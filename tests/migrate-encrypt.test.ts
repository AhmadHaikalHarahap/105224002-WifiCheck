/**
 * tests/migrate-encrypt.test.ts
 *
 * Pengujian unit untuk script backfill AES-256-GCM (scripts/migrate-encrypt.ts).
 * Menguji seluruh aturan logika, idempotensi, update parsial dinamis,
 * pencegahan penimpaan ciphertext, optimis/kondisional konkurensi dengan Prisma.DbNull,
 * deteksi perubahan plaintext sumber, dan perlindungan eksekusi CLI.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAssessmentFullyEncrypted,
  prepareAndVerifyAssessmentPayloads,
  processAssessmentRecord,
  processFindingRecord,
  isMainModule,
  sanitizeErrorMessage,
  type RawAssessmentRecord,
  type RawFindingRecord,
  type DbClientMinimal,
} from "../scripts/migrate-encrypt";
import { encryptData } from "../lib/crypto";
import { buildAssessmentAad, buildFindingAad } from "../lib/assessment-crypto";
import { Prisma } from "../lib/generated/prisma/client";

const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("scripts/migrate-encrypt (Backfill Logic & Concurrency Safety)", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  const sampleAssessment: RawAssessmentRecord = {
    id: "a1111111-2222-3333-4444-555555555555",
    ssid: "WiFi-Kantor",
    securityProtocol: "wpa3",
    passwordProtection: "enabled",
    wpsEnabled: "disabled",
    firmwareStatus: "up-to-date",
    notes: "Router utama lantai 1",
    summary: "Keamanan tergolong kuat.",
    recommendations: ["Jaga kerahasiaan password", "Periksa log berkala"],
  };

  const sampleFinding: RawFindingRecord = {
    id: "f1111111-2222-3333-4444-555555555555",
    assessmentId: "a1111111-2222-3333-4444-555555555555",
    title: "WPS Dinonaktifkan",
    description: "WPS sudah dalam keadaan mati sehingga aman dari brute force.",
  };

  // ── 1. Assessment belum terenkripsi ──────────────────────────────────────────
  it("Assessment belum terenkripsi: mengenkripsi seluruh 8 field dan memverifikasinya", async () => {
    const unencrypted: RawAssessmentRecord = {
      ...sampleAssessment,
      ssid_enc: null,
      securityProtocol_enc: null,
      passwordProtection_enc: null,
      wpsEnabled_enc: null,
      firmwareStatus_enc: null,
      notes_enc: null,
      summary_enc: null,
      recommendations_enc: null,
    };

    expect(isAssessmentFullyEncrypted(unencrypted)).toBe(false);

    let updatedWhere: Record<string, unknown> | null = null;
    let updatedData: Record<string, unknown> | null = null;

    const mockDb: DbClientMinimal = {
      assessment: {
        findMany: async () => [unencrypted],
        updateMany: async ({ where, data }) => {
          updatedWhere = where;
          updatedData = data;
          return { count: 1 };
        },
      },
      finding: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
    };

    const result = await processAssessmentRecord(unencrypted, mockDb);

    expect(result.status).toBe("success");
    expect(updatedData).not.toBeNull();
    // Memastikan seluruh 8 kolom _enc dimasukkan ke dynamic update data
    expect(updatedData).toHaveProperty("ssid_enc");
    expect(updatedData).toHaveProperty("securityProtocol_enc");
    expect(updatedData).toHaveProperty("passwordProtection_enc");
    expect(updatedData).toHaveProperty("wpsEnabled_enc");
    expect(updatedData).toHaveProperty("firmwareStatus_enc");
    expect(updatedData).toHaveProperty("notes_enc");
    expect(updatedData).toHaveProperty("summary_enc");
    expect(updatedData).toHaveProperty("recommendations_enc");

    // Memastikan conditional where mengecek bahwa kolom tersebut null via Prisma.DbNull
    expect(updatedWhere).toMatchObject({
      id: unencrypted.id,
      ssid: unencrypted.ssid,
      ssid_enc: { equals: Prisma.DbNull },
      securityProtocol_enc: { equals: Prisma.DbNull },
      notes_enc: { equals: Prisma.DbNull },
    });
  });

  // ── 2. Assessment sudah terenkripsi lengkap ──────────────────────────────────
  it("Assessment sudah terenkripsi lengkap: dilewati tanpa melakukan update DB", async () => {
    const { allPayloads } =
      prepareAndVerifyAssessmentPayloads(sampleAssessment);

    const fullyEncrypted: RawAssessmentRecord = {
      ...sampleAssessment,
      ...allPayloads,
    };

    expect(isAssessmentFullyEncrypted(fullyEncrypted)).toBe(true);

    const updateManySpy = vi.fn();
    const mockDb: DbClientMinimal = {
      assessment: {
        findMany: async () => [fullyEncrypted],
        updateMany: updateManySpy,
      },
      finding: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
    };

    const result = await processAssessmentRecord(fullyEncrypted, mockDb);

    expect(result.status).toBe("already_complete");
    expect(updateManySpy).not.toHaveBeenCalled();
  });

  // ── 3. Assessment terenkripsi sebagian ───────────────────────────────────────
  it("Assessment terenkripsi sebagian: hanya mengenkripsi field yang belum terisi", async () => {
    // Siapkan ciphertext yang sudah ada untuk 'ssid' dan 'notes'
    const existingSsidPayload = encryptData(
      sampleAssessment.ssid,
      buildAssessmentAad(sampleAssessment.id, "ssid"),
    );
    const existingNotesPayload = encryptData(
      sampleAssessment.notes,
      buildAssessmentAad(sampleAssessment.id, "notes"),
    );

    const partialRecord: RawAssessmentRecord = {
      ...sampleAssessment,
      ssid_enc: existingSsidPayload,
      notes_enc: existingNotesPayload,
      // Field lain masih kosong
      securityProtocol_enc: null,
      passwordProtection_enc: null,
      wpsEnabled_enc: null,
      firmwareStatus_enc: null,
      summary_enc: null,
      recommendations_enc: null,
    };

    expect(isAssessmentFullyEncrypted(partialRecord)).toBe(false);

    let updatedData: Record<string, unknown> | null = null;
    let updatedWhere: Record<string, unknown> | null = null;

    const mockDb: DbClientMinimal = {
      assessment: {
        findMany: async () => [partialRecord],
        updateMany: async ({ where, data }) => {
          updatedWhere = where;
          updatedData = data;
          return { count: 1 };
        },
      },
      finding: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
    };

    const result = await processAssessmentRecord(partialRecord, mockDb);

    expect(result.status).toBe("success");
    expect(updatedData).not.toBeNull();
    // Ciphertext lama tidak boleh tertimpa / tidak ada di update payload
    expect(updatedData).not.toHaveProperty("ssid_enc");
    expect(updatedData).not.toHaveProperty("notes_enc");

    // Kolom yang tadinya kosong harus ada di update payload
    expect(updatedData).toHaveProperty("securityProtocol_enc");
    expect(updatedData).toHaveProperty("passwordProtection_enc");
    expect(updatedData).toHaveProperty("recommendations_enc");

    // Kondisi where hanya mengecek Prisma.DbNull pada kolom yang akan diisi
    expect(updatedWhere).not.toHaveProperty("ssid_enc");
    expect(updatedWhere).toHaveProperty("securityProtocol_enc", { equals: Prisma.DbNull });
  });

  // ── 4. Finding terenkripsi sebagian ──────────────────────────────────────────
  it("Finding terenkripsi sebagian: hanya mengenkripsi kolom yang kosong dengan Prisma.DbNull", async () => {
    const existingTitlePayload = encryptData(
      sampleFinding.title,
      buildFindingAad(sampleFinding.assessmentId, sampleFinding.id, "title"),
    );

    const partialFinding: RawFindingRecord = {
      ...sampleFinding,
      title_enc: existingTitlePayload,
      description_enc: null,
    };

    let updatedData: Record<string, unknown> | null = null;
    let updatedWhere: Record<string, unknown> | null = null;

    const mockDb: DbClientMinimal = {
      assessment: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
      finding: {
        findMany: async () => [partialFinding],
        updateMany: async ({ where, data }) => {
          updatedWhere = where;
          updatedData = data;
          return { count: 1 };
        },
      },
    };

    const result = await processFindingRecord(partialFinding, mockDb);

    expect(result.status).toBe("success");
    expect(updatedData).not.toHaveProperty("title_enc"); // tidak ditimpa
    expect(updatedData).toHaveProperty("description_enc");

    // Pastikan conditional check pada Finding menggunakan Prisma.DbNull
    expect(updatedWhere).toMatchObject({
      id: partialFinding.id,
      title: partialFinding.title,
      description: partialFinding.description,
      description_enc: { equals: Prisma.DbNull },
    });
  });

  // ── 5. Ciphertext lama tidak tertimpa ────────────────────────────────────────
  it("Ciphertext lama tidak tertimpa: mempertahankan nilai payload yang sudah ada", async () => {
    const existingSsidPayload = encryptData(
      sampleAssessment.ssid,
      buildAssessmentAad(sampleAssessment.id, "ssid"),
    );

    const partialRecord: RawAssessmentRecord = {
      ...sampleAssessment,
      ssid_enc: existingSsidPayload,
      securityProtocol_enc: null,
    };

    const { allPayloads, dynamicUpdateData } =
      prepareAndVerifyAssessmentPayloads(partialRecord);

    // allPayloads mempertahankan ssid_enc lama
    expect(allPayloads.ssid_enc).toEqual(existingSsidPayload);
    // dynamicUpdateData sama sekali tidak mencantumkan ssid_enc
    expect(dynamicUpdateData.ssid_enc).toBeUndefined();
  });

  // ── 6. Recommendations yang tidak valid ──────────────────────────────────────
  it("Recommendations tidak valid: ditolak dan tidak melakukan update ke DB", async () => {
    const invalidRec: RawAssessmentRecord = {
      ...sampleAssessment,
      recommendations: ["Valid", 99999 as unknown as string], // item non-string
      ssid_enc: null,
    };

    const updateManySpy = vi.fn();
    const mockDb: DbClientMinimal = {
      assessment: {
        findMany: async () => [invalidRec],
        updateMany: updateManySpy,
      },
      finding: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
    };

    const result = await processAssessmentRecord(invalidRec, mockDb);

    expect(result.status).toBe("failed");
    expect(result.reason).toMatch(/bukan string/);
    expect(updateManySpy).not.toHaveBeenCalled();
  });

  // ── 7. Kegagalan verifikasi dekripsi ──────────────────────────────────────────
  it("Kegagalan verifikasi dekripsi: gagal jika ciphertext yang ada berbeda dengan plaintext", async () => {
    const mismatchedSsidPayload = encryptData(
      "Berbeda-Dengan-Asli",
      buildAssessmentAad(sampleAssessment.id, "ssid"),
    );

    const corruptRecord: RawAssessmentRecord = {
      ...sampleAssessment,
      ssid_enc: mismatchedSsidPayload, // tidak cocok dengan sampleAssessment.ssid
      securityProtocol_enc: null,
    };

    const updateManySpy = vi.fn();
    const mockDb: DbClientMinimal = {
      assessment: {
        findMany: async () => [corruptRecord],
        updateMany: updateManySpy,
      },
      finding: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
    };

    const result = await processAssessmentRecord(corruptRecord, mockDb);

    expect(result.status).toBe("failed");
    expect(result.reason).toMatch(/tidak cocok dengan data asli/);
    expect(updateManySpy).not.toHaveBeenCalled();
  });

  // ── 8. Perubahan kondisi record akibat konkurensi (kolom terisi atau plaintext berubah)
  it("Perubahan kondisi record akibat konkurensi: ditandai gagal jika count === 0", async () => {
    const unencrypted: RawAssessmentRecord = {
      ...sampleAssessment,
      ssid_enc: null,
      securityProtocol_enc: null,
    };

    // Simulasikan balapan konkurensi: data plaintext berubah di DB sebelum update selesai
    const mockDb: DbClientMinimal = {
      assessment: {
        findMany: async () => [unencrypted],
        updateMany: async () => {
          return { count: 0 }; // Plaintext berubah atau kolom telah diisi proses lain
        },
      },
      finding: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
    };

    const result = await processAssessmentRecord(unencrypted, mockDb);

    expect(result.status).toBe("failed");
    expect(result.reason).toMatch(/Konflik konkurensi/);
  });

  // ── 9. Import script dari test tidak menjalankan migrasi ────────────────────
  it("Import script dari test tidak menjalankan migrasi (isMainModule mengembalikan false)", () => {
    // Saat isTestEnvironment = true, isMainModule selalu false
    expect(isMainModule("file:///path/to/migrate-encrypt.ts", "/path/to/migrate-encrypt.ts", true)).toBe(false);

    // Di lingkungan test Vitest (default parameter), isMainModule selalu false
    expect(isMainModule("file:///path/to/migrate-encrypt.ts", "/path/to/migrate-encrypt.ts")).toBe(false);

    // Saat argv1 kosong/null, selalu false
    expect(isMainModule("file:///path/to/migrate-encrypt.ts", null, false)).toBe(false);
    expect(isMainModule("file:///path/to/migrate-encrypt.ts", "", false)).toBe(false);

    // Saat bukan test dan url cocok, return true
    const metaUrl = "file:///D:/Dokumen/wificheck/scripts/migrate-encrypt.ts";
    const argv1 = "D:\\Dokumen\\wificheck\\scripts\\migrate-encrypt.ts";
    expect(isMainModule(metaUrl, argv1, false)).toBe(true);
  });

  // ── 10. Keamanan Logging: error sanitization dengan whitelist ────────────────
  it("Sanitasi pesan error menyembunyikan detail database sensitif dan error yang tidak dikenal", () => {
    // Error dengan string database/koneksi
    const dbError = new Error("Database error: postgresql://user:secret123@localhost:5432/db");
    const sanitizedDb = sanitizeErrorMessage(dbError);
    expect(sanitizedDb).toBe("Operasi database atau proses migrasi gagal.");

    // Error yang tidak dikenal (unknown/raw error) harus menghasilkan pesan umum yang aman
    const unknownError = new Error("Custom unexpected internal socket error at line 42");
    const sanitizedUnknown = sanitizeErrorMessage(unknownError);
    expect(sanitizedUnknown).toBe("Operasi database atau proses migrasi gagal.");

    // Error yang terdaftar dalam whitelist aman tetap disampaikan dengan jelas
    const safeError = new Error("Format recommendations pada Assessment 'a1' tidak valid: harus berupa array.");
    const sanitizedSafe = sanitizeErrorMessage(safeError);
    expect(sanitizedSafe).toBe("Format recommendations pada Assessment 'a1' tidak valid: harus berupa array.");
  });
});

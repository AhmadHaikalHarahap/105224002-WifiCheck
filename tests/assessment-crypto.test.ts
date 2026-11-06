/**
 * tests/assessment-crypto.test.ts
 *
 * Pengujian unit untuk modul lib/assessment-crypto.ts (kripto-v0.2).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  buildAssessmentAad,
  buildFindingAad,
  encryptAssessmentFields,
  decryptAssessmentFields,
  encryptFindingFields,
  decryptFindingFields,
} from "../lib/assessment-crypto";
import { encryptData } from "../lib/crypto";

const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("lib/assessment-crypto", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  describe("AAD Builders", () => {
    it("menghasilkan AAD Assessment dengan format yang tepat", () => {
      const aad = buildAssessmentAad("uuid-1234", "ssid");
      expect(aad).toBe("wificheck:assessment:v1:uuid-1234:ssid");
    });

    it("menghasilkan AAD Finding dengan format yang tepat", () => {
      const aad = buildFindingAad("uuid-1234", "finding-5678", "title");
      expect(aad).toBe("wificheck:finding:v1:uuid-1234:finding-5678:title");
    });

    it("menolak ID kosong atau hanya whitespace saat membangun AAD", () => {
      expect(() => buildAssessmentAad("", "ssid")).toThrow();
      expect(() => buildAssessmentAad("   ", "ssid")).toThrow();
      expect(() => buildFindingAad("", "finding-id", "title")).toThrow();
      expect(() => buildFindingAad("assessment-id", "", "title")).toThrow();
    });
  });

  describe("Assessment Encryption & Decryption (8 field terenkripsi)", () => {
    const assessmentId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const sampleInput = {
      ssid: "WiFi-Rumah-Lantai-2",
      securityProtocol: "wpa3" as const,
      passwordProtection: "enabled" as const,
      wpsEnabled: "disabled" as const,
      firmwareStatus: "up-to-date" as const,
      notes: "Catatan khusus: Router baru dipasang",
      summary: "Konfigurasi WiFi memiliki tingkat keamanan tinggi.",
      recommendations: [
        "Pertahankan firmware tetap terupdate",
        "Gunakan password acak",
      ],
    };

    it("berhasil mengenkripsi dan mendekripsi seluruh 8 field Assessment (round-trip)", () => {
      const encrypted = encryptAssessmentFields(assessmentId, sampleInput);

      // Verifikasi 8 field memiliki payload terenkripsi
      expect(encrypted).toHaveProperty("ssid_enc");
      expect(encrypted).toHaveProperty("securityProtocol_enc");
      expect(encrypted).toHaveProperty("passwordProtection_enc");
      expect(encrypted).toHaveProperty("wpsEnabled_enc");
      expect(encrypted).toHaveProperty("firmwareStatus_enc");
      expect(encrypted).toHaveProperty("notes_enc");
      expect(encrypted).toHaveProperty("summary_enc");
      expect(encrypted).toHaveProperty("recommendations_enc");

      // Verifikasi struktur tiap payload
      expect(encrypted.ssid_enc).toHaveProperty("ciphertext");
      expect(encrypted.ssid_enc).toHaveProperty("nonce");
      expect(encrypted.ssid_enc).toHaveProperty("authTag");
      expect(encrypted.ssid_enc.version).toBe(1);

      // Dekripsi seluruh field
      const decrypted = decryptAssessmentFields({
        id: assessmentId,
        ...encrypted,
      });

      expect(decrypted.ssid).toBe(sampleInput.ssid);
      expect(decrypted.securityProtocol).toBe(sampleInput.securityProtocol);
      expect(decrypted.passwordProtection).toBe(sampleInput.passwordProtection);
      expect(decrypted.wpsEnabled).toBe(sampleInput.wpsEnabled);
      expect(decrypted.firmwareStatus).toBe(sampleInput.firmwareStatus);
      expect(decrypted.notes).toBe(sampleInput.notes);
      expect(decrypted.summary).toBe(sampleInput.summary);
      expect(decrypted.recommendations).toEqual(sampleInput.recommendations);
    });

    it("mendukung jalur legacy HANYA ketika *_enc bernilai null atau undefined", () => {
      const legacyRecord = {
        id: assessmentId,
        ssid: "WiFi-Lama",
        ssid_enc: null,
        securityProtocol: "wpa2",
        securityProtocol_enc: undefined,
        passwordProtection: "enabled",
        wpsEnabled: "enabled",
        firmwareStatus: "outdated",
        notes: "Catatan lama",
        summary: "Ringkasan lama",
        recommendations: ["Rekomendasi lama"],
      };

      const decrypted = decryptAssessmentFields(legacyRecord);

      expect(decrypted.ssid).toBe("WiFi-Lama");
      expect(decrypted.securityProtocol).toBe("wpa2");
      expect(decrypted.recommendations).toEqual(["Rekomendasi lama"]);
    });

    it("DILARANG fallback ke plaintext jika ciphertext tersedia tetapi rusak/dimodifikasi", () => {
      const encrypted = encryptAssessmentFields(assessmentId, sampleInput);

      // Rusak ciphertext ssid_enc
      const tamperedRecord = {
        id: assessmentId,
        ...encrypted,
        // Kolom plaintext legacy juga ada di record
        ssid: "Plaintext-Fallback-Yang-Tidak-Boleh-Digunakan",
        ssid_enc: {
          ...encrypted.ssid_enc,
          ciphertext: "ff" + encrypted.ssid_enc.ciphertext.slice(2),
        },
      };

      // Dekripsi WAJIB gagal (melempar error) dan TIDAK boleh mengembalikan plaintext fallback
      expect(() => decryptAssessmentFields(tamperedRecord)).toThrow(
        /Dekripsi gagal/,
      );
    });

    it("gagal mendekripsi jika ciphertext dipindahkan ke ID assessment yang berbeda (AAD mismatch)", () => {
      const encrypted = encryptAssessmentFields(assessmentId, sampleInput);

      // Coba dekripsi menggunakan ID berbeda
      expect(() =>
        decryptAssessmentFields({
          id: "different-assessment-id-1234",
          ...encrypted,
        }),
      ).toThrow(/Dekripsi gagal/);
    });

    it("Assessment recommendations dengan JSON bukan array harus gagal", () => {
      const badJsonPayload = encryptData(
        JSON.stringify({ not: "an array" }),
        buildAssessmentAad(assessmentId, "recommendations"),
      );

      const record = {
        id: assessmentId,
        ssid: "Test SSID",
        securityProtocol: "wpa3",
        passwordProtection: "enabled",
        wpsEnabled: "disabled",
        firmwareStatus: "up-to-date",
        notes: "Test notes",
        summary: "Test summary",
        recommendations_enc: badJsonPayload,
      };

      expect(() => decryptAssessmentFields(record)).toThrow(/harus berupa array/);
    });

    it("Assessment recommendations dengan item bukan string harus gagal", () => {
      const badItemPayload = encryptData(
        JSON.stringify(["Valid string", 12345, true]),
        buildAssessmentAad(assessmentId, "recommendations"),
      );

      const record = {
        id: assessmentId,
        ssid: "Test SSID",
        securityProtocol: "wpa3",
        passwordProtection: "enabled",
        wpsEnabled: "disabled",
        firmwareStatus: "up-to-date",
        notes: "Test notes",
        summary: "Test summary",
        recommendations_enc: badItemPayload,
      };

      expect(() => decryptAssessmentFields(record)).toThrow(/bukan string/);
    });

    it("Assessment recommendations legacy dengan item bukan string harus gagal", () => {
      const record = {
        id: assessmentId,
        ssid: "Test SSID",
        securityProtocol: "wpa3",
        passwordProtection: "enabled",
        wpsEnabled: "disabled",
        firmwareStatus: "up-to-date",
        notes: "Test notes",
        summary: "Test summary",
        recommendations: ["Valid string", 999 as unknown as string],
      };

      expect(() => decryptAssessmentFields(record)).toThrow(/bukan string/);
    });

    it("Assessment recommendations tanpa ciphertext dan tanpa data legacy harus gagal", () => {
      const record = {
        id: assessmentId,
        ssid: "Test SSID",
        securityProtocol: "wpa3",
        passwordProtection: "enabled",
        wpsEnabled: "disabled",
        firmwareStatus: "up-to-date",
        notes: "Test notes",
        summary: "Test summary",
        recommendations_enc: null,
        recommendations: null,
      };

      expect(() => decryptAssessmentFields(record)).toThrow(
        /Field 'recommendations' pada Assessment/,
      );
    });
  });

  describe("Finding Encryption & Decryption (2 field terenkripsi)", () => {
    const assessmentId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const findingId = "f1f2f3f4-0000-1111-2222-333344445555";
    const sampleFinding = {
      title: "WPS Diaktifkan",
      description: "Fitur WPS berisiko terhadap serangan brute force PIN.",
    };

    it("berhasil mengenkripsi dan mendekripsi field Finding (round-trip)", () => {
      const encrypted = encryptFindingFields(
        assessmentId,
        findingId,
        sampleFinding,
      );

      expect(encrypted).toHaveProperty("title_enc");
      expect(encrypted).toHaveProperty("description_enc");

      const decrypted = decryptFindingFields({
        id: findingId,
        assessmentId,
        ...encrypted,
      });

      expect(decrypted.title).toBe(sampleFinding.title);
      expect(decrypted.description).toBe(sampleFinding.description);
    });

    it("mendukung jalur legacy HANYA jika *_enc bernilai null atau undefined", () => {
      const legacyFinding = {
        id: findingId,
        assessmentId,
        title: "Temuan Lama",
        title_enc: null,
        description: "Deskripsi temuan lama",
        description_enc: undefined,
      };

      const decrypted = decryptFindingFields(legacyFinding);
      expect(decrypted.title).toBe("Temuan Lama");
      expect(decrypted.description).toBe("Deskripsi temuan lama");
    });

    it("DILARANG fallback ke plaintext Finding jika ciphertext rusak", () => {
      const encrypted = encryptFindingFields(
        assessmentId,
        findingId,
        sampleFinding,
      );

      const tamperedFinding = {
        id: findingId,
        assessmentId,
        title: "Fallback Judul Tidak Boleh Dipakai",
        title_enc: {
          ...encrypted.title_enc,
          ciphertext: "00" + encrypted.title_enc.ciphertext.slice(2),
        },
        description: sampleFinding.description,
        description_enc: encrypted.description_enc,
      };

      expect(() => decryptFindingFields(tamperedFinding)).toThrow(
        /Dekripsi gagal/,
      );
    });

    it("menolak dekripsi Finding jika assessmentId atau findingId tidak cocok", () => {
      const encrypted = encryptFindingFields(
        assessmentId,
        findingId,
        sampleFinding,
      );

      // Wrong assessmentId
      expect(() =>
        decryptFindingFields({
          id: findingId,
          assessmentId: "wrong-assessment-id",
          ...encrypted,
        }),
      ).toThrow();

      // Wrong findingId
      expect(() =>
        decryptFindingFields({
          id: "wrong-finding-id",
          assessmentId,
          ...encrypted,
        }),
      ).toThrow();
    });

    it("Finding tanpa ciphertext dan tanpa plaintext harus gagal", () => {
      // Tidak ada title_enc dan tidak ada title
      expect(() =>
        decryptFindingFields({
          id: findingId,
          assessmentId,
          title_enc: null,
          title: null,
          description_enc: null,
          description: "Deskripsi ada",
        }),
      ).toThrow(/Field 'title' pada Finding/);

      // Tidak ada description_enc dan tidak ada description
      expect(() =>
        decryptFindingFields({
          id: findingId,
          assessmentId,
          title_enc: null,
          title: "Judul ada",
          description_enc: null,
          description: null,
        }),
      ).toThrow(/Field 'description' pada Finding/);
    });
  });
});

/**
 * scripts/migrate-encrypt.ts
 *
 * Script migrasi data backfill AES-256-GCM WiFi Check (kripto-v0.2).
 *
 * Kebijakan & Karakteristik:
 * 1. Kelengkapan:
 *    - Memeriksa seluruh 8 kolom _enc pada Assessment (ssid, securityProtocol,
 *      passwordProtection, wpsEnabled, firmwareStatus, notes, summary, recommendations).
 *    - Memeriksa kedua kolom _enc pada Finding (title, description).
 * 2. Idempotensi & Update Dinamis:
 *    - Melewati record yang sudah terenkripsi lengkap (already_complete).
 *    - Objek update dibentuk dinamis: HANYA kolom _enc yang sebelumnya null/undefined
 *      yang dimasukkan ke dalam update payload.
 *    - Ciphertext lama yang sudah ada dipertahankan tanpa ditimpa.
 * 3. Keamanan Konkurensi & Integritas Sumber (Optimistic Concurrency):
 *    - Update dilakukan secara kondisional (conditional update):
 *      a. Memastikan kolom _enc yang hendak diisi MASIH bernilai SQL NULL ({ equals: Prisma.DbNull }).
 *      b. Memastikan data plaintext sumber TIDAK berubah antara waktu pembacaan dan update.
 *    - Jika record berubah di DB sebelum update (count === 0), proses dibatalkan
 *      dan dilaporkan sebagai kegagalan konflik konkurensi.
 * 4. Verifikasi Dekripsi Penuh:
 *    - Seluruh payload didekripsi ulang dengan AAD terkait dan dicocokkan dengan plaintext asli.
 *    - Rekomendasi divalidasi ketat (harus array string; tanpa filter pembuang elemen).
 * 5. Keamanan Logging (Strict Whitelist Sanitization):
 *    - Tidak mencetak plaintext, ciphertext, kunci enkripsi, DATABASE_URL, atau query database.
 *    - Pesan error disanitasi menggunakan whitelist aman; error tak dikenal menjadi pesan umum.
 *    - Menggunakan ID record untuk pelaporan kegagalan.
 * 6. Pelaporan & CLI:
 *    - Melaporkan statistik: Total, Sudah Lengkap, Berhasil Diproses, Gagal, dan Masih Tertunda.
 *    - Tidak mengeksekusi migrasi otomatis ketika diimpor dari file pengujian (Vitest).
 */

import "dotenv/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { prisma } from "../lib/prisma";
import {
  encryptData,
  decryptData,
  type EncryptedPayload,
} from "../lib/crypto";
import {
  buildAssessmentAad,
  buildFindingAad,
} from "../lib/assessment-crypto";
import { Prisma } from "../lib/generated/prisma/client";

// ── Tipe Data Pelaporan ───────────────────────────────────────────────────────

export interface MigrationReportItem {
  id: string;
  type: "Assessment" | "Finding";
  status: "already_complete" | "success" | "failed";
  reason?: string;
}

export interface ModelMigrationSummary {
  /** Jumlah seluruh record yang terdaftar di database */
  total: number;
  /** Record yang sudah memiliki seluruh kolom _enc lengkap sebelum proses ini */
  alreadyComplete: number;
  /** Record yang berhasil dienkripsi, diverifikasi, dan diupdate pada proses ini */
  success: number;
  /** Record yang gagal diproses (validasi tidak valid, verifikasi gagal, atau konflik) */
  failed: number;
  /** Record yang masih tertunda / belum lengkap terenkripsi (total - alreadyComplete - success) */
  pending: number;
}

export interface FullMigrationSummary {
  assessment: ModelMigrationSummary;
  finding: ModelMigrationSummary;
  errors: MigrationReportItem[];
}

// ── Tipe Input Record Assessment & Finding ───────────────────────────────────

export interface RawAssessmentRecord {
  id: string;
  ssid: string;
  ssid_enc?: unknown;
  securityProtocol: string;
  securityProtocol_enc?: unknown;
  passwordProtection: string;
  passwordProtection_enc?: unknown;
  wpsEnabled: string;
  wpsEnabled_enc?: unknown;
  firmwareStatus: string;
  firmwareStatus_enc?: unknown;
  notes: string;
  notes_enc?: unknown;
  summary: string;
  summary_enc?: unknown;
  recommendations: unknown;
  recommendations_enc?: unknown;
}

export interface RawFindingRecord {
  id: string;
  assessmentId: string;
  title: string;
  title_enc?: unknown;
  description: string;
  description_enc?: unknown;
}

// ── Helper Pemeriksaan Kelengkapan ───────────────────────────────────────────

export function isAssessmentFullyEncrypted(item: RawAssessmentRecord): boolean {
  return (
    item.ssid_enc !== null &&
    item.ssid_enc !== undefined &&
    item.securityProtocol_enc !== null &&
    item.securityProtocol_enc !== undefined &&
    item.passwordProtection_enc !== null &&
    item.passwordProtection_enc !== undefined &&
    item.wpsEnabled_enc !== null &&
    item.wpsEnabled_enc !== undefined &&
    item.firmwareStatus_enc !== null &&
    item.firmwareStatus_enc !== undefined &&
    item.notes_enc !== null &&
    item.notes_enc !== undefined &&
    item.summary_enc !== null &&
    item.summary_enc !== undefined &&
    item.recommendations_enc !== null &&
    item.recommendations_enc !== undefined
  );
}

export function isFindingFullyEncrypted(finding: RawFindingRecord): boolean {
  return (
    finding.title_enc !== null &&
    finding.title_enc !== undefined &&
    finding.description_enc !== null &&
    finding.description_enc !== undefined
  );
}

// ── Validasi Recommendations ─────────────────────────────────────────────────

export function validatePlaintextRecommendations(
  raw: unknown,
  assessmentId: string,
): string[] {
  if (!Array.isArray(raw)) {
    throw new Error(
      `Format recommendations pada Assessment '${assessmentId}' tidak valid: harus berupa array.`,
    );
  }
  for (let i = 0; i < raw.length; i++) {
    if (typeof raw[i] !== "string") {
      throw new Error(
        `Terdapat item pada recommendations Assessment '${assessmentId}' yang bukan string.`,
      );
    }
  }
  return raw as string[];
}

// ── Sanitasi Pesan Error (Whitelist Sanitization) ─────────────────────────────

const SAFE_ERROR_PATTERNS = [
  /^Format recommendations pada Assessment '[^']+' tidak valid: harus berupa array\.$/,
  /^Terdapat item pada recommendations Assessment '[^']+' yang bukan string\.$/,
  /^Verifikasi dekripsi field '[^']+' pada Assessment '[^']+' tidak cocok dengan data asli\.$/,
  /^Verifikasi dekripsi field '[^']+' pada Finding '[^']+' tidak cocok dengan data asli\.$/,
  /^Verifikasi gagal: JSON recommendations terdekripsi pada Assessment '[^']+' tidak valid\.$/,
  /^Verifikasi gagal: Konten recommendations terdekripsi pada Assessment '[^']+' tidak cocok dengan data asli\.$/,
  /^Konflik konkurensi: record telah dimodifikasi atau sumber data berubah sebelum update\.$/,
];

export function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message;
    for (const pattern of SAFE_ERROR_PATTERNS) {
      if (pattern.test(message)) {
        return message;
      }
    }
  }
  return "Operasi database atau proses migrasi gagal.";
}

// ── Logika Enkripsi & Verifikasi Assessment ───────────────────────────────────

export interface AssessmentPreparedPayloads {
  allPayloads: Record<string, EncryptedPayload>;
  dynamicUpdateData: Record<string, unknown>;
  whereConditions: Record<string, unknown>;
  hasNewEncryption: boolean;
}

export function prepareAndVerifyAssessmentPayloads(
  item: RawAssessmentRecord,
): AssessmentPreparedPayloads {
  // 1. Validasi rekomendasi plaintext (tanpa filter/toleransi)
  const validRecommendations = validatePlaintextRecommendations(
    item.recommendations,
    item.id,
  );

  let hasNewEncryption = false;
  const allPayloads: Record<string, EncryptedPayload> = {};
  const dynamicUpdateData: Record<string, unknown> = {};

  // 2. Kondisi konkurensi: pastikan ID cocok dan sumber plaintext tidak berubah
  const whereConditions: Record<string, unknown> = {
    id: item.id,
    ssid: item.ssid,
    securityProtocol: item.securityProtocol,
    passwordProtection: item.passwordProtection,
    wpsEnabled: item.wpsEnabled,
    firmwareStatus: item.firmwareStatus,
    notes: item.notes,
    summary: item.summary,
    recommendations: { equals: validRecommendations },
  };

  const resolveField = (
    existingPayload: unknown,
    encFieldName: string,
    plaintextValue: string,
  ): EncryptedPayload => {
    if (existingPayload !== null && existingPayload !== undefined) {
      // Pertahankan ciphertext lama (tidak dimasukkan ke dynamicUpdateData)
      return existingPayload as EncryptedPayload;
    }
    // Kolom ini kosong, lakukan enkripsi baru
    hasNewEncryption = true;
    const plainFieldName = encFieldName.replace(/_enc$/, "");
    const encrypted = encryptData(
      plaintextValue,
      buildAssessmentAad(item.id, plainFieldName),
    );
    dynamicUpdateData[encFieldName] = encrypted;
    // Gunakan Prisma.DbNull untuk matching SQL NULL pada field Json?
    whereConditions[encFieldName] = { equals: Prisma.DbNull };
    return encrypted;
  };

  allPayloads.ssid_enc = resolveField(item.ssid_enc, "ssid_enc", item.ssid);
  allPayloads.securityProtocol_enc = resolveField(
    item.securityProtocol_enc,
    "securityProtocol_enc",
    item.securityProtocol,
  );
  allPayloads.passwordProtection_enc = resolveField(
    item.passwordProtection_enc,
    "passwordProtection_enc",
    item.passwordProtection,
  );
  allPayloads.wpsEnabled_enc = resolveField(
    item.wpsEnabled_enc,
    "wpsEnabled_enc",
    item.wpsEnabled,
  );
  allPayloads.firmwareStatus_enc = resolveField(
    item.firmwareStatus_enc,
    "firmwareStatus_enc",
    item.firmwareStatus,
  );
  allPayloads.notes_enc = resolveField(
    item.notes_enc,
    "notes_enc",
    item.notes ?? "",
  );
  allPayloads.summary_enc = resolveField(
    item.summary_enc,
    "summary_enc",
    item.summary,
  );
  allPayloads.recommendations_enc = resolveField(
    item.recommendations_enc,
    "recommendations_enc",
    JSON.stringify(validRecommendations),
  );

  // 3. Verifikasi dekripsi seluruh 8 field sebelum update
  const verify = (
    payload: EncryptedPayload,
    fieldName: string,
    expectedPlaintext: string,
  ) => {
    const decrypted = decryptData(
      payload,
      buildAssessmentAad(item.id, fieldName),
    );
    if (decrypted !== expectedPlaintext) {
      throw new Error(
        `Verifikasi dekripsi field '${fieldName}' pada Assessment '${item.id}' tidak cocok dengan data asli.`,
      );
    }
  };

  verify(allPayloads.ssid_enc, "ssid", item.ssid);
  verify(allPayloads.securityProtocol_enc, "securityProtocol", item.securityProtocol);
  verify(allPayloads.passwordProtection_enc, "passwordProtection", item.passwordProtection);
  verify(allPayloads.wpsEnabled_enc, "wpsEnabled", item.wpsEnabled);
  verify(allPayloads.firmwareStatus_enc, "firmwareStatus", item.firmwareStatus);
  verify(allPayloads.notes_enc, "notes", item.notes ?? "");
  verify(allPayloads.summary_enc, "summary", item.summary);

  // Verifikasi recommendations
  const rawDecryptedRecs = decryptData(
    allPayloads.recommendations_enc,
    buildAssessmentAad(item.id, "recommendations"),
  );
  let parsedRecs: unknown;
  try {
    parsedRecs = JSON.parse(rawDecryptedRecs);
  } catch {
    throw new Error(
      `Verifikasi gagal: JSON recommendations terdekripsi pada Assessment '${item.id}' tidak valid.`,
    );
  }

  if (
    !Array.isArray(parsedRecs) ||
    parsedRecs.length !== validRecommendations.length ||
    !parsedRecs.every((val, idx) => val === validRecommendations[idx])
  ) {
    throw new Error(
      `Verifikasi gagal: Konten recommendations terdekripsi pada Assessment '${item.id}' tidak cocok dengan data asli.`,
    );
  }

  return {
    allPayloads,
    dynamicUpdateData,
    whereConditions,
    hasNewEncryption,
  };
}

// ── Logika Enkripsi & Verifikasi Finding ──────────────────────────────────────

export interface FindingPreparedPayloads {
  allPayloads: Record<string, EncryptedPayload>;
  dynamicUpdateData: Record<string, unknown>;
  whereConditions: Record<string, unknown>;
  hasNewEncryption: boolean;
}

export function prepareAndVerifyFindingPayloads(
  finding: RawFindingRecord,
): FindingPreparedPayloads {
  let hasNewEncryption = false;
  const allPayloads: Record<string, EncryptedPayload> = {};
  const dynamicUpdateData: Record<string, unknown> = {};

  // Kondisi konkurensi: pastikan ID cocok dan sumber plaintext tidak berubah
  const whereConditions: Record<string, unknown> = {
    id: finding.id,
    assessmentId: finding.assessmentId,
    title: finding.title,
    description: finding.description,
  };

  const resolveField = (
    existingPayload: unknown,
    encFieldName: string,
    plaintextValue: string,
  ): EncryptedPayload => {
    if (existingPayload !== null && existingPayload !== undefined) {
      return existingPayload as EncryptedPayload;
    }
    hasNewEncryption = true;
    const plainFieldName = encFieldName.replace(/_enc$/, "");
    const encrypted = encryptData(
      plaintextValue,
      buildFindingAad(finding.assessmentId, finding.id, plainFieldName),
    );
    dynamicUpdateData[encFieldName] = encrypted;
    whereConditions[encFieldName] = { equals: Prisma.DbNull };
    return encrypted;
  };

  allPayloads.title_enc = resolveField(
    finding.title_enc,
    "title_enc",
    finding.title,
  );
  allPayloads.description_enc = resolveField(
    finding.description_enc,
    "description_enc",
    finding.description,
  );

  // Verifikasi dekripsi
  const verify = (
    payload: EncryptedPayload,
    fieldName: string,
    expectedPlaintext: string,
  ) => {
    const decrypted = decryptData(
      payload,
      buildFindingAad(finding.assessmentId, finding.id, fieldName),
    );
    if (decrypted !== expectedPlaintext) {
      throw new Error(
        `Verifikasi dekripsi field '${fieldName}' pada Finding '${finding.id}' tidak cocok dengan data asli.`,
      );
    }
  };

  verify(allPayloads.title_enc, "title", finding.title);
  verify(allPayloads.description_enc, "description", finding.description);

  return {
    allPayloads,
    dynamicUpdateData,
    whereConditions,
    hasNewEncryption,
  };
}

// ── Pemrosesan Atomic Per-Record ─────────────────────────────────────────────

export interface DbClientMinimal {
  assessment: {
    findMany: (args?: unknown) => Promise<RawAssessmentRecord[]>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  finding: {
    findMany: (args?: unknown) => Promise<RawFindingRecord[]>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  $transaction?: <T>(fn: (tx: DbClientMinimal) => Promise<T>) => Promise<T>;
}

export async function processAssessmentRecord(
  item: RawAssessmentRecord,
  dbClient: DbClientMinimal,
): Promise<MigrationReportItem> {
  // 1. Jika sudah lengkap, lewati tanpa operasi tulis
  if (isAssessmentFullyEncrypted(item)) {
    return {
      id: item.id,
      type: "Assessment",
      status: "already_complete",
    };
  }

  try {
    // 2. Siapkan dan verifikasi payload (seluruh 8 field terverifikasi)
    const { dynamicUpdateData, whereConditions, hasNewEncryption } =
      prepareAndVerifyAssessmentPayloads(item);

    if (!hasNewEncryption || Object.keys(dynamicUpdateData).length === 0) {
      return {
        id: item.id,
        type: "Assessment",
        status: "already_complete",
      };
    }

    // 3. Tulis perubahan secara atomik & kondisional (hanya field yang kosong)
    const executeUpdate = async (tx: DbClientMinimal) => {
      const result = await tx.assessment.updateMany({
        where: whereConditions,
        data: dynamicUpdateData as Record<string, Prisma.InputJsonValue>,
      });

      if (result.count === 0) {
        throw new Error(
          "Konflik konkurensi: record telah dimodifikasi atau sumber data berubah sebelum update.",
        );
      }
    };

    if (typeof dbClient.$transaction === "function") {
      await dbClient.$transaction(executeUpdate);
    } else {
      await executeUpdate(dbClient);
    }

    return {
      id: item.id,
      type: "Assessment",
      status: "success",
    };
  } catch (err) {
    const safeReason = sanitizeErrorMessage(err);
    return {
      id: item.id,
      type: "Assessment",
      status: "failed",
      reason: safeReason,
    };
  }
}

export async function processFindingRecord(
  finding: RawFindingRecord,
  dbClient: DbClientMinimal,
): Promise<MigrationReportItem> {
  if (isFindingFullyEncrypted(finding)) {
    return {
      id: finding.id,
      type: "Finding",
      status: "already_complete",
    };
  }

  try {
    const { dynamicUpdateData, whereConditions, hasNewEncryption } =
      prepareAndVerifyFindingPayloads(finding);

    if (!hasNewEncryption || Object.keys(dynamicUpdateData).length === 0) {
      return {
        id: finding.id,
        type: "Finding",
        status: "already_complete",
      };
    }

    const executeUpdate = async (tx: DbClientMinimal) => {
      const result = await tx.finding.updateMany({
        where: whereConditions,
        data: dynamicUpdateData as Record<string, Prisma.InputJsonValue>,
      });

      if (result.count === 0) {
        throw new Error(
          "Konflik konkurensi: record telah dimodifikasi atau sumber data berubah sebelum update.",
        );
      }
    };

    if (typeof dbClient.$transaction === "function") {
      await dbClient.$transaction(executeUpdate);
    } else {
      await executeUpdate(dbClient);
    }

    return {
      id: finding.id,
      type: "Finding",
      status: "success",
    };
  } catch (err) {
    const safeReason = sanitizeErrorMessage(err);
    return {
      id: finding.id,
      type: "Finding",
      status: "failed",
      reason: safeReason,
    };
  }
}

// ── Runner Backfill Utama ───────────────────────────────────────────────────

export async function runBackfill(
  dbClient: DbClientMinimal = prisma as unknown as DbClientMinimal,
): Promise<FullMigrationSummary> {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error(
      "ENCRYPTION_KEY belum disetel di environment. Migrasi dibatalkan demi keamanan.",
    );
  }

  const errors: MigrationReportItem[] = [];

  // 1. Proses Assessment
  const allAssessments = await dbClient.assessment.findMany();
  let assessmentAlreadyComplete = 0;
  let assessmentSuccess = 0;
  let assessmentFailed = 0;

  for (const item of allAssessments) {
    const result = await processAssessmentRecord(item, dbClient);
    if (result.status === "already_complete") {
      assessmentAlreadyComplete++;
    } else if (result.status === "success") {
      assessmentSuccess++;
    } else {
      assessmentFailed++;
      errors.push(result);
    }
  }

  const assessmentSummary: ModelMigrationSummary = {
    total: allAssessments.length,
    alreadyComplete: assessmentAlreadyComplete,
    success: assessmentSuccess,
    failed: assessmentFailed,
    pending: allAssessments.length - assessmentAlreadyComplete - assessmentSuccess,
  };

  // 2. Proses Finding
  const allFindings = await dbClient.finding.findMany();
  let findingAlreadyComplete = 0;
  let findingSuccess = 0;
  let findingFailed = 0;

  for (const finding of allFindings) {
    const result = await processFindingRecord(finding, dbClient);
    if (result.status === "already_complete") {
      findingAlreadyComplete++;
    } else if (result.status === "success") {
      findingSuccess++;
    } else {
      findingFailed++;
      errors.push(result);
    }
  }

  const findingSummary: ModelMigrationSummary = {
    total: allFindings.length,
    alreadyComplete: findingAlreadyComplete,
    success: findingSuccess,
    failed: findingFailed,
    pending: allFindings.length - findingAlreadyComplete - findingSuccess,
  };

  return {
    assessment: assessmentSummary,
    finding: findingSummary,
    errors,
  };
}

export function printMigrationReport(summary: FullMigrationSummary): void {
  console.log("============================================================");
  console.log("          LAPORAN MIGRASI BACKFILL AES-256-GCM             ");
  console.log("============================================================");

  console.log("\n--- Model Assessment (8 Kolom Enkripsi) ---");
  console.log(`Total record                    : ${summary.assessment.total}`);
  console.log(`Record sudah terenkripsi lengkap: ${summary.assessment.alreadyComplete}`);
  console.log(`Record berhasil diproses        : ${summary.assessment.success}`);
  console.log(`Record gagal diproses           : ${summary.assessment.failed}`);
  console.log(`Record masih tertunda (pending) : ${summary.assessment.pending}`);

  console.log("\n--- Model Finding (2 Kolom Enkripsi) ---");
  console.log(`Total record                    : ${summary.finding.total}`);
  console.log(`Record sudah terenkripsi lengkap: ${summary.finding.alreadyComplete}`);
  console.log(`Record berhasil diproses        : ${summary.finding.success}`);
  console.log(`Record gagal diproses           : ${summary.finding.failed}`);
  console.log(`Record masih tertunda (pending) : ${summary.finding.pending}`);

  if (summary.errors.length > 0) {
    console.log("\n--- Rincian Kegagalan (Aman / Tanpa Data Sensitif) ---");
    for (const err of summary.errors) {
      console.log(`[${err.type} Gagal] ID: ${err.id} - Alasan: ${err.reason}`);
    }
  } else {
    console.log("\nStatus: Tidak ada kegagalan yang terjadi.");
  }
  console.log("============================================================\n");
}

// ── Pemeriksaan Eksekusi CLI ─────────────────────────────────────────────────

export function isMainModule(
  metaUrl: string,
  argv1: string | null | undefined = process.argv[1],
  isTestEnvironment: boolean = Boolean(process.env.VITEST),
): boolean {
  if (isTestEnvironment || !argv1) {
    return false;
  }

  try {
    const currentFile = resolve(fileURLToPath(metaUrl));
    const invokedFile = resolve(argv1);

    if (process.platform === "win32") {
      return currentFile.toLowerCase() === invokedFile.toLowerCase();
    }

    return currentFile === invokedFile;
  } catch {
    return false;
  }
}

if (isMainModule(import.meta.url)) {
  runBackfill()
    .then((summary) => {
      printMigrationReport(summary);
      if (summary.assessment.failed > 0 || summary.finding.failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Migrasi gagal dijalankan:", sanitizeErrorMessage(err));
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

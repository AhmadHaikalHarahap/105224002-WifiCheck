/**
 * lib/assessment-crypto.ts
 *
 * Modul pembantu enkripsi dan dekripsi untuk data Assessment dan Finding
 * pada WiFi Check (kripto-v0.2).
 *
 * Menggunakan lib/crypto.ts (AES-256-GCM) dengan skema AAD berbasis record:
 * - Assessment: "wificheck:assessment:v1:<assessmentId>:<fieldName>"
 * - Finding:    "wificheck:finding:v1:<assessmentId>:<findingId>:<fieldName>"
 *
 * Kebijakan Keamanan:
 * - 8 field Assessment dienkripsi: ssid, securityProtocol, passwordProtection,
 *   wpsEnabled, firmwareStatus, notes, summary, recommendations.
 * - 3 field Assessment tetap plaintext: id, riskLevel, createdAt.
 * - 2 field Finding dienkripsi: title, description.
 * - Jika payload terenkripsi (*_enc) tersedia, WAJIB didekripsi. Jika autentikasi
 *   AES-GCM gagal, proses dihentikan dengan melempar error (DILARANG fallback ke plaintext).
 * - Jalur legacy (fallback ke kolom plaintext) HANYA diizinkan jika record belum
 *   memiliki ciphertext sama sekali (*_enc bernilai null / undefined).
 */

import "server-only";

import {
  encryptData,
  decryptData,
  type EncryptedPayload,
} from "./crypto";
import type {
  SecurityProtocol,
  ProtectionStatus,
  FirmwareStatus,
} from "@/types/assessment";

// ── AAD Builders ─────────────────────────────────────────────────────────────

export function buildAssessmentAad(
  assessmentId: string,
  fieldName: string,
): string {
  if (!assessmentId || assessmentId.trim() === "") {
    throw new Error("assessmentId diperlukan untuk membangun AAD Assessment.");
  }
  return `wificheck:assessment:v1:${assessmentId}:${fieldName}`;
}

export function buildFindingAad(
  assessmentId: string,
  findingId: string,
  fieldName: string,
): string {
  if (!assessmentId || assessmentId.trim() === "") {
    throw new Error("assessmentId diperlukan untuk membangun AAD Finding.");
  }
  if (!findingId || findingId.trim() === "") {
    throw new Error("findingId diperlukan untuk membangun AAD Finding.");
  }
  return `wificheck:finding:v1:${assessmentId}:${findingId}:${fieldName}`;
}

// ── Tipe Input & Output Enkripsi Assessment ──────────────────────────────────

export interface AssessmentPlaintextFields {
  ssid: string;
  securityProtocol: string;
  passwordProtection: string;
  wpsEnabled: string;
  firmwareStatus: string;
  notes: string;
  summary: string;
  recommendations: string[];
}

export interface EncryptedAssessmentPayloads {
  ssid_enc: EncryptedPayload;
  securityProtocol_enc: EncryptedPayload;
  passwordProtection_enc: EncryptedPayload;
  wpsEnabled_enc: EncryptedPayload;
  firmwareStatus_enc: EncryptedPayload;
  notes_enc: EncryptedPayload;
  summary_enc: EncryptedPayload;
  recommendations_enc: EncryptedPayload;
}

// ── Fungsi Enkripsi Assessment ───────────────────────────────────────────────

export function encryptAssessmentFields(
  assessmentId: string,
  fields: AssessmentPlaintextFields,
): EncryptedAssessmentPayloads {
  return {
    ssid_enc: encryptData(
      fields.ssid,
      buildAssessmentAad(assessmentId, "ssid"),
    ),
    securityProtocol_enc: encryptData(
      fields.securityProtocol,
      buildAssessmentAad(assessmentId, "securityProtocol"),
    ),
    passwordProtection_enc: encryptData(
      fields.passwordProtection,
      buildAssessmentAad(assessmentId, "passwordProtection"),
    ),
    wpsEnabled_enc: encryptData(
      fields.wpsEnabled,
      buildAssessmentAad(assessmentId, "wpsEnabled"),
    ),
    firmwareStatus_enc: encryptData(
      fields.firmwareStatus,
      buildAssessmentAad(assessmentId, "firmwareStatus"),
    ),
    notes_enc: encryptData(
      fields.notes ?? "",
      buildAssessmentAad(assessmentId, "notes"),
    ),
    summary_enc: encryptData(
      fields.summary,
      buildAssessmentAad(assessmentId, "summary"),
    ),
    recommendations_enc: encryptData(
      JSON.stringify(fields.recommendations ?? []),
      buildAssessmentAad(assessmentId, "recommendations"),
    ),
  };
}

// ── Fungsi Dekripsi Assessment ───────────────────────────────────────────────

export interface AssessmentRecordForDecryption {
  id: string;
  ssid?: string | null;
  ssid_enc?: unknown;
  securityProtocol?: string | null;
  securityProtocol_enc?: unknown;
  passwordProtection?: string | null;
  passwordProtection_enc?: unknown;
  wpsEnabled?: string | null;
  wpsEnabled_enc?: unknown;
  firmwareStatus?: string | null;
  firmwareStatus_enc?: unknown;
  notes?: string | null;
  notes_enc?: unknown;
  summary?: string | null;
  summary_enc?: unknown;
  recommendations?: unknown;
  recommendations_enc?: unknown;
}

export interface DecryptedAssessmentFields {
  ssid: string;
  securityProtocol: SecurityProtocol;
  passwordProtection: ProtectionStatus;
  wpsEnabled: ProtectionStatus;
  firmwareStatus: FirmwareStatus;
  notes: string;
  summary: string;
  recommendations: string[];
}

export function decryptAssessmentFields(
  record: AssessmentRecordForDecryption,
): DecryptedAssessmentFields {
  const { id } = record;

  const decryptOrFallback = (
    encPayload: unknown,
    fieldName: string,
    fallback: string | null | undefined,
  ): string => {
    // 1. Jika payload enkripsi ADA, wajib didekripsi.
    // Jika dekripsi gagal (misal tag tidak cocok, kunci salah, dsb.),
    // error dari decryptData langsung dilempar dan TIDAK PERNAH fallback ke plaintext.
    if (encPayload !== null && encPayload !== undefined) {
      return decryptData(encPayload, buildAssessmentAad(id, fieldName));
    }

    // 2. Jalur legacy: hanya aktif jika payload enkripsi sama sekali tidak ada
    if (fallback !== undefined && fallback !== null) {
      return fallback;
    }

    throw new Error(
      `Field '${fieldName}' pada Assessment '${id}' tidak memiliki data terenkripsi maupun data legacy.`,
    );
  };

  const ssid = decryptOrFallback(record.ssid_enc, "ssid", record.ssid);
  const securityProtocol = decryptOrFallback(
    record.securityProtocol_enc,
    "securityProtocol",
    record.securityProtocol,
  ) as SecurityProtocol;
  const passwordProtection = decryptOrFallback(
    record.passwordProtection_enc,
    "passwordProtection",
    record.passwordProtection,
  ) as ProtectionStatus;
  const wpsEnabled = decryptOrFallback(
    record.wpsEnabled_enc,
    "wpsEnabled",
    record.wpsEnabled,
  ) as ProtectionStatus;
  const firmwareStatus = decryptOrFallback(
    record.firmwareStatus_enc,
    "firmwareStatus",
    record.firmwareStatus,
  ) as FirmwareStatus;
  const notes = decryptOrFallback(
    record.notes_enc,
    "notes",
    record.notes,
  );
  const summary = decryptOrFallback(
    record.summary_enc,
    "summary",
    record.summary,
  );

  let recommendations: string[];
  if (
    record.recommendations_enc !== null &&
    record.recommendations_enc !== undefined
  ) {
    // Wajib didekripsi (tidak ada fallback jika gagal)
    const rawJson = decryptData(
      record.recommendations_enc,
      buildAssessmentAad(id, "recommendations"),
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error(
        `Gagal mem-parse JSON recommendations terdekripsi untuk Assessment '${id}'.`,
      );
    }

    if (!Array.isArray(parsed)) {
      throw new Error(
        `Format recommendations terdekripsi pada Assessment '${id}' tidak valid: harus berupa array.`,
      );
    }

    for (let i = 0; i < parsed.length; i++) {
      if (typeof parsed[i] !== "string") {
        throw new Error(
          `Item ke-${i} pada recommendations terdekripsi Assessment '${id}' bukan string.`,
        );
      }
    }

    recommendations = parsed as string[];
  } else if (
    record.recommendations !== null &&
    record.recommendations !== undefined
  ) {
    // Jalur legacy: hanya jika data legacy benar-benar berupa array string
    if (!Array.isArray(record.recommendations)) {
      throw new Error(
        `Format recommendations legacy pada Assessment '${id}' tidak valid: harus berupa array.`,
      );
    }

    for (let i = 0; i < record.recommendations.length; i++) {
      if (typeof record.recommendations[i] !== "string") {
        throw new Error(
          `Item ke-${i} pada recommendations legacy Assessment '${id}' bukan string.`,
        );
      }
    }

    recommendations = record.recommendations as string[];
  } else {
    throw new Error(
      `Field 'recommendations' pada Assessment '${id}' tidak memiliki data terenkripsi maupun data legacy.`,
    );
  }

  return {
    ssid,
    securityProtocol,
    passwordProtection,
    wpsEnabled,
    firmwareStatus,
    notes,
    summary,
    recommendations,
  };
}

// ── Tipe & Fungsi Enkripsi/Dekripsi Finding ──────────────────────────────────

export interface FindingPlaintextFields {
  title: string;
  description: string;
}

export interface EncryptedFindingPayloads {
  title_enc: EncryptedPayload;
  description_enc: EncryptedPayload;
}

export function encryptFindingFields(
  assessmentId: string,
  findingId: string,
  fields: FindingPlaintextFields,
): EncryptedFindingPayloads {
  return {
    title_enc: encryptData(
      fields.title,
      buildFindingAad(assessmentId, findingId, "title"),
    ),
    description_enc: encryptData(
      fields.description,
      buildFindingAad(assessmentId, findingId, "description"),
    ),
  };
}

export interface FindingRecordForDecryption {
  id: string;
  assessmentId: string;
  title?: string | null;
  title_enc?: unknown;
  description?: string | null;
  description_enc?: unknown;
}

export function decryptFindingFields(
  record: FindingRecordForDecryption,
): FindingPlaintextFields {
  const { id, assessmentId } = record;

  const decryptOrFallbackFinding = (
    encPayload: unknown,
    fieldName: "title" | "description",
    fallback: string | null | undefined,
  ): string => {
    // 1. Jika payload enkripsi ADA, wajib didekripsi.
    // Jika dekripsi gagal, error langsung dilempar dan TIDAK PERNAH fallback ke plaintext.
    if (encPayload !== null && encPayload !== undefined) {
      return decryptData(
        encPayload,
        buildFindingAad(assessmentId, id, fieldName),
      );
    }

    // 2. Jalur legacy: hanya aktif jika payload enkripsi sama sekali tidak ada
    if (fallback !== null && fallback !== undefined) {
      return fallback;
    }

    throw new Error(
      `Field '${fieldName}' pada Finding '${id}' (Assessment '${assessmentId}') tidak memiliki data terenkripsi maupun data legacy.`,
    );
  };

  const title = decryptOrFallbackFinding(
    record.title_enc,
    "title",
    record.title,
  );

  const description = decryptOrFallbackFinding(
    record.description_enc,
    "description",
    record.description,
  );

  return {
    title,
    description,
  };
}

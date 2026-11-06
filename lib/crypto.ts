/**
 * lib/crypto.ts
 *
 * Modul enkripsi AES-256-GCM untuk WiFi Check (kripto-v0.2).
 *
 * PENTING: Modul ini HANYA boleh diimpor dari Server Components, Route Handlers,
 * Server Actions, atau modul sisi-server lainnya. Jangan impor dari Client Components.
 * Perlindungan ini diperkuat oleh `import "server-only"` di bawah, yang menyebabkan
 * build error jika modul diimpor dari Client Component di Next.js.
 *
 * Ketentuan:
 * - Algoritma : AES-256-GCM
 * - Panjang kunci : 32 byte (256 bit), dibaca dari env ENCRYPTION_KEY (hex 64 karakter)
 * - Nonce       : 12 byte (96 bit), dibuat secara acak per operasi enkripsi
 * - Auth tag    : 16 byte (128 bit)
 * - AAD         : Additional Authenticated Data wajib disertakan
 * - Format output: { ciphertext, nonce, authTag, version } semuanya hex
 */

// Mencegah modul ini diimpor dari Client Component.
// Next.js menangani ini secara internal; Vitest menggunakan stub kosong (lihat vitest.config.ts).
import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// ── Konstanta ──────────────────────────────────────────────────────────────────

/** Versi skema payload. Naikkan jika format berubah secara breaking. */
const SCHEMA_VERSION = 1 as const;

const ALGORITHM = "aes-256-gcm" as const;
const KEY_BYTES = 32; // 256 bit
const NONCE_BYTES = 12; // 96 bit (GCM nonce standar)
const TAG_BYTES = 16; // 128 bit

// ── Tipe publik ────────────────────────────────────────────────────────────────

/** Payload terenkripsi yang dikembalikan oleh encryptData(). */
export interface EncryptedPayload {
  /** Ciphertext dalam format hexadecimal. */
  ciphertext: string;
  /** Nonce (IV) 12 byte dalam format hexadecimal. */
  nonce: string;
  /** Authentication tag 16 byte dalam format hexadecimal. */
  authTag: string;
  /** Versi skema enkripsi. Saat ini selalu 1. */
  version: number;
}

// ── Validasi kunci ─────────────────────────────────────────────────────────────

/**
 * Memuat dan memvalidasi kunci enkripsi dari environment variable ENCRYPTION_KEY.
 *
 * Fungsi ini dieksekusi sekali saat modul dimuat. Jika kunci tidak valid,
 * modul akan melempar error dan tidak dapat digunakan.
 *
 * @throws {Error} Jika kunci kosong, bukan hex valid, atau bukan 64 karakter.
 * @returns Buffer kunci 32 byte yang siap digunakan.
 */
function loadEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;

  if (!raw || raw.trim() === "") {
    throw new Error(
      "ENCRYPTION_KEY tidak ditemukan atau kosong. " +
      "Atur environment variable ENCRYPTION_KEY dengan nilai hex 64 karakter.",
    );
  }

  const trimmed = raw.trim();

  if (trimmed.length !== KEY_BYTES * 2) {
    throw new Error(
      `ENCRYPTION_KEY harus tepat ${KEY_BYTES * 2} karakter hex (${KEY_BYTES} byte), ` +
      `namun diterima ${trimmed.length} karakter.`,
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(trimmed)) {
    throw new Error(
      "ENCRYPTION_KEY mengandung karakter tidak valid. " +
      "Hanya karakter hex [0-9a-fA-F] yang diizinkan.",
    );
  }

  return Buffer.from(trimmed, "hex");
}

/**
 * Kunci enkripsi yang dimuat saat modul diinisialisasi.
 * Lazy-loaded agar pengujian dapat menyetel env sebelum impor pertama;
 * tetapi agar tidak diekspos ke bundler sisi-klien, kita tidak mengekspornya.
 */
let _keyCache: Buffer | null = null;

function getKey(): Buffer {
  if (_keyCache === null) {
    _keyCache = loadEncryptionKey();
  }
  return _keyCache;
}

// ── Validasi payload ───────────────────────────────────────────────────────────

/** Pola regex untuk string hexadecimal murni. */
const HEX_RE = /^[0-9a-fA-F]+$/;

function assertHex(value: unknown, fieldName: string, expectedBytes: number): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`Field '${fieldName}' harus berupa string hex yang tidak kosong.`);
  }
  if (!HEX_RE.test(value)) {
    throw new TypeError(
      `Field '${fieldName}' mengandung karakter tidak valid. Hanya hex [0-9a-fA-F] yang diizinkan.`,
    );
  }
  if (value.length !== expectedBytes * 2) {
    throw new RangeError(
      `Field '${fieldName}' harus tepat ${expectedBytes * 2} karakter hex ` +
      `(${expectedBytes} byte), diterima ${value.length} karakter.`,
    );
  }
}

function validatePayload(payload: unknown): asserts payload is EncryptedPayload {
  if (payload === null || typeof payload !== "object") {
    throw new TypeError("Payload enkripsi harus berupa objek.");
  }

  const p = payload as Record<string, unknown>;

  // Validasi versi terlebih dahulu
  if (typeof p.version !== "number" || !Number.isInteger(p.version)) {
    throw new TypeError("Field 'version' harus berupa bilangan bulat.");
  }
  if (p.version !== SCHEMA_VERSION) {
    throw new RangeError(
      `Versi payload tidak didukung: ${p.version}. ` +
      `Hanya versi ${SCHEMA_VERSION} yang didukung.`,
    );
  }

  // Validasi komponen kriptografi
  assertHex(p.nonce, "nonce", NONCE_BYTES);
  assertHex(p.authTag, "authTag", TAG_BYTES);

  // ciphertext: string hex panjang genap; boleh kosong jika plaintext adalah string kosong
  if (typeof p.ciphertext !== "string") {
    throw new TypeError("Field 'ciphertext' harus berupa string.");
  }
  if (p.ciphertext.length > 0 && !HEX_RE.test(p.ciphertext)) {
    throw new TypeError(
      "Field 'ciphertext' mengandung karakter tidak valid. Hanya hex [0-9a-fA-F] yang diizinkan.",
    );
  }
  if (p.ciphertext.length % 2 !== 0) {
    throw new RangeError("Field 'ciphertext' harus memiliki panjang genap (pasangan hex).");
  }
}

function validateAad(aad: unknown): asserts aad is string {
  if (typeof aad !== "string") {
    throw new TypeError("AAD (Additional Authenticated Data) harus berupa string.");
  }
  // String kosong diizinkan; konteks semantiknya ditentukan oleh pemanggil.
}

// ── Fungsi enkripsi ────────────────────────────────────────────────────────────

/**
 * Mengenkripsi plaintext menggunakan AES-256-GCM.
 *
 * @param plaintext - Teks/data yang akan dienkripsi (UTF-8).
 * @param aad       - Additional Authenticated Data. Harus sama saat dekripsi.
 * @returns EncryptedPayload berisi ciphertext, nonce, authTag, dan version (semua hex).
 * @throws {Error} Jika kunci tidak valid atau enkripsi gagal.
 */
export function encryptData(plaintext: string, aad: string): EncryptedPayload {
  validateAad(aad);

  if (typeof plaintext !== "string") {
    throw new TypeError("Plaintext harus berupa string.");
  }

  const key = getKey();
  const nonce = randomBytes(NONCE_BYTES);

  // authTagLength: 16 byte (128 bit) — diatur lewat options createCipheriv
  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: TAG_BYTES });

  // Setel AAD sebelum update/final
  cipher.setAAD(Buffer.from(aad, "utf8"), { plaintextLength: Buffer.byteLength(plaintext, "utf8") });

  const encryptedChunks: Buffer[] = [];
  encryptedChunks.push(cipher.update(plaintext, "utf8"));
  encryptedChunks.push(cipher.final());

  const ciphertextBuf = Buffer.concat(encryptedChunks);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertextBuf.toString("hex"),
    nonce: nonce.toString("hex"),
    authTag: authTag.toString("hex"),
    version: SCHEMA_VERSION,
  };
}

// ── Fungsi dekripsi ────────────────────────────────────────────────────────────

/**
 * Mendekripsi payload yang dihasilkan oleh encryptData().
 *
 * Dekripsi akan gagal (melempar error) jika:
 * - Payload tidak valid (ciphertext/nonce/authTag/version salah format)
 * - AAD tidak cocok dengan yang digunakan saat enkripsi
 * - Ciphertext atau authentication tag telah dimodifikasi
 * - Kunci berbeda dari yang digunakan saat enkripsi
 *
 * Jangan pernah mengembalikan plaintext sebagian. Jika ada kegagalan otentikasi,
 * fungsi ini melempar error.
 *
 * @param encryptedPayload - Objek EncryptedPayload yang dikembalikan oleh encryptData().
 * @param aad              - AAD yang sama dengan yang digunakan saat enkripsi.
 * @returns Plaintext asli dalam bentuk string UTF-8.
 * @throws {Error} Jika autentikasi gagal, payload tidak valid, atau kunci salah.
 */
export function decryptData(encryptedPayload: unknown, aad: string): string {
  validateAad(aad);
  validatePayload(encryptedPayload);

  const key = getKey();

  const nonceBuf = Buffer.from(encryptedPayload.nonce, "hex");
  const authTagBuf = Buffer.from(encryptedPayload.authTag, "hex");
  const ciphertextBuf = Buffer.from(encryptedPayload.ciphertext, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, nonceBuf, { authTagLength: TAG_BYTES });
  decipher.setAuthTag(authTagBuf);

  // Setel AAD sebelum update/final — WAJIB cocok dengan yang digunakan saat enkripsi
  decipher.setAAD(Buffer.from(aad, "utf8"), {
    plaintextLength: ciphertextBuf.length,
  });

  let plaintext: string;
  try {
    const decryptedChunks: Buffer[] = [];
    decryptedChunks.push(decipher.update(ciphertextBuf));
    // final() melakukan verifikasi authentication tag; melempar error jika gagal
    decryptedChunks.push(decipher.final());
    plaintext = Buffer.concat(decryptedChunks).toString("utf8");
  } catch {
    // Jangan bocorkan detail internal ke pemanggil; bungkus dengan pesan umum
    throw new Error(
      "Dekripsi gagal: data telah dimodifikasi, kunci salah, atau AAD tidak cocok.",
    );
  }

  return plaintext;
}

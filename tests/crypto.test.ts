/**
 * tests/crypto.test.ts
 *
 * Pengujian unit untuk modul lib/crypto.ts (AES-256-GCM).
 *
 * Strategi isolasi modul:
 *   vi.resetModules() dipanggil sebelum setiap dynamic import agar _keyCache
 *   di dalam lib/crypto.ts dikosongkan dan kunci baru dari process.env dibaca.
 *   Pool "forks" di vitest.config.ts memastikan setiap file test berjalan di
 *   proses Node.js terpisah, sehingga isolasi antar-suite terjamin.
 *
 * Kunci yang digunakan di sini adalah kunci SINTETIS khusus pengujian.
 * Jangan masukkan kunci produksi ke repository.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EncryptedPayload } from "../lib/crypto";

// ── Kunci sintetis pengujian ───────────────────────────────────────────────────
// 64 karakter hex = 32 byte = AES-256
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const ALT_KEY  = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

// ── Helper: muat ulang modul dengan kunci tertentu ────────────────────────────
/**
 * Reset registri modul Vitest lalu impor salinan segar lib/crypto.ts.
 * Karena _keyCache bersifat module-level, reset modul + env baru
 * membuat getKey() membaca process.env.ENCRYPTION_KEY yang terbaru.
 */
async function loadCrypto(key: string | undefined) {
  if (key === undefined) {
    delete process.env.ENCRYPTION_KEY;
  } else {
    process.env.ENCRYPTION_KEY = key;
  }
  vi.resetModules();
  return import("../lib/crypto");
}

// ── Setup / teardown ──────────────────────────────────────────────────────────
describe("lib/crypto – AES-256-GCM", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    // Pulihkan env asli dan bersihkan cache modul
    if (originalKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalKey;
    }
    vi.resetModules();
  });

  // ── 1. Enkripsi dan dekripsi teks biasa ──────────────────────────────────────
  it("mengenkripsi dan mendekripsi teks biasa dengan benar", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    const plaintext = "Hello, WiFi Check!";
    const aad = "context:plaintext";

    const payload = encryptData(plaintext, aad);

    // Verifikasi struktur payload
    expect(payload).toHaveProperty("ciphertext");
    expect(payload).toHaveProperty("nonce");
    expect(payload).toHaveProperty("authTag");
    expect(payload.version).toBe(1);

    // Verifikasi panjang komponen (hex): nonce=12 byte=24 hex, tag=16 byte=32 hex
    expect(payload.nonce).toMatch(/^[0-9a-f]{24}$/);
    expect(payload.authTag).toMatch(/^[0-9a-f]{32}$/);

    // Ciphertext harus ada dan bukan plaintext itu sendiri
    expect(payload.ciphertext.length).toBeGreaterThan(0);
    expect(payload.ciphertext).not.toBe(Buffer.from(plaintext, "utf8").toString("hex"));

    // Round-trip: dekripsi menghasilkan plaintext asli
    const decrypted = decryptData(payload, aad);
    expect(decrypted).toBe(plaintext);
  });

  // ── 2. Enkripsi dan dekripsi JSON ───────────────────────────────────────────
  it("mengenkripsi dan mendekripsi JSON dengan benar", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    const data = { ssid: "Lab-WiFi-01", channel: 6, security: "wpa3" };
    const plaintext = JSON.stringify(data);
    const aad = "context:json";

    const payload = encryptData(plaintext, aad);
    const decrypted = decryptData(payload, aad);

    // Parsing kembali harus menghasilkan objek identik
    expect(JSON.parse(decrypted)).toStrictEqual(data);
  });

  // ── 3. Enkripsi dan dekripsi teks Unicode ───────────────────────────────────
  it("mengenkripsi dan mendekripsi teks Unicode dengan benar", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    // Gunakan karakter Unicode multi-script yang relevan dengan konteks proyek
    const plaintext = "WiFi Kost \u2013 Indonesia \u2013 \u65e5\u672c\u8a9e \u2013 \uD83D\uDD10";
    const aad = "context:unicode";

    const payload = encryptData(plaintext, aad);
    const decrypted = decryptData(payload, aad);

    // Karakter harus tetap sama persis — tidak ada mojibake
    expect(decrypted).toBe(plaintext);
    expect(decrypted.codePointAt(0)).toBe(plaintext.codePointAt(0));
  });

  // ── 4. Enkripsi dan dekripsi plaintext kosong ────────────────────────────────
  it("mendukung round-trip plaintext kosong", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    const aad = "context:empty";
    const payload = encryptData("", aad);

    // Payload tetap valid meskipun ciphertext kosong
    expect(payload.version).toBe(1);
    expect(payload.ciphertext).toBe("");          // tidak ada byte yang dienkripsi
    expect(payload.nonce).toMatch(/^[0-9a-f]{24}$/);
    expect(payload.authTag).toMatch(/^[0-9a-f]{32}$/);

    const decrypted = decryptData(payload, aad);
    expect(decrypted).toBe("");
  });

  // ── 5. Setiap enkripsi menghasilkan nonce berbeda (non-determinisme) ─────────
  it("menghasilkan nonce berbeda untuk setiap enkripsi (non-deterministik)", async () => {
    const { encryptData } = await loadCrypto(TEST_KEY);

    const aad = "context:nonce";
    const p1 = encryptData("data", aad);
    const p2 = encryptData("data", aad);

    // Probabilitas tabrakan nonce: 2^-96 ≈ nol secara praktis
    expect(p1.nonce).not.toBe(p2.nonce);
    expect(p1.ciphertext).not.toBe(p2.ciphertext);
  });

  // ── 6. Ciphertext yang dimodifikasi ditolak ──────────────────────────────────
  it("menolak ciphertext yang dimodifikasi", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    const payload = encryptData("data rahasia", "context:tamper-ct");
    const tampered: EncryptedPayload = {
      ...payload,
      ciphertext: flipFirstByte(payload.ciphertext),
    };

    expect(() => decryptData(tampered, "context:tamper-ct")).toThrow();
  });

  // ── 7. Authentication tag yang dimodifikasi ditolak ──────────────────────────
  it("menolak authentication tag yang dimodifikasi", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    const payload = encryptData("data rahasia", "context:tamper-tag");
    const tampered: EncryptedPayload = {
      ...payload,
      authTag: flipFirstByte(payload.authTag),
    };

    expect(() => decryptData(tampered, "context:tamper-tag")).toThrow();
  });

  // ── 8. Nonce yang dimodifikasi ditolak ───────────────────────────────────────
  it("menolak nonce yang dimodifikasi", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    const payload = encryptData("data rahasia", "context:tamper-nonce");
    const tampered: EncryptedPayload = {
      ...payload,
      nonce: flipFirstByte(payload.nonce),
    };

    expect(() => decryptData(tampered, "context:tamper-nonce")).toThrow();
  });

  // ── 9. AAD yang berbeda ditolak ──────────────────────────────────────────────
  it("menolak AAD yang berbeda dari saat enkripsi", async () => {
    const { encryptData, decryptData } = await loadCrypto(TEST_KEY);

    const payload = encryptData("data rahasia", "context:aad-original");

    expect(() => decryptData(payload, "context:aad-wrong")).toThrow();
  });

  // ── 10. Kunci yang berbeda ditolak (via fungsi asli) ─────────────────────────
  it("menolak kunci berbeda dari saat enkripsi — diuji via fungsi asli", async () => {
    // Langkah 1: Enkripsi dengan TEST_KEY
    const { encryptData } = await loadCrypto(TEST_KEY);
    const payload = encryptData("data rahasia kunci berbeda", "context:key-mismatch");

    // Langkah 2: Reset modul, ganti env ke ALT_KEY, impor ulang
    const { decryptData: decryptWithAlt } = await loadCrypto(ALT_KEY);

    // Langkah 3: Dekripsi payload TEST_KEY dengan ALT_KEY — harus gagal
    expect(() => decryptWithAlt(payload, "context:key-mismatch")).toThrow(
      /Dekripsi gagal/,
    );
  });

  // ── 11. Kunci kosong ditolak (via fungsi asli) ───────────────────────────────
  it("menolak kunci kosong — diuji via fungsi asli encryptData", async () => {
    // Hapus env, reset modul, impor segar → encryptData harus melempar saat dipanggil
    const { encryptData } = await loadCrypto(undefined);

    expect(() => encryptData("test", "aad")).toThrow(/kosong/);
  });

  // ── 12. Kunci kosong string whitespace ditolak ───────────────────────────────
  it("menolak kunci berisi hanya whitespace — diuji via fungsi asli", async () => {
    const { encryptData } = await loadCrypto("   ");

    // "   " setelah trim() == "" → seharusnya ditolak
    expect(() => encryptData("test", "aad")).toThrow(/kosong/);
  });

  // ── 13. Kunci terlalu pendek ditolak (via fungsi asli) ───────────────────────
  it("menolak kunci terlalu pendek — diuji via fungsi asli", async () => {
    const { encryptData } = await loadCrypto("abcdef1234"); // hanya 10 karakter

    expect(() => encryptData("test", "aad")).toThrow(/64 karakter/);
  });

  // ── 14. Kunci terlalu panjang ditolak (via fungsi asli) ──────────────────────
  it("menolak kunci terlalu panjang — diuji via fungsi asli", async () => {
    const { encryptData } = await loadCrypto("a".repeat(65));

    expect(() => encryptData("test", "aad")).toThrow(/64 karakter/);
  });

  // ── 15. Kunci bukan hexadecimal ditolak (via fungsi asli) ────────────────────
  it("menolak kunci bukan hexadecimal — diuji via fungsi asli", async () => {
    // 64 karakter tapi bukan hex ('z' bukan karakter hex valid)
    const { encryptData } = await loadCrypto("z".repeat(64));

    expect(() => encryptData("test", "aad")).toThrow(/karakter tidak valid/);
  });

  // ── 16. Payload dengan field tidak lengkap atau tipe salah ditolak ───────────
  it("menolak payload dengan field tidak lengkap atau tipe salah", async () => {
    const { decryptData } = await loadCrypto(TEST_KEY);

    // Bukan objek
    expect(() => decryptData(null, "aad")).toThrow(/objek/);
    expect(() => decryptData("string", "aad")).toThrow(/objek/);
    expect(() => decryptData(42, "aad")).toThrow(/objek/);

    // Versi tidak valid
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "00".repeat(12), authTag: "00".repeat(16), version: 999 },
        "aad",
      ),
    ).toThrow(/[Vv]ersi/);

    // version bertipe string (bukan number)
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "00".repeat(12), authTag: "00".repeat(16), version: "1" },
        "aad",
      ),
    ).toThrow(/version/);
  });

  // ── 17. Nonce dengan format tidak valid ditolak ──────────────────────────────
  it("menolak payload dengan nonce format tidak valid", async () => {
    const { decryptData } = await loadCrypto(TEST_KEY);

    // Nonce terlalu pendek (6 byte = 12 hex, bukan 12 byte = 24 hex)
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "00".repeat(6), authTag: "00".repeat(16), version: 1 },
        "aad",
      ),
    ).toThrow(/nonce/);

    // Nonce terlalu panjang
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "00".repeat(13), authTag: "00".repeat(16), version: 1 },
        "aad",
      ),
    ).toThrow(/nonce/);

    // Nonce bukan hex
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "zz".repeat(12), authTag: "00".repeat(16), version: 1 },
        "aad",
      ),
    ).toThrow(/nonce/);
  });

  // ── 18. AuthTag dengan format tidak valid ditolak ────────────────────────────
  it("menolak payload dengan authTag format tidak valid", async () => {
    const { decryptData } = await loadCrypto(TEST_KEY);

    // authTag terlalu pendek (8 byte = 16 hex, bukan 16 byte = 32 hex)
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "00".repeat(12), authTag: "00".repeat(8), version: 1 },
        "aad",
      ),
    ).toThrow(/authTag/);

    // authTag terlalu panjang
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "00".repeat(12), authTag: "00".repeat(17), version: 1 },
        "aad",
      ),
    ).toThrow(/authTag/);

    // authTag bukan hex
    expect(() =>
      decryptData(
        { ciphertext: "aabb", nonce: "00".repeat(12), authTag: "zz".repeat(16), version: 1 },
        "aad",
      ),
    ).toThrow(/authTag/);
  });

  // ── 19. Ciphertext dengan format tidak valid ditolak ─────────────────────────
  it("menolak payload dengan ciphertext format tidak valid", async () => {
    const { decryptData } = await loadCrypto(TEST_KEY);

    // Ciphertext bukan string
    expect(() =>
      decryptData(
        { ciphertext: 12345, nonce: "00".repeat(12), authTag: "00".repeat(16), version: 1 },
        "aad",
      ),
    ).toThrow(/ciphertext/);

    // Ciphertext panjang ganjil (tidak berpasangan hex)
    expect(() =>
      decryptData(
        { ciphertext: "abc", nonce: "00".repeat(12), authTag: "00".repeat(16), version: 1 },
        "aad",
      ),
    ).toThrow(/ciphertext/);

    // Ciphertext mengandung karakter bukan hex
    expect(() =>
      decryptData(
        { ciphertext: "zz", nonce: "00".repeat(12), authTag: "00".repeat(16), version: 1 },
        "aad",
      ),
    ).toThrow(/ciphertext/);
  });
});

// ── Utilitas ──────────────────────────────────────────────────────────────────

/**
 * Membalik semua bit byte pertama dari string hex.
 * Digunakan untuk mensimulasikan modifikasi ciphertext, authTag, atau nonce.
 *
 * Contoh: "ab1234" → "541234"  (0xab XOR 0xff = 0x54)
 */
function flipFirstByte(hex: string): string {
  const firstByte = parseInt(hex.slice(0, 2), 16);
  const flipped   = (firstByte ^ 0xff).toString(16).padStart(2, "0");
  return flipped + hex.slice(2);
}

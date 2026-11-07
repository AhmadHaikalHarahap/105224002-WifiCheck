import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  ARGON2_CONFIG,
  ARGON2_BOUNDS,
  MAX_PASSWORD_BYTES,
} from '@/lib/auth/password';

describe('Modul Password Argon2id Native Node.js (SEC-0.2)', () => {
  const testPassword = 'Secure#Passw0rd!2026';

  describe('Fungsi hashPassword', () => {
    it('menghasilkan format PHC Argon2id yang benar dan terstandarisasi', async () => {
      const hash = await hashPassword(testPassword);

      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$argon2id$v=19$')).toBe(true);

      const parts = hash.split('$');
      expect(parts.length).toBe(6);
      expect(parts[1]).toBe('argon2id');
      expect(parts[2]).toBe('v=19');
      expect(parts[3]).toBe(`m=${ARGON2_CONFIG.memoryCost},t=${ARGON2_CONFIG.timeCost},p=${ARGON2_CONFIG.parallelism}`);

      // Salt base64 16 bytes menghasilkan string ~22 karakter unpadded
      const saltBuffer = Buffer.from(parts[4], 'base64');
      expect(saltBuffer.length).toBe(ARGON2_CONFIG.saltLength);

      // Hash base64 32 bytes menghasilkan string ~43 karakter unpadded
      const hashBuffer = Buffer.from(parts[5], 'base64');
      expect(hashBuffer.length).toBe(ARGON2_CONFIG.tagLength);
    });

    it('menghasilkan salt acak yang berbeda untuk dua kali hashing password yang sama', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);

      const salt1 = hash1.split('$')[4];
      const salt2 = hash2.split('$')[4];
      expect(salt1).not.toBe(salt2);
    });

    it('menolak password kosong dengan melempar error yang jelas dan aman', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password wajib diisi dan tidak boleh kosong.');
      // @ts-expect-error Pengujian input non-string
      await expect(hashPassword(null)).rejects.toThrow('Password wajib diisi dan tidak boleh kosong.');
      // @ts-expect-error Pengujian input non-string
      await expect(hashPassword(undefined)).rejects.toThrow('Password wajib diisi dan tidak boleh kosong.');
    });

    it('dapat memproses password dengan ukuran tepat 128 byte', async () => {
      const exact128Bytes = 'A'.repeat(MAX_PASSWORD_BYTES);
      expect(Buffer.byteLength(exact128Bytes, 'utf8')).toBe(128);

      const hash = await hashPassword(exact128Bytes);
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$argon2id$v=19$')).toBe(true);
    });

    it('menolak password berukuran 129 byte saat hashing dengan error yang aman', async () => {
      const over128Bytes = 'A'.repeat(MAX_PASSWORD_BYTES + 1);
      expect(Buffer.byteLength(over128Bytes, 'utf8')).toBe(129);

      await expect(hashPassword(over128Bytes)).rejects.toThrow(
        `Password melebihi batas maksimal ${MAX_PASSWORD_BYTES} byte.`
      );
    });

    it('menghitung ukuran password Unicode berdasarkan byte UTF-8 bukan jumlah karakter', async () => {
      const emojiChar = '🔐'; // 4 bytes UTF-8 per emoji
      expect(Buffer.byteLength(emojiChar, 'utf8')).toBe(4);

      // 32 emoji * 4 byte = 128 byte (jumlah karakter JS = 64 karena surrogate pairs)
      const exact128Unicode = emojiChar.repeat(32);
      expect(Buffer.byteLength(exact128Unicode, 'utf8')).toBe(128);
      const hash = await hashPassword(exact128Unicode);
      expect(typeof hash).toBe('string');

      // 33 emoji * 4 byte = 132 byte -> melebihi batas 128 byte
      const over128Unicode = emojiChar.repeat(33);
      expect(Buffer.byteLength(over128Unicode, 'utf8')).toBe(132);
      await expect(hashPassword(over128Unicode)).rejects.toThrow(
        `Password melebihi batas maksimal ${MAX_PASSWORD_BYTES} byte.`
      );
    });
  });

  describe('Fungsi verifyPassword - Skenario Positif', () => {
    it('berhasil memverifikasi password yang benar', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('berhasil memverifikasi password dengan karakter khusus dan multibyte UTF-8', async () => {
      const complexPassword = 'KunciRahasia#2026-🔑-Bintang★-WiFi';
      const hash = await hashPassword(complexPassword);
      const isValid = await verifyPassword(complexPassword, hash);

      expect(isValid).toBe(true);
    });

    it('berhasil memverifikasi password berukuran tepat 128 byte', async () => {
      const exact128Bytes = 'Z'.repeat(MAX_PASSWORD_BYTES);
      const hash = await hashPassword(exact128Bytes);
      const isValid = await verifyPassword(exact128Bytes, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('Fungsi verifyPassword - Skenario Negatif & Penolakan Akses', () => {
    it('menolak password yang salah', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('WrongPassword#2026', hash);

      expect(isValid).toBe(false);
    });

    it('menolak password berukuran 129 byte saat verifikasi dengan menghasilkan false', async () => {
      const hash = await hashPassword(testPassword);
      const over128Bytes = 'A'.repeat(MAX_PASSWORD_BYTES + 1);
      const isValid = await verifyPassword(over128Bytes, hash);

      expect(isValid).toBe(false);
    });

    it('menolak password Unicode melebihi 128 byte saat verifikasi dengan menghasilkan false', async () => {
      const hash = await hashPassword(testPassword);
      const over128Unicode = '🔐'.repeat(33); // 132 bytes
      const isValid = await verifyPassword(over128Unicode, hash);

      expect(isValid).toBe(false);
    });

    it('menolak password yang mirip hanya beda 1 karakter kapital', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('secure#passw0rd!2026', hash);

      expect(isValid).toBe(false);
    });

    it('menolak verifikasi jika input password kosong tanpa crash', async () => {
      const hash = await hashPassword(testPassword);
      expect(await verifyPassword('', hash)).toBe(false);
      // @ts-expect-error Pengujian input non-string
      expect(await verifyPassword(null, hash)).toBe(false);
      // @ts-expect-error Pengujian input non-string
      expect(await verifyPassword(undefined, hash)).toBe(false);
    });

    it('menolak algoritma yang tidak didukung (argon2i, argon2d, bcrypt)', async () => {
      const hash = await hashPassword(testPassword);

      // Ubah algoritma dari argon2id menjadi argon2i
      const hashArgon2i = hash.replace('$argon2id$', '$argon2i$');
      expect(await verifyPassword(testPassword, hashArgon2i)).toBe(false);

      // Ubah algoritma menjadi argon2d
      const hashArgon2d = hash.replace('$argon2id$', '$argon2d$');
      expect(await verifyPassword(testPassword, hashArgon2d)).toBe(false);

      // Format bcrypt
      const hashBcrypt = '$2b$12$e8kZ1qXn9P4i7B2F6yYfO.W2t7V1mG0lK8a3J4u5O6P7Q8R9S0T1U';
      expect(await verifyPassword(testPassword, hashBcrypt)).toBe(false);
    });

    it('menolak versi yang tidak sesuai selain v=19', async () => {
      const hash = await hashPassword(testPassword);

      const hashWrongVersion = hash.replace('$v=19$', '$v=18$');
      expect(await verifyPassword(testPassword, hashWrongVersion)).toBe(false);

      const hashFutureVersion = hash.replace('$v=19$', '$v=20$');
      expect(await verifyPassword(testPassword, hashFutureVersion)).toBe(false);
    });

    it('menolak parameter di luar batas toleransi keamanan (out of bounds)', async () => {
      const hash = await hashPassword(testPassword);
      const parts = hash.split('$');

      // Memory terlalu kecil (< minMemory)
      parts[3] = `m=${ARGON2_BOUNDS.minMemory - 1},t=${ARGON2_CONFIG.timeCost},p=${ARGON2_CONFIG.parallelism}`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Memory terlalu besar (> maxMemory)
      parts[3] = `m=${ARGON2_BOUNDS.maxMemory + 1},t=${ARGON2_CONFIG.timeCost},p=${ARGON2_CONFIG.parallelism}`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Iterasi/Passes terlalu kecil (< minPasses)
      parts[3] = `m=${ARGON2_CONFIG.memoryCost},t=${ARGON2_BOUNDS.minPasses - 1},p=${ARGON2_CONFIG.parallelism}`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Iterasi/Passes terlalu besar (> maxPasses)
      parts[3] = `m=${ARGON2_CONFIG.memoryCost},t=${ARGON2_BOUNDS.maxPasses + 1},p=${ARGON2_CONFIG.parallelism}`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Parallelism terlalu kecil (< minParallelism)
      parts[3] = `m=${ARGON2_CONFIG.memoryCost},t=${ARGON2_CONFIG.timeCost},p=${ARGON2_BOUNDS.minParallelism - 1}`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Parallelism terlalu besar (> maxParallelism)
      parts[3] = `m=${ARGON2_CONFIG.memoryCost},t=${ARGON2_CONFIG.timeCost},p=${ARGON2_BOUNDS.maxParallelism + 1}`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);
    });

    it('menolak parameter yang tidak valid, bukan angka, atau ada duplikasi', async () => {
      const hash = await hashPassword(testPassword);
      const parts = hash.split('$');

      // Parameter bukan angka
      parts[3] = `m=abc,t=3,p=1`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Parameter duplikat
      parts[3] = `m=65536,m=65536,t=3,p=1`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Parameter tidak lengkap
      parts[3] = `m=65536,t=3`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Parameter liar tidak dikenal
      parts[3] = `m=65536,t=3,p=1,x=99`;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);
    });

    it('menolak salt atau hash dengan panjang yang tidak sesuai', async () => {
      const hash = await hashPassword(testPassword);
      const parts = hash.split('$');

      // Salt 8 byte (harus 16 byte)
      const shortSalt = Buffer.alloc(8, 0xaa).toString('base64');
      parts[4] = shortSalt;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Salt 24 byte (harus 16 byte)
      const longSalt = Buffer.alloc(24, 0xaa).toString('base64');
      parts[4] = longSalt;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Hash 16 byte (harus 32 byte)
      const shortHash = Buffer.alloc(16, 0xbb).toString('base64');
      parts[5] = shortHash;
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);
    });

    it('menolak salt atau hash dengan karakter Base64 yang tidak valid', async () => {
      const hash = await hashPassword(testPassword);
      const parts = hash.split('$');

      // Salt disisipkan karakter non-base64
      parts[4] = 'O6JWn3QdkOUCDiTauH0r4@';
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);

      // Hash disisipkan karakter non-base64
      parts[5] = 'RBjJ7EbMGi3iezesgvkmYRLaI2390c3XVo0YPRI3eF!';
      expect(await verifyPassword(testPassword, parts.join('$'))).toBe(false);
    });

    it('menolak string malformed umum dengan aman dan fail-closed', async () => {
      expect(await verifyPassword(testPassword, '')).toBe(false);
      expect(await verifyPassword(testPassword, 'plain-text-not-hash')).toBe(false);
      expect(await verifyPassword(testPassword, '$argon2id$v=19$')).toBe(false);
      expect(await verifyPassword(testPassword, '$argon2id$v=19$m=65536,t=3,p=1$only_salt')).toBe(false);
      expect(await verifyPassword(testPassword, '$argon2id$v=19$m=65536,t=3,p=1$salt$hash$extra_part')).toBe(false);
      // @ts-expect-error Pengujian input non-string
      expect(await verifyPassword(testPassword, null)).toBe(false);
      // @ts-expect-error Pengujian input non-string
      expect(await verifyPassword(testPassword, 12345)).toBe(false);
    });
  });
});

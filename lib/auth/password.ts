import crypto from 'node:crypto';
import util from 'node:util';

/**
 * Konfigurasi default Argon2id sesuai rekomendasi OWASP & RFC 9106
 */
export const ARGON2_CONFIG = {
  algorithm: 'argon2id',
  version: 19,
  memoryCost: 65536, // 64 MiB (dalam KiB)
  timeCost: 3,       // 3 iterasi
  parallelism: 1,    // 1 thread
  saltLength: 16,    // 16 bytes
  tagLength: 32,     // 32 bytes
} as const;

/**
 * Batas toleransi parameter pada verifikasi hash untuk mencegah DoS
 */
export const ARGON2_BOUNDS = {
  minMemory: 16384,   // 16 MiB
  maxMemory: 131072,  // 128 MiB
  minPasses: 1,
  maxPasses: 10,
  minParallelism: 1,
  maxParallelism: 4,
  saltLength: 16,
  tagLength: 32,
} as const;

/**
 * Batas maksimum ukuran password dalam byte UTF-8 untuk mencegah DoS alokasi buffer
 */
export const MAX_PASSWORD_BYTES = 128;

interface Argon2Parameters {
  message: Buffer;
  nonce: Buffer;
  memory: number;
  passes: number;
  parallelism: number;
  tagLength: number;
}

type Argon2Callback = (err: Error | null, result: Buffer) => void;

interface NativeCryptoArgon2 {
  argon2: (algorithm: string, params: Argon2Parameters, cb: Argon2Callback) => void;
}

const nativeCrypto = crypto as unknown as NativeCryptoArgon2;

if (typeof nativeCrypto.argon2 !== 'function') {
  throw new Error('Runtime Node.js saat ini tidak menyediakan modul native crypto.argon2');
}

const argon2Promise = util.promisify(nativeCrypto.argon2);

/**
 * Validasi Base64 murni tanpa karakter liar dengan panjang byte tertentu
 */
function parseValidBase64(str: string, expectedByteLength: number): Buffer | null {
  if (typeof str !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(str)) {
    return null;
  }

  const buf = Buffer.from(str, 'base64');
  if (buf.length !== expectedByteLength) {
    return null;
  }

  // Verifikasi canonical base64 (tanpa karakter asing yang diabaikan Buffer)
  const canonical = buf.toString('base64').replace(/=/g, '');
  const unpadded = str.replace(/=/g, '');
  if (canonical !== unpadded) {
    return null;
  }

  return buf;
}

/**
 * Melakukan hashing password menggunakan native Argon2id Node.js secara asinkron.
 * Menghasilkan string berformat PHC:
 * `$argon2id$v=19$m=65536,t=3,p=1$<salt_base64>$<hash_base64>`
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password wajib diisi dan tidak boleh kosong.');
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new Error(`Password melebihi batas maksimal ${MAX_PASSWORD_BYTES} byte.`);
  }

  const salt = crypto.randomBytes(ARGON2_CONFIG.saltLength);

  const derivedKey = await argon2Promise(ARGON2_CONFIG.algorithm, {
    message: Buffer.from(password, 'utf8'),
    nonce: salt,
    memory: ARGON2_CONFIG.memoryCost,
    passes: ARGON2_CONFIG.timeCost,
    parallelism: ARGON2_CONFIG.parallelism,
    tagLength: ARGON2_CONFIG.tagLength,
  });

  const b64Salt = salt.toString('base64').replace(/=/g, '');
  const b64Hash = derivedKey.toString('base64').replace(/=/g, '');

  return `$${ARGON2_CONFIG.algorithm}$v=${ARGON2_CONFIG.version}$m=${ARGON2_CONFIG.memoryCost},t=${ARGON2_CONFIG.timeCost},p=${ARGON2_CONFIG.parallelism}$${b64Salt}$${b64Hash}`;
}

/**
 * Memverifikasi kecocokan password dengan hash PHC Argon2id yang tersimpan.
 * Membaca parameter dari hash, memvalidasi format dan batasan keamanan,
 * menghitung ulang hash secara asinkron, dan membandingkan dengan timingSafeEqual.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Kebijakan: jika password kosong, melebihi batas byte, atau storedHash tidak valid, tolak langsung secara aman
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return false;
  }

  if (typeof storedHash !== 'string' || !storedHash.startsWith('$argon2id$')) {
    return false;
  }

  const parts = storedHash.split('$');
  // Format: ['', 'argon2id', 'v=19', 'm=...,t=...,p=...', saltB64, hashB64]
  if (parts.length !== 6) {
    return false;
  }

  const [, algorithm, versionPart, paramsPart, saltB64, hashB64] = parts;

  // 1. Validasi Algoritma
  if (algorithm !== 'argon2id') {
    return false;
  }

  // 2. Validasi Versi
  if (versionPart !== `v=${ARGON2_CONFIG.version}`) {
    return false;
  }

  // 3. Validasi Parameter (m, t, p)
  const paramPairs = paramsPart.split(',');
  if (paramPairs.length !== 3) {
    return false;
  }

  const seenKeys = new Set<string>();
  let memoryCost: number | null = null;
  let timeCost: number | null = null;
  let parallelism: number | null = null;

  for (const pair of paramPairs) {
    const [key, val] = pair.split('=');
    if (!key || !val || seenKeys.has(key)) {
      // Tolak jika ada parameter duplikat atau format rusak
      return false;
    }
    seenKeys.add(key);

    if (!/^\d+$/.test(val)) {
      return false;
    }

    const num = parseInt(val, 10);
    if (!Number.isSafeInteger(num)) {
      return false;
    }

    if (key === 'm') memoryCost = num;
    else if (key === 't') timeCost = num;
    else if (key === 'p') parallelism = num;
    else return false; // Parameter tidak dikenal
  }

  if (memoryCost === null || timeCost === null || parallelism === null) {
    return false;
  }

  // Periksa batas toleransi parameter
  if (memoryCost < ARGON2_BOUNDS.minMemory || memoryCost > ARGON2_BOUNDS.maxMemory) {
    return false;
  }
  if (timeCost < ARGON2_BOUNDS.minPasses || timeCost > ARGON2_BOUNDS.maxPasses) {
    return false;
  }
  if (parallelism < ARGON2_BOUNDS.minParallelism || parallelism > ARGON2_BOUNDS.maxParallelism) {
    return false;
  }

  // 4. Validasi dan decode salt & hash
  const salt = parseValidBase64(saltB64, ARGON2_BOUNDS.saltLength);
  const expectedHash = parseValidBase64(hashB64, ARGON2_BOUNDS.tagLength);

  if (!salt || !expectedHash) {
    return false;
  }

  try {
    // 5. Hitung ulang hash dengan parameter dan salt yang tersimpan
    const derivedKey = await argon2Promise('argon2id', {
      message: Buffer.from(password, 'utf8'),
      nonce: salt,
      memory: memoryCost,
      passes: timeCost,
      parallelism: parallelism,
      tagLength: expectedHash.length,
    });

    if (derivedKey.length !== expectedHash.length) {
      return false;
    }

    // 6. Perbandingan konstan untuk mencegah timing attack
    return crypto.timingSafeEqual(derivedKey, expectedHash);
  } catch {
    // Fail-closed tanpa membocorkan rincian internal
    return false;
  }
}

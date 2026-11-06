/**
 * tests/__mocks__/server-only.ts
 *
 * Stub kosong untuk paket 'server-only' di lingkungan Vitest.
 *
 * Next.js 16 menangani `import "server-only"` secara internal pada build
 * (menyebabkan build error jika modul diimpor dari Client Component).
 * Vitest tidak memiliki mekanisme ini, sehingga modul perlu di-alias
 * ke stub ini agar `lib/crypto.ts` dapat diuji tanpa error modul tidak ditemukan.
 *
 * Stub ini TIDAK melakukan apa-apa — perlindungan server-only tetap aktif
 * di lingkungan Next.js (build dan dev).
 */

// Tidak ada ekspor — cukup import yang menandai modul sebagai side-effect.
export {};


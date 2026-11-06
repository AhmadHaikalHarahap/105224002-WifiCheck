# AI_LOG.md

# AI Usage Log – WiFi Check

## 1. Informasi Proyek

- **Nama Proyek:** WiFi Check
- **Nama:** Ahmad Haikal Harahap
- **Repository:** https://github.com/AhmadHaikalHarahap/105224002-WifiCheck
- **Milestone:** Kriptografi v0.2
- **Tag Rilis:** `kripto-v0.2`
- **Teknologi:** Next.js, TypeScript, Prisma, PostgreSQL, Node.js Crypto API

## 2. Tujuan Penggunaan AI

AI digunakan sebagai alat bantu selama proses pengembangan fitur kriptografi pada aplikasi WiFi Check.

Penggunaan AI bertujuan untuk membantu memahami konsep enkripsi, merancang implementasi keamanan data, memperbaiki kesalahan kode, menyusun pengujian, dan membantu proses debugging.

Seluruh perubahan tetap diperiksa dan diuji kembali sebelum dinyatakan berhasil.

## 3. Daftar Penggunaan AI

### A. Perancangan Implementasi Kriptografi

AI digunakan untuk membantu:
- Memahami konsep Authenticated Encryption dan Data Integrity.
- Menentukan penggunaan algoritma AES-256-GCM.
- Memahami fungsi nonce, authentication tag, dan Additional Authenticated Data (AAD).
- Merancang mekanisme penyimpanan encryption key menggunakan environment variable.
- Menentukan data Assessment dan Finding yang perlu dienkripsi.

### B. Implementasi Enkripsi dan Dekripsi

AI membantu memberikan arahan dalam pengembangan:
- `lib/crypto.ts` sebagai implementasi utama enkripsi dan dekripsi.
- `lib/assessment-crypto.ts` untuk menangani enkripsi dan dekripsi field Assessment dan Finding.
- Penggunaan Node.js Crypto API.
- Validasi format encryption key dan payload ciphertext.
- Penanganan kesalahan dekripsi agar data yang gagal diverifikasi tidak ditampilkan sebagai data yang valid.

### C. Migrasi Data

AI membantu menyusun dan memeriksa proses migrasi data lama ke format terenkripsi.

Implementasi dilakukan melalui:
- Penambahan kolom terenkripsi pada database menggunakan Prisma.
- Pembuatan script `scripts/migrate-encrypt.ts`.
- Proses backfill data Assessment dan Finding.
- Pemeriksaan agar proses migrasi dapat dijalankan berulang kali tanpa mengenkripsi ulang data yang sudah terenkripsi.

### D. Pengujian dan Debugging

AI digunakan untuk membantu:
- Menyusun skenario unit testing.
- Memeriksa kesalahan pada proses enkripsi dan dekripsi.
- Memeriksa validasi encryption key.
- Memperbaiki error TypeScript.
- Memperbaiki error production build Next.js.
- Memeriksa penggunaan React Suspense pada halaman History.

### E. Dokumentasi

AI membantu menyusun dokumentasi teknis mengenai:
- Mekanisme enkripsi dan dekripsi.
- Pengelolaan encryption key.
- Proses migrasi data.
- Hasil pengujian.
- Penjelasan perubahan pada milestone kriptografi.

## 4. File yang Dibantu Pengembangannya

| File | Keterangan |
|---|---|
| `lib/crypto.ts` | Implementasi AES-256-GCM |
| `lib/assessment-crypto.ts` | Helper enkripsi dan dekripsi Assessment dan Finding |
| `scripts/migrate-encrypt.ts` | Script migrasi data lama |
| `prisma/schema.prisma` | Penambahan field terenkripsi |
| `tests/crypto.test.ts` | Pengujian fungsi kriptografi |
| `tests/assessment-crypto.test.ts` | Pengujian enkripsi field Assessment dan Finding |
| `tests/migrate-encrypt.test.ts` | Pengujian proses migrasi |
| `vitest.config.ts` | Konfigurasi pengujian Vitest |
| `app/actions/` | Penyesuaian proses penyimpanan data |
| `app/history/page.tsx` | Penyesuaian pengambilan dan dekripsi data History |
| `app/reports/` | Penyesuaian tampilan data hasil dekripsi |

## 5. Hasil Implementasi

Implementasi kriptografi pada WiFi Check memiliki beberapa hasil berikut:

1. Menggunakan algoritma AES-256-GCM untuk enkripsi dan autentikasi data.
2. Menggunakan encryption key sepanjang 256 bit yang disimpan pada environment variable `ENCRYPTION_KEY`.
3. Menggunakan nonce unik untuk setiap proses enkripsi.
4. Menggunakan authentication tag untuk memeriksa integritas ciphertext.
5. Menggunakan Additional Authenticated Data (AAD) untuk mengikat ciphertext dengan identitas record dan nama field.
6. Menerapkan validasi payload sebelum proses dekripsi.
7. Menerapkan fail-closed apabila proses dekripsi atau verifikasi autentikasi gagal.
8. Mempertahankan mekanisme SHA-256 fingerprint yang sudah tersedia pada versi sebelumnya.

## 6. Hasil Migrasi Data

Proses backfill berhasil dilakukan terhadap data yang sebelumnya masih menggunakan format plaintext.

Hasil migrasi pertama:

- Assessment: 3 record berhasil diproses.
- Finding: 7 record berhasil diproses.
- Total: 10 record berhasil diproses.
- Record gagal: 0.

Pengujian idempotensi juga berhasil dilakukan. Ketika script dijalankan kembali, seluruh record yang sudah terenkripsi dikenali sehingga tidak dienkripsi ulang.

## 7. Hasil Pengujian

Pengujian dilakukan menggunakan Vitest dan perintah pemeriksaan proyek.

| Pengujian | Hasil |
|---|---|
| WiFi fingerprint | 6 test berhasil |
| Assessment crypto | 16 test berhasil |
| Crypto | 19 test berhasil |
| Migrasi data | 10 test berhasil |
| Total | 51 test berhasil |
| TypeScript (`npx tsc --noEmit`) | Berhasil |
| Prisma validation | Berhasil |
| Production build (`npm run build`) | Berhasil |
| Production smoke test | Berhasil |

Production smoke test dilakukan dengan memeriksa halaman Dashboard, Check, History, Report, dan Edit tanpa menemukan error.

## 8. Peran AI dan Pengembang

**Peran AI:**
- Memberikan penjelasan konsep kriptografi.
- Memberikan saran struktur implementasi.
- Membantu analisis kesalahan dan debugging.
- Membantu penyusunan unit test.
- Membantu menyusun dokumentasi teknis.

**Peran Pengembang:**
- Menentukan kebutuhan dan rancangan aplikasi.
- Memeriksa dan menyesuaikan kode yang dihasilkan.
- Menjalankan perintah pada lingkungan lokal.
- Memeriksa hasil migrasi database.
- Menjalankan unit test, TypeScript, dan production build.
- Melakukan pengujian aplikasi secara langsung.
- Bertanggung jawab atas hasil akhir implementasi.

## 9. Catatan Keamanan

- Encryption key disimpan pada file `.env` dan tidak dimasukkan ke repository.
- File `.env` dimasukkan ke dalam `.gitignore`.
- File `.env.example` hanya digunakan sebagai contoh konfigurasi tanpa berisi encryption key asli.
- Kolom plaintext lama masih dipertahankan selama tahap validasi dan dual-write.
- Penghapusan kolom plaintext belum dilakukan pada milestone ini.
- Encryption key tidak dicantumkan dalam dokumentasi atau source code yang dipublikasikan.

## 10. Kesimpulan

AI digunakan sebagai alat bantu dalam proses pengembangan fitur kriptografi WiFi Check, mulai dari perancangan, implementasi, pengujian, hingga debugging.

Berdasarkan pengujian yang telah dilakukan, implementasi kriptografi berhasil melewati 51 unit test, pemeriksaan TypeScript, validasi Prisma, production build, dan production smoke test.

Seluruh hasil implementasi tetap diperiksa dan diverifikasi oleh pengembang sebelum digunakan sebagai bagian dari rilis milestone `kripto-v0.2`.
# AI_LOG — Tugas Kriptografi WiFi Check

## 1. Tujuan Penggunaan AI

AI digunakan sebagai alat bantu dalam perancangan dan implementasi komponen kriptografi untuk aplikasi WiFi Check. Bantuan meliputi rancangan fingerprint SHA-256, validasi input, pengujian otomatis, dokumentasi, dan analisis error saat proses build.

## 2. Bagian yang Dibantu AI

- Merancang komponen fingerprint konfigurasi Wi-Fi menggunakan SHA-256.
- Menyusun validasi input konfigurasi.
- Menyiapkan endpoint API `POST /api/fingerprint`.
- Menyusun skenario pengujian otomatis menggunakan Vitest.
- Membantu dokumentasi komponen kriptografi pada README.
- Membantu menganalisis error konfigurasi Next.js saat proses build.

## 3. Keputusan Implementasi

- Menggunakan SHA-256 melalui modul bawaan `node:crypto`.
- Menyusun konfigurasi dalam format JSON dengan urutan field yang tetap.
- Menormalisasi SSID menggunakan Unicode NFC.
- Menggunakan data sintetis untuk pengujian.
- Tidak meminta password Wi-Fi asli atau menyimpan kunci privat.
- Menggunakan Vitest untuk pengujian otomatis.

## 4. Hasil Verifikasi

Hasil pemeriksaan yang telah dijalankan:

- `npm test`: 6 pengujian berhasil.
- `npx tsc --noEmit`: berhasil tanpa error TypeScript.
- `npm run build`: berhasil setelah deklarasi `runtime` yang tidak kompatibel dihapus dari route.
- Endpoint `POST /api/fingerprint`: berhasil menghasilkan respons berisi algoritma SHA-256, versi skema, dan fingerprint.

## 5. Batasan Keamanan

SHA-256 merupakan fungsi hash, bukan enkripsi atau autentikasi. Fingerprint dapat membantu membandingkan konfigurasi, tetapi tidak membuktikan keaslian perangkat atau pengirim data.

Komponen ini tidak dirancang untuk menyimpan password, menyembunyikan data sensitif, atau membuktikan identitas perangkat.

## 6. Data dan Kerahasiaan

Pengujian menggunakan konfigurasi Wi-Fi sintetis. Komponen fingerprint tidak memerlukan password Wi-Fi asli, token, kunci privat, atau rahasia lain.

## 7. Tanggung Jawab Pengembang

Kode diverifikasi melalui pengujian otomatis, pemeriksaan TypeScript, proses build, dan pengujian endpoint. Pengembang tetap bertanggung jawab memahami, memeriksa, dan memelihara kode yang digunakan.
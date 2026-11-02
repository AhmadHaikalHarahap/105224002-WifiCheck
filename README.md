# WiFi Check — Understand Your Wi-Fi Security

WiFi Check adalah aplikasi web untuk melakukan penilaian awal terhadap keamanan konfigurasi jaringan Wi-Fi rumah atau kost. Aplikasi ini menggunakan sistem penilaian berbasis aturan (*rule-based assessment*) untuk mengidentifikasi konfigurasi yang berpotensi berisiko dan memberikan rekomendasi perbaikan.

WiFi Check ditujukan untuk pengguna umum dan mahasiswa yang ingin memahami keamanan dasar jaringan Wi-Fi tanpa harus menggunakan perangkat audit profesional.

## Fitur Utama

- **Dashboard:** menampilkan gambaran hasil penilaian keamanan Wi-Fi.
- **New Assessment:** melakukan penilaian konfigurasi Wi-Fi.
- **Assessment History:** melihat dan mencari riwayat penilaian.
- **Assessment Report:** melihat hasil penilaian, tingkat risiko, temuan, dan rekomendasi.
- **CRUD Assessment:** menambahkan, melihat, memperbarui, dan menghapus data Assessment.
- **CRUD Finding:** menambahkan, melihat, memperbarui, dan menghapus temuan manual.
- **Validasi Data:** menggunakan Zod pada Server Action untuk memvalidasi input.
- **Database Persistence:** menyimpan data menggunakan PostgreSQL dan Prisma ORM.

## Teknologi

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL
- Prisma ORM 7
- Zod
- Vitest

## Persyaratan Sistem

Pastikan perangkat sudah memiliki:

- Node.js dan npm.
- PostgreSQL.
- Git.

## Instalasi

Clone repository:

```bash
git clone https://github.com/AhmadHaikalHarahap/105224002-WifiCheck.git
```

Masuk ke direktori proyek:

```bash
cd 105224002-WifiCheck
```

Install dependency:

```bash
npm install
```

## Konfigurasi Database

Buat database PostgreSQL dengan nama:

```text
wificheck
```

Salin file contoh konfigurasi:

```powershell
Copy-Item .env.example .env
```

Buka file `.env` dan sesuaikan `DATABASE_URL` dengan konfigurasi PostgreSQL lokal:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/wificheck?schema=public"
```

Ganti `YOUR_PASSWORD` dengan password PostgreSQL lokal. Jangan mengunggah file `.env` ke repository.

## Migrasi Database

Validasi schema Prisma:

```bash
npx prisma validate
```

Jalankan migration:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

## Seed Data

Untuk memasukkan data contoh ke database:

```bash
npm run db:seed
```

Seed menyediakan dua data Assessment contoh beserta Finding yang terhubung. Data contoh menggunakan ID tetap sehingga proses seed dapat dijalankan kembali tanpa membuat duplikasi Assessment contoh.

## Menjalankan Aplikasi

Jalankan development server:

```bash
npm run dev
```

Buka aplikasi melalui:

```text
http://localhost:3000
```

## Perintah Pengembangan

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan development server |
| `npm run build` | Membuat production build |
| `npm run start` | Menjalankan production server |
| `npm run lint` | Memeriksa kualitas kode |
| `npm test` | Menjalankan pengujian Vitest |
| `npm run db:seed` | Memasukkan seed data |
| `npx prisma studio` | Membuka Prisma Studio |

## Struktur Database

WiFi Check menggunakan dua entitas utama:

### Assessment

Menyimpan informasi hasil penilaian konfigurasi Wi-Fi, seperti:

- SSID
- Security Protocol
- Password Protection
- WPS Status
- Firmware Status
- Risk Level
- Summary
- Recommendations
- Created At

### Finding

Menyimpan temuan keamanan yang berhubungan dengan Assessment, seperti:

- Title
- Description
- Severity
- Is Manual
- Assessment ID

Relasi database menggunakan hubungan one-to-many: satu Assessment dapat memiliki beberapa Finding. Jika Assessment dihapus, Finding yang terkait juga dihapus melalui konfigurasi cascade.

## Validasi dan Keamanan

- Validasi data dilakukan menggunakan Zod pada sisi server.
- SSID dibatasi maksimal 32 byte UTF-8.
- Catatan Assessment dibatasi maksimal 250 karakter.
- Judul Finding dibatasi maksimal 120 karakter.
- Deskripsi Finding dibatasi maksimal 2.000 karakter.
- Severity Finding hanya menerima nilai `low`, `medium`, dan `high`.
- Password Wi-Fi asli tidak diminta atau disimpan oleh aplikasi.
- File `.env` tidak boleh diunggah ke repository.

## Dokumentasi dan Bukti Pengujian

Dokumentasi praktikum Modul 6 tersedia di:

`docs/praktikum/modul-06.md`

Bukti implementasi dan pengujian tersedia di:

`docs/praktikum/screenshots/`

Dokumentasi mencakup implementasi database, CRUD Assessment, CRUD Finding, relasi antartabel, validasi input, dan hasil pengujian.

## Repository dan Rilis

Repository GitHub:

https://github.com/AhmadHaikalHarahap/105224002-WifiCheck

Tag rilis Milestone 1: `v0.1`

Tag rilis Milestone 2: `v0.2`

---

**WiFi Check — Understand Your Wi-Fi Security**
# WiFi Check — Understand Your Wi-Fi Security

Aplikasi web untuk melakukan evaluasi awal terhadap keamanan konfigurasi Wi-Fi, mengidentifikasi potensi kelemahan, dan memberikan rekomendasi perbaikan melalui antarmuka yang sederhana dan mudah dipahami.

> **Project:** Individual Web Application Development Project  
> **Milestone:** 1 — Initial User Interface (v0.1)  
> **Status:** Frontend development with mock data  
> **Primary Language:** TypeScript

---

## 1. Deskripsi Produk

**WiFi Check** adalah aplikasi web edukatif yang membantu pengguna memahami tingkat keamanan konfigurasi jaringan Wi-Fi berdasarkan informasi yang dimasukkan secara manual.

Aplikasi menggunakan pendekatan *rule-based assessment*, yaitu proses evaluasi berdasarkan aturan yang telah ditentukan. Informasi seperti protokol keamanan, status perlindungan password, status Wi-Fi Protected Setup (WPS), dan kondisi firmware router digunakan untuk menghasilkan klasifikasi risiko beserta temuan dan rekomendasi keamanan.

WiFi Check dirancang sebagai fondasi pengembangan aplikasi yang mengintegrasikan Pengembangan Aplikasi Web, Keamanan Komputasi dan Siber, serta Kriptografi.

Pada Milestone 1, fokus pengembangan adalah antarmuka pengguna, navigasi, komponen reusable, validasi formulir, mock data, desain responsif, aksesibilitas, dan dokumentasi produk.

### Tujuan Pengembangan

- Membantu pengguna memahami dasar keamanan konfigurasi Wi-Fi.
- Mengidentifikasi konfigurasi yang berpotensi memiliki kelemahan keamanan.
- Memberikan rekomendasi perbaikan yang mudah dipahami.
- Menyediakan antarmuka untuk melihat hasil dan riwayat evaluasi.
- Membangun fondasi yang dapat dikembangkan dengan backend dan database pada milestone berikutnya.

---

## 2. Permasalahan yang Diselesaikan

Pengguna Wi-Fi rumahan maupun penghuni kos tidak selalu memahami pengaturan keamanan jaringan yang digunakan. Konfigurasi yang lemah, penggunaan protokol lama, WPS yang aktif, atau firmware yang tidak diperbarui dapat meningkatkan risiko keamanan.

Pengguna pemula juga sering kesulitan memahami hasil pemeriksaan teknis karena informasi keamanan jaringan dapat disampaikan dengan istilah yang terlalu kompleks.

WiFi Check mencoba mengatasi permasalahan tersebut dengan menyajikan proses evaluasi yang sederhana, hasil yang mudah dipahami, dan rekomendasi tindakan yang relevan.

---

## 3. Sasaran Pengguna

Aplikasi ini ditujukan untuk:

- **Mahasiswa:** mempelajari konsep keamanan jaringan dan pengembangan aplikasi web.
- **Pengguna Wi-Fi rumahan:** memahami konfigurasi keamanan jaringan yang digunakan.
- **Penghuni kos:** memperoleh edukasi dasar tentang keamanan Wi-Fi.
- **Pengguna pemula:** mempelajari potensi kelemahan konfigurasi jaringan tanpa harus menggunakan perangkat audit profesional.

---

## 4. Fitur Aplikasi

### 4.1 Dashboard

Halaman utama yang menyajikan ringkasan data evaluasi.

Fitur yang tersedia meliputi:

- Ringkasan jumlah evaluasi.
- Statistik kategori risiko Low, Medium, dan High.
- Daftar evaluasi terbaru.
- Rekomendasi keamanan.
- Navigasi menuju halaman pemeriksaan dan riwayat.

Data pada Milestone 1 menggunakan mock data untuk mendukung pengembangan antarmuka.

### 4.2 New Assessment

Halaman untuk memasukkan informasi konfigurasi Wi-Fi dan menjalankan evaluasi awal.

Informasi yang dapat dimasukkan meliputi:

- Nama jaringan atau Service Set Identifier (SSID).
- Protokol keamanan, seperti Open, WEP, WPA2, WPA3, atau Other/Unknown.
- Status perlindungan password.
- Status WPS.
- Kondisi firmware router.
- Catatan tambahan.

Formulir menerapkan validasi sisi klien (*client-side validation*) untuk memeriksa kelengkapan dan format input sebelum evaluasi diproses.

> **Catatan:** Pengguna tidak diminta memasukkan password Wi-Fi yang sebenarnya.

### 4.3 Assessment History

Halaman untuk menampilkan riwayat evaluasi yang tersedia.

Informasi yang ditampilkan meliputi:

- Nama jaringan.
- Protokol keamanan.
- Tingkat risiko.
- Tanggal evaluasi.
- Akses menuju laporan detail.

Halaman ini juga menyediakan pencarian nama jaringan dan filter berdasarkan tingkat risiko.

### 4.4 Assessment Report

Halaman yang menampilkan hasil evaluasi secara lebih terperinci.

Informasi laporan meliputi:

- Identitas jaringan berdasarkan SSID.
- Konfigurasi yang dievaluasi.
- Klasifikasi risiko.
- Temuan keamanan.
- Rekomendasi perbaikan.
- Tanggal evaluasi.

Laporan disusun agar pengguna dapat memahami alasan di balik hasil penilaian dan mengetahui langkah perbaikan yang disarankan.

### 4.5 Klasifikasi Risiko

WiFi Check menggunakan tiga kategori risiko:

| Kategori | Penjelasan |
|---|---|
| **Low** | Konfigurasi yang dinilai relatif lebih baik berdasarkan aturan pemeriksaan yang diterapkan. |
| **Medium** | Konfigurasi memiliki kelemahan atau kondisi yang memerlukan perhatian. |
| **High** | Konfigurasi menunjukkan kelemahan yang berpotensi meningkatkan risiko keamanan. |

Klasifikasi ditentukan berdasarkan aturan evaluasi yang diterapkan pada aplikasi. Hasilnya merupakan penilaian awal, bukan jaminan keamanan jaringan.

---

## 5. Teknologi yang Digunakan

| Teknologi | Fungsi |
|---|---|
| **Next.js** | Framework aplikasi web dan pengelolaan routing (App Router). |
| **React** | Pembuatan komponen antarmuka dan pengelolaan interaksi pengguna. |
| **TypeScript** | Menambahkan sistem tipe untuk membantu menjaga konsistensi kode. |
| **Tailwind CSS** | Mengatur styling dan desain responsif. |
| **Lucide React** | Menyediakan ikon antarmuka. |
| **Mock Data** | Menyediakan data simulasi selama pengembangan frontend. |

Versi dependensi yang sebenarnya mengikuti konfigurasi pada `package.json` proyek.

---

## 6. Struktur Proyek

Struktur direktori repository `wificheck`:

```text
wificheck/
├── public/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── not-found.tsx
│   ├── check/
│   │   └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   └── reports/
│       └── [id]/
│           ├── page.tsx
│           └── ReportDetailClient.tsx
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppSidebar.tsx
│   │   └── PageContainer.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   └── RecommendationCard.tsx
│   ├── assessment/
│   │   ├── AssessmentForm.tsx
│   │   ├── FormField.tsx
│   │   ├── RiskBadge.tsx
│   │   ├── AssessmentTable.tsx
│   │   └── EmptyState.tsx
│   └── providers/
│       └── AssessmentProvider.tsx
├── data/
│   └── mock-assessments.ts
├── lib/
│   ├── assessment-rules.ts
│   └── validation.ts
├── types/
│   └── assessment.ts
├── docs/
│   ├── screenshots/
│   └── lighthouse/
├── package.json
├── README.md
└── tsconfig.json
```

### Penjelasan Direktori

- `app/`: Halaman aplikasi, routing App Router, layout, dan styling global.
- `components/`: Komponen UI yang dapat digunakan kembali (layout, dashboard, assessment, dan provider).
- `data/`: Data simulasi untuk evaluasi dan tampilan dashboard.
- `lib/`: Fungsi validasi serta aturan evaluasi risiko (*rule-based engine*).
- `types/`: Definisi tipe data TypeScript.
- `docs/screenshots/`: Bukti tampilan aplikasi pada berbagai ukuran layar.
- `docs/lighthouse/`: Laporan atau bukti audit Lighthouse.

---

## 7. Petunjuk Instalasi dan Menjalankan Proyek

### Prasyarat

Pastikan perangkat sudah memiliki:

- Node.js versi yang kompatibel dengan versi Next.js proyek (Node.js 18.18+ atau Node.js 20+ disarankan).
- npm.
- Git jika ingin mengkloning repository.
- Browser modern seperti Google Chrome.

### Langkah 1 — Masuk ke Direktori Proyek

Jika repository sudah tersedia di komputer:

```bash
cd wificheck
```

Jika belum, kloning repository menggunakan URL repository milikmu:

```bash
git clone <URL_REPOSITORY_GITHUB>
cd wificheck
```

Ganti `<URL_REPOSITORY_GITHUB>` dengan URL repository yang sebenarnya.

### Langkah 2 — Instal Dependensi

```bash
npm install
```

Perintah ini memasang dependensi yang tercantum dalam konfigurasi proyek.

### Langkah 3 — Jalankan Development Server

```bash
npm run dev
```

Setelah server berjalan, buka alamat berikut di browser:

[http://localhost:3000](http://localhost:3000)

Jika port 3000 sedang digunakan, Next.js dapat menampilkan port alternatif pada terminal.

### Langkah 4 — Build untuk Produksi

Setelah aplikasi selesai dikembangkan, jalankan:

```bash
npm run build
```

Perintah ini digunakan untuk memeriksa apakah aplikasi dapat dibangun untuk produksi. Pastikan proses selesai tanpa error sebelum menyatakan build berhasil.

---

## 8. Panduan Pengujian Fitur

Pengujian berikut dapat digunakan untuk memeriksa fungsi utama aplikasi:

| No. | Skenario | Hasil yang diharapkan |
|:---:|---|---|
| 1 | Membuka dashboard | Dashboard dapat ditampilkan beserta statistik dan daftar evaluasi. |
| 2 | Membuka halaman `/check` | Formulir evaluasi tersedia dengan semua input fields. |
| 3 | Mengirim formulir kosong | Pesan validasi ditampilkan pada input yang wajib diisi. |
| 4 | Memasukkan SSID yang hanya berisi spasi | Input ditolak dengan pesan yang jelas. |
| 5 | Memasukkan SSID lebih dari 32 karakter | Validasi menampilkan pesan kesalahan. |
| 6 | Mengirim konfigurasi yang valid | Sistem menghasilkan hasil evaluasi dan menampilkannya di halaman laporan. |
| 7 | Membuka `/history` | Daftar riwayat ditampilkan. |
| 8 | Menggunakan pencarian dan filter | Data disaring sesuai input pencarian SSID dan filter risiko. |
| 9 | Membuka laporan yang tersedia | Detail evaluasi ditampilkan lengkap dengan temuan dan rekomendasi. |
| 10 | Membuka ID laporan yang tidak tersedia | Pesan atau halaman laporan tidak ditemukan ditampilkan. |
| 11 | Mengakses aplikasi melalui ponsel | Konten dan navigasi tetap dapat digunakan secara responsif. |
| 12 | Menjalankan build | Proses build selesai tanpa error (`npm run build`). |

---

## 9. Desain Responsif

Antarmuka dirancang menggunakan pendekatan *mobile-first* agar dapat menyesuaikan diri dengan berbagai ukuran layar.

Target pengujian:

| Perangkat | Lebar Viewport |
|---|---:|
| Ponsel | 375 px hingga 640 px |
| Tablet | 768 px |
| Desktop | 1024 px ke atas |

Pada layar kecil, komponen diatur agar tetap terbaca, formulir tersusun dengan baik, navigasi mudah diakses melalui drawer/menu hamburger, dan halaman tidak mengalami horizontal overflow yang tidak diperlukan.

Pada layar desktop, aplikasi menggunakan sidebar tetap, kartu statistik, dan tabel dengan ruang yang lebih luas.

---

## 10. Aksesibilitas Web

Pengembangan WiFi Check memperhatikan prinsip aksesibilitas agar antarmuka dapat digunakan oleh lebih banyak pengguna.

Hal-hal yang diterapkan dan diverifikasi meliputi:

- Penggunaan HTML semantik (`header`, `nav`, `main`, `aside`, `footer`, `fieldset`, `legend`).
- Struktur heading yang konsisten (`h1`, `h2`, `h3`).
- Label yang terhubung dengan input (`htmlFor` dan `id`).
- Pesan kesalahan yang jelas menggunakan `role="alert"` dan `aria-describedby`.
- Navigasi keyboard penuh dengan indikator fokus yang terlihat (`focus-visible`).
- Kontras teks dan latar belakang yang memadai sesuai standar WCAG AA.
- Nama yang jelas untuk tombol dan tautan.
- Informasi risiko yang tidak hanya dibedakan melalui warna (dilengkapi ikon Lucide dan teks label).
- Dukungan untuk preferensi `prefers-reduced-motion`.

> **Target Lighthouse Accessibility:** minimal 85 (disarankan 95+).  
> Skor akhir harus dicantumkan setelah audit Lighthouse benar-benar dilakukan.

---

## 11. Dokumentasi Lighthouse

Simpan bukti pengujian Lighthouse pada direktori:

```text
docs/lighthouse/
```

Catat informasi berikut setelah pengujian dilakukan:

| Informasi | Hasil Aktual |
|---|---|
| Mode pengujian | Desktop / Mobile |
| Perangkat yang diemulasikan | Responsive |
| Halaman yang diuji | Dashboard (`/`), Check (`/check`), History (`/history`) |
| Accessibility score | *Isi sesuai hasil pengujian aktual (contoh: 95/100)* |

### Cara Menjalankan Audit

1. Jalankan aplikasi melalui `npm run dev` atau gunakan build produksi (`npm run start`).
2. Buka halaman yang ingin diuji di Google Chrome (disarankan mode Incognito).
3. Buka Chrome DevTools (`F12` atau `Ctrl+Shift+I`).
4. Pilih tab **Lighthouse**.
5. Pilih kategori **Accessibility**.
6. Tentukan mode pengujian dan konfigurasi perangkat (Desktop atau Mobile).
7. Klik **Analyze page load**.
8. Catat hasil aktual dan simpan laporan atau screenshot ke `docs/lighthouse/`.

---

## 12. Bukti Pengerjaan

Siapkan bukti pengerjaan dalam repository sesuai ketentuan tugas.

### Screenshot Antarmuka

Simpan pada `docs/screenshots/`, dengan contoh penamaan:

```text
docs/screenshots/
├── dashboard-mobile.png
├── dashboard-tablet.png
├── dashboard-desktop.png
├── assessment-form-validation.png
├── assessment-result.png
└── assessment-history.png
```

### Bukti Validasi

Ambil screenshot yang memperlihatkan formulir menolak input tidak valid dan menampilkan pesan kesalahan yang dapat dipahami.

### Bukti Lighthouse

Simpan screenshot atau laporan audit asli beserta kondisi pengujiannya pada `docs/lighthouse/`.

---

## 13. Batasan Aplikasi pada Milestone 1

Pada tahap ini, WiFi Check berfokus pada implementasi frontend dan simulasi proses evaluasi.

Batasan yang perlu diperhatikan:

- Aplikasi tidak melakukan pemindaian Wi-Fi secara langsung.
- Aplikasi tidak terhubung otomatis ke router pengguna.
- Aplikasi tidak menangkap paket jaringan.
- Data awal menggunakan mock data.
- Penyimpanan permanen melalui database belum menjadi bagian dari milestone ini (data sesi baru disimpan dalam React state dan akan kembali ke data awal jika halaman dimuat ulang/refresh).
- Penilaian bergantung pada informasi yang dimasukkan pengguna dan aturan evaluasi yang diimplementasikan.
- Hasil evaluasi merupakan penilaian awal edukatif, bukan jaminan bahwa suatu jaringan sepenuhnya aman.
- Fitur kriptografi lanjutan (seperti pembuatan hash/fingerprint konfigurasi SHA-256) belum menjadi persyaratan implementasi Milestone 1 dan direncanakan untuk milestone berikutnya.

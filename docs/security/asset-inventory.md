# Asset Inventory — WiFi Check

## 1. Informasi Dokumen

| Item | Keterangan |
|---|---|
| Nama aplikasi | WiFi Check |
| Tujuan | Evaluasi awal keamanan konfigurasi Wi-Fi |
| Versi dokumentasi | 0.1 |
| Dasar inventaris | Repository source code dan README WiFi Check |
| Status | Inventaris awal untuk threat modeling |
| Batasan | Implementasi yang belum diverifikasi tidak dianggap sebagai kontrol keamanan yang sudah tersedia |

## 2. Ringkasan Sistem

WiFi Check adalah aplikasi web edukatif yang mengevaluasi konfigurasi Wi-Fi berdasarkan informasi yang dimasukkan pengguna secara manual. Aplikasi menggunakan aturan evaluasi (*rule-based assessment*) untuk menghasilkan klasifikasi risiko, temuan, dan rekomendasi.

Informasi yang dapat dimasukkan meliputi SSID, protokol keamanan, status perlindungan password, status WPS, kondisi firmware, dan catatan tambahan. Aplikasi tidak meminta password Wi-Fi yang sebenarnya.

Pada milestone saat ini, aplikasi menggunakan mock data dan React state. Database permanen, pemindaian jaringan langsung, koneksi otomatis ke router, dan penangkapan paket jaringan bukan bagian dari implementasi yang didokumentasikan.

## 3. Daftar Aset

| ID | Nama aset | Deskripsi dan lokasi terkait | Kebutuhan keamanan utama |
|---|---|---|---|
| A-01 | Source code aplikasi | Kode pada direktori `app/`, `components/`, `lib/`, `data/`, dan `types/` | Integrity, Availability |
| A-02 | Konfigurasi dan dependensi | `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, dan konfigurasi terkait | Integrity, Availability |
| A-03 | Input konfigurasi Wi-Fi | Data yang dimasukkan pada `components/assessment/AssessmentForm.tsx` | Confidentiality, Integrity |
| A-04 | Aturan penilaian risiko | Logika evaluasi pada `lib/assessment-rules.ts` | Integrity, Availability |
| A-05 | Hasil assessment | Klasifikasi risiko, temuan, dan rekomendasi yang dihasilkan aplikasi | Integrity, Availability |
| A-06 | Mock data dan data awal | Data simulasi pada `data/mock-assessments.ts` | Integrity, Availability |
| A-07 | State assessment dan riwayat sesi | Data assessment yang dikelola oleh `components/providers/AssessmentProvider.tsx` | Confidentiality, Integrity, Availability |
| A-08 | Identitas dan navigasi laporan | Parameter ID pada route `app/reports/[id]/` dan proses pencarian laporan terkait | Integrity, Availability |
| A-09 | Tampilan dan dokumentasi produk | README, halaman dashboard, formulir, riwayat, dan laporan | Integrity, Availability |
| A-10 | Aset deployment dan komunikasi web | Kode aplikasi yang disajikan melalui web origin dan konfigurasi deployment terkait | Confidentiality, Integrity |

## 4. Penjelasan Kebutuhan Keamanan

### A-01 — Source code aplikasi

Source code merupakan aset utama yang menentukan perilaku aplikasi, validasi input, pengolahan data, dan penyajian laporan.

- **Confidentiality:** Tidak dianggap sebagai persyaratan utama selama source code memang dipublikasikan secara terbuka, tetapi file konfigurasi dan rahasia yang tidak seharusnya dipublikasikan tetap harus dilindungi.
- **Integrity:** Perubahan tidak sah pada kode dapat mengubah penilaian atau tampilan hasil.
- **Availability:** Kerusakan atau kegagalan build dapat mengganggu penggunaan aplikasi.

### A-02 — Konfigurasi dan dependensi

Konfigurasi build dan dependensi memengaruhi proses kompilasi serta komponen perangkat lunak yang digunakan aplikasi.

Perubahan tidak sah, dependensi rentan, atau konfigurasi yang keliru berpotensi memengaruhi keamanan dan ketersediaan aplikasi.

### A-03 — Input konfigurasi Wi-Fi

Input mencakup SSID, protokol keamanan, status perlindungan password, WPS, status firmware, dan catatan tambahan.

Input harus divalidasi dan ditampilkan dengan aman. SSID dan catatan dapat berisi informasi yang tidak seharusnya tersebar luas. Aplikasi tidak meminta password Wi-Fi sebenarnya.

### A-04 — Aturan penilaian risiko

Aturan penilaian menentukan klasifikasi risiko dan rekomendasi. Perubahan yang tidak sah atau kesalahan logika dapat menyebabkan hasil yang tidak tepat.

### A-05 — Hasil assessment

Hasil harus sesuai dengan konfigurasi yang dievaluasi. Hasil yang salah atau dimanipulasi dapat menyesatkan pengguna mengenai kondisi keamanan jaringan.

### A-06 dan A-07 — Mock data dan state

Mock data digunakan sebagai data awal, sedangkan hasil sesi dikelola melalui React state. Berdasarkan dokumentasi saat ini, data sesi tidak tersimpan secara permanen di database dan dapat kembali ke data awal setelah halaman dimuat ulang.

### A-08 — Identitas laporan

ID laporan digunakan dalam navigasi menuju detail assessment. Aplikasi harus menangani ID yang tidak ditemukan secara benar dan tidak boleh menganggap ID yang valid sebagai bukti otorisasi.

### A-09 — Tampilan dan dokumentasi

Dokumentasi dan tampilan merupakan sumber informasi bagi pengguna dan pengembang. Informasi yang keliru dapat menyebabkan salah penggunaan aplikasi atau klaim keamanan yang tidak sesuai implementasi.

### A-10 — Deployment dan komunikasi web

Aset ini mencakup lingkungan yang menyajikan aplikasi dan jalur pengiriman kode ke browser. Konfigurasi deployment, HTTPS, dan security headers belum dinyatakan aman hanya berdasarkan inventaris ini; semuanya perlu diperiksa pada lingkungan yang benar-benar digunakan.

## 5. Status Perlindungan Kriptografi

| Aset atau aliran | Status berdasarkan pemeriksaan awal |
|---|---|
| Data input dan hasil dalam React state | Belum ditemukan bukti bahwa data tersebut dienkripsi secara khusus oleh aplikasi |
| Pengiriman kode dari web origin ke browser | Perlindungan TLS/HTTPS bergantung pada konfigurasi deployment aktual dan perlu diverifikasi |
| Data mock | Berupa data aplikasi; tidak ada bukti enkripsi khusus yang terverifikasi |
| Fingerprint SHA-256 konfigurasi | Didokumentasikan sebagai rencana masa depan, bukan fitur yang telah dipastikan tersedia |
| Penyimpanan database | Tidak digunakan sebagai penyimpanan permanen pada milestone ini |

**Catatan:** Tidak ditemukannya bukti dalam pemeriksaan awal bukan bukti mutlak bahwa suatu kontrol tidak ada di seluruh lingkungan. Status harus diperbarui jika audit source code atau konfigurasi deployment memberikan bukti tambahan.

## 6. Asumsi dan Batasan

1. Penilaian dilakukan berdasarkan input manual, bukan hasil pemindaian jaringan.
2. Aplikasi tidak melakukan koneksi otomatis ke router atau menangkap paket jaringan.
3. Data awal berasal dari mock data dan data sesi dikelola melalui React state.
4. Hasil assessment merupakan penilaian edukatif, bukan jaminan keamanan jaringan.
5. Belum ada klaim bahwa audit Lighthouse, pengujian penetrasi, atau pengujian keamanan menyeluruh telah dilakukan.
6. Konfigurasi hosting, TLS, header keamanan, dan kontrol infrastruktur perlu diverifikasi secara terpisah.

## 7. Referensi Implementasi

- Repository: https://github.com/AhmadHaikalHarahap/105224002-WifiCheck
- `components/assessment/AssessmentForm.tsx`
- `components/providers/AssessmentProvider.tsx`
- `lib/assessment-rules.ts`
- `lib/validation.ts`
- `data/mock-assessments.ts`
- `app/reports/[id]/`
- `package.json`
- `next.config.ts`
- `README.md`

## 8. Penggunaan pada Tahap Berikutnya

ID aset pada dokumen ini menjadi acuan untuk DFD, threat model STRIDE, dan risk register. Jika implementasi berubah, inventaris harus diperbarui agar tetap sesuai dengan aplikasi yang sebenarnya.
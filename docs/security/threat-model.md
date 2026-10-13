# Threat Model — WiFi Check

## 1. Informasi Dokumen

| Item | Keterangan |
|---|---|
| Aplikasi | WiFi Check |
| Versi | 0.1 |
| Metode | STRIDE |
| Referensi arsitektur | `asset-inventory.md` dan `dfd.md` |
| Status | Analisis ancaman awal |
| Ruang lingkup | Frontend, input assessment, aturan penilaian, state, laporan, dan penyediaan aplikasi web |

## 2. Tujuan

Threat modeling dilakukan untuk mengidentifikasi kemungkinan ancaman terhadap aset dan aliran data WiFi Check, menilai kemungkinan dan dampak ancaman, serta menentukan risiko yang perlu diprioritaskan.

WiFi Check merupakan aplikasi edukatif yang menerima input konfigurasi Wi-Fi secara manual dan menghasilkan evaluasi berbasis aturan. Aplikasi pada milestone ini menggunakan mock data dan React state, bukan database permanen atau pemindaian jaringan langsung.

Ancaman di bawah merupakan skenario yang perlu dipertimbangkan. Pencantuman suatu ancaman tidak berarti kerentanan tersebut sudah terbukti ada.

## 3. Metode STRIDE

| Kategori | Makna | Contoh penerapan pada WiFi Check |
|---|---|---|
| S — Spoofing | Menyamar sebagai entitas lain | Hasil atau identitas assessment disalahartikan sebagai data yang tepercaya |
| T — Tampering | Mengubah data atau proses tanpa izin | Input, hasil, atau aturan penilaian dimanipulasi |
| R — Repudiation | Menyangkal suatu tindakan tanpa bukti yang memadai | Tidak tersedia rekaman permanen untuk membuktikan perubahan assessment pada sesi tertentu |
| I — Information Disclosure | Informasi terbuka kepada pihak yang tidak semestinya | SSID atau catatan yang sensitif terlihat oleh pihak lain |
| D — Denial of Service | Mengganggu ketersediaan | Input berlebihan atau konten yang sangat panjang membuat antarmuka tidak responsif |
| E — Elevation of Privilege | Mendapatkan kewenangan melebihi yang seharusnya | Jika fitur backend atau akses pengguna ditambahkan, pemeriksaan otorisasi yang lemah dapat memungkinkan akses tidak semestinya |

## 4. Skala Penilaian

### 4.1 Likelihood

| Nilai | Level | Pedoman |
|---|---|---|
| 1 | Low | Membutuhkan kondisi khusus atau peluang eksploitasi terbatas |
| 2 | Medium | Skenario masuk akal dan dapat terjadi jika kondisi tertentu terpenuhi |
| 3 | High | Mudah dicoba atau memiliki jalur serangan yang relatif langsung |

### 4.2 Impact

| Nilai | Level | Pedoman |
|---|---|---|
| 1 | Low | Gangguan kecil dengan pengaruh terbatas |
| 2 | Medium | Hasil assessment, privasi, atau penggunaan aplikasi dapat terpengaruh secara berarti |
| 3 | High | Dapat merusak keandalan penilaian, mengekspos informasi penting, atau mengganggu penggunaan secara luas |

### 4.3 Skor risiko awal

Skor dihitung menggunakan:

**Risk Score = Likelihood × Impact**

| Skor | Kategori |
|---|---|
| 1–2 | Low |
| 3–4 | Medium |
| 6 | High |
| 9 | Critical |

Skor merupakan alat bantu prioritas awal, bukan ukuran probabilitas statistik. Nilai perlu ditinjau kembali setelah kontrol aktual dan hasil pengujian diketahui.

## 5. Daftar Ancaman STRIDE

### TM-01 — Manipulasi input assessment

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** E-01, P-01, P-02, F-01, F-02, F-03
- **Aset terdampak:** A-03 (Input konfigurasi Wi-Fi), A-05 (Hasil assessment)
- **Skenario:** Pengguna mengirim nilai yang tidak sesuai dengan pilihan yang diharapkan, misalnya nilai protokol yang tidak valid atau input yang diubah di luar alur formulir normal. Jika validasi atau pemrosesan tidak memadai, hasil assessment dapat menjadi tidak sesuai.
- **Likelihood:** Medium (2). Input berasal dari pengguna dan dapat dimodifikasi; validasi sisi klien sudah didokumentasikan, tetapi validasi saja tidak membuktikan semua jalur input aman.
- **Impact:** Medium (2). Hasil evaluasi dapat salah atau tidak konsisten, tetapi aplikasi saat ini tidak mengubah konfigurasi router secara langsung.
- **Skor awal:** 4 — Medium.
- **Mitigasi yang disarankan:** Validasi nilai yang diizinkan, validasi ulang pada batas pemrosesan, dan pengujian input tidak valid. Jika seluruh pemrosesan tetap di klien, jelaskan bahwa validasi tidak menjadi batas keamanan terhadap pengguna yang mengendalikan browser.

### TM-02 — Manipulasi hasil atau aturan penilaian

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** P-03, P-04, P-05, D-02, F-05, F-07, F-08
- **Aset terdampak:** A-04 (Aturan penilaian risiko), A-05 (Hasil assessment), A-07 (State assessment)
- **Skenario:** Pengguna yang mengendalikan browser atau pihak yang mengubah kode aplikasi memodifikasi aturan atau state sehingga laporan menampilkan tingkat risiko, temuan, atau rekomendasi yang berbeda dari hasil semestinya.
- **Likelihood:** Medium (2). Aturan dan state berada di sisi klien sehingga tidak dapat diperlakukan sebagai sumber bukti yang tahan manipulasi.
- **Impact:** High (3). Pengguna dapat menerima kesimpulan keamanan yang keliru dan mengambil keputusan berdasarkan laporan tersebut.
- **Skor awal:** 6 — High.
- **Mitigasi yang disarankan:** Dokumentasikan keterbatasan hasil di sisi klien, buat pengujian unit untuk aturan risiko, dan jika dibutuhkan hasil yang dapat dipercaya lintas pengguna, pindahkan evaluasi penting ke backend yang menerapkan kontrol akses dan validasi sesuai kebutuhan.

### TM-03 — Penyalahgunaan identitas laporan

- **Kategori STRIDE:** Spoofing
- **Elemen DFD:** P-05, F-08, F-09
- **Aset terdampak:** A-05 (Hasil assessment), A-08 (Identitas dan navigasi laporan)
- **Skenario:** Pengguna membuka atau membagikan URL laporan dan menganggap ID laporan sebagai bukti identitas pemilik atau keaslian hasil. Dalam implementasi tanpa autentikasi dan penyimpanan permanen, ID laporan sendiri tidak membuktikan siapa yang membuat hasil tersebut.
- **Likelihood:** Medium (2). Route laporan dapat diakses melalui ID, dan pengguna dapat membuat asumsi yang keliru tentang makna ID.
- **Impact:** Medium (2). Hasil dapat disalahartikan sebagai laporan autentik atau milik pengguna tertentu. Dampak akses lintas pengguna perlu dinilai ulang jika backend dan akun pengguna ditambahkan.
- **Skor awal:** 4 — Medium.
- **Mitigasi yang disarankan:** Jangan menganggap ID sebagai mekanisme autentikasi. Jika autentikasi ditambahkan, lakukan pemeriksaan kepemilikan pada server untuk setiap laporan dan jelaskan sumber data serta batas keaslian laporan.

### TM-04 — Penyangkalan tindakan atau perubahan assessment

- **Kategori STRIDE:** Repudiation
- **Elemen DFD:** P-04, D-02, P-05, F-07, F-08
- **Aset terdampak:** A-05 (Hasil assessment), A-07 (State assessment)
- **Skenario:** Pengguna menyangkal pernah membuat atau mengubah suatu assessment. Karena data sesi dikelola dalam React state dan tidak tersimpan permanen, aplikasi tidak menyediakan bukti audit persisten berdasarkan arsitektur yang didokumentasikan.
- **Likelihood:** Medium (2). Data sesi dapat hilang saat halaman dimuat ulang, sehingga rekonstruksi tindakan sebelumnya terbatas.
- **Impact:** Low (1). Pada milestone edukatif tanpa penyimpanan permanen, dampak utamanya adalah keterbatasan pembuktian, bukan hilangnya catatan transaksi bisnis yang persisten.
- **Skor awal:** 2 — Low.
- **Mitigasi yang disarankan:** Dokumentasikan bahwa riwayat hanya berlaku selama sesi. Jika audit trail menjadi kebutuhan, desain pencatatan server-side dengan waktu, identitas yang sesuai, dan perlindungan integritas log.

### TM-05 — Pengungkapan SSID dan catatan assessment

- **Kategori STRIDE:** Information Disclosure
- **Elemen DFD:** E-01, P-01, P-04, P-05, D-02, F-01, F-07, F-09
- **Aset terdampak:** A-03 (Input konfigurasi Wi-Fi), A-05 (Hasil assessment), A-07 (State assessment)
- **Skenario:** Pengguna memasukkan SSID atau catatan yang berisi informasi sensitif, lalu informasi tersebut terlihat oleh orang lain yang menggunakan perangkat atau browser yang sama, melalui tangkapan layar, atau ketika laporan ditampilkan.
- **Likelihood:** Medium (2). SSID dan catatan ditampilkan sebagai bagian dari alur assessment; kemungkinan akses oleh orang lain bergantung pada penggunaan perangkat dan konteks aplikasi.
- **Impact:** Medium (2). Informasi dapat mengungkap nama jaringan atau konteks pengguna, meskipun aplikasi tidak meminta password Wi-Fi sebenarnya.
- **Skor awal:** 4 — Medium.
- **Mitigasi yang disarankan:** Minimalkan informasi yang dikumpulkan, ingatkan pengguna agar tidak menulis rahasia di catatan, hindari menampilkan data yang tidak diperlukan, dan evaluasi kebutuhan penyimpanan serta penghapusan data jika fitur persisten ditambahkan.

### TM-06 — Kebocoran data melalui komunikasi web

- **Kategori STRIDE:** Information Disclosure
- **Elemen DFD:** E-02, TB-02, F-10
- **Aset terdampak:** A-01 (Source code aplikasi), A-03 (Input konfigurasi), A-05 (Hasil assessment), A-10 (Aset deployment dan komunikasi)
- **Skenario:** Jika aplikasi diakses melalui jaringan tanpa perlindungan transport yang memadai, pihak di jalur komunikasi berpotensi membaca atau memodifikasi data yang dikirimkan.
- **Likelihood:** Medium (2). Ini merupakan risiko kondisional; konfigurasi HTTPS pada deployment aktual belum diverifikasi dalam analisis ini.
- **Impact:** High (3). Jika data sensitif dikirim tanpa perlindungan, kerahasiaan dan integritas komunikasi dapat terganggu.
- **Skor awal:** 6 — High.
- **Mitigasi yang disarankan:** Verifikasi HTTPS/TLS pada deployment, pastikan semua aset dimuat melalui koneksi aman, dan tinjau konfigurasi hosting serta security headers. Jangan menyatakan kontrol ini aktif sebelum ada bukti konfigurasi aktual.

### TM-07 — Input berlebihan mengganggu antarmuka

- **Kategori STRIDE:** Denial of Service
- **Elemen DFD:** E-01, P-01, P-02, P-03, F-01, F-02
- **Aset terdampak:** A-03 (Input konfigurasi Wi-Fi), A-04 (Aturan penilaian risiko), A-09 (Tampilan aplikasi)
- **Skenario:** Input yang sangat panjang atau pengiriman interaksi berulang membuat validasi, rendering, atau penggunaan antarmuka menjadi lambat. Validasi SSID dan catatan sudah didokumentasikan, tetapi semua jalur beban dan perilaku browser tetap perlu diuji.
- **Likelihood:** Medium (2). Pengguna dapat memasukkan nilai berulang atau tidak sesuai, sementara dampak sebenarnya bergantung pada implementasi dan perangkat.
- **Impact:** Medium (2). Antarmuka dapat menjadi lambat atau sulit digunakan; tidak ada indikasi dari desain saat ini bahwa hal tersebut otomatis mengganggu layanan lain.
- **Skor awal:** 4 — Medium.
- **Mitigasi yang disarankan:** Batasi panjang input di semua jalur yang relevan, hindari pekerjaan sinkron yang tidak diperlukan, dan lakukan pengujian dengan input batas serta interaksi berulang.

### TM-08 — Manipulasi data awal atau dependensi

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** E-02, P-03, P-04, D-01, F-06, F-10
- **Aset terdampak:** A-01 (Source code), A-02 (Konfigurasi dan dependensi), A-04 (Aturan penilaian risiko), A-06 (Mock data)
- **Skenario:** Perubahan tidak sah pada source code, aturan penilaian, mock data, atau dependensi menyebabkan aplikasi menjalankan perilaku berbeda dari yang diharapkan.
- **Likelihood:** Medium (2). Repository dan dependensi merupakan bagian dari rantai pengembangan perangkat lunak; risiko aktual bergantung pada kontrol akun, proses review, dan pengelolaan dependensi yang belum diaudit secara menyeluruh.
- **Impact:** High (3). Perubahan dapat memengaruhi seluruh pengguna yang menerima build tersebut atau menghasilkan penilaian yang menyesatkan.
- **Skor awal:** 6 — High.
- **Mitigasi yang disarankan:** Review perubahan sebelum merge, lindungi akses repository, gunakan lockfile, periksa dependensi secara berkala, dan verifikasi build dari source yang telah ditinjau.

### TM-09 — Ketiadaan otorisasi jika fitur multi-user ditambahkan

- **Kategori STRIDE:** Elevation of Privilege
- **Elemen DFD:** P-05, F-08, F-09; backend dan penyimpanan pengguna belum termasuk arsitektur saat ini
- **Aset terdampak:** A-05 (Hasil assessment), A-08 (Identitas laporan), A-10 (Aset deployment)
- **Skenario:** Jika aplikasi kelak menambahkan akun, backend, atau database, pemeriksaan kepemilikan laporan yang tidak memadai dapat memungkinkan pengguna mengakses assessment milik pengguna lain.
- **Likelihood:** Low (1). Ini adalah risiko pengembangan masa depan, bukan klaim adanya endpoint terlindungi yang saat ini rentan.
- **Impact:** High (3). Pada sistem multi-user, akses lintas akun dapat mengekspos informasi dan merusak integritas data.
- **Skor awal:** 3 — Medium.
- **Mitigasi yang disarankan:** Sebelum fitur multi-user dirilis, definisikan model otorisasi, lakukan pemeriksaan akses pada server untuk setiap objek, dan uji akses menggunakan beberapa akun. Sampai fitur tersebut ada, catat ancaman sebagai risiko kondisional.

### TM-10 — Hasil penilaian disalahartikan sebagai jaminan keamanan

- **Kategori STRIDE:** Tampering / Information Disclosure (integritas dan konteks informasi)
- **Elemen DFD:** P-03, P-05, F-05, F-09
- **Aset terdampak:** A-04 (Aturan penilaian risiko), A-05 (Hasil assessment), A-09 (Tampilan dan dokumentasi)
- **Skenario:** Pengguna menganggap hasil Low sebagai bukti bahwa jaringan pasti aman, padahal penilaian hanya berdasarkan input manual dan aturan yang diterapkan. Input yang tidak lengkap atau keliru juga dapat menghasilkan kesimpulan yang tidak sesuai kondisi router sebenarnya.
- **Likelihood:** High (3). Pengguna dapat mengandalkan kategori risiko yang terlihat tanpa memahami batasan penilaian manual.
- **Impact:** High (3). Pengguna dapat mengabaikan kelemahan jaringan nyata karena hasil aplikasi dianggap sebagai jaminan.
- **Skor awal:** 9 — Critical.
- **Mitigasi yang disarankan:** Tampilkan batasan penilaian dengan jelas pada halaman hasil, jelaskan bahwa input tidak diverifikasi langsung ke router, dan hindari bahasa yang menjamin keamanan. Tambahkan pengujian untuk kondisi input tidak diketahui dan kombinasi aturan risiko.

### TM-11 — Manipulasi konten atau tampilan laporan

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** P-01, P-05, F-02, F-09
- **Aset terdampak:** A-03 (Input konfigurasi), A-05 (Hasil assessment), A-09 (Tampilan aplikasi)
- **Skenario:** Input atau teks yang ditampilkan dalam laporan mengandung karakter khusus atau konten tak terduga yang menyebabkan tampilan tidak benar. Jika data dimasukkan ke konteks HTML yang tidak aman, risiko injeksi sisi klien juga perlu dipertimbangkan.
- **Likelihood:** Medium (2). Aplikasi menampilkan nilai yang berasal dari input pengguna, sehingga perilaku rendering perlu diperiksa. Analisis ini belum membuktikan adanya kerentanan XSS.
- **Impact:** High (3). Jika injeksi yang dapat dieksekusi terbukti terjadi, integritas tampilan atau data pada sesi browser dapat terpengaruh.
- **Skor awal:** 6 — High.
- **Mitigasi yang disarankan:** Gunakan rendering teks yang aman, hindari injeksi HTML mentah untuk input pengguna, dan uji karakter khusus pada SSID serta catatan. Pastikan hasil pengujian benar-benar membuktikan ada atau tidaknya jalur eksekusi.

### TM-12 — Aset web tidak tersedia

- **Kategori STRIDE:** Denial of Service
- **Elemen DFD:** E-02, TB-02, F-10, P-01
- **Aset terdampak:** A-01 (Source code aplikasi), A-09 (Tampilan aplikasi), A-10 (Aset deployment)
- **Skenario:** Gangguan pada hosting, kesalahan deployment, atau kegagalan penyediaan aset membuat pengguna tidak dapat membuka aplikasi atau menggunakan halaman assessment.
- **Likelihood:** Low (1). Belum ada bukti insiden atau pengukuran ketersediaan; kemungkinan aktual bergantung pada lingkungan hosting yang digunakan.
- **Impact:** Medium (2). Aplikasi tidak dapat digunakan sementara, tetapi tidak ada database permanen atau layanan router yang diketahui ikut terdampak pada milestone ini.
- **Skor awal:** 2 — Low.
- **Mitigasi yang disarankan:** Verifikasi proses build dan deployment, siapkan cara pemulihan versi sebelumnya, serta pantau ketersediaan jika aplikasi dipublikasikan untuk digunakan secara luas.

## 6. Ringkasan Ancaman

| ID | Kategori STRIDE | Ancaman | Likelihood | Impact | Skor | Prioritas awal |
|---|---|---|---:|---:|---:|---|
| TM-01 | Tampering | Manipulasi input | 2 | 2 | 4 | Medium |
| TM-02 | Tampering | Manipulasi hasil atau aturan | 2 | 3 | 6 | High |
| TM-03 | Spoofing | Penyalahgunaan identitas laporan | 2 | 2 | 4 | Medium |
| TM-04 | Repudiation | Penyangkalan tindakan assessment | 2 | 1 | 2 | Low |
| TM-05 | Information Disclosure | Pengungkapan SSID dan catatan | 2 | 2 | 4 | Medium |
| TM-06 | Information Disclosure | Komunikasi web tanpa perlindungan memadai | 2 | 3 | 6 | High |
| TM-07 | Denial of Service | Input berlebihan | 2 | 2 | 4 | Medium |
| TM-08 | Tampering | Perubahan source code atau dependensi | 2 | 3 | 6 | High |
| TM-09 | Elevation of Privilege | Otorisasi lemah pada fitur multi-user mendatang | 1 | 3 | 3 | Medium |
| TM-10 | Tampering / Information Disclosure | Hasil disalahartikan sebagai jaminan keamanan | 3 | 3 | 9 | Critical |
| TM-11 | Tampering | Manipulasi konten atau tampilan laporan | 2 | 3 | 6 | High |
| TM-12 | Denial of Service | Aset web tidak tersedia | 1 | 2 | 2 | Low |

## 7. Prioritas Awal

Ancaman yang memerlukan perhatian lebih lanjut berdasarkan skor awal:

1. **TM-10 — Hasil penilaian disalahartikan sebagai jaminan keamanan (Critical).** Prioritas karena dapat memengaruhi keputusan pengguna tentang keamanan jaringan.
2. **TM-02 — Manipulasi hasil atau aturan penilaian (High).** Integritas penilaian merupakan fungsi inti aplikasi.
3. **TM-06 — Komunikasi web tanpa perlindungan memadai (High, kondisional).** Perlu verifikasi HTTPS/TLS pada deployment sebelum menetapkan risiko aktual.
4. **TM-08 — Manipulasi source code atau dependensi (High).** Perubahan pada rantai pengembangan dapat mengubah perilaku aplikasi.
5. **TM-11 — Manipulasi konten atau tampilan laporan (High, perlu pengujian).** Perlu pengujian rendering input untuk memastikan tidak ada jalur injeksi.

Daftar prioritas ini akan dikaji ulang dalam `risk-register.md`. Skor dapat berubah setelah pemeriksaan kode dan deployment yang lebih menyeluruh.

## 8. Batasan Analisis

- Penilaian likelihood dan impact merupakan estimasi awal, bukan hasil pengukuran statistik.
- Tidak ada klaim bahwa aplikasi telah mengalami serangan atau memiliki kerentanan yang telah dieksploitasi.
- HTTPS/TLS dan security headers belum diverifikasi pada lingkungan deployment aktual.
- Risiko terkait backend, akun, dan database bersifat kondisional karena komponen tersebut belum menjadi bagian arsitektur milestone yang didokumentasikan.
- Pengujian khusus seperti XSS, pengujian beban, audit dependensi, dan pemeriksaan konfigurasi hosting belum dinyatakan selesai.
- Threat model perlu diperbarui jika arsitektur, fitur, atau hasil pengujian berubah.

## 9. Referensi

Repository: https://github.com/AhmadHaikalHarahap/105224002-WifiCheck

Referensi implementasi yang diperiksa:

- `README.md`
- `components/assessment/AssessmentForm.tsx`
- `components/providers/AssessmentProvider.tsx`
- `lib/assessment-rules.ts`
- `lib/validation.ts`
- `data/mock-assessments.ts`
- `app/reports/[id]/`

Dokumen pendamping:

- `asset-inventory.md`
- `dfd.md`

Dokumen berikutnya: `risk-register.md`.
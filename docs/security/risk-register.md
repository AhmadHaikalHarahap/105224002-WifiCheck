# Risk Register — WiFi Check

## 1. Informasi Dokumen

| Item | Keterangan |
|---|---|
| Aplikasi | WiFi Check |
| Versi | 0.1 |
| Referensi | `asset-inventory.md`, `dfd.md`, `threat-model.md` |
| Metode penilaian | Likelihood × Impact |
| Jumlah risiko prioritas | 5 |
| Status | Penilaian awal, menunggu verifikasi kontrol dan pemetaan tugas |

## 2. Tujuan

Risk register ini mencatat risiko keamanan prioritas WiFi Check berdasarkan hasil threat modeling menggunakan STRIDE.

Risiko dipilih berdasarkan kemungkinan terjadinya skenario, besarnya dampak terhadap aplikasi dan pengguna, serta pentingnya fungsi yang terdampak. Skor merupakan estimasi awal dan bukan hasil pengujian eksploitasi.

## 3. Metode Penilaian

### Likelihood

| Nilai | Level | Keterangan |
|---|---|---|
| 1 | Low | Kemungkinan rendah atau memerlukan kondisi khusus |
| 2 | Medium | Skenario masuk akal dan dapat terjadi jika kondisi tertentu terpenuhi |
| 3 | High | Skenario relatif mudah terjadi atau jalur serangannya langsung |

### Impact

| Nilai | Level | Keterangan |
|---|---|---|
| 1 | Low | Dampak terbatas |
| 2 | Medium | Memengaruhi hasil assessment, privasi, atau penggunaan aplikasi |
| 3 | High | Dapat mengakibatkan keputusan keamanan yang salah, paparan informasi penting, atau gangguan signifikan |

### Perhitungan

**Risk Score = Likelihood × Impact**

| Skor | Kategori |
|---|---|
| 1–2 | Low |
| 3–4 | Medium |
| 6 | High |
| 9 | Critical |

## 4. Ringkasan Lima Risiko Prioritas

| Risk ID | Threat ID | Risiko | Likelihood | Impact | Skor | Level |
|---|---|---|---:|---:|---:|---|
| R-01 | TM-10 | Hasil assessment disalahartikan sebagai jaminan keamanan | 3 | 3 | 9 | Critical |
| R-02 | TM-02 | Manipulasi hasil atau aturan penilaian | 2 | 3 | 6 | High |
| R-03 | TM-06 | Komunikasi web tanpa perlindungan memadai | 2 | 3 | 6 | High — kondisional |
| R-04 | TM-08 | Manipulasi source code atau dependensi | 2 | 3 | 6 | High |
| R-05 | TM-11 | Manipulasi konten atau tampilan laporan | 2 | 3 | 6 | High — perlu pengujian |

## 5. Detail Risiko dan Mitigasi

### R-01 — Hasil assessment disalahartikan sebagai jaminan keamanan

**Referensi ancaman:** TM-10

| Atribut | Detail |
|---|---|
| Aset terdampak | A-04, A-05, A-09 |
| Elemen DFD | P-03, P-05, F-05, F-09 |
| Likelihood | 3 — High |
| Alasan likelihood | Aplikasi mengevaluasi konfigurasi berdasarkan input manual dan aturan yang tersedia. Pengguna dapat menganggap kategori risiko sebagai gambaran menyeluruh kondisi router meskipun aplikasi tidak melakukan pemindaian langsung. |
| Impact | 3 — High |
| Alasan impact | Pengguna dapat mengabaikan kelemahan jaringan yang tidak tercakup dalam input atau aturan penilaian. |
| Skor awal | 9 — Critical |
| Pemilik tindak lanjut yang disarankan | Pengembang aplikasi dan penanggung jawab dokumentasi |
| Pemetaan tugas | **Perlu dikonfirmasi — Tugas 2/Tugas 3** |

**Mitigasi yang disarankan:**

1. Tambahkan penjelasan pada halaman hasil bahwa evaluasi hanya berdasarkan informasi yang dimasukkan pengguna.
2. Jelaskan bahwa WiFi Check tidak memverifikasi konfigurasi router secara langsung.
3. Hindari pernyataan yang menyamakan kategori Low dengan jaminan jaringan aman.
4. Tambahkan pengujian untuk input tidak lengkap, nilai tidak diketahui, dan kombinasi konfigurasi yang berbeda.
5. Pastikan rekomendasi yang ditampilkan konsisten dengan hasil evaluasi.

**Bukti penyelesaian yang diharapkan:**

- Perubahan source code atau tampilan yang memuat batasan penilaian.
- Hasil pengujian yang menunjukkan perilaku aplikasi pada input yang relevan.
- Pemeriksaan manual terhadap teks hasil assessment.

**Risiko residual:** Belum dinilai. Risiko dapat tetap ada karena penilaian manual tidak dapat memastikan seluruh kondisi keamanan jaringan.

### R-02 — Manipulasi hasil atau aturan penilaian

**Referensi ancaman:** TM-02

| Atribut | Detail |
|---|---|
| Aset terdampak | A-04, A-05, A-07 |
| Elemen DFD | P-03, P-04, P-05, D-02, F-05, F-07, F-08 |
| Likelihood | 2 — Medium |
| Alasan likelihood | Aturan dan state aplikasi berjalan di sisi klien. Pengguna yang mengendalikan browser dapat memodifikasi lingkungan klien; hasil tidak boleh dianggap sebagai bukti yang tahan manipulasi. |
| Impact | 3 — High |
| Alasan impact | Hasil yang dimodifikasi dapat menampilkan klasifikasi risiko atau rekomendasi yang salah. |
| Skor awal | 6 — High |
| Pemilik tindak lanjut yang disarankan | Pengembang aplikasi |
| Pemetaan tugas | **Perlu dikonfirmasi — Tugas 2/Tugas 3** |

**Mitigasi yang disarankan:**

1. Buat pengujian unit untuk fungsi penilaian di `lib/assessment-rules.ts`.
2. Uji setiap kategori protokol keamanan dan kombinasi input yang relevan.
3. Periksa bahwa input di luar nilai yang diizinkan tidak menghasilkan kesimpulan yang menyesatkan.
4. Dokumentasikan bahwa hasil yang dihitung di browser dapat dimodifikasi oleh pengguna yang mengendalikan browser.
5. Jika keaslian hasil diperlukan untuk sistem multi-user atau proses formal, evaluasi pemrosesan sisi server dan kontrol integritas yang sesuai.

**Bukti penyelesaian yang diharapkan:**

- Berkas pengujian aturan penilaian.
- Hasil pengujian untuk skenario valid dan tidak valid.
- Dokumentasi batas kepercayaan terhadap hasil yang dibuat di sisi klien.

**Risiko residual:** Belum dinilai. Pengujian aturan dapat meningkatkan keandalan, tetapi tidak menjadikan state browser tahan manipulasi.

### R-03 — Komunikasi web tanpa perlindungan memadai

**Referensi ancaman:** TM-06

| Atribut | Detail |
|---|---|
| Aset terdampak | A-01, A-03, A-05, A-10 |
| Elemen DFD | E-02, TB-02, F-10 |
| Likelihood | 2 — Medium, sementara |
| Alasan likelihood | Konfigurasi HTTPS/TLS pada lingkungan deployment aktual belum diverifikasi. Nilai ini merupakan estimasi sementara, bukan klaim bahwa aplikasi benar-benar menggunakan HTTP tanpa perlindungan. |
| Impact | 3 — High |
| Alasan impact | Jika data atau aset aplikasi dikirim tanpa perlindungan transport yang memadai, kerahasiaan dan integritas komunikasi berpotensi terganggu. |
| Skor awal | 6 — High |
| Pemilik tindak lanjut yang disarankan | Penanggung jawab deployment |
| Pemetaan tugas | **Perlu dikonfirmasi — Tugas 2/Tugas 3** |

**Mitigasi yang disarankan:**

1. Identifikasi URL deployment yang benar-benar digunakan.
2. Verifikasi bahwa aplikasi menggunakan HTTPS dengan sertifikat yang valid.
3. Periksa agar aset aplikasi tidak dimuat melalui koneksi HTTP yang tidak aman.
4. Tinjau konfigurasi hosting dan security headers yang relevan.
5. Catat hasil pemeriksaan beserta bukti konfigurasi atau hasil pengujian.

**Bukti penyelesaian yang diharapkan:**

- URL deployment yang diverifikasi.
- Bukti koneksi HTTPS dan validitas sertifikat.
- Hasil pemeriksaan konfigurasi yang relevan.

**Risiko residual:** Belum dinilai. Jika kontrol transport yang memadai telah diverifikasi, likelihood harus dinilai ulang berdasarkan bukti tersebut.

### R-04 — Manipulasi source code atau dependensi

**Referensi ancaman:** TM-08

| Atribut | Detail |
|---|---|
| Aset terdampak | A-01, A-02, A-04, A-06 |
| Elemen DFD | E-02, P-03, P-04, D-01, F-06, F-10 |
| Likelihood | 2 — Medium |
| Alasan likelihood | Perubahan source code dan dependensi merupakan risiko pada proses pengembangan. Tingkat perlindungan repository, proses review, dan pengelolaan dependensi belum diaudit secara menyeluruh. |
| Impact | 3 — High |
| Alasan impact | Perubahan pada aturan, data awal, atau kode dapat mengubah perilaku aplikasi dan menghasilkan penilaian yang keliru. |
| Skor awal | 6 — High |
| Pemilik tindak lanjut yang disarankan | Pengelola repository dan pengembang |
| Pemetaan tugas | **Perlu dikonfirmasi — Tugas 2/Tugas 3** |

**Mitigasi yang disarankan:**

1. Tinjau perubahan kode sebelum digabungkan ke branch utama.
2. Batasi akses tulis repository kepada pihak yang memang memerlukannya.
3. Pertahankan lockfile dan tinjau perubahan dependensi.
4. Jalankan lint dan build setelah perubahan penting.
5. Periksa dependensi yang digunakan dan tangani temuan yang relevan.
6. Pastikan perubahan pada aturan penilaian disertai pengujian yang sesuai.

**Bukti penyelesaian yang diharapkan:**

- Riwayat perubahan dan hasil code review jika tersedia.
- Hasil lint dan build yang benar-benar dijalankan.
- Catatan pemeriksaan dependensi beserta tindak lanjutnya.

**Risiko residual:** Belum dinilai. Keberadaan lockfile atau proses build saja tidak membuktikan bahwa seluruh rantai pengembangan telah aman.

### R-05 — Manipulasi konten atau tampilan laporan

**Referensi ancaman:** TM-11

| Atribut | Detail |
|---|---|
| Aset terdampak | A-03, A-05, A-09 |
| Elemen DFD | P-01, P-05, F-02, F-09 |
| Likelihood | 2 — Medium, sementara |
| Alasan likelihood | Laporan menampilkan informasi yang berasal dari input. Jalur rendering dan penanganan karakter khusus harus diuji; kerentanan injeksi belum terbukti. |
| Impact | 3 — High |
| Alasan impact | Jika ditemukan jalur injeksi yang dapat dieksekusi, integritas tampilan dan keamanan sesi browser dapat terpengaruh. |
| Skor awal | 6 — High |
| Pemilik tindak lanjut yang disarankan | Pengembang frontend |
| Pemetaan tugas | **Perlu dikonfirmasi — Tugas 2/Tugas 3** |

**Mitigasi yang disarankan:**

1. Periksa bagaimana SSID dan catatan ditampilkan pada halaman riwayat serta detail laporan.
2. Gunakan mekanisme rendering teks yang aman dan hindari menyisipkan input mentah sebagai HTML.
3. Uji input yang mengandung tanda kutip, tanda kurung sudut, dan karakter khusus lain.
4. Pastikan validasi input tidak menggantikan kebutuhan untuk melakukan rendering secara aman.
5. Catat hasil pengujian aktual dan perbaiki jalur yang terbukti bermasalah.

**Bukti penyelesaian yang diharapkan:**

- Pemeriksaan source code pada komponen yang menampilkan input.
- Hasil pengujian karakter khusus pada laporan.
- Perubahan kode dan pengujian ulang jika ditemukan masalah.

**Risiko residual:** Belum dinilai. Jangan menyatakan aplikasi bebas XSS sebelum jalur rendering yang relevan diperiksa dan diuji.

## 6. Rencana Tindak Lanjut

| Urutan | Risk ID | Tindakan berikutnya | Status |
|---:|---|---|---|
| 1 | R-01 | Memastikan batasan assessment dijelaskan kepada pengguna | Belum diverifikasi |
| 2 | R-02 | Memeriksa aturan penilaian dan menyiapkan pengujian | Belum diverifikasi |
| 3 | R-03 | Memverifikasi HTTPS/TLS pada deployment aktual | Menunggu informasi deployment |
| 4 | R-04 | Meninjau source code, dependensi, dan proses perubahan | Belum diverifikasi |
| 5 | R-05 | Memeriksa rendering input dan menguji karakter khusus | Belum diverifikasi |

Prioritas tindak lanjut dapat berubah setelah kontrol aktual diperiksa. Status “belum diverifikasi” tidak berarti kontrol tersebut pasti tidak ada.

## 7. Pemetaan ke Tugas 2 dan Tugas 3

Rincian resmi Tugas 2 dan Tugas 3 belum tersedia dalam bahan yang digunakan untuk dokumen ini. Karena itu, pemetaan kontrol ke nomor tugas belum dapat dipastikan.

| Risk ID | Kontrol yang diusulkan | Pemetaan |
|---|---|---|
| R-01 | Penjelasan batasan assessment dan pengujian skenario | Perlu dikonfirmasi |
| R-02 | Pengujian unit aturan risiko dan penanganan input | Perlu dikonfirmasi |
| R-03 | Verifikasi HTTPS/TLS dan konfigurasi deployment | Perlu dikonfirmasi |
| R-04 | Code review, pemeriksaan dependensi, lint, dan build | Perlu dikonfirmasi |
| R-05 | Pemeriksaan rendering aman dan pengujian karakter khusus | Perlu dikonfirmasi |

Pemetaan akhir dilakukan setelah instruksi atau rubrik Tugas 2 dan Tugas 3 tersedia. Jangan menandai kontrol sebagai selesai hanya karena kontrol tersebut ditulis dalam risk register.

## 8. Batasan dan Asumsi

1. Risk register disusun berdasarkan threat model awal.
2. Skor merupakan estimasi kualitatif, bukan hasil pengukuran statistik.
3. Risiko komunikasi web masih bergantung pada verifikasi deployment.
4. Risiko manipulasi laporan masih membutuhkan pemeriksaan kode dan pengujian.
5. Tidak ada klaim bahwa mitigasi telah diterapkan atau pengujian telah berhasil.
6. Nilai risiko residual akan diisi setelah kontrol diterapkan dan efektivitasnya diperiksa.
7. Pemetaan ke Tugas 2 dan Tugas 3 menunggu rincian tugas resmi.

## 9. Referensi

Repository: https://github.com/AhmadHaikalHarahap/105224002-WifiCheck

Dokumen terkait:

- `asset-inventory.md`
- `dfd.md`
- `threat-model.md`

File implementasi yang relevan:

- `components/assessment/AssessmentForm.tsx`
- `components/providers/AssessmentProvider.tsx`
- `lib/assessment-rules.ts`
- `lib/validation.ts`
- `data/mock-assessments.ts`
- `app/reports/[id]/`

Dokumen ini harus diperbarui ketika verifikasi source code, pengujian, deployment, atau instruksi tugas memberikan informasi baru.
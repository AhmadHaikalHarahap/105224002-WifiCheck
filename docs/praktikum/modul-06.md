\# Dokumentasi Praktikum Modul 6 – Database dan CRUD WiFi Check



\## 1. Identitas Proyek



| Keterangan | Informasi |

|---|---|

| Nama | Ahmad Haikal Harahap |

| NIM | 105224002 |

| Nama Proyek | WiFi Check |

| Repository | https://github.com/AhmadHaikalHarahap/105224002-WifiCheck |

| Framework | Next.js 16 |

| Bahasa Pemrograman | TypeScript |

| Database | PostgreSQL 18 |

| ORM | Prisma 7 |

| Validasi | Zod |

| Status | Implementasi CRUD selesai |



\## 2. Deskripsi Proyek



WiFi Check merupakan aplikasi berbasis web yang digunakan untuk melakukan evaluasi awal terhadap keamanan konfigurasi jaringan WiFi. Aplikasi ini membantu pengguna memahami kondisi keamanan jaringan berdasarkan beberapa parameter, seperti protokol keamanan, perlindungan password, status WPS, dan kondisi firmware router.



Pada pengembangan Modul 6, aplikasi WiFi Check dikembangkan dengan mengintegrasikan database PostgreSQL dan Prisma ORM agar data yang dimasukkan pengguna dapat disimpan secara permanen.



Sebelumnya, sebagian data aplikasi masih menggunakan pendekatan mock data. Pada tahap ini, pengelolaan data telah dihubungkan dengan database sehingga pengguna dapat melakukan operasi Create, Read, Update, dan Delete (CRUD).



\## 3. Teknologi yang Digunakan



| Teknologi | Fungsi |

|---|---|

| Next.js 16 | Framework pengembangan aplikasi web |

| TypeScript | Menjaga konsistensi tipe data |

| PostgreSQL 18 | Menyimpan data aplikasi |

| Prisma ORM 7 | Menghubungkan aplikasi dengan database |

| Server Actions | Menangani proses pengolahan data di server |

| Zod | Melakukan validasi data di sisi server |

| Tailwind CSS | Mengatur tampilan dan responsivitas aplikasi |



\## 4. Perancangan Database



Aplikasi WiFi Check menggunakan dua entitas utama, yaitu Assessment dan Finding.



\### 4.1 Entitas Assessment



Assessment digunakan untuk menyimpan hasil pemeriksaan keamanan jaringan WiFi.



Atribut yang digunakan antara lain:



\- id

\- ssid

\- securityProtocol

\- passwordProtection

\- wpsEnabled

\- firmwareStatus

\- notes

\- riskLevel

\- summary

\- recommendations

\- createdAt



\### 4.2 Entitas Finding



Finding digunakan untuk menyimpan daftar temuan keamanan dari suatu Assessment.



Atribut yang digunakan antara lain:



\- id

\- assessmentId

\- title

\- description

\- severity

\- isManual



Atribut `isManual` digunakan untuk membedakan temuan yang dibuat secara otomatis oleh sistem dengan temuan yang ditambahkan pengguna secara manual.



\### 4.3 Relasi Antarentitas



Relasi antara Assessment dan Finding menggunakan hubungan One-to-Many.



Satu Assessment dapat memiliki banyak Finding, sedangkan satu Finding hanya dimiliki oleh satu Assessment.



Relasi tersebut juga menggunakan aturan `onDelete: Cascade`. Artinya, apabila suatu Assessment dihapus, seluruh Finding yang terhubung dengan Assessment tersebut akan ikut dihapus.



\## 5. Implementasi Prisma ORM



Prisma digunakan sebagai ORM untuk mengelola komunikasi antara aplikasi Next.js dengan database PostgreSQL.



File konfigurasi Prisma:



\- `prisma/schema.prisma`

\- `prisma.config.ts`

\- `lib/prisma.ts`



Proses migration digunakan untuk menerapkan perubahan struktur database.



Perintah yang digunakan:



```bash

npx prisma validate

npx prisma migrate dev --name add\_manual\_finding

npx prisma generate

```



Migration berhasil diterapkan dengan nama:



`20261102121237\_add\_manual\_finding`



Setelah migration dijalankan, database PostgreSQL telah memiliki struktur tabel Assessment dan Finding beserta relasinya.



\## 6. Implementasi CRUD Assessment



Pengelolaan data Assessment telah menggunakan database PostgreSQL melalui Prisma ORM.



\### 6.1 Create Assessment



Pengguna dapat membuat Assessment baru melalui halaman pemeriksaan WiFi.



Data yang dimasukkan meliputi SSID, protokol keamanan, perlindungan password, status WPS, firmware, dan catatan tambahan.



Setelah data divalidasi, sistem menjalankan analisis keamanan menggunakan rule-based assessment dan menyimpan hasilnya ke database.



\### 6.2 Read Assessment



Data Assessment ditampilkan pada halaman History dan halaman Report Detail.



Sistem mengambil data dari PostgreSQL menggunakan Prisma sehingga data yang ditampilkan berasal dari database, bukan mock data.



\### 6.3 Update Assessment



Pengguna dapat mengubah informasi Assessment melalui halaman edit.



Setelah data diperbarui, sistem menjalankan kembali proses analisis keamanan untuk memperbarui risk level, summary, recommendations, dan temuan otomatis.



Temuan manual tetap dipertahankan ketika Assessment diperbarui.



\### 6.4 Delete Assessment



Pengguna dapat menghapus Assessment melalui halaman History.



Penghapusan dilakukan menggunakan Server Action dan Prisma. Finding yang terhubung juga akan terhapus secara otomatis melalui relasi Cascade.



\## 7. Implementasi CRUD Finding



Finding merupakan entitas yang berelasi dengan Assessment.



Pada tahap ini, pengguna dapat mengelola temuan keamanan secara manual melalui halaman Report Detail.



\### 7.1 Create Finding



Pengguna dapat menambahkan temuan keamanan baru dengan mengisi:



\- Judul temuan.

\- Deskripsi temuan.

\- Tingkat risiko (Low, Medium, atau High).



Data disimpan ke tabel Finding dengan nilai `isManual = true`.



\### 7.2 Read Finding



Seluruh temuan ditampilkan pada halaman laporan Assessment.



Sistem menampilkan temuan otomatis dan temuan manual berdasarkan relasi dengan Assessment.



\### 7.3 Update Finding



Pengguna dapat mengubah judul, deskripsi, dan tingkat risiko pada temuan manual.



Sistem membatasi proses perubahan hanya pada Finding yang memiliki nilai `isManual = true`.



\### 7.4 Delete Finding



Pengguna dapat menghapus temuan manual tanpa menghapus Assessment induknya.



Penghapusan dilakukan menggunakan Prisma dengan memeriksa ID Finding, ID Assessment, dan status temuan manual.



\## 8. Implementasi Validasi Server Menggunakan Zod



Zod digunakan untuk memastikan data yang diterima server sesuai dengan aturan yang telah ditentukan.



Validasi dilakukan pada Server Actions sebelum data disimpan atau diperbarui di database.



Pada Assessment, validasi meliputi:



\- SSID wajib diisi.

\- SSID tidak boleh melebihi 32 byte UTF-8.

\- Protokol keamanan harus sesuai pilihan yang tersedia.

\- Status perlindungan password harus valid.

\- Status WPS harus valid.

\- Status firmware harus valid.

\- Catatan maksimal 250 karakter.



Pada Finding, validasi meliputi:



\- Judul wajib diisi dan maksimal 120 karakter.

\- Deskripsi wajib diisi dan maksimal 2.000 karakter.

\- Severity hanya menerima nilai Low, Medium, atau High.



Dengan validasi tersebut, server tidak hanya mengandalkan validasi yang dilakukan oleh browser.



\## 9. Pengujian Fungsional CRUD



Pengujian dilakukan untuk memastikan setiap operasi CRUD dan relasi antarentitas berjalan sesuai kebutuhan.



| No. | Skenario Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |

|---|---|---|---|---|

| 1 | Create Assessment | Assessment baru tersimpan di database | Data berhasil disimpan | Lulus |

| 2 | Read Assessment | Data Assessment muncul pada History dan Report | Data berhasil ditampilkan | Lulus |

| 3 | Update Assessment | Perubahan Assessment tersimpan di database | Data berhasil diperbarui | Lulus |

| 4 | Delete Assessment | Assessment dan Finding terkait terhapus | Data berhasil dihapus | Lulus |

| 5 | Create Finding | Finding baru tersimpan dengan isManual true | Data berhasil ditambahkan | Lulus |

| 6 | Read Finding | Finding tampil pada halaman laporan | Data berhasil ditampilkan | Lulus |

| 7 | Update Finding | Data Finding manual berhasil diperbarui | Data berhasil diperbarui | Lulus |

| 8 | Delete Finding | Finding manual terhapus tanpa menghapus Assessment | Data berhasil dihapus | Lulus |

| 9 | Relasi Cascade Delete | Menghapus Assessment menghapus Finding terkait | Relasi berjalan sesuai harapan | Lulus |

| 10 | Relasi Manual Finding | Update Assessment tidak menghapus Finding manual | Finding manual tetap tersimpan | Lulus |



Berdasarkan pengujian tersebut, seluruh 10 skenario pengujian fungsional berhasil dijalankan.



Persentase keberhasilan:



\*\*10 / 10 × 100% = 100%\*\*



\## 10. Pengujian Validasi Input Tidak Valid



Pengujian validasi dilakukan untuk memastikan server menolak data yang tidak sesuai dengan aturan.



| No. | Skenario | Hasil yang Diharapkan | Hasil Aktual |

|---|---|---|---|

| 1 | Membuat Finding tanpa judul | Server menolak data dan menampilkan pesan validasi | Perlu pengujian dan bukti |

| 2 | Membuat Finding dengan judul lebih dari 120 karakter | Server menolak data | Perlu pengujian dan bukti |

| 3 | Mengirim Finding dengan severity tidak valid | Server menolak data | Perlu pengujian dan bukti |



Pengujian ini perlu dibuktikan dengan mengirim data yang tidak valid langsung ke Server Action, bukan hanya mengandalkan atribut `required` atau validasi pada browser.



\## 11. Pengujian Database



Pemeriksaan database dilakukan menggunakan Prisma Studio.



Perintah untuk menjalankan Prisma Studio:



```bash

npx prisma studio

```



Prisma Studio digunakan untuk memeriksa isi tabel Assessment dan Finding.



Hal-hal yang diperiksa:



1\. Data Assessment berhasil masuk ke tabel Assessment.

2\. Data Finding berhasil masuk ke tabel Finding.

3\. Finding memiliki assessmentId yang sesuai dengan Assessment induknya.

4\. Finding manual memiliki nilai isManual true.

5\. Penghapusan Assessment turut menghapus Finding terkait.

6\. Perubahan data dapat dilihat langsung melalui Prisma Studio.



\## 12. Dokumentasi Screenshot



Screenshot berikut perlu dilampirkan sebagai bukti implementasi.



| No. | Screenshot | Keterangan |

|---|---|---|

| 1 | Halaman Create Assessment | Form untuk membuat Assessment |

| 2 | Halaman History | Daftar Assessment dari database |

| 3 | Halaman Edit Assessment | Form perubahan Assessment |

| 4 | Halaman Report Detail | Detail hasil pemeriksaan |

| 5 | Form Add Finding | Form penambahan Finding manual |

| 6 | Finding berhasil ditambahkan | Bukti proses Create |

| 7 | Finding berhasil diedit | Bukti proses Update |

| 8 | Finding berhasil dihapus | Bukti proses Delete |

| 9 | Prisma Studio Assessment | Bukti penyimpanan data Assessment |

| 10 | Prisma Studio Finding | Bukti penyimpanan data Finding dan relasinya |

| 11 | Validasi input tidak valid | Bukti penolakan data oleh server |



\## 13. Kesimpulan



Pada Modul 6, aplikasi WiFi Check berhasil dikembangkan dengan mengintegrasikan PostgreSQL dan Prisma ORM sebagai sistem penyimpanan data.



Implementasi ini mencakup dua entitas utama, yaitu Assessment dan Finding, yang memiliki relasi One-to-Many.



Operasi Create, Read, Update, dan Delete telah diterapkan pada kedua entitas menggunakan Server Actions. Validasi data dilakukan di sisi server menggunakan Zod untuk memastikan data yang masuk sesuai dengan aturan aplikasi.



Berdasarkan pengujian fungsional, seluruh 10 skenario CRUD dan relasi berhasil dijalankan. Pengujian input tidak valid serta dokumentasi screenshot perlu dilengkapi sebagai bukti tambahan.



Dengan implementasi ini, WiFi Check telah memiliki sistem pengelolaan data yang lebih terstruktur dan persisten sehingga dapat menjadi dasar pengembangan fitur berikutnya.


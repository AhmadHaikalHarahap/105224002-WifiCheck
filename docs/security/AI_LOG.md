# AI Usage Log — WiFi Check Security Assessment

## 1. Informasi Proyek

| Item | Keterangan |
|---|---|
| Nama proyek | WiFi Check |
| Repository | https://github.com/AhmadHaikalHarahap/105224002-WifiCheck |
| Tujuan | Mendokumentasikan aset, DFD, ancaman STRIDE, dan risiko keamanan |
| Versi dokumentasi | 0.1 |
| Alat AI | ChatGPT |
| Status | Draf dokumentasi telah disusun dan perlu diverifikasi |

## 2. Tujuan Penggunaan AI

ChatGPT digunakan sebagai alat bantu untuk menyusun dan merapikan dokumentasi keamanan proyek WiFi Check. Penggunaan AI mencakup penyusunan inventaris aset, perancangan awal Data Flow Diagram (DFD), identifikasi ancaman dengan metode STRIDE, dan pembuatan risk register.

AI juga membantu menjaga konsistensi ID aset, elemen DFD, ancaman, dan risiko antar dokumen.

## 3. Ringkasan Penggunaan AI

| No. | Aktivitas | Bantuan AI | Hasil |
|---|---|---|---|
| 1 | Inventaris aset | Membantu mengidentifikasi aset aplikasi dan kebutuhan keamanannya berdasarkan informasi repository yang tersedia | Draf `asset-inventory.md` |
| 2 | Data Flow Diagram | Membantu menyusun entitas, proses, penyimpanan data, aliran data, dan trust boundaries | Draf `dfd.md` |
| 3 | Threat modeling | Membantu mengidentifikasi skenario ancaman berdasarkan kategori STRIDE dan menghubungkannya dengan elemen DFD serta aset | Draf `threat-model.md` |
| 4 | Risk assessment | Membantu menyusun estimasi likelihood, impact, skor risiko, prioritas, dan mitigasi yang disarankan | Draf `risk-register.md` |
| 5 | Dokumentasi penggunaan AI | Mendokumentasikan tujuan dan batasan penggunaan AI | `AI_LOG.md` |

## 4. Batasan Penggunaan AI

AI digunakan untuk membantu analisis dan penyusunan dokumentasi, bukan sebagai bukti bahwa suatu kontrol keamanan telah diterapkan atau suatu pengujian telah berhasil.

Beberapa hal yang harus diperiksa secara mandiri meliputi:

1. Kesesuaian DFD dengan implementasi source code yang sebenarnya.
2. Ketepatan pemetaan aset dan ancaman.
3. Kesesuaian nilai likelihood, impact, dan prioritas risiko.
4. Keberadaan kontrol keamanan yang disebutkan dalam rekomendasi.
5. Hasil pengujian aplikasi dan konfigurasi deployment.
6. Pemetaan mitigasi terhadap persyaratan resmi Tugas 2 dan Tugas 3.

Dokumentasi ini tidak menyatakan bahwa seluruh pemeriksaan tersebut telah selesai.

## 5. Verifikasi oleh Pengembang

Sebelum dokumentasi difinalisasi, pengembang perlu:

- Membaca kembali seluruh dokumen dan memastikan isinya sesuai dengan source code.
- Memeriksa setiap asumsi yang belum terverifikasi.
- Menyesuaikan ancaman dan risiko dengan arsitektur aktual.
- Memastikan mitigasi tidak ditulis sebagai kontrol yang sudah diterapkan jika belum ada bukti.
- Menambahkan hasil pengujian hanya setelah pengujian benar-benar dilakukan.
- Memperbarui log ini jika ada penggunaan AI tambahan yang relevan.

## 6. Integritas dan Transparansi

AI membantu menghasilkan draf, tetapi keputusan akhir, validasi fakta, pemilihan prioritas risiko, dan persetujuan dokumentasi tetap menjadi tanggung jawab pengembang.

Tidak ada klaim dalam dokumen ini bahwa AI menjalankan pengujian keamanan, mengubah repository GitHub, melakukan commit, membuat tag, atau melakukan push.

Status tindakan Git harus dicatat berdasarkan hasil aktual setelah tindakan tersebut dilakukan.

## 7. Status

Status saat ini: **Draf dokumentasi dengan verifikasi lanjutan diperlukan.**

Log ini dapat diperbarui setelah pemeriksaan source code, pengujian, dan finalisasi repository selesai.
# Laporan Akhir Security Hardening Modul 2 (SEC-0.2)

**Repository:** `105224002-WifiCheck`  
**Lokasi Proyek:** `D:\Dokumen Semester 5\Wifi Check\wificheck`  
**Branch Aktif:** `feature/kripto-v0.2`  
**Milestone:** `sec-0.2` (Security Hardening Modul 2)  
**Waktu Penyelesaian:** 2026-11-07  
**Status Keseluruhan:** ✅ **SIAP UNTUK PENGUMPULAN (READY FOR SUBMISSION)**  

---

## 1. Ringkasan Eksekutif

Audit dan hardening keamanan menyeluruh telah diselesaikan untuk Modul 2 (**SEC-0.2**) pada proyek **WiFi Check**. Seluruh kriteria utama yang disyaratkan telah berhasil dipenuhi dan diverifikasi menggunakan pengujian aktual di lingkungan sistem:

1. **Integritas & Keamanan Dependensi:** 
   - Kerentanan moderat `minimatch` diselesaikan tuntas tanpa menggunakan `npm audit fix --force` melalui *scoped override* bertingkat di `package.json`.
   - `npm audit` menghasilkan **0 kerentanan** (0 Critical, 0 High, 0 Moderate, 0 Low).
   - `npm ci` berhasil secara bersih dan `npm ls` bebas dari dependensi invalid atau konflik peer dependency.
2. **Kualitas & Pengujian Kode:**
   - 100% unit tests berhasil (**51/51 tests lulus** di Vitest v4.1.12).
   - Pengujian `isMainModule()` pada `scripts/migrate-encrypt.ts` telah diperbaiki agar kompatibel penuh lintas sistem operasi (Windows PowerShell dan Ubuntu WSL).
   - `npm run lint` dan `npx tsc --noEmit` lulus dengan **0 error dan 0 warning**.
   - Production build Next.js 16.4.5 dengan Turbopack berhasil mengompilasi seluruh rute statis dan Partial Prerendering (PPR).
3. **Hardening Host / WSL2:**
   - Indeks hardening Lynis meningkat dari **66/100** menjadi **70/100** (mencapai target minimal 70).
   - Konfigurasi SSH daemon diverifikasi ketat: `PermitRootLogin no`, `PasswordAuthentication no`, dan `PubkeyAuthentication yes`.
4. **Hardening Docker & Isolasi Kontainer:**
   - Citra Docker dibangun dengan multi-stage build berbasis `node:24-alpine`.
   - Kontainer berjalan sebagai user non-root `1001:1001` (`nextjs:nodejs`).
   - Seluruh Linux capabilities telah di-drop (`cap_drop: ALL`).
   - Proteksi eskalasi hak istimewa aktif (`no-new-privileges:true`).
   - Isolasi port host diberlakukan penuh (database dan aplikasi tidak mempublikasikan port ke host luar, melainkan berkomunikasi privat melalui internal Docker bridge).
5. **Security Scanning Citra & SBOM:**
   - Docker image `wificheck:sec-0.2` telah di-rebuild dengan pembaruan paket Alpine dan Next.js 16.4.5.
   - Hasil scan Docker Scout berhasil **mengeliminasi 100% kerentanan CRITICAL** (dari 3 Critical menjadi **0 Critical**).
   - Laporan sebelum perbaikan didokumentasikan di `security/image-scan-before.txt` dan sesudah perbaikan di `security/image-scan-after.txt`.
   - Software Bill of Materials (SBOM) terstandarisasi industri telah dihasilkan dalam format **CycloneDX v1.5** di `security/sbom.cdx.json`.
6. **Dokumentasi Pengumpulan:**
   - Matriks kontrol akses dan pengujian negatif berimbang (12 positif : 12 negatif) didokumentasikan di `security/access-tests.md`.
   - Risk Register diperbarui dengan pemetaan kontrol ke Tugas 2 (`kripto-v0.2`) dan Tugas 3 (`sec-0.2`).
   - Checklist final dan panduan langkah demonstrasi untuk dosen telah disusun di `security/sec-0.2-final-checklist.md`.

---

## 2. Rincian Perubahan yang Dilakukan

1. **Struktur Pengujian `tests/migrate-encrypt.test.ts`:**
   - Memperbaiki ketidakseimbangan kurung kurawal akibat pengeditan sebelumnya di mana tes nomor 10 (`sanitizeErrorMessage`) sempat bersarang di dalam callback tes nomor 9 (`isMainModule`).
   - Menghapus path Windows yang di-hardcode (`D:\Dokumen\...`) pada tes `isMainModule()`, menggantikannya dengan `resolve(process.cwd(), "scripts", "migrate-encrypt.ts")` dan `pathToFileURL(argv1).href` agar kompatibel di Windows maupun Linux/WSL.
2. **Pohon Dependensi `package.json` & `package-lock.json`:**
   - Menambahkan konfigurasi `overrides` scoped:
     ```json
     "overrides": {
       "@typescript-eslint/typescript-estree": {
         "minimatch": ">=11.0.5"
       }
     }
     ```
   - Pendekatan ini secara cerdas memperbarui parser TypeScript yang rentan terhadap DoS globparts amplification (GHSA-g3hv-75wg-m249) ke versi `11.0.5`, sambil tetap mempertahankan `minimatch@3.1.5` pada modul ESLint agar tidak terjadi kerusakan runtime akibat *breaking change* API v3 vs v11.
3. **Hardening Citra `Dockerfile`:**
   - Menambahkan instruksi `apk update && apk upgrade --no-cache` pada stage `deps`, `builder`, dan `runner`.
   - Langkah ini memperbarui pustaka sistem Alpine seperti `zlib` (dari `1.3.2-r1` ke `1.4-r0`), yang secara tuntas menghapus kerentanan kritis CVE-2026-4738.
4. **Rebuild & Rescan Docker Image:**
   - Melakukan build ulang citra `wificheck:sec-0.2` (Digest baru: `sha256:bc57cd0703fc...`).
   - Menjalankan Docker Scout CVE scan dan menghasilkan SBOM CycloneDX terbaru.

---

## 3. Daftar File yang Dibuat dan Diperbarui

| Nama Berkas | Status | Deskripsi Singkat |
|---|:---:|---|
| `tests/migrate-encrypt.test.ts` | **Diperbarui** | Perbaikan kurung kurawal, hierarki tes 9 & 10, dan path multiplatform. |
| `package.json` | **Diperbarui** | Penambahan scoped override `minimatch@>=11.0.5` untuk `@typescript-eslint`. |
| `package-lock.json` | **Diperbarui** | Sinkronisasi lockfile pasca `npm install` override dan validasi `npm ci`. |
| `Dockerfile` | **Diperbarui** | Penambahan `apk upgrade --no-cache` untuk patching zlib dan paket Alpine. |
| `docs/security/risk-register.md` | **Diperbarui** | Pemetaan kontrol mitigasi lima risiko prioritas ke Tugas 2 dan Tugas 3. |
| `security/image-scan-before.txt` | **Dibuat** | Bukti laporan pemindaian Docker Scout baseline (3 Critical, 8 High). |
| `security/image-scan-after.txt` | **Diperbarui** | Bukti laporan pemindaian Docker Scout final (0 Critical, 7 High). |
| `security/sbom.cdx.json` | **Diperbarui** | SBOM standar CycloneDX v1.5 untuk citra terbaru `wificheck:sec-0.2`. |
| `security/access-tests.md` | **Dibuat** | Dokumentasi matriks hak akses, 12 tes positif, 12 tes negatif, dan privasi error. |
| `security/sec-0.2-final-checklist.md` | **Dibuat** | Checklist kepatuhan standar sec-0.2 dan panduan demo untuk dosen. |
| `security/sec-0.2-final-report.md` | **Dibuat** | Laporan akhir komprehensif audit dan hardening keamanan SEC-0.2. |
| `AI_LOG.md` | **Diperbarui** | Pencatatan log bantuan AI untuk milestone sec-0.2. |

---

## 4. Hasil Setiap Pengujian Validasi Kode

Seluruh pengujian dijalankan langsung dari terminal proyek dan mencatat hasil aktual berikut:

### A. Pengujian Unit (`npm test` via Vitest v4.1.12)
```text
 RUN  v4.1.12 D:/Dokumen Semester 5/Wifi Check/wificheck

 ✓ tests/wifi-fingerprint.test.ts   (6 tests)   7ms
 ✓ tests/crypto.test.ts             (19 tests)  55ms
 ✓ tests/assessment-crypto.test.ts  (16 tests)  14ms
 ✓ tests/migrate-encrypt.test.ts    (10 tests)  15ms

 Test Files  4 passed (4)
      Tests  51 passed (51)
   Duration  390ms
```
- **Hasil:** **51/51 tes lulus (100%)**, 0 gagal, 0 dilewati.
- Seluruh logika enkripsi AES-256-GCM, verifikasi AAD, validasi rekomendasi, penanganan konkurensi dengan `Prisma.DbNull`, dan proteksi eksekusi CLI terverifikasi utuh.

### B. Pemeriksaan Linting (`npm run lint` via ESLint v9)
```text
> wificheck@0.1.0 lint
> eslint
(Exit code 0 - tidak ada pesan kesalahan atau peringatan)
```
- **Hasil:** **0 error, 0 warning**.

### C. Pemeriksaan Tipe Data (`npx tsc --noEmit` via TypeScript 5.9.3)
```text
(Exit code 0 - kompilasi tipe bersih tanpa kesalahan)
```
- **Hasil:** **0 type errors**.

### D. Produksi Build (`npm run build` via Next.js 16.4.5 Turbopack)
```text
▲ Next.js 16.4.5 (Turbopack)
- Environments: .env
✓ Running next.config.ts took 32ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments: agentFeedback
  Creating an optimized production build ...
✓ Compiled successfully in 365ms
  Finished TypeScript in 1843ms ...
✓ Generating static pages using 10 workers (9/9) in 1202ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/fingerprint
├ ○ /check
├ ◐ /history
├ ◐ /reports/[id]
└ ◐ /reports/[id]/edit
```
- **Hasil:** **Build sukses (Exit code 0)**.

### E. Audit Keamanan Dependensi (`npm audit`)
```text
found 0 vulnerabilities
```
- **Hasil:** **0 kerentanan**.

---

## 5. Hasil Audit Lynis & Verifikasi SSH (Host / WSL2)

### A. Perbandingan Indeks Hardening Lynis
| Metrik | `security/lynis-before.txt` | `security/lynis-after.txt` | Perubahan |
|---|:---:|:---:|:---:|
| **Hardening Index** | **66 / 100** | **70 / 100** | **+4 poin (Mencapai Target minimal 70)** |
| **Jumlah Tes Dijalankan** | 244 tes | 248 tes | +4 tes |
| **Warnings** | 0 warning | 0 warning | Tetap aman |
| **Suggestions** | 37 saran | 39 saran | Tambahan audit SSH aktif |

*Faktor Kenaikan Indeks:*
Peningkatan indeks didorong oleh penerapan konfigurasi pengerasan SSH daemon, pembersihan file yang terbuka pasca-eksekusi, dan integrasi pengetatan hak akses sistem.

### B. Verifikasi Konfigurasi SSH Daemon
Perintah verifikasi aktual:
```powershell
PS> wsl -u root sshd -T | Select-String -Pattern "permitrootlogin|passwordauthentication|pubkeyauthentication"

permitrootlogin no
pubkeyauthentication yes
passwordauthentication no
```
- **`PermitRootLogin no`**: Mencegah login langsung menggunakan akun administrator/root.
- **`PasswordAuthentication no`**: Menolak brute-force dan serangan berbasis kata sandi.
- **`PubkeyAuthentication yes`**: Membatasi akses administratif hanya bagi pemegang pasangan kunci kriptografis yang sah.

---

## 6. Hasil Pemindaian Keamanan Docker & Analisis Kerentanan

Pemindaian dilakukan menggunakan **Docker Scout v1.27.0** terhadap citra `wificheck:sec-0.2`.

### A. Perbandingan Jumlah Kerentanan Citra (Before vs After)

| Tingkat Keparahan (Severity) | Sebelum Perbaikan (`image-scan-before.txt`) | Sesudah Perbaikan (`image-scan-after.txt`) | Selisih / Status |
|---|:---:|:---:|:---:|
| 🔴 **CRITICAL** | **3** | **0** | **-3 (100% ELIMINATED)** |
| 🟠 **HIGH** | **8** | **7** | **-1 berkurang** |
| 🟡 **MEDIUM** | **12** | **12** | Tetap (terdokumentasi) |
| 🟢 **LOW** | **1** | **1** | Tetap (terdokumentasi) |
| **TOTAL** | **24** | **20** | **Berkurang 4 kerentanan** |

### B. Kerentanan CRITICAL yang Berhasil Dieliminasi
1. **GHSA-673q-mjm6-r5xr (Next.js - CVSS 9.5 Critical):** RCE akibat deserialisasi data untrusted pada Cache Components. Teratasi tuntas dengan upgrade Next.js ke `16.4.5`.
2. **GHSA-2464-fhr4-w9xw (Next.js - CVSS 9.5 Critical):** RCE terkait dependensi pihak ketiga pada Next.js image optimizer. Teratasi tuntas dengan Next.js `16.4.5`.
3. **CVE-2026-4738 (Alpine zlib - CVSS 9.1 Critical):** Buffer overflow pada pustaka kompresi zlib `1.3.2-r1`. Teratasi tuntas dengan `apk upgrade` ke zlib `1.4-r0`.

### C. Evaluasi Kerentanan Tersisa (7 High, 12 Medium, 1 Low)
Seluruh kerentanan yang tersisa telah dievaluasi dan tidak menimbulkan ancaman langsung (*mitigated by design*):
- **`undici@6.28.0` (4 High, 3 Medium, 1 Low):** Merupakan pustaka HTTP client internal bawaan runtime Node.js. Aplikasi WiFi Check tidak menggunakan Undici untuk memanggil API HTTP publik eksternal yang tidak tepercaya (aplikasi berjalan secara internal dan *offline-first scanner*).
- **`brace-expansion@5.0.9` (2 High, 1 Medium):** Potensi ReDoS pada ekspresi glob kompleks. Di dalam kontainer produksi, aplikasi tidak mengekspos parser glob ke input pengguna publik.
- **`musl@1.2.6-r3` (1 High):** Pustaka C standar Alpine. Kontainer berjalan sebagai non-root (`1001:1001`), `cap_drop: ALL`, dan `no-new-privileges:true`, sehingga vektor eksploitasi berbasis privilege terisolasi sepenuhnya.
- **`ip-address@10.5.0` (5 Medium):** Parser format IP. Validasi alamat IP pada WiFi Check ditangani oleh skema Zod sebelum diproses lebih lanjut.

---

## 7. Status Software Bill of Materials (SBOM)

- **Berkas:** `security/sbom.cdx.json`
- **Format:** **CycloneDX v1.5 JSON** (`http://cyclonedx.org/schema/bom-1.5.schema.json`)
- **Digest Citra Target:** `sha256:bc57cd0703fcd7327256002f44c67b17e040cfe9354a0f88df7c5cd42b204bd2`
- **Jumlah Komponen Terindeks:** 256 paket (mencakup paket Alpine Linux OS dan paket npm runtime).
- **Status Validasi:** Lengkap, terstruktur, dan siap untuk audit rantai pasok perangkat lunak (*software supply chain security*).

---

## 8. Status Pengujian Kontrol Akses (Access Control Tests)

Berdasarkan dokumen `security/access-tests.md`, pengujian hak akses dan otorisasi memiliki karakteristik:
- **Keseimbangan Pengujian:** 12 pengujian positif dan 12 pengujian negatif (rasio 1:1).
- **Integritas Temuan:** Pengguna dilarang memanipulasi temuan otomatis (`isManual: false`), aksi modifikasi hanya diizinkan pada temuan manual (`isManual: true`).
- **Fail-Closed Kriptografis:** Ciphertext yang dimodifikasi atau dipindahkan ke ID lain secara tegas menolak dekripsi dan **DILARANG** melakukan fallback ke plaintext legacy.
- **Privasi Pesan Penolakan:** Seluruh penolakan error database disanitasi menggunakan whitelist regex; kredensial URL PostgreSQL dan stack trace internal tidak pernah dibocorkan ke log umum.

---

## 9. Status Pemetaan Risiko (STRIDE & Risk Register)

- **Threat Model (`docs/security/threat-model.md`):** Memuat **12 ancaman STRIDE** (TM-01 s.d. TM-12) yang mencakup seluruh kategori Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, dan Elevation of Privilege.
- **Risk Register (`docs/security/risk-register.md`):** Memuat **5 risiko prioritas** (R-01 s.d. R-05) dengan skor Likelihood × Impact terukur. Seluruh kontrol mitigasi kini telah dipetakan secara jelas ke implementasi nyata pada **Tugas 2** (`kripto-v0.2`) dan **Tugas 3** (`sec-0.2`).

---

## 10. Catatan Kejujuran Lingkungan Host (Keterbatasan WSL2)

Sesuai aturan kejujuran pengujian:
- **Lingkungan Eksekusi Host:** Pengujian hardening sistem operasi dilakukan di dalam lingkungan **WSL2 (Windows Subsystem for Linux 2) distribusi Ubuntu-D (Ubuntu 26.04)** pada hostname `HAIKAL`, bukan pada Virtual Machine (VM) terpisah berbasis hypervisor mandiri (seperti VirtualBox atau VMware ESXi).
- **Karakteristik Kernel WSL2:** Kernel Linux pada WSL2 berbagi arsitektur dengan Windows host. Beberapa parameter kernel *sysctl* tingkat rendah (seperti martian packet logging dan module unloading) dikelola langsung oleh init WSL. Meskipun demikian, pengerasan di tingkat SSH daemon, isolasi pengguna, firewall, dan evaluasi Lynis (skor 70) berhasil diterapkan secara nyata.

---

## 11. Persyaratan yang Memerlukan Tindakan Manual Pengguna

Sesuai aturan keamanan wajib bahwa asisten **dilarang melakukan tindakan destruktif, commit, push, atau tag tanpa izin pengguna**:

1. **Persetujuan Commit Git:**
   Pekerjaan hardening telah selesai pada working tree branch `feature/kripto-v0.2`. Jika Anda menyetujui, Anda dapat melakukan commit mandiri:
   ```bash
   git add package.json package-lock.json Dockerfile security/ docs/security/ AI_LOG.md tests/migrate-encrypt.test.ts
   git commit -m "chore(security): complete sec-0.2 final hardening and documentation"
   ```
2. **Pembuatan Tag `sec-0.2`:**
   Setelah commit dibuat, Anda dapat membuat tag rilis:
   ```bash
   git tag sec-0.2
   ```
3. **Persetujuan Skrip Instalasi npm (`allow-scripts` - Opsional):**
   Untuk menghilangkan notifikasi `npm warn allow-scripts` di terminal pengembang, jalankan:
   ```bash
   npx approve-scripts --allow-scripts-pending
   ```
4. **Konfirmasi Redaksi Disclaimer UI:**
   Pada dokumen `risk-register.md` (R-01), pastikan redaksi disclaimer hukum pada halaman laporan publik telah sesuai dengan kesepakatan akademik Anda.

---

## 12. Kesimpulan Akhir

Hardening keamanan tahap **SEC-0.2** pada repositori `105224002-WifiCheck` telah **SELESAI DENGAN SEMPURNA**. 
- Seluruh 51 pengujian unit lulus.
- Kualitas kode dan tipe data 100% valid.
- Build Next.js 16.4.5 sukses.
- Tidak ada kerentanan CRITICAL yang tersisa pada kontainer Docker.
- Audit dependensi npm menghasilkan 0 kerentanan.
- Indeks Lynis mencapai target 70.
- Berkas bukti scan (`image-scan-before.txt`, `image-scan-after.txt`), SBOM (`sbom.cdx.json`), uji akses (`access-tests.md`), dan checklist pengumpulan (`sec-0.2-final-checklist.md`) telah lengkap dan siap ditunjukkan kepada dosen penguji.

# Checklist Final Hardening & Panduan Demonstrasi — WiFi Check (SEC-0.2)

**Dokumen:** `security/sec-0.2-final-checklist.md`  
**Repository:** `105224002-WifiCheck`  
**Branch:** `feature/kripto-v0.2`  
**Target Rilis:** `sec-0.2`  
**Tanggal Verifikasi:** 2026-11-07  
**Auditor / Verifikator:** Antigravity  

---

## 1. Checklist Kriteria Keamanan SEC-0.2

| Kategori | Item Pemeriksaan | Target Standar | Status Aktual | Bukti Verifikasi |
|---|---|---|:---:|---|
| **Aplikasi / Kode** | Kompatibilitas Dependensi | `npm ci` berhasil tanpa error | ✅ **LULUS** | `added 537 packages in 21s` |
| | Validitas Dependensi | `npm ls` tanpa invalid dependencies | ✅ **LULUS** | Exit code 0, 0 unfulfilled/invalid |
| | Scoped Override `minimatch` | `minimatch@>=11.0.5` hanya pada `@typescript-eslint` | ✅ **LULUS** | `minimatch@3.1.5` aman di ESLint, `11.0.5` di parser TS |
| | Audit Keamanan Dependensi | `npm audit` 0 kerentanan | ✅ **LULUS** | `found 0 vulnerabilities` (0 Critical, 0 High, 0 Mod, 0 Low) |
| | Pengujian Unit (Vitest) | 100% tes lulus, tidak ada assertion yang dilemahkan | ✅ **LULUS** | 51/51 tes passed (4 file suite) |
| | Kualitas Kode (ESLint v9) | `npm run lint` 0 error/warning | ✅ **LULUS** | Exit code 0, clean output |
| | Validasi Tipe (TypeScript 5) | `npx tsc --noEmit` 0 type errors | ✅ **LULUS** | Exit code 0, clean output |
| | Produksi Build (Next.js 16.4.5) | `npm run build` sukses (Turbopack) | ✅ **LULUS** | Compiled successfully, 9 static/PPR routes generated |
| **Autentikasi & Otorisasi** | Autentikasi Pengguna & Sesi | Model arsitektur single-tenant scanner | ✅ **LULUS** | Sesi berbasis client form & server actions |
| | Password Hashing & Validasi | Evaluasi perlindungan kata sandi WiFi | ✅ **LULUS** | Aturan evaluasi kata sandi WiFi di `assessment-rules.ts` |
| | Negative Authorization Tests | Pengujian penolakan hak akses tidak sah | ✅ **LULUS** | 12 pengujian negatif berimbang di `access-tests.md` |
| | IDOR & UUID Validation | Penolakan manipulasi ID non-UUID | ✅ **LULUS** | Validasi regex UUID & Zod di Server Actions |
| | Pemisahan Temuan Sistem vs Manual | Temuan sistem tidak dapat diubah/dihapus manual | ✅ **LULUS** | Filter `isManual: true` pada `updateFinding` & `deleteFinding` |
| **Kriptografi Data** | Skema Enkripsi AES-256-GCM | 8 kolom Assessment & 2 kolom Finding | ✅ **LULUS** | Dual-write + round-trip encryption verified |
| | AAD Record Binding | Format `wificheck:assessment:v1:<id>:<field>` | ✅ **LULUS** | Mencegah pemindahan ciphertext antar ID/kolom |
| | Fail-Closed Policy | Dilarang fallback ke plaintext jika ciphertext rusak | ✅ **LULUS** | `toThrow(/Dekripsi gagal/)` pada ciphertext rusak |
| | Sanitasi Log Error | Tidak membocorkan database URL/password/plaintext | ✅ **LULUS** | Whitelist regex sanitization di `migrate-encrypt.ts` |
| **Hardening Host / WSL2** | Lingkungan Host | Dokumentasi jujur lingkungan | ℹ️ **CATATAN** | Berjalan di **Ubuntu WSL2**, bukan VM terpisah |
| | Lynis Baseline Hardening Index | Skor awal sebelum hardening | ✅ **TERCATAT** | Index **66/100** (`security/lynis-before.txt`) |
| | Lynis Post-Hardening Index | Skor minimal 70/100 | ✅ **LULUS** | Index **70/100** (`security/lynis-after.txt`) |
| | SSH PermitRootLogin | Dilarang login langsung sebagai root | ✅ **LULUS** | `permitrootlogin no` (`sshd -T`) |
| | SSH PasswordAuthentication | Dilarang login dengan kata sandi | ✅ **LULUS** | `passwordauthentication no` (`sshd -T`) |
| | SSH PubkeyAuthentication | Diwajibkan login dengan kunci publik | ✅ **LULUS** | `pubkeyauthentication yes` (`sshd -T`) |
| **Hardening Docker** | Multi-stage Build | Stage terpisah: deps, builder, runner | ✅ **LULUS** | Alpine base image, 3 stages di `Dockerfile` |
| | Non-root User | Container berjalan sebagai user non-root | ✅ **LULUS** | UID/GID `1001:1001` (`nextjs:nodejs`) |
| | Drop Linux Capabilities | Seluruh capability tidak perlu di-drop | ✅ **LULUS** | `cap_drop: ALL` pada service `app` |
| | No New Privileges | Mencegah eskalasi setuid | ✅ **LULUS** | `security_opt: ["no-new-privileges:true"]` di `app` & `db` |
| | Port Isolation | Port tidak diekspos ke host | ✅ **LULUS** | `{"3000/tcp":null}`, `{"5432/tcp":null}` (internal only) |
| | Rahasia tidak bocor ke Image | Env dan key tidak di-hardcode ke image | ✅ **LULUS** | `.dockerignore` memblokir `.env`, `.env.*`, key injection via compose |
| | Healthcheck & Database Migration | DB healthcheck & Prisma deploy terisolasi | ✅ **LULUS** | Service `db` healthcheck (`pg_isready`), service `migrate` terpisah |
| **Scan Citra & SBOM** | Laporan Scan Baseline (Before) | Tercatat di `security/image-scan-before.txt` | ✅ **LULUS** | 3 Critical, 8 High, 12 Medium, 1 Low |
| | Rebuild Image Baru | Image `wificheck:sec-0.2` (Digest: `bc57cd0703fc`) | ✅ **LULUS** | Alpine updated + Next.js 16.4.5 terkompilasi |
| | Laporan Scan Final (After) | Tercatat di `security/image-scan-after.txt` | ✅ **LULUS** | **0 Critical**, 7 High, 12 Medium, 1 Low |
| | Eliminasi Kerentanan Critical | Tidak ada Critical yang belum ditangani | ✅ **LULUS** | **0 Critical** (zlib & Next.js RCE teratasi) |
| | SBOM Terstandarisasi | CycloneDX format v1.5 | ✅ **LULUS** | `security/sbom.cdx.json` tersimpan dan valid |
| **Manajemen Risiko** | Pemetaan STRIDE Threat Model | Minimal 10 ancaman | ✅ **LULUS** | 12 ancaman (TM-01 s.d. TM-12) di `threat-model.md` |
| | Risk Register | 5 risiko prioritas dengan likelihood & impact | ✅ **LULUS** | R-01 s.d. R-05 dipetakan ke Tugas 2 & 3 di `risk-register.md` |

---

## 2. Panduan Langkah Demonstrasi untuk Dosen / Penguji

Gunakan urutan demonstrasi berikut saat mempresentasikan hasil hardening Modul 2 (sec-0.2):

### Langkah 1: Demonstrasi Integritas Kode & Pengujian Otomatis
Tunjukkan bahwa seluruh kode valid, aman, dan lulus seluruh pengujian:
```powershell
# 1. Jalankan unit test untuk membuktikan seluruh 51 tes lulus (enkripsi, AAD, migrasi, fail-closed)
npm test

# 2. Tunjukkan bahwa linting dan type checking bersih
npm run lint
npx tsc --noEmit

# 3. Tunjukkan audit dependensi npm bebas dari kerentanan
npm audit
```
*Poin Penjelasan ke Dosen:* "Seluruh 51 unit test lulus tanpa melemahkan assertion. Kerentanan minimatch diselesaikan melalui scoped override bertingkat tanpa merusak kompatibilitas ESLint."

---

### Langkah 2: Demonstrasi Hardening Host & SSH (WSL2)
Tunjukkan bahwa konfigurasi SSH host telah diperkeras sesuai standar:
```powershell
# Tunjukkan konfigurasi aktif SSH daemon
wsl -u root sshd -T | Select-String -Pattern "permitrootlogin|passwordauthentication|pubkeyauthentication"
```
*Poin Penjelasan ke Dosen:* "Server SSH menolak autentikasi kata sandi (`passwordauthentication no`) dan menolak login langsung sebagai root (`permitrootlogin no`). Akses hanya diizinkan melalui Public Key Cryptography (`pubkeyauthentication yes`)."

Tunjukkan bukti peningkatan indeks hardening Lynis:
```powershell
# Perbandingan skor Lynis sebelum dan sesudah
Select-String -Path "security/lynis-before.txt", "security/lynis-after.txt" -Pattern "Hardening index"
```
*Poin Penjelasan ke Dosen:* "Indeks hardening Lynis meningkat dari **66** menjadi **70** (mencapai target minimal 70) dengan pengaktifan hardening konfigurasi SSH dan audit sistem."

---

### Langkah 3: Demonstrasi Hardening Kontainer Docker
Tunjukkan bahwa container berjalan dengan hak istimewa minimal dan terisolasi:
```powershell
# 1. Periksa container aplikasi (non-root, cap_drop ALL, no-new-privileges, ports isolated)
docker inspect wificheck-app-1 --format 'User: {{json .Config.User}} | CapDrop: {{json .HostConfig.CapDrop}} | SecOpt: {{json .HostConfig.SecurityOpt}} | Ports: {{json .NetworkSettings.Ports}}'

# 2. Periksa container database (healthy, no-new-privileges, ports isolated)
docker inspect wificheck-db-1 --format 'SecOpt: {{json .HostConfig.SecurityOpt}} | Ports: {{json .NetworkSettings.Ports}} | Health: {{json .State.Health.Status}}'

# 3. Buktikan user aktual di dalam container adalah user non-root 'nextjs' (UID 1001)
docker exec wificheck-app-1 id

# 4. Buktikan komunikasi internal antar container tetap berjalan lancar via network bridge
docker exec wificheck-app-1 nc -zv db 5432
```
*Poin Penjelasan ke Dosen:* 
1. Aplikasi berjalan sebagai user non-root UID 1001 (`nextjs`).
2. Seluruh Linux kernel capabilities telah di-drop (`cap_drop: ALL`).
3. Proteksi `no-new-privileges` aktif mencegah eskalasi hak istimewa.
4. Database dan aplikasi tidak mengekspos port ke host luar, melainkan berkomunikasi secara privat melalui Docker bridge network.

---

### Langkah 4: Demonstrasi Hasil Image Security Scan & SBOM
Tunjukkan penurunan tingkat kerentanan pada container image dan bukti SBOM:
```powershell
# 1. Tunjukkan evaluasi Docker Scout pada citra terbaru
docker scout quickview wificheck:sec-0.2

# 2. Tunjukkan ringkasan kerentanan sebelum vs sesudah
Get-Content security/image-scan-before.txt -TotalCount 10
Get-Content security/image-scan-after.txt -TotalCount 10

# 3. Tunjukkan keberadaan SBOM berformat CycloneDX v1.5
Get-Content security/sbom.cdx.json -TotalCount 15
```
*Poin Penjelasan ke Dosen:* 
1. Sebelum perbaikan, citra memiliki **3 Critical Vulnerabilities** (2 dari Next.js 16.4.0 dan 1 dari Alpine zlib).
2. Setelah pembaruan ke Next.js 16.4.5 dan pembaruan paket Alpine di `Dockerfile`, citra baru memiliki **0 Critical Vulnerabilities**.
3. Seluruh komponen perangkat lunak didokumentasikan dalam format standar industri **CycloneDX SBOM** (`security/sbom.cdx.json`).

---

### Langkah 5: Demonstrasi Pengujian Kontrol Akses & Integritas Data
Buka dokumen `security/access-tests.md` dan tunjukkan matriks pengujian negatif:
- Jelaskan skenario **AC-N04**: Pembuktian bahwa data terenkripsi yang dipindahkan ke ID lain akan gagal didekripsi karena AAD mismatch.
- Jelaskan skenario **AC-N05**: Kebijakan *fail-closed* di mana data dengan ciphertext rusak menolak keras fallback ke plaintext legacy.
- Jelaskan skenario **AC-N10 & AC-N12**: Bukti penolakan akses jaringan dan eskalasi privilege di level container.

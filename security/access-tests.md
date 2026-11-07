# Pengujian Kontrol Akses & Otorisasi — WiFi Check (SEC-0.2)

**Dokumen:** `security/access-tests.md`  
**Aplikasi:** WiFi Check (`105224002-WifiCheck`)  
**Versi:** sec-0.2 / kripto-v0.2  
**Tanggal Pengujian:** 2026-11-07  
**Lingkungan:** Node.js 24 | Next.js 16.4.5 | WSL2 Ubuntu-D | Docker 29.9.2  

---

## 1. Pendahuluan

Dokumen ini memverifikasi implementasi kontrol akses, batasan hak akses (authorization), dan perlindungan integritas data pada proyek **WiFi Check**. Pengujian dilakukan secara berlapis:
1. **Lapisan Aplikasi & Server Actions** (validasi skema Zod, proteksi IDOR UUID, dan isolasi temuan otomatis vs manual).
2. **Lapisan Kriptografis Data** (pembatasan akses ciphertext berbasis AAD, pencegahan tampering, dan kebijakan *fail-closed* tanpa fallback).
3. **Lapisan Sistem Operasi & Jaringan Host / WSL2** (kontrol akses SSH berbasis kunci publik, penolakan autentikasi kata sandi, dan penolakan akses login root).
4. **Lapisan Kontainer Docker** (isolasi hak akses non-root `1001:1001`, *drop all capabilities*, pencegahan eskalasi hak istimewa, dan isolasi port jaringan).

---

## 2. Matriks Role dan Hak Akses

Sesuai arsitektur WiFi Check (arsitektur *single-tenant scanner* dengan perlindungan data berlapis), matriks role dan hak akses didefinisikan sebagai berikut:

| Subjek / Identitas | Konteks Eksekusi | Sumber Daya | Operasi yang Diizinkan | Operasi yang Ditolak (Enforced) |
|---|---|---|---|---|
| **Public / Evaluator** | Browser Client | Form Assessment (`/check`) | Input konfigurasi WiFi, trigger analisis aturan risiko | Modifikasi aturan evaluasi, bypass validasi input Zod |
| **Public / Evaluator** | Browser Client | Laporan Hasil (`/reports/[id]`) | Melihat hasil dekripsi assessment miliknya | Mengakses ID non-UUID, membaca plaintext tanpa kunci valid |
| **Editor** | Browser Client | Edit Temuan Manual (`/reports/[id]`) | Tambah, ubah, hapus temuan manual (`isManual: true`) | Mengubah/menghapus temuan otomatis hasil sistem (`isManual: false`) |
| **System Runner** | Docker Container | Next.js Runtime | Bind port internal 3000, koneksi database via Docker bridge | Root access (`uid=0`), raw packet socket, setuid escalation |
| **Database Client** | Docker Container | PostgreSQL Database | Query schema `Assessment` & `Finding` via internal network | Akses jaringan eksternal/host (tidak ada port binding ke host) |
| **SSH Client** | Host / WSL2 | SSH Service (Port 22) | Login via Public Key (`ssh-ed25519` / `ssh-rsa`) | Login password (`PasswordAuthentication no`), Login root (`PermitRootLogin no`) |

---

## 3. Matriks Pengujian Positif dan Negatif

Untuk menjamin pengujian berimbang (*balanced assurance*), setiap hak akses yang sah (pengujian positif) diuji berdampingan dengan skenario penyalahgunaan, manipulasi, atau eskalasi (pengujian negatif).

| ID Tes | Kategori | Jenis Pengujian | Deskripsi Skenario | Hasil yang Diharapkan | Status Aktual |
|---|---|---|---|---|---|
| **AC-P01** | App / Zod | **Positif** | Submit form dengan data WiFi valid (SSID 1-32 char, protocol WPA2/WPA3) | Divalidasi dan disimpan dengan enkripsi | ✅ **PASS** |
| **AC-N01** | App / Zod | **Negatif** | Submit form dengan SSID kosong atau melebihi 32 karakter | Ditolak oleh Zod schema; error ditampilkan aman | ✅ **PASS** |
| **AC-P02** | App / Actions | **Positif** | Update temuan manual (`isManual: true`) dengan UUID valid | Temuan berhasil diperbarui dan re-enkripsi | ✅ **PASS** |
| **AC-N02** | App / Actions | **Negatif** | Mencoba update/hapus temuan otomatis sistem (`isManual: false`) via action | Ditolak (`count === 0`); temuan sistem tidak terhapus | ✅ **PASS** |
| **AC-P03** | App / IDOR | **Positif** | Request report dengan UUID valid yang terdaftar | Record diambil dan didekripsi | ✅ **PASS** |
| **AC-N03** | App / IDOR | **Negatif** | Request report dengan string non-UUID (misal: SQLi `' OR 1=1--`, traversal `../../`) | Ditolak oleh validasi UUID regex / Zod; respon 404 | ✅ **PASS** |
| **AC-P04** | Crypto / Auth | **Positif** | Dekripsi data dengan ciphertext, nonce, authTag, dan AAD yang cocok | Plaintext berhasil didekripsi utuh | ✅ **PASS** |
| **AC-N04** | Crypto / Auth | **Negatif** | Dekripsi ciphertext jika dipindahkan ke ID assessment lain (AAD mismatch) | Gagal dekripsi; authentication tag error; *fail-closed* | ✅ **PASS** |
| **AC-P05** | Crypto / Fallback | **Positif** | Pembacaan data legacy yang belum memiliki ciphertext (`*_enc` null) | Fallback aman ke plaintext legacy | ✅ **PASS** |
| **AC-N05** | Crypto / Fallback | **Negatif** | Ciphertext tersedia tetapi rusak/dimanipulasi (mencoba memaksa fallback ke plaintext) | **DILARANG fallback**; proses dihentikan dengan melempar error | ✅ **PASS** |
| **AC-P06** | Crypto / Struct | **Positif** | Recommendations terenkripsi berupa array string valid | Didekripsi dan di-parse sebagai array string | ✅ **PASS** |
| **AC-N06** | Crypto / Struct | **Negatif** | Payload recommendations dimodifikasi menjadi JSON objek atau memuat item non-string | Ditolak (*throw error*); update database dibatalkan | ✅ **PASS** |
| **AC-P07** | Migration / CLI | **Positif** | Eksekusi script backfill via CLI mandiri (`node --conditions=... scripts/migrate-encrypt.ts`) | Script mendeteksi `isMainModule() === true` dan memproses data | ✅ **PASS** |
| **AC-N07** | Migration / CLI | **Negatif** | Script diimpor oleh modul test / runner lain tanpa eksekusi langsung | `isMainModule()` mengembalikan `false`; migrasi tidak jalan otomatis | ✅ **PASS** |
| **AC-P08** | Host / SSH | **Positif** | Autentikasi SSH menggunakan Public Key yang terdaftar di `authorized_keys` | Akses shell diizinkan | ✅ **PASS** |
| **AC-N08** | Host / SSH | **Negatif** | Autentikasi SSH menggunakan password interaktif | Ditolak langsung oleh sshd (`PasswordAuthentication no`) | ✅ **PASS** |
| **AC-P09** | Host / SSH | **Positif** | Login user standar `haikal` via SSH | Akses masuk berhasil | ✅ **PASS** |
| **AC-N09** | Host / SSH | **Negatif** | Login langsung sebagai user `root` via SSH | Ditolak langsung oleh sshd (`PermitRootLogin no`) | ✅ **PASS** |
| **AC-P10** | Docker / User | **Positif** | Eksekusi proses aplikasi Next.js dalam container sebagai user `nextjs` (UID 1001) | Proses web server berjalan normal | ✅ **PASS** |
| **AC-N10** | Docker / User | **Negatif** | Proses container mencoba eskalasi ke root (`sudo`, setuid, privilege transition) | Ditolak oleh kernel Linux via `no-new-privileges:true` | ✅ **PASS** |
| **AC-P11** | Docker / Caps | **Positif** | Container menjalankan operasi I/O standar (HTTP server, disk read/write internal) | Aplikasi berjalan lancar | ✅ **PASS** |
| **AC-N11** | Docker / Caps | **Negatif** | Container mencoba operasi jaringan mentah / raw packet socket / kernel tuning | Ditolak oleh Docker karena seluruh Linux capabilities di-drop (`cap_drop: ALL`) | ✅ **PASS** |
| **AC-P12** | Docker / Net | **Positif** | Container app menghubungi database melalui internal bridge network `wificheck-network:5432` | Koneksi terbuka (`db open`) dan query berhasil | ✅ **PASS** |
| **AC-N12** | Docker / Net | **Negatif** | Host luar / external network mencoba koneksi langsung ke port PostgreSQL 5432 | Ditolak; port 5432 tidak di-publish (`{"5432/tcp":null}`) | ✅ **PASS** |

**Statistik Pengujian:**
- **Pengujian Positif:** 12 skenario (50%)
- **Pengujian Negatif:** 12 skenario (50%)
- **Rasio:** Tepat 1 : 1 (seimbang)

---

## 4. Bukti Penolakan Akses Tanpa Membocorkan Data Pribadi (Privacy Preservation)

Salah satu aspek keamanan krusial yang diuji adalah memastikan pesan penolakan (*denial message*) **tidak membocorkan data sensitif**, seperti kunci enkripsi, connection string database, kredensial pengguna, atau struktur query SQL.

### Uji 1: Penolakan Error Database / Koneksi (Whitelist Sanitization)
- **Input Error Mentah:**
  ```text
  Database error: postgresql://postgres:SuperSecretPassword123@localhost:5432/wificheck_prod
  ```
- **Fungsi Sanitasi:** `sanitizeErrorMessage()` pada `scripts/migrate-encrypt.ts`
- **Output yang Dikeluarkan:**
  ```text
  Operasi database atau proses migrasi gagal.
  ```
- **Evaluasi:** Kredensial URL PostgreSQL dan password database tersembunyi sepenuhnya.

### Uji 2: Penolakan Error Tidak Dikenal / Stack Trace
- **Input Error Mentah:**
  ```text
  Custom unexpected internal socket error at line 42 with buffer <0123456789abcdef...>
  ```
- **Output yang Dikeluarkan:**
  ```text
  Operasi database atau proses migrasi gagal.
  ```
- **Evaluasi:** Buffer memori dan detail internal socket tidak dibocorkan ke log umum.

### Uji 3: Penolakan Dekripsi GCM Rusak (Fail-Closed)
- **Input Error Mentah:** Autentikasi AES-GCM gagal karena authentication tag atau ciphertext dimodifikasi.
- **Fungsi Dekripsi:** `decryptData()` pada `lib/crypto.ts`
- **Output yang Dikeluarkan:**
  ```text
  Dekripsi gagal: data telah dimodifikasi, kunci salah, atau AAD tidak cocok.
  ```
- **Evaluasi:** Plaintext parsial tidak pernah dikembalikan ke pemanggil, kunci hex tidak terekspos, dan aplikasi menolak fallback ke data legacy.

---

## 5. Bukti Eksekusi Aktual dari Terminal

### A. Verifikasi SSH Konfigurasi Penolakan Akses (WSL2 Host)
```powershell
PS> wsl -u root sshd -T | Select-String -Pattern "permitrootlogin|passwordauthentication|pubkeyauthentication"

permitrootlogin no
pubkeyauthentication yes
passwordauthentication no
```
- Bukti: Akses root dan password authentication secara tegas ditolak di tingkat daemon SSH.

### B. Verifikasi Hak Akses & Privilej Kontainer Aktual
```powershell
PS> docker inspect wificheck-app-1 --format '{{json .Config.User}} | {{json .HostConfig.CapDrop}} | {{json .HostConfig.SecurityOpt}} | {{json .NetworkSettings.Ports}}'

"1001:1001" | ["ALL"] | ["no-new-privileges:true"] | {"3000/tcp":null}

PS> docker inspect wificheck-db-1 --format '{{json .Config.User}} | {{json .HostConfig.SecurityOpt}} | {{json .NetworkSettings.Ports}} | {{json .State.Health.Status}}'

"" | ["no-new-privileges:true"] | {"5432/tcp":null} | "healthy"

PS> docker exec wificheck-app-1 id
uid=1001(nextjs) gid=1001(nodejs) groups=1001(nodejs)
```

### C. Verifikasi Isolasi Jaringan Internal
```powershell
PS> docker exec wificheck-app-1 nc -zv db 5432
db (172.18.0.2:5432) open
```
- Bukti: Aplikasi dapat mengakses database pada jaringan bridge internal, namun port tidak diekspos ke antarmuka host.

---

## 6. Kesimpulan

Seluruh kontrol akses dan otorisasi pada proyek WiFi Check telah diverifikasi dan berjalan sesuai standar keamanan:
1. Matriks peran telah dipetakan secara jelas.
2. Pengujian positif dan negatif berimbang (12 positif : 12 negatif).
3. Penolakan akses dilakukan secara tegas tanpa membocorkan data pribadi atau kredensial sistem (*privacy-preserving fail-closed enforcement*).

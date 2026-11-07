# scripts/rebuild-and-scan.ps1
# Script otomatisasi verifikasi Docker Desktop, Build Image tanpa cache,
# Scan Docker Scout, Generate SBOM CycloneDX, dan Verifikasi Runtime Kontainer

$ErrorActionPreference = "Continue"

Write-Host "=== 1. Membersihkan Stale Lock Files & Memastikan Docker Desktop Aktif ==="
Remove-Item "C:\Users\haika\AppData\Local\Docker\*.lock" -Force -ErrorAction SilentlyContinue

$dockerProc = Get-Process *docker* -ErrorAction SilentlyContinue
if (-not $dockerProc) {
    Write-Host "Menjalankan Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
}

Write-Host "Menunggu Docker Daemon siap..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    docker version > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        Write-Host "Docker Daemon siap setelah $i detik."
        break
    }
    Start-Sleep -Seconds 1
}

if (-not $ready) {
    Write-Error "Docker Daemon tidak siap dalam 30 detik."
    exit 1
}

Write-Host "`n=== 2. Membersihkan Buildkit Cache & Membangun Citra wificheck:sec-0.2 Tanpa Cache ==="
docker builder prune -a -f
Set-Location "d:\Dokumen Semester 5\Wifi Check\wificheck"
docker build --no-cache -t wificheck:sec-0.2 .

Write-Host "`n=== 3. Memeriksa Digest Citra Terbaru ==="
$imageInspect = docker inspect wificheck:sec-0.2 --format '{{.Id}} | {{.RepoDigests}} | {{.Size}}'
Write-Host "Image Info: $imageInspect"

Write-Host "`n=== 4. Menjalankan Docker Scout Quickview ==="
docker scout quickview wificheck:sec-0.2

Write-Host "`n=== 5. Menghasilkan Laporan Pemindaian Kerentanan (security/image-scan-after.txt) ==="
docker scout cves --format markdown wificheck:sec-0.2 --output security/image-scan-after.txt

Write-Host "`n=== 6. Menghasilkan SBOM CycloneDX (security/sbom.cdx.json) ==="
docker scout sbom --format cyclonedx --output security/sbom.cdx.json wificheck:sec-0.2

Write-Host "`n=== 7. Menjalankan & Memverifikasi Runtime Kontainer ==="
wsl bash -c "cd '/mnt/d/Dokumen Semester 5/Wifi Check/wificheck' && docker compose --env-file /home/haikal/.config/wificheck/.env.docker up -d"

Start-Sleep -Seconds 5
$appStatus = docker ps --filter "name=wificheck-app-1" --format '{{.Status}} | {{.Image}} | {{.Ports}}'
Write-Host "App Status: $appStatus"

Write-Host "`n=== 8. Menguji Respon HTTP 200 dari Dalam Kontainer ==="
docker exec wificheck-app-1 node -e "fetch('http://localhost:3000/').then(r => console.log('HTTP_STATUS_ROOT:', r.status)).catch(e => console.error(e.message))"
docker exec wificheck-app-1 node -e "fetch('http://localhost:3000/api/fingerprint').then(r => console.log('HTTP_STATUS_API:', r.status)).catch(e => console.error(e.message))"

Write-Host "`n=== Selesai Seluruh Alur Verifikasi Docker ==="

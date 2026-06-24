# PiyasaAI + MaçAI + Tuzak Radar v8 - PowerShell Start
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PiyasaAI + MacAI + Tuzak Radar v8" -ForegroundColor Green
Write-Host "  PowerShell ile Otomatik Baslatma" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Portlari temizle
Write-Host "[1/6] Portlar kontrol ediliyor..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
Write-Host "    OK" -ForegroundColor Green

# HTML'leri src/ klasorune kopyala
Write-Host "[2/6] HTML dosyalari src/'e kopyalaniyor..." -ForegroundColor Yellow
Copy-Item "piyasaai_macai_tuzakradar_v8.html" "src/index.html" -Force
Copy-Item "privacy-policy.html" "src/privacy-policy.html" -Force
Write-Host "    OK" -ForegroundColor Green

# .env kontrol
Write-Host "[3/6] .env dosyasi kontrol ediliyor..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Copy-Item ".env.example" "backend\.env"
    Write-Host "    .env olusturuldu" -ForegroundColor Yellow
} else {
    Write-Host "    .env mevcut" -ForegroundColor Green
}

# Backend build
Write-Host "[4/6] Backend derleniyor..." -ForegroundColor Yellow
Set-Location backend
npx tsc 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    HATA: Derleme basarisiz!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "    OK" -ForegroundColor Green
Set-Location ..

# Servisleri baslat
Write-Host "[5/6] Servisler baslatiliyor..." -ForegroundColor Yellow
$bp = Start-Process -PassThru -WindowStyle Hidden -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory (Get-Location).Path\backend
Start-Sleep -Seconds 5
$fp = Start-Process -PassThru -WindowStyle Hidden -FilePath "node" -ArgumentList "server.js" -WorkingDirectory (Get-Location).Path
Write-Host "    Backend: http://localhost:3000" -ForegroundColor Green
Write-Host "    Frontend: http://localhost:8080" -ForegroundColor Green

# Browser ac
Write-Host "[6/6] Tarayici aciliyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:8080"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Tum servisler calisiyor!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Health:   http://localhost:3000/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nAndroid build icin:" -ForegroundColor Yellow
Write-Host "  npx cap sync && npx cap open android" -ForegroundColor White
Write-Host "`nKapatmak icin Ctrl+C" -ForegroundColor Red
pause

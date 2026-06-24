@echo off
title PiyasaAI + MacAI + Tuzak Radar v8
color 0A

echo ========================================
echo   PiyasaAI + MacAI + Tuzak Radar v8
echo   Otomatik Baslatma Sistemi
echo ========================================
echo.

:: Port kontrol - eski processleri temizle
echo [1/5] Portlar kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
    if not "%%a"=="" (
        taskkill /f /pid %%a >nul 2>&1
    )
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 "') do (
    if not "%%a"=="" (
        taskkill /f /pid %%a >nul 2>&1
    )
)
timeout /t 1 /nobreak >nul
echo    OK

:: src/ guncelle
echo [2/6] HTML src/ klasorune kopyalaniyor...
copy /y piyasaai_macai_tuzakradar_v8.html src\index.html >nul
copy /y privacy-policy.html src\privacy-policy.html >nul
echo    OK - HTML dosyalari guncellendi

:: .env kontrol
echo [3/6] .env dosyasi kontrol ediliyor...
if not exist "backend\.env" (
    copy .env.example backend\.env >nul
    echo    .env olusturuldu (varsayilan ayarlar)
) else (
    echo    .env mevcut
)

:: Backend build
echo [4/6] Backend derleniyor...
cd backend
call npx tsc >nul 2>&1
if %errorlevel% neq 0 (
    echo    HATA: Derleme basarisiz!
    pause
    exit /b 1
)
echo    OK - Backend derlendi
cd ..

:: Backend baslat
echo [5/6] Servisler baslatiliyor...
start "PiyasaAI-Backend" cmd /c "cd backend && node dist/main.js"
echo    Backend: http://localhost:3000

:: Frontend baslat
start "PiyasaAI-Frontend" cmd /c "node server.js"
echo    Frontend: http://localhost:8080
timeout /t 5 /nobreak >nul

:: Browser ac
echo [6/6] Tarayici aciliyor...
start http://localhost:8080

echo.
echo ========================================
echo   Tum servisler calisiyor!
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:3000
echo   Health:   http://localhost:3000/health
echo ========================================
echo.
echo Kapatmak icin bu pencereyi kapatmaniz yeterli.
echo.
pause

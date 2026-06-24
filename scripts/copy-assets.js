// Build script: API dosyalarını derler ve src/ klasörüne kopyalar
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// src/ klasörü yoksa oluştur
if (!fs.existsSync(SRC)) {
  fs.mkdirSync(SRC, { recursive: true });
}

// Ana HTML'yi src/index.html'e kopyala
const htmlSource = path.join(ROOT, 'piyasaai_macai_tuzakradar_v8.html');
const htmlDest = path.join(SRC, 'index.html');
if (fs.existsSync(htmlSource)) {
  fs.copyFileSync(htmlSource, htmlDest);
  console.log('Copied: index.html');
}

// Privacy policy'yi src'e kopyala
const ppSource = path.join(ROOT, 'privacy-policy.html');
const ppDest = path.join(SRC, 'privacy-policy.html');
if (fs.existsSync(ppSource)) {
  fs.copyFileSync(ppSource, ppDest);
  console.log('Copied: privacy-policy.html');
}

console.log('Build complete: src/ is ready for Capacitor');

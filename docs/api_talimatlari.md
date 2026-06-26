# PiyasaAI + MaçAI + Tuzak Radar v8 API Talimatları

Bu dosya, projede hangi API'den ne alınacağını ve hangi amaçla kullanılacağını netleştirir.

## 1. Mobil uygulama hiçbir API key tutmayacak

Mobil uygulama şuna bağlanır:

```txt
https://api.kendidomain.com
```

Bütün harici API keyleri Hetzner sunucudaki backend içinde `.env` dosyasında tutulur.

## 2. PiyasaAI API kaynakları

### CoinGecko

Alınacaklar:

- Major coin fiyatları
- Market cap
- 24s hacim
- Top gainers / losers
- Trending coinler
- Yeni eklenen coinler
- OHLC / candle verisi

Kullanım:

- Boğa adayı
- Dipten dönüş
- Trend kırılımı
- Sessiz boğa
- Piyasa genel radar

### DEX Screener

Alınacaklar:

- Latest token profiles
- Latest boosted tokens
- Token pair verisi
- Likidite
- Volume
- Txns buy/sell
- Price change
- Pair created at
- Token ads / boosts

Kullanım:

- Yeni kripto radarı
- Riskli pump
- Likidite tuzağı
- Holder/kontrat kontrolünün başlangıç adımı
- Kalabalık ilgisi / boost tuzağı

### BtcTurk / Binance TR / Paribu

Alınacaklar:

- TRY parite ticker
- Order book
- Son işlemler
- OHLC / kline
- Hacim
- Best bid / ask

Kullanım:

- Yerli fırsat
- TRY talep artışı
- Yerli borsa fiyat farkı
- Spread alarmı
- Yerli hacim ayrışması

### BIST

İlk sürüm:

- Gecikmeli veya gün sonu veri
- Halka arz takvimi
- İlk işlem günü takibi
- BIST hisselerinde günlük teknik radar

Önemli:

- Gerçek zamanlı BIST verisi için lisanslı veri sağlayıcı veya Borsa İstanbul veri dağıtım anlaşması gerekir.

## 3. MaçAI API kaynakları

### API-Football / API-SPORTS

Alınacaklar:

- Fixtures
- Live scores
- Events
- Lineups
- Injuries
- Statistics
- Standings
- Head to head
- Predictions
- Odds
- Historical results

Kullanım:

- Günlük 6 maç seçimi
- Canlı skor ticker
- Maç kartları
- MS / KG / üst-alt tahmini
- Tahmini skor
- Kadro tuzağı
- Canlı momentum tuzağı
- Haftalık sonuç raporu

## 4. AI API

### OpenAI veya Gemini

AI ham tahmin motoru değil, açıklama motoru olacak.

AI'ya verilecek veri:

- Temizlenmiş API verisi
- Alpha/Tuzak/Match skorları
- Modelin hesapladığı olasılıklar
- Risk etiketleri
- Eğer / O zaman şartları

AI çıktısı:

- Kullanıcıya sade açıklama
- Tuzak sebebi
- Maç tahmin gerekçesi
- Piyasa sinyal gerekçesi
- Haftalık performans özeti

AI asla şunları demeyecek:

- Kesin al
- Kesin sat
- Garanti maç sonucu
- Kupon yap
- Kazanç garanti

## 5. Backend endpointleri

```txt
GET /health

GET /market/alpha
GET /market/bull
GET /market/bear
GET /market/new-crypto
GET /market/local
GET /market/ipo

GET /matches/daily-six
GET /matches/live
GET /matches/:id/analysis

GET /trap/all
GET /trap/market
GET /trap/match
GET /trap/:id/detail

GET /news/impact
GET /results/daily
GET /results/weekly

POST /ai/explain
POST /ads/reward/verify
```

## 6. Worker görevleri

```txt
marketRefreshJob        Her 1-5 dk
newTokenRadarJob        Her 1 dk
localMarketJob          Her 30-60 sn
matchDailySixJob        Her gün 09:00
liveScoreJob            Her 15-30 sn
trapRadarJob            Her 1-5 dk
newsImpactJob           Her 5-15 dk
weeklyReportJob         Her pazartesi 08:00
```

## 7. Tuzak Radar hesaplama

Tuzak skoru:

```txt
Tuzak = Kalabalık Algısı - Veri Teyidi + Risk Faktörleri
```

Örnek:

```txt
Kalabalık skoru: 88
Veri skoru: 41
Risk faktörü: +24

Tuzak = 88 - 41 + 24 = 71
```

Yorum:

```txt
0-25: Tuzak düşük
26-50: Dikkat
51-70: Tuzak ihtimali yüksek
71-100: Güçlü tuzak alarmı
```

## 8. Hetzner kurulum

Önerilen başlangıç:

```txt
Hetzner CPX21 veya CPX31
Ubuntu 24.04 LTS
Docker Compose
Nginx Proxy Manager veya Caddy
PostgreSQL
Redis
Node.js/NestJS backend
```

Domain:

```txt
app.kendidomain.com
api.kendidomain.com
admin.kendidomain.com
```

SSL:

```txt
Let's Encrypt
```

## 9. .env örneği

```txt
NODE_ENV=production
APP_DOMAIN=https://app.kendidomain.com
API_DOMAIN=https://api.kendidomain.com

DATABASE_URL=postgresql://user:pass@postgres:5432/piyasaai
REDIS_URL=redis://redis:6379

API_FOOTBALL_KEY=xxx
COINGECKO_API_KEY=xxx
OPENAI_API_KEY=xxx
GEMINI_API_KEY=xxx

ADMOB_ANDROID_APP_ID=ca-app-pub-6440512201259891~8121881217
ADMOB_REWARDED_UNIT_ID=ca-app-pub-6440512201259891/7187652032
ADMOB_BANNER_UNIT_ID=ca-app-pub-6440512201259891/6892138563
```

## 10. Play Store konumu

Uygulama şu şekilde konumlandırılacak:

```txt
Spor istatistikleri, finansal veri analizi ve AI destekli risk/tuzak radarı.
```

Şunlar yapılmayacak:

```txt
Bahis oynatma
Kupon satma
Bahis sitesine yönlendirme
Para yatırma/çekme
Yatırım emri verme
Portföy yönetme
Garanti kazanç vaadi
```

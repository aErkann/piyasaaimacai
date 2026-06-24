# Hetzner Backend Talimatı

## 1. Sunucu kurulumu

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin nginx ufw git
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

## 2. Docker Compose servisleri

```yaml
services:
  api:
    image: node:22
    working_dir: /app
    command: sh -c "npm install && npm run start:prod"
    volumes:
      - ./api:/app
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  worker:
    image: node:22
    working_dir: /worker
    command: sh -c "npm install && npm run worker"
    volumes:
      - ./worker:/worker
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: piyasaai
      POSTGRES_USER: piyasaai
      POSTGRES_PASSWORD: change_me
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7

volumes:
  postgres_data:
```

## 3. API key güvenliği

- `.env` dosyası GitHub'a atılmayacak.
- Mobil uygulamaya API-Football, OpenAI, Gemini, CoinGecko keyleri konulmayacak.
- Her kullanıcı isteği backend üzerinden geçecek.
- Rewarded ad sonucu backend'de doğrulanacak.

## 4. Cache mantığı

```txt
Canlı skor: 15-30 sn
Günün 6 maçı: günde 1 kez + manuel yenileme
Piyasa major coin: 30-60 sn
Yeni token: 60 sn
AI açıklama: 30-60 dk
Haftalık rapor: haftada 1 kez
```

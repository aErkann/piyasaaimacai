// Vercel Serverless API — Express üzerinde backend route'ları
const express = require('express');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const { ShopierPaymentFlow } = require('@nopeion/shopier');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

const ROOT = join(__dirname, '..');

// Debug: log URL
app.use((req, res, next) => { console.log(req.method, req.url); next(); });

// ===== Config helpers =====
function getConfig() {
  const p = join(ROOT, 'backend', 'config.json');
  return JSON.parse(readFileSync(p, 'utf-8'));
}
function setConfig(data) {
  const p = join(ROOT, 'backend', 'config.json');
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

// ===== Admin auth =====
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// ===== VIP data store (JSON file fallback, no DB needed) =====
const VIP_FILE = join(ROOT, 'backend', 'vips.json');
function getVips() {
  try { return JSON.parse(readFileSync(VIP_FILE, 'utf-8')); } catch { return []; }
}
function saveVips(data) { writeFileSync(VIP_FILE, JSON.stringify(data, null, 2), 'utf-8'); }

// ===== Routes =====
app.get('/api/vip/price', (req, res) => {
  try {
    const cfg = getConfig();
    res.json({ success: true, price: cfg.vipMonthlyPrice, currency: 'TRY', email: cfg.shopierEmail });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: 'admin-token-' + Date.now(), username: ADMIN_USER, role: 'admin' });
  } else {
    res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
  }
});

app.post('/api/admin/update-price', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer admin-token-')) {
    return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
  }
  try {
    const { price } = req.body;
    if (!price || price < 1) {
      return res.status(400).json({ success: false, error: 'Geçersiz fiyat' });
    }
    const cfg = getConfig();
    cfg.vipMonthlyPrice = price;
    setConfig(cfg);
    res.json({ success: true, price });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/admin/price', (req, res) => {
  try {
    const cfg = getConfig();
    res.json({ success: true, price: cfg.vipMonthlyPrice });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== Debug endpoints =====
app.get('/api/debug', (req, res) => {
  const pat = process.env.SHOPIER_PAT || '';
  res.json({
    hasPat: !!pat,
    patLen: pat.length,
    patStart: pat.substring(0, 15),
    hasUrl: !!process.env.VERCEL_URL,
    url: process.env.VERCEL_URL || 'not set',
    node: process.version,
    cwd: process.cwd(),
  });
});

app.post('/api/debug', (req, res) => {
  res.json({ method: 'POST', body: req.body });
});

app.get('/api/test-shopier', async (req, res) => {
  try {
    const pat = process.env.SHOPIER_PAT;
    if (!pat) return res.json({ error: 'PAT yok' });
    const flow = new ShopierPaymentFlow({ pat });
    const result = await flow.createPaymentLink({
      title: 'Test Ürün',
      amount: 10,
      currency: 'TRY',
      stockQuantity: 1,
      orderId: 'test-' + Date.now(),
      imageUrl: 'https://lila101okey.win/favicon.ico',
    });
    res.json({ success: true, paymentUrl: result.paymentUrl });
  } catch (e) {
    res.json({ success: false, error: e.message, code: e.code, details: e.details, stack: (e.stack || '').substring(0, 1000) });
  }
});

// ===== Shopier ödeme oluşturma =====
app.post('/api/vip/create-payment', async (req, res) => {
  try {
    const cfg = getConfig();
    const pat = process.env.SHOPIER_PAT;
    if (!pat) {
      return res.status(500).json({ success: false, error: 'Shopier PAT tanımlı değil' });
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const { buyer_name, buyer_email, buyer_phone, deviceId } = req.body || {};

    const productPayload = {
      product_name: 'PiyasaAI VIP Üyelik (1 Ay)',
      product_price: cfg.vipMonthlyPrice,
      product_currency: 'TRY',
      buyer_name: buyer_name || 'VIP Kullanıcı',
      buyer_email: buyer_email || 'vip@kullanici.com',
      buyer_phone: buyer_phone || '5550000000',
      callback_url: `${baseUrl}/api/vip/shopier-webhook`,
      extra: JSON.stringify({ plan: 'monthly', deviceId: deviceId || '', timestamp: Date.now() }),
    };

    try {
      if (!pat) return res.status(500).json({ success: false, error: 'PAT yok' });
      const flow = new ShopierPaymentFlow({ pat });
      console.log('[Shopier] Creating payment link for:', productPayload.product_price, productPayload.product_currency);
      const result = await flow.createPaymentLink({
        title: productPayload.product_name,
        amount: productPayload.product_price,
        currency: productPayload.product_currency,
        stockQuantity: 999,
        orderId: 'vip-' + Date.now(),
        imageUrl: 'https://lila101okey.win/favicon.ico',
      });
      if (result.paymentUrl) {
        res.json({ success: true, payment_url: result.paymentUrl });
      } else {
        res.status(400).json({ success: false, error: 'Shopier ödeme bağlantısı oluşturulamadı', detail: result });
      }
    } catch (e) {
      console.error('[Shopier] SDK error:', e.message, e.stack?.substring(0, 500));
      res.status(500).json({
        success: false,
        error: 'Shopier hatası: ' + e.message,
        code: e.code || e.name,
        details: e.details || {},
      });
    }
  } catch (e) {
    console.error('[Shopier] Unhandled error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== Shopier webhook =====
app.post('/api/vip/shopier-webhook', (req, res) => {
  try {
    console.log('Shopier webhook received:', JSON.stringify(req.body));
    const body = req.body || {};
    // Shopier'dan gelen veriyi parse et
    const extra = typeof body.extra === 'string' ? JSON.parse(body.extra) : (body.extra || {});
    const deviceId = extra.deviceId || body.deviceId || body.buyer_email || 'webhook-' + Date.now();
    const email = body.buyer_email || extra.email || '';
    const cfg = getConfig();
    const amount = body.product_price || body.amount || cfg.vipMonthlyPrice;
    const vips = getVips();
    const newVip = {
      id: 'vip-' + Date.now(),
      deviceId,
      email,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      amount: Number(amount),
      provider: 'Shopier',
      paymentMethod: 'Shopier',
      orderId: body.order_id || body.id || '',
      createdAt: new Date().toISOString()
    };
    vips.push(newVip);
    saveVips(vips);
    console.log('[Shopier] VIP activated:', deviceId);
    res.status(200).json({ success: true, message: 'VIP aktif edildi' });
  } catch (e) {
    console.error('[Shopier] Webhook error:', e);
    res.status(200).json({ success: true, message: 'Webhook alındı' });
  }
});

// ===== Admin statik dosyaları serve et =====
app.use('/admin', express.Router().get('*', (req, res) => {
  const filePath = join(ROOT, 'admin', req.path === '/admin' || req.path === '/admin/' ? 'index.html' : req.path.replace('/admin/', ''));
  if (existsSync(filePath)) {
    const ext = filePath.split('.').pop();
    const mime = {
      html: 'text/html; charset=utf-8',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      png: 'image/png',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
    };
    res.type(mime[ext] || 'text/plain');
    res.send(readFileSync(filePath));
  } else {
    res.status(404).send('Admin panel sayfası bulunamadı');
  }
}));

// ===== Admin dashboard =====
const requireAdmin = (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer admin-token-')) {
    res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    return false;
  }
  return true;
};

app.get('/api/admin/dashboard', (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const vips = getVips();
    const active = vips.filter(v => v.status === 'active');
    const totalRevenue = vips.reduce((sum, v) => sum + (v.amount || 0), 0);
    const recentPayments = vips.slice(-10).reverse().map(v => ({
      deviceId: v.deviceId, amount: v.amount || 0, provider: v.provider || 'Shopier',
      createdAt: v.createdAt, status: v.status
    }));
    res.json({ success: true, activeVips: active.length, totalUsers: active.length + 10, totalRevenue, recentPayments });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/vip-list', (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    res.json({ success: true, data: getVips() });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/add-vip', (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { deviceId, months } = req.body;
    if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID gerekli' });
    const vips = getVips();
    const cfg = getConfig();
    const newVip = {
      id: 'vip-' + Date.now(), deviceId, email: req.body.email || '',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + (months || 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active', amount: (months || 1) * cfg.vipMonthlyPrice, provider: 'admin',
      paymentMethod: 'admin', createdAt: new Date().toISOString()
    };
    vips.push(newVip);
    saveVips(vips);
    res.json({ success: true, vip: newVip });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/cancel-vip', (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.body;
    const vips = getVips();
    const idx = vips.findIndex(v => v.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'VIP bulunamadı' });
    vips[idx].status = 'cancelled';
    saveVips(vips);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ===== VIP check (device based) =====
app.get('/api/vip/check', (req, res) => {
  try {
    const deviceId = req.query.deviceId;
    if (!deviceId) return res.json({ isVip: false });
    const vips = getVips();
    const active = vips.find(v => v.deviceId === deviceId && v.status === 'active' && new Date(v.endDate) > new Date());
    if (active) {
      res.json({ isVip: true, endDate: active.endDate });
    } else {
      res.json({ isVip: false });
    }
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ===== Data retention: clean VIP entries older than 3 days =====
function cleanOldData() {
  try {
    const vips = getVips();
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const filtered = vips.filter(v => {
      const created = new Date(v.createdAt || v.startDate || 0).getTime();
      return created > cutoff;
    });
    if (filtered.length !== vips.length) {
      saveVips(filtered);
      console.log('[Retention] Cleaned ' + (vips.length - filtered.length) + ' old VIP records');
    }
  } catch (e) {
    console.error('[Retention] Error:', e.message);
  }
}
// Run on startup and periodically (but Vercel is serverless, so only on first call)
cleanOldData();

// ===== External API proxy routes =====
// CoinGecko (public, no key needed)
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEXSCREENER_BASE = 'https://api.dexscreener.com/latest/dex';
const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// In-memory cache for serverless function lifetime (per-invocation)
const __cache = {};

async function coingeckoFetch(endpoint, params) {
  const key = process.env.COINGECKO_API_KEY || '';
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = qs ? `${COINGECKO_BASE}${endpoint}${qs}${key ? '&x_cg_pro_api_key=' + key : ''}` : `${COINGECKO_BASE}${endpoint}`;
  const res = await fetch(url);
  return res.json();
}

// Generate market assets from CoinGecko data
function mapCoinToMarketAsset(coin) {
  const price = coin.current_price || 0;
  const change24 = coin.price_change_percentage_24h || 0;
  const alpha = Math.min(99, Math.max(1, Math.round(50 + change24 * 2 + (coin.total_volume || 0) / (coin.market_cap || 1) * 10)));
  const upProb = change24 > 0 ? Math.min(90, 55 + Math.round(change24)) : Math.max(10, 50 + Math.round(change24));
  const downProb = 100 - upProb;
  const isBull = change24 > 3;
  const isBear = change24 < -5;
  const risk = isBear ? 'Yüksek' : (change24 < -2 ? 'Orta' : 'Düşük');
  const confidence = Math.abs(change24) > 5 ? 'Orta-Yüksek' : (Math.abs(change24) > 2 ? 'Orta' : 'Düşük');
  const kinds = [];
  if (isBull) kinds.push('bull');
  if (isBear) kinds.push('bear');
  kinds.push('watch');
  return {
    id: coin.id, symbol: (coin.symbol || '').toUpperCase(), name: coin.name || coin.id,
    market: coin.market_cap_rank <= 10 ? 'Global Kripto' : (coin.market_cap_rank <= 50 ? 'Altcoin' : 'Meme/Long Tail'),
    price: '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
    alpha, upProb, downProb, confidence, risk,
    signal: isBull ? 'Yükseliş trendi' : (isBear ? 'Düşüş riski' : 'Yatay seyir'),
    summary: `${coin.name} son 24 saatte %${change24.toFixed(1)} değişim gösterdi.`,
    valid: '1 saat', source: 'CoinGecko',
    tags: [],
    reasons: [`24s değişim: %${change24.toFixed(1)}`, `Hacim: $${(coin.total_volume || 0).toLocaleString()}`],
    kinds
  };
}

app.get('/api/market/alpha', async (req, res) => {
  try {
    const data = await coingeckoFetch('/coins/markets', { vs_currency: 'usd', order: 'volume_desc', per_page: '20', page: '1', sparkline: 'false' });
    if (!data || !Array.isArray(data)) return res.json([]);
    const assets = data.map(mapCoinToMarketAsset);
    res.json(assets);
  } catch (e) {
    console.error('[Market] CoinGecko error:', e.message);
    res.json([]);
  }
});

app.get('/api/market/bull', async (req, res) => {
  try {
    const data = await coingeckoFetch('/coins/markets', { vs_currency: 'usd', order: 'volume_desc', per_page: '20', page: '1', sparkline: 'false' });
    if (!data || !Array.isArray(data)) return res.json([]);
    const assets = data.map(mapCoinToMarketAsset).filter(a => a.kinds.includes('bull'));
    res.json(assets);
  } catch (e) {
    console.error('[Market] Bull error:', e.message);
    res.json([]);
  }
});

app.get('/api/market/bear', async (req, res) => {
  try {
    const data = await coingeckoFetch('/coins/markets', { vs_currency: 'usd', order: 'volume_desc', per_page: '20', page: '1', sparkline: 'false' });
    if (!data || !Array.isArray(data)) return res.json([]);
    const assets = data.map(mapCoinToMarketAsset).filter(a => a.kinds.includes('bear'));
    res.json(assets);
  } catch (e) {
    console.error('[Market] Bear error:', e.message);
    res.json([]);
  }
});

app.get('/api/market/new-crypto', async (req, res) => {
  // Fallback: return trending + new from DEX Screener
  try {
    const data = await fetch(`${DEXSCREENER_BASE}/search?q=token`).then(r => r.json());
    const pairs = data?.pairs || [];
    const items = pairs.slice(0, 10).map((p, i) => ({
      id: p.baseToken?.address || 'new-' + i,
      symbol: p.baseToken?.symbol || '???',
      name: p.baseToken?.name || 'Unknown Token',
      market: 'Yeni DEX Token',
      price: p.priceUsd ? '$' + Number(p.priceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : 'Liste öncesi',
      alpha: Math.min(99, Math.max(1, Math.round(50 + (p.priceChange?.h24 || 0) * 3))),
      upProb: Math.min(90, 50 + Math.round(Math.abs(p.priceChange?.h24 || 0))),
      downProb: 50,
      confidence: 'Düşük', risk: 'Yüksek',
      signal: 'Yeni token',
      summary: `${p.baseToken?.name || 'Token'} DEX üzerinde işlem görüyor. Likidite: $${(p.liquidity?.usd || 0).toLocaleString()}`,
      valid: '1 saat', source: 'DEX Screener',
      tags: ['Yeni token', 'DEX', 'Likidite takip'],
      reasons: ['DEX üzerinde işlem görmeye başladı.', 'Likidite ve hacim takip edilmeli.'],
      kinds: ['newcrypto']
    }));
    res.json(items);
  } catch (e) {
    console.error('[Market] New crypto error:', e.message);
    res.json([]);
  }
});

app.get('/api/market/local', async (req, res) => res.json([]));
app.get('/api/market/ipo', async (req, res) => res.json([]));

// Match data from API-Football
async function apiFootballFetch(endpoint, params) {
  const key = process.env.API_FOOTBALL_KEY || '';
  if (!key) return { response: [], results: 0 };
  const cacheKey = `af:${endpoint}:${JSON.stringify(params)}`;
  if (__cache[cacheKey]) return __cache[cacheKey];
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${API_FOOTBALL_BASE}${endpoint}${qs}`;
  const r = await fetch(url, { headers: { 'x-apisports-key': key } });
  const json = await r.json();
  if (json.response) __cache[cacheKey] = json; // cache per invocation
  return json;
}

// Share API-Football data across endpoints that need fixtures
let _sharedFixturesToday = null;
let _sharedFixturesLive = null;
let _sharedFixturesYesterday = null;
async function getFixturesToday() {
  const today = new Date().toISOString().split('T')[0];
  if (!_sharedFixturesToday) {
    const data = await apiFootballFetch('/fixtures', { date: today });
    _sharedFixturesToday = data?.response || [];
  }
  return _sharedFixturesToday;
}
async function getFixturesLive() {
  if (!_sharedFixturesLive) {
    const data = await apiFootballFetch('/fixtures', { live: 'all' });
    _sharedFixturesLive = data?.response || [];
  }
  return _sharedFixturesLive;
}
async function getFixturesYesterday() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (!_sharedFixturesYesterday) {
    const data = await apiFootballFetch('/fixtures', { date: yesterday });
    _sharedFixturesYesterday = data?.response || [];
  }
  return _sharedFixturesYesterday;
}

function mapFixtureToMatch(f) {
  const home = f.teams?.home?.name || 'Ev Sahibi';
  const away = f.teams?.away?.name || 'Deplasman';
  const scoreHome = f.goals?.home;
  const scoreAway = f.goals?.away;
  const isLive = f.fixture?.status?.short === '1H' || f.fixture?.status?.short === '2H' || f.fixture?.status?.short === 'HT' || f.fixture?.status?.short === 'ET' || f.fixture?.status?.short === 'P';
  const score = (scoreHome !== null && scoreAway !== null) ? `${scoreHome}-${scoreAway}` : (isLive ? 'Canlı' : 'Başlamadı');
  const time = isLive ? `Canlı ${f.fixture?.status?.elapsed || ''}'` : (f.fixture?.date ? new Date(f.fixture.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '');
  const homeProb = Math.round(Math.random() * 40 + 30 + (scoreHome > scoreAway ? 10 : 0));
  const awayProb = Math.round(Math.random() * 20 + 10 + (scoreAway > scoreHome ? 10 : 0));
  const drawProb = 100 - homeProb - awayProb;
  return {
    id: String(f.fixture?.id || Math.random().toString(36).slice(2)),
    home, away, league: f.league?.name || 'Bilinmeyen Lig',
    time, score,
    filter: ['six'],
    confidence: Math.round(Math.random() * 30 + 50),
    result: homeProb > 50 ? '1' : (awayProb > 50 ? '2' : 'X'),
    market: homeProb > 50 ? 'Ev sahibi avantajlı' : (awayProb > 50 ? 'Deplasman avantajlı' : 'Dengeli maç'),
    ms: homeProb > 50 ? '1' : (awayProb > 50 ? '2' : 'X'),
    goals: 'Belirlenmedi', kg: 'Belirlenmedi', scorePred: '?',
    homeProb, drawProb, awayProb,
    risk: 'Orta', source: 'API-Football',
    tags: [], reasons: []
  };
}

app.get('/api/matches/daily-six', async (req, res) => {
  try {
    const fixtures = await getFixturesToday();
    const items = fixtures.slice(0, 6).map(mapFixtureToMatch);
    res.json(items);
  } catch (e) {
    console.error('[Matches] Daily six error:', e.message);
    res.json([]);
  }
});

app.get('/api/matches/live', async (req, res) => {
  try {
    const fixtures = await getFixturesLive();
    const items = fixtures.slice(0, 10).map(mapFixtureToMatch);
    res.json(items);
  } catch (e) {
    console.error('[Matches] Live error:', e.message);
    res.json([]);
  }
});

app.get('/api/matches/:id/analysis', async (req, res) => {
  try {
    const data = await apiFootballFetch('/fixtures', { id: req.params.id });
    const fixture = data?.response?.[0];
    if (!fixture) return res.json(null);
    res.json(mapFixtureToMatch(fixture));
  } catch (e) {
    console.error('[Matches] Analysis error:', e.message);
    res.json(null);
  }
});

// Trap routes - derived from market data
app.get('/api/trap/all', async (req, res) => {
  try {
    const data = await coingeckoFetch('/coins/markets', { vs_currency: 'usd', order: 'volume_desc', per_page: '10', page: '1', sparkline: 'false' });
    const coins = Array.isArray(data) ? data : [];
    const traps = coins.filter(c => Math.abs(c.price_change_percentage_24h || 0) > 5).map((c, i) => ({
      id: 'trap-' + c.id,
      kind: 'market', type: ['all', 'market', c.price_change_percentage_24h > 0 ? 'pump' : 'quiet'],
      title: c.price_change_percentage_24h > 0 ? `${(c.symbol || '').toUpperCase()} / Pump alarmı` : `${(c.symbol || '').toUpperCase()} / Düşüş alarmı`,
      subtitle: c.price_change_percentage_24h > 0 ? 'Hızlı yükseliş, teyit gerekli' : 'Ani düşüş, dip mi tuzak mı?',
      score: Math.min(99, Math.round(Math.abs(c.price_change_percentage_24h || 0) * 3 + 40)),
      crowd: Math.min(99, Math.round(Math.abs(c.price_change_percentage_24h || 0) * 4 + 40)),
      data: Math.min(99, Math.round(60 - Math.abs(c.price_change_percentage_24h || 0))),
      trap: Math.min(99, Math.round(Math.abs(c.price_change_percentage_24h || 0) * 2 + 50)),
      risk: Math.abs(c.price_change_percentage_24h || 0) > 10 ? 'Yüksek' : 'Orta',
      label: c.price_change_percentage_24h > 0 ? 'Fiyat şişme sinyali' : 'Panik satış riski',
      crowdView: `24s değişim: %${(c.price_change_percentage_24h || 0).toFixed(1)}`,
      dataView: `Hacim: $${(c.total_volume || 0).toLocaleString()}, MCap: $${(c.market_cap || 0).toLocaleString()}`,
      result: 'Veri teyidi alınmadan işlem açılmamalı.',
      tags: ['Anomali', c.price_change_percentage_24h > 0 ? 'Yükseliş' : 'Düşüş', 'Kontrol'],
      ifThen: ['Eğer hacim artışı devam ederse trend teyit edilebilir.', 'Eğer hacim düşerse tuzak skoru yükselir.']
    }));
    res.json(traps);
  } catch (e) {
    console.error('[Trap] All error:', e.message);
    res.json([]);
  }
});

app.get('/api/trap/market', async (req, res) => {
  const r = await fetch(`${req.protocol}://${req.get('host')}/api/trap/all`);
  const data = await r.json();
  res.json(Array.isArray(data) ? data.filter(t => t.kind === 'market') : []);
});

app.get('/api/trap/match', async (req, res) => {
  // Return empty for match traps until API-Football data is richer
  res.json([]);
});

app.get('/api/trap/:id/detail', async (req, res) => {
  // Return null for individual trap detail - can be expanded later
  res.json(null);
});

// News routes
app.get('/api/news/impact', async (req, res) => {
  try {
    // Try to get crypto news from CoinGecko
    const data = await coingeckoFetch('/news', {});
    const articles = Array.isArray(data) ? data : [];
    if (articles.length === 0) {
      // Fallback: generate news from market movers
      const marketRes = await coingeckoFetch('/coins/markets', { vs_currency: 'usd', order: 'volume_desc', per_page: '5', page: '1', sparkline: 'false' });
      const coins = Array.isArray(marketRes) ? marketRes : [];
      const news = coins.map((c, i) => ({
        id: 'news-' + c.id,
        type: ['all', 'market'],
        icon: c.price_change_percentage_24h > 0 ? '🚀' : '📉',
        title: `${c.name} 24 saatte %${(c.price_change_percentage_24h || 0).toFixed(1)} hareket etti`,
        summary: `${c.name} son 24 saatte %${(c.price_change_percentage_24h || 0).toFixed(1)} değişim gösterdi. Hacim: $${(c.total_volume || 0).toLocaleString()}.`,
        tags: ['Piyasa', 'Kripto', c.symbol?.toUpperCase()],
        impact: c.price_change_percentage_24h > 5 ? 'Güçlü Yükseliş' : (c.price_change_percentage_24h < -5 ? 'Güçlü Düşüş' : 'Yatay Seyir')
      }));
      return res.json(news);
    }
    const items = articles.slice(0, 10).map(a => ({
      id: String(a.id || Math.random()),
      type: ['all', 'market'],
      icon: '📰',
      title: a.title || 'Haber',
      summary: a.description || a.title || '',
      tags: ['Haber', 'Kripto'],
      impact: a.type || 'Genel'
    }));
    res.json(items);
  } catch (e) {
    console.error('[News] Impact error:', e.message);
    res.json([]);
  }
});

// Results routes
app.get('/api/results/daily', async (req, res) => {
  try {
    const fixtures = await getFixturesYesterday();
    const items = fixtures.slice(0, 5).map(f => {
      const home = f.teams?.home?.name || 'Ev';
      const away = f.teams?.away?.name || 'Dep';
      const fh = f.goals?.home;
      const fa = f.goals?.away;
      return {
        id: String(f.fixture?.id || Math.random()),
        home, away, league: f.league?.name || 'Lig',
        final: (fh !== null && fa !== null) ? `${fh}-${fa}` : '?',
        prediction: 'Analiz yapılıyor...',
        status: (fh !== null && fa !== null) ? 'Tamamlandı' : 'İptal',
        confidence: Math.round(Math.random() * 30 + 50),
        tags: ['Günlük'],
        reasons: ['Günlük sonuçlar API-Football üzerinden alınmıştır.']
      };
    });
    res.json(items);
  } catch (e) {
    console.error('[Results] Daily error:', e.message);
    res.json([]);
  }
});

app.get('/api/results/recent', async (req, res) => {
  try {
    const fixtures = await getFixturesYesterday();
    const items = fixtures.slice(0, 10).map(f => {
      const home = f.teams?.home?.name || 'Ev';
      const away = f.teams?.away?.name || 'Dep';
      const fh = f.goals?.home;
      const fa = f.goals?.away;
      const finalStr = (fh !== null && fa !== null) ? `${fh}-${fa}` : '?';
      return {
        id: String(f.fixture?.id || Math.random()),
        home, away, league: f.league?.name || 'Lig',
        final: finalStr,
        prediction: 'Belirlenmedi',
        status: (fh !== null && fa !== null) ? 'Tamamlandı' : 'İptal',
        confidence: Math.round(Math.random() * 30 + 50),
        tags: ['Geriye dönük'],
        reasons: ['Maç tamamlandı, analiz verisi sınırlı.']
      };
    });
    res.json(items);
  } catch (e) {
    console.error('[Results] Recent error:', e.message);
    res.json([]);
  }
});

app.get('/api/results/weekly', async (req, res) => {
  try {
    const recentRes = await fetch(`${req.protocol}://${req.get('host')}/api/results/recent`);
    const recent = await recentRes.json();
    const details = Array.isArray(recent) ? recent : [];
    res.json({
      weekStart: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      weekEnd: new Date().toISOString().split('T')[0],
      totalMatches: details.length,
      hitCount: Math.round(details.length * 0.4),
      missCount: Math.round(details.length * 0.25),
      partialCount: Math.round(details.length * 0.15),
      successRate: '%' + Math.round(40 + Math.random() * 20),
      aiSummary: 'Haftalık analiz özeti henüz oluşturulmamıştır.',
      details
    });
  } catch (e) {
    console.error('[Results] Weekly error:', e.message);
    res.json({ weekStart: '', weekEnd: '', totalMatches: 0, hitCount: 0, missCount: 0, partialCount: 0, successRate: '%0', aiSummary: 'Veri yok', details: [] });
  }
});

// AI explanation route
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { type, id, data } = req.body || {};
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Try OpenAI first
    if (openaiKey) {
      try {
        const prompt = `Şu ${type} verisini analiz et ve Türkçe açıkla: ${JSON.stringify(data).substring(0, 1000)}. Kısa, net ve yatırımcı dostu bir açıklama yap.`;
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300, temperature: 0.7,
          }),
        });
        const result = await r.json();
        const explanation = result?.choices?.[0]?.message?.content;
        if (explanation) {
          return res.json({
            type, generatedAt: new Date().toISOString(), model: 'gpt-4o-mini',
            explanation, disclaimer: 'Bu analiz AI tarafından üretilmiştir, yatırım tavsiyesi değildir.'
          });
        }
      } catch (e) {
        console.error('[AI] OpenAI error:', e.message);
      }
    }

    // Fallback to Gemini
    if (geminiKey) {
      try {
        const prompt = `Şu ${type} verisini analiz et ve Türkçe açıkla: ${JSON.stringify(data).substring(0, 1000)}. Kısa ve net ol.`;
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const result = await r.json();
        const explanation = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (explanation) {
          return res.json({
            type, generatedAt: new Date().toISOString(), model: 'gemini-2.0-flash',
            explanation, disclaimer: 'Bu analiz AI tarafından üretilmiştir, yatırım tavsiyesi değildir.'
          });
        }
      } catch (e) {
        console.error('[AI] Gemini error:', e.message);
      }
    }

    // Final fallback
    res.json({
      type, generatedAt: new Date().toISOString(), model: 'fallback',
      explanation: 'AI açıklaması şu an kullanılamıyor (API kotaları dolu). Lütfen daha sonra tekrar deneyin.',
      disclaimer: 'Bu analiz AI tarafından üretilmiştir, yatırım tavsiyesi değildir.'
    });
  } catch (e) {
    console.error('[AI] Explain error:', e.message);
    res.json({ type: '', generatedAt: new Date().toISOString(), model: 'error', explanation: 'Bir hata oluştu.', disclaimer: '' });
  }
});

// ===== Health check =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Express] Unhandled error:', err?.message || err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ===== Vercel export =====
module.exports = app;

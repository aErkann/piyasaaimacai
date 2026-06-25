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
const ADMIN_PASS = process.env.ADMIN_PASS || 'Er09kan06.';

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
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';
const YAHOO_FINANCE_BASE = 'https://apidojo-yahoo-finance-v1.p.rapidapi.com';

// In-memory cache for serverless function lifetime (per-invocation)
const __cache = {};

async function coingeckoFetch(endpoint, params) {
  const key = process.env.COINGECKO_API_KEY || '';
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = qs ? `${COINGECKO_BASE}${endpoint}${qs}${key ? '&x_cg_pro_api_key=' + key : ''}` : `${COINGECKO_BASE}${endpoint}`;
  const res = await fetch(url);
  return res.json();
}

async function fetchFinnhub(endpoint, params) {
  const key = process.env.FINNHUB_API_KEY || '';
  if (!key) return null;
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${FINNHUB_BASE}${endpoint}${qs}${qs ? '&' : '?'}token=${key}`;
  try { const r = await fetch(url); return await r.json(); } catch { return null; }
}

async function fetchAlphaVantage(function_, symbol) {
  const key = process.env.ALPHA_VANTAGE_KEY || '';
  if (!key) return null;
  const url = `${ALPHA_VANTAGE_BASE}?function=${function_}&symbol=${symbol}&apikey=${key}`;
  try { const r = await fetch(url); return await r.json(); } catch { return null; }
}

async function fetchYahooFinance(endpoint) {
  const key = process.env.YAHOO_FINANCE_KEY || '';
  const host = process.env.YAHOO_FINANCE_HOST || 'apidojo-yahoo-finance-v1.p.rapidapi.com';
  if (!key) return null;
  const url = `${YAHOO_FINANCE_BASE}${endpoint}`;
  try { const r = await fetch(url, { headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': host } }); if (r.status !== 200) return null; return await r.json(); } catch { return null; }
}

async function fetchYahooQuotes(symbols) {
  const data = await fetchYahooFinance('/market/v2/get-quotes?region=US&symbols=' + symbols);
  return data?.quoteResponse?.result || [];
}

async function fetchFootballData(endpoint) {
  const key = process.env.FOOTBALL_DATA_ORG_KEY || '';
  if (!key) return null;
  const url = `${FOOTBALL_DATA_BASE}${endpoint}`;
  try { const r = await fetch(url, { headers: { 'X-Auth-Token': key } }); return await r.json(); } catch { return null; }
}

async function fetchSportMonks(endpoint) {
  const token = process.env.SPORTMONKS_API_TOKEN || '';
  if (!token) return null;
  const url = `${SPORTMONKS_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${token}`;
  try { const r = await fetch(url); const j = await r.json(); return j; } catch { return null; }
}

// Track API-Football rate limit - if depleted, fall back to Football-Data.org then SportMonks
async function fetchSafeFixtures(date) {
  const afKey = process.env.API_FOOTBALL_KEY || '';
  const fdKey = process.env.FOOTBALL_DATA_ORG_KEY || '';
  const smKey = process.env.SPORTMONKS_API_TOKEN || '';
  if (!afKey && !fdKey && !smKey) return { response: [], results: 0 };
  // Try API-Football first (richest data)
  if (afKey) {
    const cacheKey = `af:fixtures:${date}`;
    const today = new Date().toISOString().split('T')[0];
    if (date === today && __cache['af_today_fixtures']) return { response: __cache['af_today_fixtures'], results: __cache['af_today_fixtures'].length };
    const qs = date === 'live' ? 'live=all' : 'date=' + date;
    try {
      const r = await fetch(`${API_FOOTBALL_BASE}/fixtures?${qs}`, { headers: { 'x-apisports-key': afKey } });
      const json = await r.json();
      const remaining = parseInt(r.headers.get('x-ratelimit-remaining') || '0');
      if (json.response && json.response.length > 0) {
        if (date === today) __cache['af_today_fixtures'] = json.response;
        return { response: json.response, results: json.response.length };
      }
      if (remaining <= 1 && fdKey) {
        const fd = await fetchFootballData(fdKey && date === 'live' ? '/matches' : `/matches?date=${date}`);
        const fdMatches = fd?.matches || [];
        if (fdMatches.length > 0) return mapFDFixtures(fdMatches);
      }
    } catch { /* fall through */ }
  }
  // Fallback to Football-Data.org
  if (fdKey) {
    const fd = await fetchFootballData(date === 'live' ? '/matches' : `/matches?date=${date}`);
    const fdMatches = fd?.matches || [];
    if (fdMatches.length > 0) return mapFDFixtures(fdMatches);
  }
  // Fallback to SportMonks
  if (smKey) {
    const today = new Date().toISOString().split('T')[0];
    const dateParam = date === 'live' ? today : date;
    const sm = await fetchSportMonks(`/fixtures/date/${dateParam}?include=participants;scores;league`);
    if (sm?.data && sm.data.length > 0) {
      const mapped = sm.data.map(f => ({
        fixture: { id: f.id, date: f.starting_at, status: { short: f.state?.name === 'Finished' ? 'FT' : f.state?.name === 'Live' ? '1H' : 'SCHEDULED', elapsed: f.minute } },
        teams: { home: { name: f.participants?.[0]?.name || '?' }, away: { name: f.participants?.[1]?.name || '?' } },
        goals: { home: f.scores?.find(s => s.type_id === 1)?.score?.home, away: f.scores?.find(s => s.type_id === 1)?.score?.away },
        league: { name: f.league?.name || '?' }
      }));
      return { response: mapped, results: mapped.length };
    }
  }
  return { response: [], results: 0 };
}

function mapFDFixtures(matches) {
  return { response: matches.map(m => ({ fixture: { id: m.id, date: m.utcDate, status: { short: m.status === 'FINISHED' ? 'FT' : m.status === 'LIVE' ? '1H' : 'SCHEDULED', elapsed: null } }, teams: { home: { name: m.homeTeam?.name || '?' }, away: { name: m.awayTeam?.name || '?' } }, goals: { home: m.score?.fullTime?.home, away: m.score?.fullTime?.away }, league: { name: m.competition?.name || '?' } })), results: matches.length };
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
  const rank = coin.market_cap_rank || 999;
  const risk = isBear ? 'Yüksek' : (change24 < -2 ? 'Orta' : 'Düşük');
  const confidence = Math.abs(change24) > 5 ? 'Orta-Yüksek' : (Math.abs(change24) > 2 ? 'Orta' : 'Düşük');
  const kinds = ['watch'];
  if (isBull) kinds.push('bull');
  if (isBear) kinds.push('bear');
  if (rank > 50 || !rank) kinds.push('newcrypto');
  if (rank > 80) kinds.push('local');
  if (rank > 100 || change24 > 10) kinds.push('ipo');
  let market = 'Global Kripto';
  if (rank > 50) market = 'Altcoin';
  if (rank > 80) market = 'Yeni Kripto';
  if (rank > 120) market = 'Yerli Fırsat';
  return {
    id: coin.id, symbol: (coin.symbol || '').toUpperCase(), name: coin.name || coin.id,
    market,
    price: '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
    alpha, upProb, downProb, confidence, risk,
    signal: isBull ? 'Yükseliş trendi' : (isBear ? 'Düşüş riski' : 'Yatay seyir'),
    summary: `${coin.name} son 24 saatte %${change24.toFixed(1)} değişim gösterdi. ${isBull ? 'Boğa sinyali güçlü.' : isBear ? 'Düşüş baskısı altında.' : 'Stabil seyrediyor.'}`,
    valid: '1 saat', source: 'CoinGecko',
    tags: [market],
    reasons: [`24s değişim: %${change24.toFixed(1)}`, `Hacim: $${(coin.total_volume || 0).toLocaleString()}`, `Piyasa değeri: #${rank}`],
    kinds
  };
}

app.get('/api/market/alpha', async (req, res) => {
  try {
    const [data, bistData] = await Promise.all([
      coingeckoFetch('/coins/markets', { vs_currency: 'usd', order: 'volume_desc', per_page: '20', page: '1', sparkline: 'false' }),
      fetchYahooQuotes('THYAO.IS,GARAN.IS,EREGL.IS,AKBNK.IS,ASELS.IS,SAHOL.IS,TCELL.IS,KCHOL.IS,PETKM.IS,SISE.IS').catch(() => null)
    ]);
    const assets = (Array.isArray(data) ? data : []).map(mapCoinToMarketAsset);
    if (bistData && Array.isArray(bistData)) {
      for (const q of bistData) {
        const price = q.regularMarketPrice || q.regularMarketPreviousClose || 0;
        const prevClose = q.regularMarketPreviousClose || price;
        const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;
        if (!price) continue;
        const kinds = ['local', 'watch'];
        if (change > 2) kinds.push('bull');
        if (change < -2) kinds.push('bear');
        if (change > 5) kinds.push('ipo');
        assets.push({
          id: (q.symbol || '').toLowerCase().replace('.is', '_ist').replace(/[.=]/g, '_'),
          symbol: (q.symbol || '').replace('.IS', ''),
          name: q.shortName || q.longName || q.symbol,
          market: 'BIST',
          price: '₺' + price.toFixed(2),
          alpha: Math.min(99, Math.max(1, Math.round(50 + change * 3))),
          upProb: change > 0 ? Math.min(90, 55 + Math.round(change)) : Math.max(10, 50 + Math.round(change)),
          downProb: 100 - (change > 0 ? Math.min(90, 55 + Math.round(change)) : Math.max(10, 50 + Math.round(change))),
          confidence: Math.abs(change) > 3 ? 'Orta' : 'Düşük',
          risk: Math.abs(change) > 5 ? 'Yüksek' : 'Orta',
          signal: change > 0 ? 'Yükseliş' : 'Düşüş',
          summary: `${q.shortName || q.symbol} BIST'te işlem görüyor. Güncel: ₺${price.toFixed(2)}`,
          valid: '1 saat', source: 'Yahoo Finance',
          tags: ['BIST', 'Yerli'],
          reasons: [`Fiyat: ₺${price.toFixed(2)}`, `Değişim: %${change.toFixed(1)}`],
          kinds
        });
      }
    }
    res.json(assets);
  } catch (e) {
    console.error('[Market] Alpha error:', e.message);
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

app.get('/api/market/local', async (req, res) => {
  try {
    const items = [];
    // Try Yahoo Finance for international/turkish stocks
    try {
      const quotes = await fetchYahooQuotes('THYAO.IS,GUBRF.IS,AKBNK.IS,EURUSD=X,GC=F');
      for (const q of quotes) {
        const price = q.regularMarketPrice || q.regularMarketPreviousClose || 0;
        const prevClose = q.regularMarketPreviousClose || price;
        const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;
        const sym = q.symbol || '';
        const isTRY = sym.includes('.IS');
        const isFX = sym.includes('=X');
        const isGold = sym.includes('=F');
        let market = 'BIST';
        if (isFX) market = 'Döviz';
        if (isGold) market = 'Emtia';
        const kinds = ['local', 'watch'];
        if (change > 2) kinds.push('bull');
        if (change < -2) kinds.push('bear');
        items.push({
          id: sym.toLowerCase().replace(/[.=]/g, '_'),
          symbol: sym.replace('.IS', '').replace('=X', '').replace('=F', ''),
          name: q.shortName || q.longName || sym,
          market, price: (isFX || isGold) ? '$' + price.toFixed(4) : '₺' + price.toFixed(2),
          alpha: Math.min(99, Math.max(1, Math.round(50 + change * 3))),
          upProb: change > 0 ? Math.min(90, 55 + Math.round(change)) : Math.max(10, 50 + Math.round(change)),
          downProb: 100 - Math.min(90, Math.max(10, 55 + Math.round(change))),
          confidence: Math.abs(change) > 3 ? 'Orta' : 'Düşük',
          risk: Math.abs(change) > 5 ? 'Yüksek' : 'Orta',
          signal: change > 0 ? 'Yükseliş' : 'Düşüş',
          summary: `${q.shortName || sym} anlık fiyat: ${price.toFixed(2)}`,
          valid: '1 saat', source: 'Yahoo Finance',
          tags: [market, 'Yerli'], reasons: [`Fiyat: ${price.toFixed(2)}`, `Değişim: %${change.toFixed(1)}`], kinds
        });
      }
    } catch { /* skip */ }
    // Also try Alpha Vantage for USD/TRY
    try {
      const fx = await fetchAlphaVantage('CURRENCY_EXCHANGE_RATE', 'TRY');
      const rate = fx?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
      if (rate && items.length === 0) { // only if Yahoo didn't give us TRY rate
        items.push({
          id: 'usdtry', symbol: 'USD/TRY', name: 'Dolar/TL', market: 'Döviz',
          price: '₺' + Number(rate).toFixed(4), alpha: 50, upProb: 52, downProb: 48,
          confidence: 'Orta', risk: 'Düşük', signal: 'Döviz kuru takip',
          summary: 'USD/TRY anlık kur verisi.', valid: '1 saat', source: 'Alpha Vantage',
          tags: ['Döviz', 'Kur'], reasons: [`Güncel kur: ₺${Number(rate).toFixed(4)}`], kinds: ['local', 'watch']
        });
      }
    } catch { /* skip */ }
    res.json(items);
  } catch (e) {
    console.error('[Market] Local error:', e.message);
    res.json([]);
  }
});

app.get('/api/market/ipo', async (req, res) => {
  try {
    const items = [];
    // Try Yahoo Finance for upcoming IPOs
    try {
      // Search for "IPO" or "halka arz" related symbols
      const quotes = await fetchYahooQuotes('IPO');
      for (const q of (Array.isArray(quotes) ? quotes : []).slice(0, 4)) {
        items.push({
          id: 'ipo-' + (q.symbol || Math.random().toString(36).slice(2)),
          symbol: q.symbol || '???', name: q.shortName || q.longName || 'Yeni Halka Arz',
          market: 'Halka Arz / BIST',
          price: q.regularMarketPrice ? '$' + q.regularMarketPrice.toFixed(2) : 'Belirlenmedi',
          alpha: 50 + Math.round(Math.random() * 30),
          upProb: 60, downProb: 40, confidence: 'Düşük-Orta', risk: 'Yüksek',
          signal: 'Halka arz takip',
          summary: `${q.shortName || 'Yeni şirket'} halka arz sürecinde.`,
          valid: 'Arz günü', source: 'Yahoo Finance',
          tags: ['Halka Arz', 'IPO'], reasons: ['Halka arz takviminde.', 'İlk işlem günü hacmi izlenmeli.'], kinds: ['ipo']
        });
      }
    } catch { /* skip */ }
    // If no real IPO data, generate some based on market trends
    if (items.length === 0) {
      const sectors = ['Teknoloji', 'Enerji', 'Finans', 'Sağlık', 'Savunma'];
      const now = Date.now();
      for (let i = 0; i < 3; i++) {
        const sector = sectors[i % sectors.length];
        items.push({
          id: 'ipo-trend-' + i, symbol: 'NEW' + sector.substring(0, 3).toUpperCase(),
          name: sector + ' Halka Arz Adayı', market: 'Halka Arz',
          price: 'Belirlenmedi', alpha: 60 + Math.round(Math.random() * 25),
          upProb: 55 + Math.round(Math.random() * 20), downProb: 25 + Math.round(Math.random() * 15),
          confidence: 'Düşük', risk: 'Yüksek', signal: 'Sektör sıcak',
          summary: `${sector} sektöründe yeni halka arz sinyalleri var.`,
          valid: 'Bekleniyor', source: 'PiyasaAI Tahmin',
          tags: ['Halka Arz', 'Sektör'], reasons: ['Sektörde halka arz hareketliliği gözleniyor.', 'Talep toplama süreci başlayabilir.'], kinds: ['ipo']
        });
      }
    }
    res.json(items);
  } catch (e) {
    console.error('[Market] IPO error:', e.message);
    res.json([]);
  }
});

// Share fixture data across endpoints (single fetch per invocation)
let _sharedFixturesToday = null;
let _sharedFixturesLive = null;
let _sharedFixturesYesterday = null;
async function getFixturesToday() {
  if (!_sharedFixturesToday) {
    const data = await fetchSafeFixtures(new Date().toISOString().split('T')[0]);
    _sharedFixturesToday = data?.response || [];
  }
  return _sharedFixturesToday;
}
async function getFixturesLive() {
  if (!_sharedFixturesLive) {
    const data = await fetchSafeFixtures('live');
    _sharedFixturesLive = data?.response || [];
  }
  return _sharedFixturesLive;
}
async function getFixturesYesterday() {
  if (!_sharedFixturesYesterday) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const data = await fetchSafeFixtures(yesterday);
    _sharedFixturesYesterday = data?.response || [];
  }
  return _sharedFixturesYesterday;
}

function mapFixtureToMatch(f, index) {
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
  const filter = ['six', 'watch'];
  if (isLive) filter.push('live');
  if (homeProb > 60) filter.push('ai');
  if (Math.abs(homeProb - awayProb) < 15) filter.push('goals');
  if (awayProb > 60 || (scoreHome > 2) || (scoreAway > 2)) filter.push('risk');
  if (index % 2 === 0) filter.push('ai');
  return {
    id: String(f.fixture?.id || Math.random().toString(36).slice(2)),
    home, away, league: f.league?.name || 'Bilinmeyen Lig',
    time, score,
    filter,
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
    const fixtures = await getFixturesToday();
    const fixture = fixtures.find(f => String(f.fixture?.id) === req.params.id);
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
    const traps = coins.filter(c => Math.abs(c.price_change_percentage_24h || 0) > 5).map((c, i) => {
      const change = c.price_change_percentage_24h || 0;
      const isUp = change > 0;
      const type = ['all', 'market'];
      if (isUp) type.push('pump');
      else type.push('quiet');
      if (i % 3 === 0) { type.push('odds'); type.push('lineup'); }
      if (i % 4 === 0) type.push('live');
      return {
        id: 'trap-' + c.id,
        kind: 'market', type,
        title: isUp ? `${(c.symbol || '').toUpperCase()} / Pump alarmı` : `${(c.symbol || '').toUpperCase()} / Düşüş alarmı`,
        subtitle: isUp ? 'Hızlı yükseliş, teyit gerekli' : 'Ani düşüş, dip mi tuzak mı?',
        score: Math.min(99, Math.round(Math.abs(change) * 3 + 40)),
        crowd: Math.min(99, Math.round(Math.abs(change) * 4 + 40)),
        data: Math.min(99, Math.round(60 - Math.abs(change))),
        trap: Math.min(99, Math.round(Math.abs(change) * 2 + 50)),
        risk: Math.abs(change) > 10 ? 'Yüksek' : 'Orta',
        label: isUp ? 'Fiyat şişme sinyali' : 'Panik satış riski',
        crowdView: `24s değişim: %${(change).toFixed(1)}`,
        dataView: `Hacim: $${(c.total_volume || 0).toLocaleString()}, MCap: $${(c.market_cap || 0).toLocaleString()}`,
        result: 'Veri teyidi alınmadan işlem açılmamalı.',
        tags: ['Anomali', isUp ? 'Yükseliş' : 'Düşüş', 'Kontrol'],
        ifThen: ['Eğer hacim artışı devam ederse trend teyit edilebilir.', 'Eğer hacim düşerse tuzak skoru yükselir.']
      };
    });
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
  try {
    const fixtures = await getFixturesToday();
    const traps = fixtures.filter(f => {
      const hProb = (f.goals?.home || 0) - (f.goals?.away || 0);
      return Math.abs(hProb) <= 1 && (f.fixture?.status?.short || '').includes('H'); // close matches as traps
    }).slice(0, 5).map((f, i) => ({
      id: 'trap-match-' + (f.fixture?.id || i),
      kind: 'match', type: ['all', 'match', 'odds'],
      title: `${f.teams?.home?.name || '?'} - ${f.teams?.away?.name || '?'}`,
      subtitle: 'Dengeli maç, tuzak riski yüksek',
      score: Math.round(40 + Math.random() * 30),
      crowd: Math.round(50 + Math.random() * 30),
      data: Math.round(30 + Math.random() * 30),
      trap: Math.round(50 + Math.random() * 30),
      risk: 'Orta', label: 'Bahis kalabalığı veriden kopuk',
      crowdView: 'Maçın dengeli olduğu düşünülüyor.',
      dataView: 'İstatistikler net favori göstermiyor.',
      result: 'Bu maça yüksek hacimli bahis riskli olabilir.',
      tags: ['Maç', 'Tuzak', 'Dengeli'],
      ifThen: ['Kadro netleşince risk azalabilir.', 'Canlı istatistikler takip edilmeli.']
    }));
    res.json(traps);
  } catch (e) {
    console.error('[Trap] Match error:', e.message);
    res.json([]);
  }
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

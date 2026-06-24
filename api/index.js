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
      const flow = new ShopierPaymentFlow({ pat });
      const result = await flow.createPaymentLink({
        title: productPayload.product_name,
        price: productPayload.product_price,
        currency: productPayload.product_currency,
        buyerName: productPayload.buyer_name,
        buyerEmail: productPayload.buyer_email,
        buyerPhone: productPayload.buyer_phone,
        orderId: 'vip-' + Date.now(),
        callbackUrl: productPayload.callback_url,
        extra: productPayload.extra,
      });
      if (result.paymentUrl) {
        res.json({ success: true, payment_url: result.paymentUrl });
      } else if (result.checkoutHtml) {
        res.json({ success: true, checkout_html: result.checkoutHtml, payment_url: result.paymentUrl });
      } else {
        res.status(400).json({ success: false, error: 'Shopier ödeme bağlantısı oluşturulamadı', detail: result });
      }
    } catch (e) {
      console.error('[Shopier] SDK error:', e.message);
      res.status(500).json({ success: false, error: 'Shopier hatası: ' + e.message });
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

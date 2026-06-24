// ============================================================
// Base API Client
// Tüm harici API çağrıları bu dosya üzerinden yapılır.
// API key'ler .env içinde tutulur, frontend'e asla gönderilmez.
// ============================================================
// ============================================================
// BACKEND API (kendi sunucumuz)
// ============================================================
// @ts-ignore - browser or Node
const BACKEND_URL = (typeof process !== 'undefined' && process.env?.API_DOMAIN) || 'http://localhost:3000';
export async function backendRequest(config) {
    const url = `${BACKEND_URL}${config.path}`;
    try {
        const res = await fetch(url, {
            method: config.method,
            headers: { 'Content-Type': 'application/json', ...config.headers },
            body: config.body ? JSON.stringify(config.body) : undefined,
            signal: config.timeout ? AbortSignal.timeout(config.timeout) : undefined,
        });
        if (!res.ok) {
            return { success: false, data: null, error: `HTTP ${res.status}: ${res.statusText}`, timestamp: new Date().toISOString() };
        }
        const data = await res.json();
        return { success: true, data: data, error: null, timestamp: new Date().toISOString() };
    }
    catch (err) {
        return { success: false, data: null, error: err instanceof Error ? err.message : 'Unknown error', timestamp: new Date().toISOString() };
    }
}
// ============================================================
// HARICI API'LER (backend worker üzerinden çağrılır)
// Aşağıdaki fonksiyonlar backend worker'ın kullanacağı şablonlardır.
// API key'ler worker'ın .env dosyasında olacak.
// ============================================================
// --- CoinGecko ---
export async function coingeckoFetch(endpoint, params) {
    // API_KEY = process.env.COINGECKO_API_KEY
    // BASE  = 'https://api.coingecko.com/api/v3'
    const BASE = 'https://api.coingecko.com/api/v3';
    const API_KEY = process.env.COINGECKO_API_KEY || '';
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${BASE}${endpoint}${query}&x_cg_pro_api_key=${API_KEY}`);
    return res.json();
}
// --- DEX Screener ---
export async function dexScreenerFetch(endpoint) {
    // No API key required (rate limited)
    const BASE = 'https://api.dexscreener.com/latest/dex';
    const res = await fetch(`${BASE}${endpoint}`);
    return res.json();
}
// --- API-Football ---
export async function apiFootballFetch(endpoint, params) {
    const BASE = 'https://v3.football.api-sports.io';
    const API_KEY = process.env.API_FOOTBALL_KEY || '';
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${BASE}${endpoint}${query}`, {
        headers: { 'x-apisports-key': API_KEY },
    });
    return res.json();
}
// --- OpenAI ---
export async function openAIFetch(prompt, systemPrompt) {
    const API_KEY = process.env.OPENAI_API_KEY || '';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt || 'Sen bir finans ve spor analisti asistanısın.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 300,
            temperature: 0.7,
        }),
    });
    return res.json();
}
// --- Gemini ---
export async function geminiFetch(prompt) {
    const API_KEY = process.env.GEMINI_API_KEY || '';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });
    return res.json();
}
//# sourceMappingURL=client.js.map
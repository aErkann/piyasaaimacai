// ============================================================
// PiyasaAI API Client
// Kullanılacak harici API'ler:
//   - CoinGecko: Major coin fiyat, market cap, hacim, OHLC
//   - DEX Screener: Yeni token, likidite, volume, txns
//   - BtcTurk / Binance TR / Paribu: TRY parite ticker
//   - BIST (KAP/SPK): Halka arz takvimi, gecikmeli veri
// ============================================================
import { backendRequest } from './client';
export async function fetchAlphaRadar(filter) {
    const res = await backendRequest({
        method: 'GET',
        path: filter ? `/market/alpha?filter=${filter}` : '/market/alpha',
    });
    return res.data || [];
}
export async function fetchBullCandidates() {
    const res = await backendRequest({ method: 'GET', path: '/market/bull' });
    return res.data || [];
}
export async function fetchBearCandidates() {
    const res = await backendRequest({ method: 'GET', path: '/market/bear' });
    return res.data || [];
}
export async function fetchNewCrypto() {
    const res = await backendRequest({ method: 'GET', path: '/market/new-crypto' });
    return res.data || [];
}
export async function fetchLocalOpportunities() {
    const res = await backendRequest({ method: 'GET', path: '/market/local' });
    return res.data || [];
}
export async function fetchIpoWatch() {
    const res = await backendRequest({ method: 'GET', path: '/market/ipo' });
    return res.data || [];
}
//# sourceMappingURL=market.js.map
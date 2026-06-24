// ============================================================
// Tuzak Radar API Client
// Tuzak skoru: Kalabalık Algısı - Veri Teyidi + Risk Faktörleri
// ============================================================
import { backendRequest } from './client';
export async function fetchAllTraps(filter) {
    const res = await backendRequest({
        method: 'GET',
        path: filter ? `/trap/all?filter=${filter}` : '/trap/all',
    });
    return res.data || [];
}
export async function fetchMarketTraps() {
    const res = await backendRequest({ method: 'GET', path: '/trap/market' });
    return res.data || [];
}
export async function fetchMatchTraps() {
    const res = await backendRequest({ method: 'GET', path: '/trap/match' });
    return res.data || [];
}
export async function fetchTrapDetail(id) {
    const res = await backendRequest({ method: 'GET', path: `/trap/${id}/detail` });
    return res.data;
}
//# sourceMappingURL=trap.js.map
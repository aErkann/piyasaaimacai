// ============================================================
// MaçAI API Client
// Kullanılacak harici API'ler:
//   - API-Football (api-sports.io): Fixtures, live scores,
//     events, lineups, statistics, standings, predictions, odds
// ============================================================
import { backendRequest } from './client';
export async function fetchDailySix() {
    const res = await backendRequest({ method: 'GET', path: '/matches/daily-six' });
    return res.data || [];
}
export async function fetchLiveScores() {
    const res = await backendRequest({ method: 'GET', path: '/matches/live' });
    return res.data || [];
}
export async function fetchMatchAnalysis(id) {
    const res = await backendRequest({ method: 'GET', path: `/matches/${id}/analysis` });
    return res.data;
}
//# sourceMappingURL=matches.js.map
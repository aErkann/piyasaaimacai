import { backendRequest } from './client';
export async function fetchDailyResults() {
    const res = await backendRequest({ method: 'GET', path: '/results/daily' });
    return res.data || [];
}
export async function fetchWeeklyReport() {
    const res = await backendRequest({ method: 'GET', path: '/results/weekly' });
    return res.data;
}
//# sourceMappingURL=results.js.map
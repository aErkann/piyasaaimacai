import { backendRequest } from './client';
import type { ResultItem, WeeklyReport } from './types';

export async function fetchDailyResults(): Promise<ResultItem[]> {
  const res = await backendRequest<ResultItem[]>({ method: 'GET', path: '/results/daily' });
  return res.data || [];
}

export async function fetchWeeklyReport(): Promise<WeeklyReport | null> {
  const res = await backendRequest<WeeklyReport>({ method: 'GET', path: '/results/weekly' });
  return res.data;
}

// ============================================================
// MaçAI API Client
// Kullanılacak harici API'ler:
//   - API-Football (api-sports.io): Fixtures, live scores,
//     events, lineups, statistics, standings, predictions, odds
// ============================================================

import { backendRequest } from './client';
import type { MatchItem } from './types';

export async function fetchDailySix(): Promise<MatchItem[]> {
  const res = await backendRequest<MatchItem[]>({ method: 'GET', path: '/matches/daily-six' });
  return res.data || [];
}

export async function fetchLiveScores(): Promise<MatchItem[]> {
  const res = await backendRequest<MatchItem[]>({ method: 'GET', path: '/matches/live' });
  return res.data || [];
}

export async function fetchMatchAnalysis(id: string): Promise<MatchItem | null> {
  const res = await backendRequest<MatchItem>({ method: 'GET', path: `/matches/${id}/analysis` });
  return res.data;
}

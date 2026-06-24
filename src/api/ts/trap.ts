// ============================================================
// Tuzak Radar API Client
// Tuzak skoru: Kalabalık Algısı - Veri Teyidi + Risk Faktörleri
// ============================================================

import { backendRequest } from './client';
import type { TrapItem } from './types';

export async function fetchAllTraps(filter?: string): Promise<TrapItem[]> {
  const res = await backendRequest<TrapItem[]>({
    method: 'GET',
    path: filter ? `/trap/all?filter=${filter}` : '/trap/all',
  });
  return res.data || [];
}

export async function fetchMarketTraps(): Promise<TrapItem[]> {
  const res = await backendRequest<TrapItem[]>({ method: 'GET', path: '/trap/market' });
  return res.data || [];
}

export async function fetchMatchTraps(): Promise<TrapItem[]> {
  const res = await backendRequest<TrapItem[]>({ method: 'GET', path: '/trap/match' });
  return res.data || [];
}

export async function fetchTrapDetail(id: string): Promise<TrapItem | null> {
  const res = await backendRequest<TrapItem>({ method: 'GET', path: `/trap/${id}/detail` });
  return res.data;
}

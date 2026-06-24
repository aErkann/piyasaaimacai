// ============================================================
// Haber API Client
// Kullanılacak kaynaklar:
//   - RSS/API haber akışı
//   - AI etki analizi için OpenAI/Gemini
// ============================================================

import { backendRequest } from './client';
import type { NewsItem } from './types';

export async function fetchImpactNews(filter?: string): Promise<NewsItem[]> {
  const res = await backendRequest<NewsItem[]>({
    method: 'GET',
    path: filter ? `/news/impact?filter=${filter}` : '/news/impact',
  });
  return res.data || [];
}

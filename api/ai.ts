// ============================================================
// AI API Client
// Kullanılacak servisler:
//   - OpenAI (gpt-4o-mini)
//   - Gemini (gemini-2.0-flash)
// AI = açıklama motoru, tahmin motoru değil.
// ============================================================

import { backendRequest } from './client';
import type { AiExplanation } from './types';

export async function requestAiExplanation(type: string, id: string, data: unknown): Promise<AiExplanation | null> {
  const res = await backendRequest<AiExplanation>({
    method: 'POST',
    path: '/ai/explain',
    body: { type, id, data },
  });
  return res.data;
}

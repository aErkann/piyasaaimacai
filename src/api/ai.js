// ============================================================
// AI API Client
// Kullanılacak servisler:
//   - OpenAI (gpt-4o-mini)
//   - Gemini (gemini-2.0-flash)
// AI = açıklama motoru, tahmin motoru değil.
// ============================================================
import { backendRequest } from './client';
export async function requestAiExplanation(type, id, data) {
    const res = await backendRequest({
        method: 'POST',
        path: '/ai/explain',
        body: { type, id, data },
    });
    return res.data;
}
//# sourceMappingURL=ai.js.map
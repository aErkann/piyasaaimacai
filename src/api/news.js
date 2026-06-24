// ============================================================
// Haber API Client
// Kullanılacak kaynaklar:
//   - RSS/API haber akışı
//   - AI etki analizi için OpenAI/Gemini
// ============================================================
import { backendRequest } from './client';
export async function fetchImpactNews(filter) {
    const res = await backendRequest({
        method: 'GET',
        path: filter ? `/news/impact?filter=${filter}` : '/news/impact',
    });
    return res.data || [];
}
//# sourceMappingURL=news.js.map
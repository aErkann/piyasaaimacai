import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ResultItem {
  id: string; home: string; away: string; league: string; final: string;
  prediction: string; status: string; confidence: number;
  tags: string[]; reasons: string[];
}

const DEMO_RESULTS: ResultItem[] = [
  { id:'r1', home:'Beşiktaş', away:'Konyaspor', league:'Süper Lig', final:'2-1',
    prediction:'1 & 1.5 Üst', status:'Tahmin tuttu', confidence:69,
    tags:['MS 1','2.5 Üst','KG Var'], reasons:['Ev sahibi xG üstünlüğü skora yansıdı.','Maç önü 1 & 1.5 üst senaryosu doğru çalıştı.'] },
  { id:'r2', home:'Roma', away:'Torino', league:'Serie A', final:'0-0',
    prediction:'1X', status:'Kısmi tuttu', confidence:61,
    tags:['1X tuttu','Gol tahmini zayıf'], reasons:['Maç sonucu tarafında risk korunmuş oldu.','Gol pazarı beklentisi karşılık bulmadı.'] },
  { id:'r3', home:'PSG', away:'Lyon', league:'Ligue 1', final:'3-1',
    prediction:'1 & 2.5 Üst', status:'Tahmin tuttu', confidence:77,
    tags:['MS 1','Üst tuttu','Güçlü güven'], reasons:['Ev sahibi baskısı erken golle başladı.','Günün başarılı yüksek güvenli analizlerinden biri.'] },
];

export interface WeeklyReport {
  weekStart: string; weekEnd: string;
  totalMatches: number; hitCount: number; missCount: number; partialCount: number;
  successRate: string; aiSummary: string;
  details: ResultItem[];
}

@Injectable()
export class ResultsService {
  private cache = DEMO_RESULTS;

  @Cron(CronExpression.EVERY_HOUR)
  refreshResults() {
    console.log('[ResultsService] Results refreshed');
  }

  getDailyResults(): ResultItem[] {
    return this.cache;
  }

  getWeeklyReport(): WeeklyReport {
    const hits = this.cache.filter(r => r.status === 'Tahmin tuttu').length;
    const partials = this.cache.filter(r => r.status === 'Kısmi tuttu').length;
    const misses = this.cache.filter(r => !r.status.includes('tuttu')).length;
    const rate = this.cache.length > 0
      ? Math.round(((hits + partials * 0.5) / this.cache.length) * 100) + '%'
      : '%0';
    return {
      weekStart: '2026-06-16', weekEnd: '2026-06-22',
      totalMatches: this.cache.length, hitCount: hits, missCount: misses,
      partialCount: partials, successRate: rate,
      aiSummary: 'Bu hafta en başarılı pazar ev sahibi kaybetmez (1X) oldu. Gol pazarında dalgalanma yaşandı.',
      details: this.cache,
    };
  }
}

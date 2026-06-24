import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface NewsItem {
  id: string; type: string[]; icon: string;
  title: string; summary: string; tags: string[]; impact: string;
}

const DEMO_NEWS: NewsItem[] = [
  { id:'n1', type:['all','football','injury','impact'], icon:'📰',
    title:'Galatasaray\'da forvet belirsizliği',
    summary:'Muhtemel ilk 11 değişikliği, maç sonucu güven skorunu %74\'ten %68\'e düşürebilir.',
    tags:['Kadro','AI Etki','Süper Lig'], impact:'Tahmin güveni düşer' },
  { id:'n2', type:['all','football','impact'], icon:'📊',
    title:'Fenerbahçe maçında canlı xG farkı açılıyor',
    summary:'Ev sahibi xG ve şut üstünlüğü nedeniyle canlı 1X senaryosu güçleniyor.',
    tags:['Canlı','xG','Momentum'], impact:'Canlı tahmin güçlenir' },
  { id:'n3', type:['all','market','impact'], icon:'🚀',
    title:'Yeni AI token listeleme takvimi yaklaştı',
    summary:'AIx Launch için ilk likidite ve holder dağılımı listeleme günü skorlanacak.',
    tags:['Yeni Kripto','Listeleme','Risk'], impact:'Listeleme alarmı' },
  { id:'n4', type:['all','market'], icon:'🏛️',
    title:'Yeni halka arzda ilk işlem günü takip edilecek',
    summary:'Talep yoğunluğu ve ilk 3 işlem günü hacmi alpha skorunu belirleyecek.',
    tags:['Halka Arz','BIST','Yeni Hisse'], impact:'İlk işlem alarmı' },
  { id:'n5', type:['all','injury','football'], icon:'⛑️',
    title:'Premier League maçında savunma eksikleri',
    summary:'Chelsea tarafında eksik savunma oyuncuları KG Var ihtimalini yükseltiyor.',
    tags:['Sakatlık','Premier League','Gol Pazarı'], impact:'KG Var artar' },
];

@Injectable()
export class NewsService {
  private cache = DEMO_NEWS;

  @Cron(CronExpression.EVERY_10_MINUTES)
  refreshNews() {
    console.log('[NewsService] News feed refreshed');
  }

  getImpactNews(filter?: string): NewsItem[] {
    if (!filter || filter === 'all') return this.cache;
    return this.cache.filter(n => n.type.includes(filter));
  }
}

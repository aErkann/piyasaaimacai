import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface MatchItem {
  id: string; home: string; away: string; league: string;
  time: string; score: string; filter: string[];
  confidence: number; result: string; market: string; ms: string;
  goals: string; kg: string; scorePred: string;
  homeProb: number; drawProb: number; awayProb: number;
  risk: string; source: string; tags: string[]; reasons: string[];
}

const DEMO_MATCHES: MatchItem[] = [
  { id:'fb-ts', home:'Fenerbahçe', away:'Trabzonspor', league:'Süper Lig', time:'Canlı 63\'', score:'1-0', filter:['six','live','ai'],
    confidence:78, result:'1X', market:'Ev sahibi kaybetmez', ms:'1X', goals:'2.5 Üst eğilim', kg:'KG Var %58', scorePred:'2-1',
    homeProb:56, drawProb:25, awayProb:19, risk:'Orta', source:'API-Football live + stats',
    tags:['xG 1.42-0.51','Şut 11-4','Topla oynama %61','Canlı momentum'],
    reasons:['Ev sahibi xG ve şut üstünlüğü kurmuş durumda.','Trabzonspor geçişlerde tehdit üretiyor, bu yüzden KG Var tamamen düşük değil.','Canlı kırmızı kart veya sakatlık olursa tahmin iptal/yeniden hesaplanır.'] },
  { id:'gs-kay', home:'Galatasaray', away:'Kayserispor', league:'Süper Lig', time:'20:00', score:'Başlamadı', filter:['six','ai','goals'],
    confidence:74, result:'1 & 1.5 Üst', market:'Ev sahibi + gol', ms:'1', goals:'1.5 Üst %72', kg:'KG Yok %54', scorePred:'2-0',
    homeProb:68, drawProb:20, awayProb:12, risk:'Orta', source:'API-Football fixtures + form',
    tags:['Form 4G-1B','İç saha güçlü','Rakip eksik','1.5 üst'],
    reasons:['Galatasaray iç saha formu ve hücum üretimiyle önde.','Rakibin deplasman savunma verisi zayıf.','KG Var yerine ev sahibi gol ağırlıklı senaryo daha mantıklı.'] },
  { id:'bjk-ads', home:'Beşiktaş', away:'Adana DS', league:'Süper Lig', time:'21:30', score:'Başlamadı', filter:['six','risk','goals'],
    confidence:59, result:'KG Var', market:'Gollü ama riskli', ms:'Kararsız', goals:'2.5 Üst %55', kg:'KG Var %64', scorePred:'2-2',
    homeProb:38, drawProb:29, awayProb:33, risk:'Yüksek', source:'API-Football + team form',
    tags:['Savunma zayıf','KG eğilimi','MS belirsiz','Risk yüksek'],
    reasons:['İki takımda da gol üretme potansiyeli var fakat maç sonucu tarafında güven düşük.','Savunma verileri KG Var pazarını destekliyor.','MS seçimi yerine gol pazarı daha anlamlı görünüyor.'] },
  { id:'ars-che', home:'Arsenal', away:'Chelsea', league:'Premier League', time:'18:30', score:'Başlamadı', filter:['six','ai'],
    confidence:71, result:'1X', market:'Ev sahibi tarafı', ms:'1X', goals:'2.5 Alt/Üst sınır', kg:'KG Var %52', scorePred:'1-1 / 2-1',
    homeProb:50, drawProb:28, awayProb:22, risk:'Orta', source:'API-Football standings + form',
    tags:['Büyük maç','Tempo değişken','Ev avantajı','1X'],
    reasons:['Ev sahibi form ve saha avantajı nedeniyle önde.','Derbi/büyük maç dinamiği sonucu zorlaştırıyor.','Güven yüksek değil, kontrollü analiz.'] },
  { id:'real-sev', home:'Real Madrid', away:'Sevilla', league:'La Liga', time:'22:00', score:'Başlamadı', filter:['six','ai','goals'],
    confidence:80, result:'1', market:'Güçlü ev sahibi', ms:'1', goals:'2.5 Üst %61', kg:'KG Yok %51', scorePred:'3-1',
    homeProb:72, drawProb:18, awayProb:10, risk:'Düşük-Orta', source:'API-Football predictions + form',
    tags:['Form üstün','Ev sahibi','Gol beklentisi','Güçlü güven'],
    reasons:['Ev sahibi form, kadro kalitesi ve saha avantajı belirgin.','Sevilla savunma kırılganlığı gol beklentisini artırıyor.','Güven skoru günün en yükseklerinden biri.'] },
  { id:'int-laz', home:'Inter', away:'Lazio', league:'Serie A', time:'Canlı 31\'', score:'0-0', filter:['six','live','risk'],
    confidence:62, result:'2. yarı gol', market:'Canlı gol bekleme', ms:'1X', goals:'1.5 Üst canlı', kg:'KG Düşük', scorePred:'1-0',
    homeProb:57, drawProb:30, awayProb:13, risk:'Orta', source:'API-Football live stats',
    tags:['Canlı 0-0','Şut az','2. yarı tempo','Sarı kart 2'],
    reasons:['İlk yarı tempo düşük, fakat ev sahibi baskısı artıyor.','Canlı veri 2. yarı gol ihtimalini öne çıkarıyor.','Tempo artmazsa tahmin geçersizleşir.'] },
];

@Injectable()
export class MatchesService {
  private cache = DEMO_MATCHES;

  @Cron(CronExpression.EVERY_30_SECONDS)
  refreshLive() {
    console.log('[MatchesService] Live scores refreshed');
  }

  getDailySix(): MatchItem[] {
    return this.cache;
  }

  getLiveScores(): MatchItem[] {
    return this.cache.filter(m => m.filter.includes('live'));
  }

  getMatchAnalysis(id: string): MatchItem | undefined {
    return this.cache.find(m => m.id === id);
  }
}

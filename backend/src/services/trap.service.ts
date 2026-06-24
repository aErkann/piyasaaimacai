import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface TrapItem {
  id: string; kind: string; type: string[]; title: string; subtitle: string;
  score: number; crowd: number; data: number; trap: number; risk: string; label: string;
  crowdView: string; dataView: string; result: string;
  tags: string[]; ifThen: string[];
}

const DEMO_TRAPS: TrapItem[] = [
  { id:'t-nova', kind:'market', type:['all','market','pump'], title:'NOVA / Yeni DEX Token', subtitle:'Riskli pump alarmı',
    score:74, crowd:88, data:41, trap:71, risk:'Yüksek', label:'Kalabalık pump\'a koşuyor',
    crowdView:'Fiyat +38%, sosyal ilgi yüksek, yeni token heyecanı var.',
    dataView:'Likidite düşük, holder yoğunluğu riskli, hacim var ama alış kalitesi zayıf.',
    result:'Uzak dur / sadece izle.', tags:['Likidite tuzağı','Holder riski','Yeni token','Pump riski'],
    ifThen:['Eğer likidite 250K$ üstüne çıkar ve holder dağılımı düzelirse risk azalır.','Eğer hacim düşerken fiyat şişmeye devam ederse tuzak skoru 85+ olur.'] },
  { id:'t-arb', kind:'market', type:['all','market','quiet'], title:'ARB / Arbitrum', subtitle:'Sessiz boğa hazırlığı',
    score:79, crowd:32, data:76, trap:18, risk:'Orta', label:'Kalabalık henüz fark etmedi',
    crowdView:'Fiyat yatay, sosyal ilgi düşük, büyük hareket yok gibi görünüyor.',
    dataView:'Hacim tabanı yükseliyor, RSI toparlanıyor, satış baskısı azalıyor.',
    result:'Sessiz izleme adayı.', tags:['Sessiz boğa','Hacim tabanı','RSI dönüş','Direnç alarmı'],
    ifThen:['Eğer 0.94 üstü hacimli kapanış gelirse alpha skoru 88\'e çıkar.','Eğer hacim düşer ve fiyat dip altına sarkarsa sinyal iptal olur.'] },
  { id:'t-sol', kind:'market', type:['all','market','quiet'], title:'SOL / Solana', subtitle:'Kırılım öncesi tuzak kontrolü',
    score:82, crowd:67, data:81, trap:29, risk:'Orta', label:'Boğa güçlü ama teyit şart',
    crowdView:'Kalabalık SOL tarafında pozitif, kısa vadeli boğa beklentisi var.',
    dataView:'Hacim destekli trend var fakat direnç bölgesine yaklaşılmış durumda.',
    result:'Boğa adayı; ama direnç üstü kapanış gelmeden agresif yorum yapılmaz.',
    tags:['Direnç testi','Hacim x2.1','Boğa teyidi','İptal seviyesi'],
    ifThen:['Eğer 145 üstü hacimli kalırsa boğa skoru güçlenir.','Eğer 139 altına hacimli iner ise sinyal iptal edilir.'] },
  { id:'t-gs', kind:'match', type:['all','match','lineup','odds'], title:'Galatasaray - Kayserispor', subtitle:'Favori / erken gol tuzağı',
    score:72, crowd:84, data:58, trap:63, risk:'Orta-Yüksek', label:'Kalabalık farklı galibiyet bekliyor',
    crowdView:'MS 1 ve 2.5 üst popüler. Kalabalık erken gol ve rahat galibiyet bekliyor.',
    dataView:'Forvet belirsizliği, rakibin düşük blok oyunu ve ilk yarı tempo riski var.',
    result:'MS 1 yerine 1 & 1.5 üst veya ikinci yarı gol daha kontrollü senaryo.',
    tags:['Kadro tuzağı','Favori tuzağı','İlk yarı gol riski','Düşük blok'],
    ifThen:['Eğer ilk 20 dakikada ev sahibi 5+ şut bulursa üst ihtimali artar.','Eğer ilk yarı xG 0.40 altında kalırsa 2.5 üst zayıflar.'] },
  { id:'t-bjk', kind:'match', type:['all','match','odds'], title:'Beşiktaş - Adana DS', subtitle:'KG Var kalabalık tuzağı',
    score:69, crowd:79, data:52, trap:64, risk:'Yüksek', label:'Gol pazarı popüler ama riskli',
    crowdView:'İki takım savunması zayıf göründüğü için KG Var çok popüler.',
    dataView:'Maç sonucu belirsiz, tempo dalgalı ve ilk 11\'e göre gol verisi değişebilir.',
    result:'KG Var tek başına temiz değil.', tags:['KG Var tuzağı','Tempo riski','MS kararsız','Canlı bekle'],
    ifThen:['Eğer ilk 15 dakikada iki taraf toplam 4+ şut bulursa KG güçlenir.','Eğer maç düşük tempoda başlarsa KG tuzak skoru 75+ olur.'] },
  { id:'t-inter', kind:'match', type:['all','match','live'], title:'Inter - Lazio', subtitle:'Canlı 0-0 gol tuzağı',
    score:66, crowd:71, data:49, trap:59, risk:'Orta', label:'Canlı gol beklentisi acele olabilir',
    crowdView:'0-0 devam ettiği için ikinci yarı gol beklentisi artıyor.',
    dataView:'Şut az, xG düşük, tempo yükselmeden gol tahmini zayıf kalıyor.',
    result:'Canlı gol için tempo teyidi beklenmeli.', tags:['Canlı tuzak','xG düşük','Tempo teyidi','2. yarı gol'],
    ifThen:['Eğer 55. dakikaya kadar xG 0.90 üstüne çıkarsa gol ihtimali artar.','Eğer şut sayısı düşük kalırsa canlı gol sinyali iptal olur.'] },
];

@Injectable()
export class TrapService {
  private cache = DEMO_TRAPS;

  @Cron(CronExpression.EVERY_5_MINUTES)
  refreshTraps() {
    console.log('[TrapService] Trap radar refreshed');
  }

  getAllTraps(filter?: string): TrapItem[] {
    if (!filter || filter === 'all') return this.cache;
    return this.cache.filter(t => t.type.includes(filter));
  }

  getMarketTraps(): TrapItem[] {
    return this.cache.filter(t => t.kind === 'market');
  }

  getMatchTraps(): TrapItem[] {
    return this.cache.filter(t => t.kind === 'match');
  }

  getTrapDetail(id: string): TrapItem | undefined {
    return this.cache.find(t => t.id === id);
  }
}

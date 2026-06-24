import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface MarketAsset {
  id: string; symbol: string; name: string; market: string;
  price: string; alpha: number; upProb: number; downProb: number;
  confidence: string; risk: string; signal: string; summary: string;
  valid: string; source: string; tags: string[]; reasons: string[]; kinds: string[];
}

const DEMO_ASSETS: MarketAsset[] = [
  { id:'sol', symbol:'SOL', name:'Solana', market:'Global Kripto', kinds:['bull','watch'],
    price:'$142.80', alpha:84, upProb:72, downProb:28, confidence:'Orta-Yüksek', risk:'Orta',
    signal:'Boğa geçiş adayı', summary:'Trend kırılımına hacimli yaklaşım var.',
    valid:'4 saat', source:'CoinGecko + Binance market data',
    tags:['EMA20 üstü','Hacim x2.1','RSI 59','Direnç yakın'],
    reasons:['Fiyat kısa vadeli ortalamaların üzerinde kalıyor.','Hacim artışı fiyat hareketini destekliyor.','RSI aşırı alımda değil, hareket alanı var.','Direnç üstü kapanışta skor 90+ bölgesine çıkabilir.'] },
  { id:'arb', symbol:'ARB', name:'Arbitrum', market:'Global Kripto', kinds:['bull'],
    price:'$0.91', alpha:73, upProb:64, downProb:36, confidence:'Orta', risk:'Orta',
    signal:'Dipten dönüş adayı', summary:'Düşüş sonrası momentum toparlanıyor.',
    valid:'6 saat', source:'CoinGecko + OHLC',
    tags:['RSI 48','Dip bölge','Hacim x1.4','Trend nötr+'],
    reasons:['Aşırı satıştan çıkış bölgesi izleniyor.','Hacim henüz patlamadı ama toparlanma var.','Direnç teyidi gelmeden güçlü al sinyali sayılmaz.','Risk/ödül oranı izlemeye değer.'] },
  { id:'nova', symbol:'NOVA', name:'Nova Token', market:'Yeni DEX Token', kinds:['newcrypto','bear'],
    price:'$0.0042', alpha:61, upProb:44, downProb:56, confidence:'Düşük', risk:'Yüksek',
    signal:'Riskli pump alarmı', summary:'Hareket güçlü ama likidite ve holder riski zayıf.',
    valid:'1 saat', source:'DEX Screener',
    tags:['Yeni token','Likidite düşük','Holder riski','Pump riski'],
    reasons:['Hacim artışı var fakat likidite düşük.','Yeni token olduğu için rug/pump riski yüksek.','Sosyal ilgi artışı fiyata yansımış olabilir.','Risk filtresi nedeniyle boğa adayı listesine alınmaz.'] },
  { id:'aix', symbol:'AIX', name:'AIx Launch', market:'Yeni Kripto', kinds:['newcrypto'],
    price:'Liste öncesi', alpha:68, upProb:58, downProb:42, confidence:'Düşük-Orta', risk:'Yüksek',
    signal:'Yaklaşan listeleme', summary:'AI temalı yeni token, ilk likidite sonrası skorlanacak.',
    valid:'Listeleme günü', source:'Launchpad + DEX Screener',
    tags:['3 gün sonra','AI teması','Likidite bekleniyor','Whitelist'],
    reasons:['Henüz fiyat/hacim oluşmadı, bu yüzden kesin sinyal değil.','Listeleme sonrası ilk 30 dakika likidite takip edilmeli.','Kontrat doğrulama ve holder dağılımı kontrol edilmeden güçlü sinyal verilmez.','Tema güçlü ama ilk işlem riski yüksek.'] },
  { id:'betae', symbol:'BETAE', name:'Beta Enerji', market:'Yeni Hisse / Halka Arz', kinds:['ipo'],
    price:'₺40.00 arz', alpha:66, upProb:60, downProb:40, confidence:'Düşük-Orta', risk:'Orta-Yüksek',
    signal:'Halka arz takip adayı', summary:'Talep toplama sonrası ilk işlem hacmi izlenecek.',
    valid:'İlk 3 işlem günü', source:'KAP/SPK + halka arz verisi',
    tags:['Enerji sektörü','Bireysele eşit','Arz takvimi','İlk işlem takip'],
    reasons:['Halka arzlarda fiyat geçmişi sınırlı olduğu için teknik sinyal oluşmaz.','İlk işlem günü hacim, tavan/çözülme ve emir derinliği izlenmeli.','Arz büyüklüğü ve sektör ilgisi alpha skorunu etkiler.','Kullanıcıya al demeyiz; ilk işlem sonrası takip senaryosu veririz.'] },
  { id:'thy', symbol:'THYAO', name:'Türk Hava Yolları', market:'BIST', kinds:['bull','watch'],
    price:'₺301.50', alpha:70, upProb:62, downProb:38, confidence:'Orta', risk:'Orta',
    signal:'Kapanış teyidi bekliyor', summary:'Hacim destekli trend pozitife dönüyor.',
    valid:'Günlük kapanış', source:'BIST gecikmeli/EOD',
    tags:['BIST','Hacim x1.25','RSI 55','Direnç takip'],
    reasons:['Günlük kapanış tarafında pozitif görünüm var.','Hacim ortalamanın hafif üzerinde.','Direnç üstü kapanış sinyal gücünü artırır.','BIST verisi lisans durumuna göre gecikmeli gösterilir.'] },
  { id:'btctry', symbol:'BTCTRY', name:'Bitcoin / TL', market:'Yerli Borsa', kinds:['local','bull'],
    price:'₺2.115M', alpha:78, upProb:67, downProb:33, confidence:'Orta', risk:'Orta',
    signal:'Yerli talep güçleniyor', summary:'TRY paritesi hacmi globalden pozitif ayrışıyor.',
    valid:'2 saat', source:'BtcTurk/Binance TR ticker',
    tags:['TRY paritesi','Yerli hacim','Spread takip','Fiyat farkı'],
    reasons:['Yerli borsada TRY tarafı hacimleniyor.','Global fiyatla yerli parite arasındaki fark takip edilebilir.','Spread açılırsa risk artar.','Bu veri arbitraj vaadi değil, piyasa talep göstergesidir.'] },
  { id:'ethtry', symbol:'ETHTRY', name:'Ethereum / TL', market:'Yerli Borsa', kinds:['local','bear'],
    price:'₺103.800', alpha:49, upProb:43, downProb:57, confidence:'Orta', risk:'Orta',
    signal:'Zayıf talep riski', summary:'Yerli hacim düşük, kısa vadede satış baskısı önde.',
    valid:'2 saat', source:'BtcTurk/Paribu market data',
    tags:['TRY paritesi','Hacim zayıf','RSI 47','Talep düşük'],
    reasons:['Yerli paritede hacim zayıf kalıyor.','Global hareket yerli talep tarafından desteklenmiyor.','Düşüş ihtimali yükseliş ihtimalinden yüksek görünüyor.','Takip için hacim artışı beklenmeli.'] },
];

@Injectable()
export class MarketService {
  private cache: MarketAsset[] = DEMO_ASSETS;

  @Cron(CronExpression.EVERY_5_MINUTES)
  refreshCache() {
    console.log('[MarketService] Cache refreshed at', new Date().toISOString());
  }

  getAlphaRadar(filter?: string): MarketAsset[] {
    if (!filter || filter === 'all') return this.cache;
    if (filter === 'watch') return this.cache.filter(x => ['sol','thy'].includes(x.id));
    return this.cache.filter(x => x.kinds.includes(filter));
  }

  getBullCandidates(): MarketAsset[] {
    return this.cache.filter(x => x.upProb >= 60 && x.risk !== 'Yüksek');
  }

  getBearCandidates(): MarketAsset[] {
    return this.cache.filter(x => x.downProb > x.upProb || x.risk === 'Yüksek');
  }

  getNewCrypto(): MarketAsset[] {
    return this.cache.filter(x => x.kinds.includes('newcrypto'));
  }

  getLocalOpportunities(): MarketAsset[] {
    return this.cache.filter(x => x.kinds.includes('local'));
  }

  getIpoWatch(): MarketAsset[] {
    return this.cache.filter(x => x.kinds.includes('ipo'));
  }
}

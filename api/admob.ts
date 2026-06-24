// ============================================================
// AdMob Rewarded Video Entegrasyonu
// Capacitor AdMob plugin üzerinden çalışır.
// API key'ler backend'de, AdMob ID'ler .env'de tutulur.
// ============================================================

// Test reklam ID'leri (yayın öncesi kullanılacak)
// Android: ca-app-pub-3940256099942544/5224354917
// iOS:     ca-app-pub-3940256099942544/1712485313

const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

export interface AdMobConfig {
  rewardedUnitId: string;
  appId: string;
}

let currentConfig: AdMobConfig = {
  rewardedUnitId: TEST_REWARDED_ID,
  appId: '',
};

export function configureAdMob(config: Partial<AdMobConfig>) {
  if (config.rewardedUnitId) currentConfig.rewardedUnitId = config.rewardedUnitId;
  if (config.appId) currentConfig.appId = config.appId;
}

export async function showRewardedAd(): Promise<boolean> {
  // Capacitor AdMob plugin çağrısı
  // Gerçek cihazda: AdMob rewarded video gösterir
  // Web/emülatör: Simüle eder

  if (typeof (window as any).Capacitor !== 'undefined' &&
      (window as any).Capacitor.isNativePlatform()) {
    try {
      // Gerçek AdMob gösterimi
      const { RewardedAd } = await import(
        /* webpackIgnore: true */
        '@capacitor-community/admob'
      );
      await RewardedAd.prepare({ adId: currentConfig.rewardedUnitId });
      const result = await RewardedAd.show();
      return result ? result.adReward?.amount > 0 : false;
    } catch (err) {
      console.warn('[AdMob] Native ad failed, using fallback:', err);
      return fallbackAd();
    }
  }
  return fallbackAd();
}

async function fallbackAd(): Promise<boolean> {
  // Web/emülatör için 5 saniyelik simülasyon
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 5000);
  });
}

export function getAdMobConfig(): AdMobConfig {
  return { ...currentConfig };
}

// ============================================================
// AdMob Rewarded Video + Banner Entegrasyonu
// @capacitor-community/admob (v6) üzerinden çalışır.
// Gerçek ID'ler AdMob panelinden alınıp buraya yazılır.
// ============================================================

// CANLI AdMob ID'leri (PiyasaAI + MaçAI + Tuzak Radar)
// Android App ID:   ca-app-pub-6440512201259891~8121881217
// Android Rewarded: ca-app-pub-6440512201259891/7187652032
// Android Banner:   ca-app-pub-6440512201259891/6892138563

export type BannerPosition = 'bottom' | 'top';

export interface AdMobConfig {
  rewardedUnitId: string;
  bannerUnitId: string;
  appId: string;
}

const _REWARDED = 'ca-app-pub-6440512201259891/7187652032';
const _BANNER   = 'ca-app-pub-6440512201259891/6892138563';

let currentConfig: AdMobConfig = {
  rewardedUnitId: _REWARDED,
  bannerUnitId: _BANNER,
  appId: 'ca-app-pub-6440512201259891~8121881217',
};

let bannerVisible = false;
let initialized = false;

export function configureAdMob(config: Partial<AdMobConfig>) {
  if (config.rewardedUnitId) currentConfig.rewardedUnitId = config.rewardedUnitId;
  if (config.bannerUnitId) currentConfig.bannerUnitId = config.bannerUnitId;
  if (config.appId) currentConfig.appId = config.appId;
}

async function ensureInitialized() {
  if (initialized) return;
  const { AdMob } = await import('@capacitor-community/admob');
  await AdMob.initialize({});
  initialized = true;
}

export async function showRewardedAd(): Promise<boolean> {
  if (!isNative()) return fallbackAd();
  try {
    await ensureInitialized();
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
    let rewarded = false;
    const rewardListener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      () => { rewarded = true; }
    );
    try {
      await AdMob.prepareRewardVideoAd({ adId: currentConfig.rewardedUnitId });
      const item = await AdMob.showRewardVideoAd();
      if (item && typeof item.amount === 'number' && item.amount > 0) rewarded = true;
    } finally {
      await rewardListener.remove();
    }
    return rewarded;
  } catch (err) {
    console.warn('[AdMob] Rewarded ad failed, fallback:', err);
    return fallbackAd();
  }
}

export async function showBanner(position: BannerPosition = 'bottom'): Promise<void> {
  if (!isNative()) return;
  if (bannerVisible) return;
  try {
    await ensureInitialized();
    const { AdMob, BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId: currentConfig.bannerUnitId,
      position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
    });
    bannerVisible = true;
  } catch (err) {
    console.warn('[AdMob] Banner show failed:', err);
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNative()) return;
  if (!bannerVisible) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.hideBanner();
    bannerVisible = false;
  } catch (err) {
    console.warn('[AdMob] Banner hide failed:', err);
  }
}

export function getAdMobConfig(): AdMobConfig {
  return { ...currentConfig };
}

// ===== Internal =====

function isNative(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' &&
         (window as any).Capacitor.isNativePlatform();
}

async function fallbackAd(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 5000);
  });
}

// ============================================================
// AdMob Rewarded Video + Banner Entegrasyonu
// @capacitor-community/admob (v6) üzerinden çalışır.
// Gerçek ID'ler AdMob panelinden alınıp buraya yazılır.
// ============================================================
const _REWARDED = 'ca-app-pub-6440512201259891/7187652032';
const _BANNER = 'ca-app-pub-6440512201259891/6892138563';
let currentConfig = {
    rewardedUnitId: _REWARDED,
    bannerUnitId: _BANNER,
    appId: 'ca-app-pub-6440512201259891~8121881217',
};
let bannerVisible = false;
let initialized = false;
export function configureAdMob(config) {
    if (config.rewardedUnitId)
        currentConfig.rewardedUnitId = config.rewardedUnitId;
    if (config.bannerUnitId)
        currentConfig.bannerUnitId = config.bannerUnitId;
    if (config.appId)
        currentConfig.appId = config.appId;
}
async function ensureInitialized() {
    if (initialized)
        return;
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({});
    initialized = true;
}
export async function showRewardedAd() {
    if (!isNative())
        return fallbackAd();
    try {
        await ensureInitialized();
        const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
        let rewarded = false;
        const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { rewarded = true; });
        try {
            await AdMob.prepareRewardVideoAd({ adId: currentConfig.rewardedUnitId });
            const item = await AdMob.showRewardVideoAd();
            if (item && typeof item.amount === 'number' && item.amount > 0)
                rewarded = true;
        }
        finally {
            await rewardListener.remove();
        }
        return rewarded;
    }
    catch (err) {
        console.warn('[AdMob] Rewarded ad failed, fallback:', err);
        return fallbackAd();
    }
}
export async function showBanner(position = 'bottom') {
    if (!isNative())
        return;
    if (bannerVisible)
        return;
    try {
        await ensureInitialized();
        const { AdMob, BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob');
        await AdMob.showBanner({
            adId: currentConfig.bannerUnitId,
            position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
        });
        bannerVisible = true;
    }
    catch (err) {
        console.warn('[AdMob] Banner show failed:', err);
    }
}
export async function hideBanner() {
    if (!isNative())
        return;
    if (!bannerVisible)
        return;
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.hideBanner();
        bannerVisible = false;
    }
    catch (err) {
        console.warn('[AdMob] Banner hide failed:', err);
    }
}
export function getAdMobConfig() {
    return { ...currentConfig };
}
// ===== Internal =====
function isNative() {
    return typeof window.Capacitor !== 'undefined' &&
        window.Capacitor.isNativePlatform();
}
async function fallbackAd() {
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), 5000);
    });
}
//# sourceMappingURL=admob.js.map
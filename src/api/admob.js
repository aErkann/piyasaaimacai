// ============================================================
// AdMob Rewarded Video + Banner Entegrasyonu
// Capacitor AdMob plugin üzerinden çalışır.
// CANLI ID'ler (PiyasaAI + MaçAI + Tuzak Radar)
// ============================================================
const _REWARDED = 'ca-app-pub-6440512201259891/7187652032';
const _BANNER = 'ca-app-pub-6440512201259891/6892138563';
let currentConfig = {
    rewardedUnitId: _REWARDED,
    bannerUnitId: _BANNER,
    appId: 'ca-app-pub-6440512201259891~8121881217',
};
let bannerVisible = false;
export function configureAdMob(config) {
    if (config.rewardedUnitId)
        currentConfig.rewardedUnitId = config.rewardedUnitId;
    if (config.bannerUnitId)
        currentConfig.bannerUnitId = config.bannerUnitId;
    if (config.appId)
        currentConfig.appId = config.appId;
}
export async function showRewardedAd() {
    if (isNative()) {
        try {
            const { RewardedAd } = await import(
            /* webpackIgnore: true */
            '@capacitor-community/admob');
            await RewardedAd.prepare({ adId: currentConfig.rewardedUnitId });
            const result = await RewardedAd.show();
            return result ? result.adReward?.amount > 0 : false;
        }
        catch (err) {
            console.warn('[AdMob] Rewarded ad failed, fallback:', err);
            return fallbackAd();
        }
    }
    return fallbackAd();
}
export async function showBanner(position = 'bottom') {
    if (!isNative())
        return;
    if (bannerVisible)
        return;
    try {
        const { BannerAd } = await import(
        /* webpackIgnore: true */
        '@capacitor-community/admob');
        await BannerAd.show({
            adId: currentConfig.bannerUnitId,
            position: position === 'top' ? 'TOP_CENTER' : 'BOTTOM_CENTER',
            size: 'ADAPTIVE_BANNER',
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
        const { BannerAd } = await import(
        /* webpackIgnore: true */
        '@capacitor-community/admob');
        await BannerAd.hide();
        bannerVisible = false;
    }
    catch (err) {
        console.warn('[AdMob] Banner hide failed:', err);
    }
}
export function getAdMobConfig() {
    return { ...currentConfig };
}
function isNative() {
    return typeof window.Capacitor !== 'undefined' &&
        window.Capacitor.isNativePlatform();
}
async function fallbackAd() {
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), 5000);
    });
}

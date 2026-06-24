// ============================================================
// AdMob Rewarded Video + Banner Entegrasyonu
// Capacitor AdMob plugin üzerinden çalışır.
// Gerçek ID'ler AdMob panelinden alınıp buraya yazılır.
// ============================================================
// Test ID'ler (yayın öncesi kullanılır, canlıda gerçek ID'lerle değiştir)
// Android Rewarded: ca-app-pub-3940256099942544/5224354917
// Android Banner:   ca-app-pub-3940256099942544/6300978111
// iOS Rewarded:     ca-app-pub-3940256099942544/1712485313
// iOS Banner:       ca-app-pub-3940256099942544/2934735716
const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
let currentConfig = {
    rewardedUnitId: TEST_REWARDED,
    bannerUnitId: TEST_BANNER,
    appId: '',
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
//# sourceMappingURL=admob.js.map

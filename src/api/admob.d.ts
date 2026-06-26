export type BannerPosition = 'bottom' | 'top';
export interface AdMobConfig {
    rewardedUnitId: string;
    bannerUnitId: string;
    appId: string;
}
export declare function configureAdMob(config: Partial<AdMobConfig>): void;
export declare function showRewardedAd(): Promise<boolean>;
export declare function showBanner(position?: BannerPosition): Promise<void>;
export declare function hideBanner(): Promise<void>;
export declare function getAdMobConfig(): AdMobConfig;
//# sourceMappingURL=admob.d.ts.map
export interface AdMobConfig {
    rewardedUnitId: string;
    appId: string;
}
export declare function configureAdMob(config: Partial<AdMobConfig>): void;
export declare function showRewardedAd(): Promise<boolean>;
export declare function getAdMobConfig(): AdMobConfig;
//# sourceMappingURL=admob.d.ts.map
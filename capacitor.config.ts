import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.piyasaai.app',
  appName: 'PiyasaAI MaçAI',
  webDir: 'src',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#03070b',
    },
    AdMob: {
      appId: process.env.ADMOB_ANDROID_APP_ID || 'ca-app-pub-6440512201259891~8121881217',
    },
  },
};

export default config;

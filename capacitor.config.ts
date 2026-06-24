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
  },
};

export default config;

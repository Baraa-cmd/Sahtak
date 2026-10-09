import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sahtak.dierhafer',
  appName: 'صحتك دير حافر',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  }
};

export default config;

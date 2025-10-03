import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'app-residences',
  webDir: 'www',
  server: {
    cleartext: true,
    allowNavigation: ['http://192.168.50.211:8000'],
    androidScheme: 'http'
  }
};

export default config;

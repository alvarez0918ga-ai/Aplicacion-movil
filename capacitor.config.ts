import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'mi_proyecto',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#2563eb',
      sound: 'beep.wav',
    },
  },
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.furama.resort.driver',
  appName: 'Furama Driver App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Uncomment the line below if you want to use your local API server
    // url: 'http://YOUR_API_SERVER_IP:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#065f46',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#065f46',
    },
  },
};

export default config;


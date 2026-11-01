import type { CapacitorConfig } from '@capacitor/cli';

/** Android app shell. Web build for the app: `vite build --mode android` → dist-android/ (website stays in dist/). */
const config: CapacitorConfig = {
  appId: 'com.immersa.anatomy',
  appName: 'Immersa',
  webDir: 'dist-android',
  backgroundColor: '#0b0d10',
  loggingBehavior: 'debug',
  android: {
    // ES2022 bundle + WebGL2 (three r186) need a modern System WebView; older ones get Capacitor's update prompt.
    minWebViewVersion: 100,
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    backgroundColor: '#0b0d10',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
  },
};

export default config;

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.playearn.arcade",
  appName: "Play N' Earn",
  webDir: "out",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#38bdf8",
      showSpinner: false,
    },
  },
};

export default config;

module.exports = {
  expo: {
    name: "Step & Water",
    slug: "step-water-app",
    version: "1.0.0",
    orientation: "portrait",
    // App icon and splash screen configuration
    // For production: Add icon.png (1024x1024px) and splash.png (2048x2048px) to assets folder
    // If assets are missing, Expo will use default icons (app will still work)
    // icon: "./assets/icon.png", // Uncomment when you add icon.png
    userInterfaceStyle: "automatic",
    splash: {
      // image: "./assets/splash.png", // Uncomment when you add splash.png
      resizeMode: "contain",
      backgroundColor: "#6366f1"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.stepwater.app",
      infoPlist: {
        NSMotionUsageDescription: "We need access to motion data to track your steps.",
        NSHealthShareUsageDescription: "We need access to health data to track your activity.",
        NSHealthUpdateUsageDescription: "We need access to update health data with your activity."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#6366f1",
        // foregroundImage: "./assets/icon.png" // Uncomment when you add icon.png
      },
      package: "com.stepwater.app",
      versionCode: 1,
      permissions: [
        "ACTIVITY_RECOGNITION",
        "POST_NOTIFICATIONS",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_HEALTH",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "ACCESS_FINE_LOCATION"
      ],
      // Android manifest configurations for foreground service
      // These ensure the foreground service works correctly in production builds
      googleServicesFile: undefined, // Not using Firebase
      // Foreground service configuration for production
      intentFilters: [
        {
          action: "android.intent.action.MAIN",
          category: ["android.intent.category.LAUNCHER"]
        }
      ]
    },
    plugins: [
      "expo-notifications",
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 23,
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0"
          }
        }
      ]
    ],
    // EAS project ID removed - not required for Expo Go
    // Only needed when building with EAS Build
    scheme: "stepwater",
    extra: {
      // Supabase configuration
      // These will be available via Constants.expoConfig.extra
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      // EAS project configuration
      eas: {
        projectId: "196b9270-8e92-43a3-aa34-1d6c52d36a63"
      }
    }
  }
};


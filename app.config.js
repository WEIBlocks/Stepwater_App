module.exports = {
  expo: {
    name: "Step & Water",
    slug: "step-water-app",
    version: "1.0.0",
    orientation: "portrait",
    // Icon and splash removed for Expo Go - they're not required for development
    // Add them back when creating a production build
    userInterfaceStyle: "automatic",
    splash: {
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
        backgroundColor: "#6366f1"
      },
      package: "com.stepwater.app",
      versionCode: 1,
      permissions: [
        "ACTIVITY_RECOGNITION",
        "POST_NOTIFICATIONS"
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


const fs = require('fs');
const path = require('path');

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production' || process.env.EAS_BUILD_PROFILE === 'production';

// Check if Firebase config files exist
const androidGoogleServicesPath = './android/app/google-services.json';
const iosGoogleServicesPath = './ios/StepAndWaterApp/GoogleService-Info.plist';
const hasAndroidGoogleServices = fs.existsSync(path.resolve(__dirname, androidGoogleServicesPath));
const hasIosGoogleServices = fs.existsSync(path.resolve(__dirname, iosGoogleServicesPath));

// AdMob App IDs
// Test IDs for development, replace production IDs with your actual AdMob App IDs
const ADMOB_APP_IDS = {
  android: {
    test: 'ca-app-pub-3940256099942544~3347511713',
    production: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY', // TODO: Replace with your Android App ID
  },
  ios: {
    test: 'ca-app-pub-3940256099942544~1458002511',
    production: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY', // TODO: Replace with your iOS App ID
  },
};

module.exports = {
  expo: {
    owner: "sultan2", // <-- ADD THIS LINE
    name: "Step & Water",
    slug: "step-water-app",
    version: "1.0.0",
    orientation: "portrait",
    // Production optimizations
    jsEngine: "hermes",
    // App icon and splash screen configuration
    // For production: Add icon.png (1024x1024px) and splash.png (2048x2048px) to assets folder
    // If assets are missing, Expo will use default icons (app will still work)
    icon: "./assets/icon.png", // App icon
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
      bundleIdentifier: "com.myname.stepwater",
      infoPlist: {
        NSMotionUsageDescription: "We need access to motion data to track your steps.",
        NSHealthShareUsageDescription: "We need access to health data to track your activity.",
        NSHealthUpdateUsageDescription: "We need access to update health data with your activity."
      },
      // Firebase configuration for iOS (only if file exists)
      ...(hasIosGoogleServices && { googleServicesFile: iosGoogleServicesPath }),
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#6366f1",
        foregroundImage: "./assets/icon.png" // Android adaptive icon foreground
      },
      package: "com.myname.stepwater",
      label: "Step & Water", // Explicit app label for Android
      versionCode: 1,
      permissions: [
        "ACTIVITY_RECOGNITION",
        "POST_NOTIFICATIONS",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_DATA_SYNC",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "ACCESS_FINE_LOCATION"
      ],
      // Android manifest configurations for foreground service
      // These ensure the foreground service works correctly in production builds
      // Firebase configuration for Android (only if file exists)
      ...(hasAndroidGoogleServices && { googleServicesFile: androidGoogleServicesPath }),
      // Production build optimizations
      allowBackup: true
    },
    plugins: [
      "expo-notifications",
      // react-native-iap configuration - specifies Google Play Store variant
      [
        "react-native-iap",
        {
          paymentProvider: "Play Store"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 23,
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0",
            // Production build optimizations
            enableProguardInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
            // Ensure proper Java version
            javaVersion: "17",
            // ProGuard rules (will be applied if ProGuard is enabled)
            proguardFiles: ["proguard-rules.pro"]
          },
          ios: {
            // iOS build optimizations
            deploymentTarget: "13.4"
          }
        }
      ],
      // Google AdMob configuration
      [
        "react-native-google-mobile-ads",
        {
          // Android AdMob App ID (uses test ID in dev, production in release)
          androidAppId: isProduction
            ? ADMOB_APP_IDS.android.production
            : ADMOB_APP_IDS.android.test,
          // iOS AdMob App ID (uses test ID in dev, production in release)
          iosAppId: isProduction
            ? ADMOB_APP_IDS.ios.production
            : ADMOB_APP_IDS.ios.test,
          // Delay app measurement until explicit initialization (recommended)
          delayAppMeasurementInit: true,
          // User tracking description for iOS ATT prompt (required for iOS 14+)
          userTrackingUsageDescription:
            "This identifier will be used to deliver personalized ads to you.",
        }
      ],
      "./plugins/withStepWaterService.js"
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


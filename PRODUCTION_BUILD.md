# Production Build Guide

This guide will help you create a production-ready build of the Step & Water Tracker app.

## Prerequisites

1. **EAS CLI** - Install globally:
   ```bash
   npm install -g eas-cli
   ```

2. **EAS Account** - Sign up at https://expo.dev and login:
   ```bash
   eas login
   ```

3. **App Assets** - Create the following assets:
   - `assets/icon.png` - 1024x1024px PNG (app icon)
   - `assets/splash.png` - 2048x2048px PNG (splash screen)

## Step 1: Prepare Assets

### App Icon
- Create a 1024x1024px PNG image
- Save as `assets/icon.png`
- Ensure it has a transparent background or matches your brand

### Splash Screen
- Create a 2048x2048px PNG image
- Save as `assets/splash.png`
- Background color is set to `#6366f1` (indigo)

**Note:** If you don't have assets ready, the app will use default Expo icons. You can add them later and rebuild.

## Step 2: Environment Variables (Optional)

If using Supabase for cloud sync, create a `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** The app works without Supabase - it will use local storage only if Supabase is not configured.

## Step 3: Configure EAS Project

Link your project to EAS (if not already done):

```bash
eas build:configure
```

This will use the project ID already configured in `app.config.js`.

## Step 4: Build for Android

### Preview Build (APK for testing):
```bash
eas build --platform android --profile preview
```

### Production Build (APK):
```bash
eas build --platform android --profile production
```

### Production Build (AAB for Play Store):
Update `eas.json` production profile:
```json
"production": {
  "android": {
    "buildType": "app-bundle"
  }
}
```

Then build:
```bash
eas build --platform android --profile production
```

## Step 5: Build for iOS

### Preview Build:
```bash
eas build --platform ios --profile preview
```

### Production Build:
```bash
eas build --platform ios --profile production
```

**Note:** iOS builds require:
- Apple Developer account ($99/year)
- Proper certificates and provisioning profiles (EAS handles this automatically)

## Step 6: Local Development Build (Optional)

If you want to test a production-like build locally:

### Android:
```bash
eas build --platform android --profile preview --local
```

### iOS (macOS only):
```bash
eas build --platform ios --profile preview --local
```

## Step 7: Testing the Build

1. Download the build from the EAS dashboard or use the provided URL
2. Install on a physical device (not emulator for foreground service testing)
3. Test the following:
   - App launches without crashes
   - Foreground notification appears (Android)
   - Step tracking works
   - Water logging works
   - Data persists after app restart
   - Background updates work

## Step 8: Submit to Stores

### Google Play Store:
```bash
eas submit --platform android --profile production
```

### Apple App Store:
```bash
eas submit --platform ios --profile production
```

**Note:** Update `eas.json` submit configuration with your store credentials.

## Troubleshooting

### Build Fails
- Check EAS build logs in the dashboard
- Ensure all dependencies are in `package.json`
- Verify `app.config.js` syntax is correct

### App Crashes on Launch
- Check error logs: `adb logcat` (Android) or Xcode console (iOS)
- Verify all permissions are granted
- Ensure Supabase credentials are valid (if using)

### Foreground Service Not Working
- Test on a physical Android device (not emulator)
- Check notification permissions are granted
- Verify Android version is 8.0+ (API 26+)

### Missing Assets
- The app will use default Expo icons if assets are missing
- Add proper assets and rebuild for production

## Production Checklist

- [ ] App icon created (`assets/icon.png`)
- [ ] Splash screen created (`assets/splash.png`)
- [ ] Environment variables configured (if using Supabase)
- [ ] Version number updated in `app.config.js`
- [ ] EAS project configured
- [ ] Test build created and tested
- [ ] All features tested on physical device
- [ ] Error handling verified
- [ ] App doesn't crash on launch
- [ ] Foreground service works (Android)
- [ ] Data persists correctly
- [ ] Ready for store submission

## Version Management

Update version before each production build:

1. Update `version` in `app.config.js` (e.g., "1.0.1")
2. `versionCode` auto-increments in production builds (Android)
3. For iOS, update `buildNumber` in `app.config.js` if needed

## Security Notes

- Never commit `.env` file to git
- Keep Supabase service role key secret
- Review all permissions before submission
- Test app with minimal permissions granted

## Support

For issues:
1. Check EAS build logs
2. Review app logs on device
3. Test in development mode first
4. Check Expo documentation: https://docs.expo.dev



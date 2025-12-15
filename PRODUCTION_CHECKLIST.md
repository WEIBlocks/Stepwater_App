# Production Build Checklist

Use this checklist before creating a production build to ensure everything is ready.

## ✅ Configuration Files

- [x] `app.config.js` - Configured with proper Android/iOS settings
- [x] `eas.json` - Production build profiles configured
- [x] `package.json` - Build scripts added
- [x] `.gitignore` - Environment files excluded

## ✅ Error Handling

- [x] Error boundary implemented in App.tsx
- [x] All async operations wrapped in try-catch
- [x] Foreground service errors don't crash app
- [x] Supabase errors handled gracefully (app works without it)
- [x] Storage errors handled silently
- [x] Permission errors handled with fallbacks

## ✅ Android Configuration

- [x] Foreground service permissions configured
- [x] Notification channel configured
- [x] Background task handling implemented
- [x] Minimum SDK version set (23)
- [x] Target SDK version set (34)
- [x] Package name configured
- [x] Version code configured

## ✅ iOS Configuration

- [x] Bundle identifier configured
- [x] Health permissions configured
- [x] Motion permissions configured
- [x] Info.plist descriptions added

## ✅ Assets (Optional but Recommended)

- [ ] App icon created (`assets/icon.png` - 1024x1024px)
- [ ] Splash screen created (`assets/splash.png` - 2048x2048px)
- [ ] Adaptive icon configured (Android)

**Note:** App will work with default Expo icons if assets are missing.

## ✅ Environment Variables (Optional)

- [ ] `.env` file created (if using Supabase)
- [ ] `EXPO_PUBLIC_SUPABASE_URL` set
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set

**Note:** App works without Supabase - uses local storage only.

## ✅ Testing Before Production

- [ ] Test app launch (no crashes)
- [ ] Test foreground notification (Android)
- [ ] Test step tracking
- [ ] Test water logging
- [ ] Test data persistence
- [ ] Test background updates
- [ ] Test on physical device (not emulator)
- [ ] Test with minimal permissions
- [ ] Test without internet connection
- [ ] Test app restart/recovery

## ✅ Build Commands

### Preview Build (Testing)
```bash
npm run build:android:preview
# or
npm run build:ios:preview
```

### Production Build
```bash
npm run build:android:production
# or
npm run build:ios:production
```

## ✅ Pre-Build Verification

1. **Version Check**
   - [ ] Version number updated in `app.config.js`
   - [ ] Version code will auto-increment (production builds)

2. **Dependencies**
   - [ ] All dependencies in `package.json`
   - [ ] No missing peer dependencies
   - [ ] Run `npm install` to ensure lock file is updated

3. **Code Quality**
   - [ ] No TypeScript errors
   - [ ] No console errors in development
   - [ ] All features tested

4. **Security**
   - [ ] No hardcoded secrets
   - [ ] `.env` file not committed
   - [ ] API keys properly configured

## ✅ Known Limitations

- **Foreground Service**: Android only (iOS doesn't support)
- **Step Tracking**: Requires physical device (not emulator)
- **Background Updates**: Limited by Android battery optimization
- **Supabase**: Optional - app works without it

## ✅ Production Build Steps

1. **Prepare Assets** (if available)
   - Create app icon and splash screen
   - Place in `assets/` folder

2. **Configure Environment** (if using Supabase)
   - Create `.env` file
   - Add Supabase credentials

3. **Update Version**
   - Update `version` in `app.config.js`
   - Version code auto-increments

4. **Build**
   ```bash
   eas build --platform android --profile production
   ```

5. **Test Build**
   - Download and install on device
   - Test all features
   - Verify no crashes

6. **Submit to Store** (when ready)
   ```bash
   eas submit --platform android --profile production
   ```

## ✅ Troubleshooting

### Build Fails
- Check EAS build logs
- Verify `app.config.js` syntax
- Ensure all dependencies are listed

### App Crashes
- Check device logs (`adb logcat` for Android)
- Verify permissions are granted
- Test in development mode first

### Foreground Service Not Working
- Test on physical Android device
- Check notification permissions
- Verify Android 8.0+ (API 26+)

## ✅ Success Criteria

Your app is production-ready when:
- ✅ Build completes successfully
- ✅ App launches without crashes
- ✅ All core features work
- ✅ Data persists correctly
- ✅ Foreground service works (Android)
- ✅ No critical errors in logs
- ✅ App handles errors gracefully

## 📝 Notes

- The app is designed to work even if Supabase is not configured
- Foreground service is Android-only (iOS will work but without persistent notification)
- All critical paths have error handling
- App will not crash if services fail to start
- Console logs are present for debugging but won't affect production builds



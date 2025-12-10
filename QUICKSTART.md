# Quick Start - Run on Expo Go

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start Expo

```bash
npm start
# or
npx expo start
```

## Step 3: Open in Expo Go

1. Install **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code:
   - **iOS**: Open Camera app → scan QR code → tap notification
   - **Android**: Open Expo Go app → tap "Scan QR code"

## Common Issues & Solutions

### ❌ "Unable to resolve module" errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### ❌ "Metro bundler failed to start"

**Solution:**
```bash
# Kill any running Metro processes
npx expo start --clear
```

### ❌ App opens but shows blank screen

**Solution:**
1. Check console for errors
2. Make sure all dependencies are installed: `npm install`
3. Clear cache: `npx expo start -c`

### ❌ Steps not counting

**Solution:**
- Grant Motion & Fitness permission:
  - **iOS**: Settings → Privacy → Motion & Fitness → Enable
  - **Android**: Settings → Apps → Expo Go → Permissions → Physical Activity
- Restart the app after granting permissions

### ❌ Notifications not working

**Solution:**
- Grant notification permission when prompted
- **Android 13+**: Make sure notifications are enabled in app settings

### ❌ TypeScript errors

**Solution:**
- Install dependencies first: `npm install`
- Restart TypeScript server in your IDE
- Type errors should resolve once dependencies are installed

## Verification Checklist

After starting the app in Expo Go, verify:

- [ ] App opens without errors
- [ ] Onboarding screen appears (first time)
- [ ] Home screen shows step and water rings
- [ ] Can navigate between tabs
- [ ] Step counter updates (after granting permission)
- [ ] Can add water via FAB button
- [ ] Settings screen works
- [ ] Data persists when app restarts

## Development Tips

1. **Live Reload**: Shake device → Enable Fast Refresh
2. **Debug Menu**: Shake device → Show Developer Menu
3. **Reload App**: Press `r` in terminal or shake device → Reload
4. **Clear Cache**: `npx expo start -c`

## Next Steps

Once everything works in Expo Go:
- Test all features (steps, water, goals, reminders)
- Verify permissions work correctly
- Test on both iOS and Android if possible

For production builds, see the main README.md



# Expo Go Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Expo development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

3. **Scan QR code with Expo Go app:**
   - **iOS**: Open Camera app and scan QR code, or use Expo Go app
   - **Android**: Open Expo Go app and scan QR code

## Important Notes for Expo Go

### ✅ Compatible Packages
All packages in this project are compatible with Expo Go:
- ✅ expo-sensors (Pedometer)
- ✅ expo-notifications
- ✅ expo-haptics
- ✅ react-native-reanimated
- ✅ react-native-gesture-handler
- ✅ react-native-svg
- ✅ lottie-react-native (with lottie-react-native 6.5.1)

### ⚠️ Limitations

1. **expo-build-properties**: 
   - Removed from app.config.js for Expo Go compatibility
   - This plugin requires a development build
   - Not needed for basic functionality in Expo Go

2. **Permissions**:
   - Motion/Fitness permissions are handled automatically by Expo Go
   - Notification permissions will be requested at runtime

3. **Background Step Tracking**:
   - Limited in Expo Go
   - Steps update when app is in foreground
   - For full background tracking, you'll need a development build

## Troubleshooting

### App won't load in Expo Go

1. **Clear Expo cache:**
   ```bash
   npx expo start -c
   ```

2. **Check for incompatible packages:**
   - Make sure all packages are Expo SDK 51 compatible
   - Run: `npx expo install --check`

3. **Restart Metro bundler:**
   - Press `r` in the terminal where Expo is running
   - Or stop and restart with `npm start`

### Permission Issues

- **Steps not counting**: 
  - Make sure you've granted Motion & Fitness permission
  - On iOS: Settings → Privacy → Motion & Fitness
  - On Android: Settings → Apps → Expo Go → Permissions

- **Notifications not working**:
  - Make sure notifications are enabled in device settings
  - Grant notification permission when prompted

### Common Errors

**Error: "Unable to resolve module"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

**Error: "Unable to resolve @react-navigation/native"**
```bash
# Make sure you've installed all dependencies
npm install
npx expo install --check
```

**Metro bundler errors:**
```bash
# Clear cache and restart
npx expo start -c
```

## Development Build (Optional)

If you need features not available in Expo Go (like expo-build-properties), create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for development
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Testing Steps

1. ✅ App opens in Expo Go
2. ✅ Onboarding screen appears (first time only)
3. ✅ Step counter initializes (check permissions)
4. ✅ Water tracking works
5. ✅ Navigation between screens works
6. ✅ Notifications can be set up
7. ✅ Data persists (AsyncStorage)

## Need Help?

- Check Expo documentation: https://docs.expo.dev/
- Expo Go compatibility: https://docs.expo.dev/get-started/expo-go/
- Community forums: https://forums.expo.dev/



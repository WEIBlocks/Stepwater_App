# Development Build Guide

## ✅ What Just Happened

1. **Prebuild Completed**: Native Android project created
2. **Build Started**: `npx expo run:android` is building your app

## What to Expect

### During Build:
- Gradle will download dependencies (first time takes 5-10 minutes)
- The app will compile
- It will automatically install on your connected Android device/emulator
- Metro bundler will start automatically

### After Build:
- The app will launch on your device
- **The pedometer will work properly!** 🎉
- Steps will track automatically as you walk
- All native features will work correctly

## Requirements

### For Android Build:
1. **Android Studio** installed (for Android SDK)
2. **Java JDK** (usually comes with Android Studio)
3. **Android device connected** via USB with USB debugging enabled
   - OR **Android emulator** running

### Check Your Setup:
```bash
# Check if device is connected
adb devices

# Should show your device or emulator
```

## If Build Fails

### Common Issues:

1. **"SDK not found"**
   - Install Android Studio
   - Open Android Studio → SDK Manager
   - Install Android SDK (API 33 or 34)

2. **"Java not found"**
   - Install JDK 17 or 21
   - Set JAVA_HOME environment variable

3. **"Device not found"**
   - Connect device via USB
   - Enable USB debugging in Developer Options
   - Or start an Android emulator

4. **"Gradle build failed"**
   - Check internet connection (needs to download dependencies)
   - Try: `cd android && ./gradlew clean` then rebuild

## Build Commands

### Build and Install:
```bash
npx expo run:android
```

### Clean Build:
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Build for Specific Device:
```bash
# List devices
adb devices

# Build for specific device
npx expo run:android --device
```

## After First Build

Once the build completes:
1. ✅ App installs automatically
2. ✅ Metro bundler starts
3. ✅ App launches on device
4. ✅ **Pedometer will work!**

## Testing the Pedometer

After the app launches:
1. Grant permissions when prompted
2. Walk 10-20 steps
3. Watch the dashboard - steps should update in real-time! 🚶‍♂️
4. Check console logs for step updates

## Development Workflow

### Making Changes:
- Edit code in `src/` folder
- Changes hot-reload automatically
- No need to rebuild unless you change native code

### Rebuilding:
- Only needed if you:
  - Add new native modules
  - Change `app.config.js` native settings
  - Change Android permissions

## Next Steps

1. **Wait for build to complete** (check terminal)
2. **App will auto-install** on your device
3. **Test pedometer** - walk around!
4. **Enjoy automatic step tracking!** 🎉

---

**The build is running now!** Check your terminal for progress. Once it completes, the app will launch and the pedometer will work! 🚀


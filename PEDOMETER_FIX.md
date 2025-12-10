# Pedometer Not Working - Solution Guide

## The Problem
The pedometer `watchStepCount` callback is not firing when you walk. This is a known issue with Expo Go on Android.

## Solution Options

### Option 1: Create a Development Build (Recommended) ⭐

**Why:** Expo Go has limitations with native sensors. A development build includes all native modules.

**Steps:**

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS Build:**
   ```bash
   eas build:configure
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android --profile development
   ```
   
   Or build locally:
   ```bash
   npx expo run:android
   ```

5. **Install the build on your device** and test again.

---

### Option 2: Manual Step Entry (Quick Test)

I've added a manual step entry feature so you can test the app while we fix the pedometer.

**How to use:**
- There's now a "+" button or manual entry option in the app
- You can manually add steps to test the functionality

---

### Option 3: Check Permissions

1. Go to **Settings → Apps → Step & Water → Permissions**
2. Ensure **"Physical Activity"** or **"Activity Recognition"** is **Granted**
3. Restart the app

---

### Option 4: Test on iOS

If you have an iPhone, try testing on iOS - the pedometer works better there:
```bash
npx expo run:ios
```

---

## Quick Test Right Now

1. **Check if pedometer is available:**
   - Look in logs for: `Pedometer available: true` ✅

2. **Walk 50+ steps** (not just shaking - actual walking)
   - The callback might only fire after significant movement

3. **Keep app in foreground**
   - Some sensors don't work when app is in background

4. **Check logs for:**
   - `🎯 Android pedometer callback FIRED!` - This means it's working!

---

## Next Steps

I recommend **Option 1 (Development Build)** for the best experience. The pedometer will work reliably in a development build.

Would you like me to help you set up a development build?


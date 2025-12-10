# Development Build Setup - Fix Pedometer Issue

## Quick Start (5 minutes)

The pedometer doesn't work in Expo Go on Android. You need a development build.

### Step 1: Install Required Tools

```bash
# Make sure you have Android Studio installed
# Download from: https://developer.android.com/studio

# Install EAS CLI (if not already installed)
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
# Enter your Expo account credentials
# (Create account at expo.dev if needed)
```

### Step 3: Build and Run

**Option A: Local Build (Faster, requires Android Studio)**
```bash
# Make sure your Android device is connected via USB
# Enable USB debugging on your phone

npx expo run:android
```

**Option B: Cloud Build (Easier, but takes longer)**
```bash
# Configure EAS (first time only)
eas build:configure

# Build for Android
eas build --platform android --profile development

# After build completes, scan QR code to install
```

### Step 4: Test

Once installed, the pedometer will work! Walk and you'll see steps updating.

---

## Troubleshooting

### "Command not found: eas"
```bash
npm install -g eas-cli
```

### "Android device not found"
1. Enable USB debugging: Settings → About Phone → Tap "Build Number" 7 times
2. Settings → Developer Options → Enable "USB Debugging"
3. Connect phone via USB
4. Run `adb devices` to verify connection

### Build fails
- Make sure Android Studio is installed
- Check that you have enough disk space (builds need ~5GB)
- Try: `npx expo run:android --clear`

---

## Alternative: Use Manual Step Entry

For now, you can use the **"+100" button** on the Steps card to manually add steps and test the app functionality.

The pedometer will work automatically once you create a development build.

---

## Why This Is Needed

Expo Go has limitations with native sensors like the pedometer. A development build includes all native modules and works exactly like a production app.

---

## Need Help?

1. Check the logs for any error messages
2. Make sure your device supports step counting (most modern phones do)
3. Verify permissions are granted in Settings → Apps → Your App → Permissions


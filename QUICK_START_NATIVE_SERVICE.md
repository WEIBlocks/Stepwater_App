# Quick Start: Native Service Setup

## ⚠️ Important: This Requires a Development Build

The native foreground service **cannot run in Expo Go**. You must create a development build.

## Step 1: Install Config Plugin Dependencies

```bash
npm install --save-dev @expo/config-plugins
```

## Step 2: Create Development Build

You have two options:

### Option A: Local Development Build (Recommended for Testing)

```bash
# Build and run on connected device/emulator
npx expo run:android
```

This will:
- Build the native Android app with your custom module
- Install it on your device/emulator
- Start the Metro bundler

### Option B: EAS Development Build

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to EAS
eas login

# Build development client
eas build --profile development --platform android
```

## Step 3: Verify Native Module is Registered

After building, check the logs when the app starts. You should see:

```
✅ Native foreground service started
```

Instead of:

```
⚠️ Native service not available (iOS or not configured)
```

## Step 4: Grant Permissions

When the app first launches, grant these permissions:
- **Activity Recognition** (for step tracking)
- **Notifications** (for foreground notification)

## Troubleshooting

### Still seeing "Native service not available"?

1. **Make sure you're using a development build, not Expo Go**
   - Expo Go doesn't support custom native modules
   - You must use `npx expo run:android` or EAS build

2. **Check that the module is registered**
   - Look for `StepWaterServicePackage` in `MainApplication.java`
   - The config plugin should have added it automatically

3. **Verify the build includes native code**
   - Check `android/app/build/generated` for Kotlin files
   - Ensure `modules/StepWaterService` is included in the build

4. **Check AndroidManifest.xml**
   - Service and receiver should be declared
   - Permissions should be present

### Build Errors?

1. **Kotlin not found**
   ```bash
   # Add to android/build.gradle
   ext.kotlinVersion = "1.9.0"
   ```

2. **Module not found**
   - Ensure `modules/StepWaterService` directory exists
   - Check file paths match package name: `com.stepwater.app`

3. **Permission errors**
   - Verify all permissions in `app.config.js`
   - Check `AndroidManifest.xml` is updated

## Testing the Service

Once the app is running with the native module:

1. **Check service status:**
   ```typescript
   const isRunning = await nativeStepWaterService.isServiceRunning();
   console.log('Service running:', isRunning);
   ```

2. **Start service manually:**
   ```typescript
   await nativeStepWaterService.startService();
   ```

3. **Check notification:**
   - Pull down notification shade
   - Should see "Step & Water Tracker" notification
   - Should update in real-time as you walk

4. **Test step tracking:**
   - Walk around with device
   - Notification should update automatically
   - UI should sync every 5 seconds

## Next Steps

- See `NATIVE_SERVICE_IMPLEMENTATION.md` for full documentation
- See `NATIVE_SERVICE_SETUP.md` for detailed setup instructions







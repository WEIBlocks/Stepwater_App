# Native Android Foreground Service Setup

This document explains how to integrate the native Android foreground service into your Expo app.

## Overview

The native service handles:
- Step tracking using Android's Step Counter API
- Water intake tracking
- Real-time notification updates
- Data persistence using SharedPreferences
- Auto-restart on device reboot

## Integration Steps

### 1. Register the Native Module

You need to register the `StepWaterServicePackage` in your `MainApplication.java` or `MainApplication.kt` file.

**For Expo managed workflow**, you'll need to create a config plugin or use a development build.

**For bare React Native**, add to `MainApplication.java`:

```java
import com.stepwater.app.StepWaterServicePackage;

@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new StepWaterServicePackage() // Add this
    );
}
```

### 2. Update AndroidManifest.xml

Add the service and receiver declarations to your `AndroidManifest.xml`:

```xml
<service
    android:name="com.stepwater.app.StepWaterForegroundService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="health" />

<receiver
    android:name="com.stepwater.app.BootReceiver"
    android:enabled="true"
    android:exported="true"
    android:permission="android.permission.RECEIVE_BOOT_COMPLETED">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.QUICKBOOT_POWERON" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</receiver>
```

### 3. Permissions

Ensure these permissions are in your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_HEALTH" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 4. Build Configuration

The service requires:
- Minimum SDK: 23 (Android 6.0)
- Target SDK: 34
- Kotlin support

### 5. Testing

1. Build a development build (not Expo Go):
   ```bash
   npx expo run:android
   ```

2. Grant permissions when prompted:
   - Activity Recognition
   - Notifications

3. The service should start automatically when the app launches.

## How It Works

1. **Service Start**: The service starts when `nativeStepWaterService.startService()` is called from React Native.

2. **Step Tracking**: The service uses Android's `Sensor.TYPE_STEP_COUNTER` to track steps in real-time.

3. **Notification Updates**: The notification updates automatically whenever:
   - Step count changes
   - Water intake changes
   - Goals change

4. **Data Persistence**: All data is stored in SharedPreferences and persists across app restarts.

5. **Auto-Restart**: The `BootReceiver` restarts the service after device reboot.

## React Native API

```typescript
import { nativeStepWaterService } from './src/services/nativeStepWaterService';

// Start the service
await nativeStepWaterService.startService();

// Stop the service
await nativeStepWaterService.stopService();

// Update water intake
await nativeStepWaterService.updateWater(250); // 250ml

// Get current values
const steps = await nativeStepWaterService.getCurrentSteps();
const water = await nativeStepWaterService.getCurrentWater();

// Set goals
await nativeStepWaterService.setStepGoal(10000);
await nativeStepWaterService.setWaterGoal(2000);
await nativeStepWaterService.setWaterUnit('ml'); // or 'oz'
```

## Troubleshooting

### Service Not Starting
- Check that permissions are granted
- Verify the service is registered in MainApplication
- Check logcat for errors: `adb logcat | grep StepWater`

### Steps Not Updating
- Ensure device has step counter sensor (most modern devices do)
- Check that ACTIVITY_RECOGNITION permission is granted
- Verify service is running: `nativeStepWaterService.isServiceRunning()`

### Notification Not Showing
- Check POST_NOTIFICATIONS permission
- Verify notification channel is created
- Check that service is running in foreground







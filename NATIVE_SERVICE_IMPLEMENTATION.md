# Native Android Foreground Service Implementation

## Overview

This implementation moves step tracking and notification updates to a native Android foreground service, ensuring real-time updates even when the app is closed or killed.

## What Was Changed

### 1. Native Android Service (`modules/StepWaterService/`)

**Created Files:**
- `StepWaterForegroundService.kt` - Main foreground service that:
  - Tracks steps using Android's Step Counter API
  - Updates notification in real-time
  - Persists data using SharedPreferences
  - Runs continuously in foreground
  
- `StepWaterDataManager.kt` - Data persistence layer:
  - Stores steps, water, goals in SharedPreferences
  - Handles daily reset
  - Manages baseline steps for step counter
  
- `StepWaterServiceModule.kt` - React Native bridge:
  - Exposes service control methods to JS
  - Handles communication between RN and native service
  
- `StepWaterServicePackage.kt` - Package registration
- `BootReceiver.kt` - Auto-restart service on device reboot

### 2. React Native Integration

**New Service Interface:**
- `src/services/nativeStepWaterService.ts` - TypeScript wrapper for native module

**Updated Files:**
- `App.tsx` - Starts native service on app launch
- `src/state/store.ts` - Removed JS notification updates, reads from native service
- `src/navigation/AppNavigator.tsx` - Uses native service instead of old JS service
- `src/screens/GoalsScreen.tsx` - Updated to await async goal setters
- `src/screens/SettingsScreen.tsx` - Updated to await async settings setter

**Removed/Deprecated:**
- All `ForegroundServiceManager.triggerUpdate()` calls removed
- JS-based notification updates removed
- Step tracking now handled entirely by native service

## Key Features

### ✅ Real-Time Updates
- Steps update immediately as user walks
- Water updates instantly after user input
- Notification updates automatically from native service

### ✅ Persistent Service
- Service runs continuously, even when app is closed
- Auto-restarts after device reboot
- Uses START_STICKY to survive system kills

### ✅ Native Data Storage
- All data stored in SharedPreferences
- Survives app restarts
- Daily reset handled automatically

### ✅ Single Source of Truth
- Native service is the source of truth for steps and water
- React Native UI syncs from native service periodically
- No conflicts between JS and native state

## Integration Steps

### 1. Register Native Module

You need to register the package in your `MainApplication` file. For Expo, you'll need a development build.

**For Bare React Native:**

In `android/app/src/main/java/com/stepwater/app/MainApplication.java`:

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

Add to `android/app/src/main/AndroidManifest.xml`:

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

Ensure these are in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_HEALTH" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 4. Build

```bash
# For Expo development build
npx expo run:android

# For bare React Native
cd android && ./gradlew assembleDebug
```

## API Usage

### Starting/Stopping Service

```typescript
import { nativeStepWaterService } from './src/services/nativeStepWaterService';

// Start service (called automatically in App.tsx)
await nativeStepWaterService.startService();

// Stop service
await nativeStepWaterService.stopService();

// Check if running
const isRunning = await nativeStepWaterService.isServiceRunning();
```

### Reading Values

```typescript
// Get current steps (from native service - source of truth)
const steps = await nativeStepWaterService.getCurrentSteps();

// Get current water (from native service - source of truth)
const water = await nativeStepWaterService.getCurrentWater();
```

### Updating Values

```typescript
// Update water intake (adds to current total)
await nativeStepWaterService.updateWater(250); // 250ml

// Set goals
await nativeStepWaterService.setStepGoal(10000);
await nativeStepWaterService.setWaterGoal(2000);
await nativeStepWaterService.setWaterUnit('ml'); // or 'oz'
```

### Syncing from Native Service

The store automatically syncs from native service every 5 seconds. You can also manually sync:

```typescript
const syncFromNativeService = useStore((state) => state.syncFromNativeService);
await syncFromNativeService();
```

## How It Works

### Step Tracking Flow

1. Native service registers Android Step Counter sensor
2. Sensor fires when steps change
3. Service calculates: `currentSteps = rawSteps - baseline`
4. Service updates SharedPreferences
5. Service updates notification immediately
6. React Native syncs from native service every 5 seconds

### Water Tracking Flow

1. User adds water in React Native UI
2. `addWater()` calls `nativeStepWaterService.updateWater()`
3. Native service updates SharedPreferences
4. Native service updates notification immediately
5. React Native state updates for UI

### Notification Updates

- Notification updates automatically whenever:
  - Step count changes (from sensor)
  - Water intake changes (from user input)
  - Goals change (from settings)
- Updates happen in native code, no JS execution required
- Notification is ongoing and non-dismissible

## Data Persistence

All data is stored in SharedPreferences with keys:
- `current_steps` - Today's step count
- `current_water` - Today's water intake (ml)
- `step_goal` - Daily step goal
- `water_goal` - Daily water goal (ml)
- `water_unit` - Display unit ('ml' or 'oz')
- `baseline_steps` - Step counter baseline
- `last_raw_steps` - Last raw step counter value
- `last_date` - Last date data was updated (for daily reset)

## Daily Reset

The service automatically resets steps and water at midnight:
- Checks date on every update
- Resets to 0 if date changed
- Preserves baseline steps (doesn't reset)

## Troubleshooting

### Service Not Starting
1. Check permissions are granted (Activity Recognition, Notifications)
2. Verify service is registered in MainApplication
3. Check logcat: `adb logcat | grep StepWater`

### Steps Not Updating
1. Ensure device has step counter sensor (most modern devices do)
2. Check ACTIVITY_RECOGNITION permission
3. Verify service is running: `nativeStepWaterService.isServiceRunning()`
4. Check sensor availability in logcat

### Notification Not Showing
1. Check POST_NOTIFICATIONS permission
2. Verify notification channel is created
3. Ensure service is running in foreground
4. Check notification settings in Android

### Data Not Persisting
1. Check SharedPreferences access
2. Verify date format is correct
3. Check logcat for storage errors

## Testing

1. **Start Service:**
   ```typescript
   await nativeStepWaterService.startService();
   ```

2. **Check Service Status:**
   ```typescript
   const isRunning = await nativeStepWaterService.isServiceRunning();
   console.log('Service running:', isRunning);
   ```

3. **Test Step Tracking:**
   - Walk around with device
   - Check notification updates
   - Verify steps in UI

4. **Test Water Tracking:**
   - Add water in UI
   - Check notification updates immediately
   - Verify water in UI

5. **Test Persistence:**
   - Close app completely
   - Reopen app
   - Verify steps/water are still there

6. **Test Auto-Restart:**
   - Reboot device
   - Service should start automatically
   - Check notification appears

## Notes

- The service uses `START_STICKY` to auto-restart if killed
- Wake lock is held to prevent system from killing service
- Notification is ongoing and non-dismissible (required for foreground service)
- Step counter baseline is set on first reading and persists across days
- All data operations are synchronous in native code for performance

## Future Improvements

- Add support for setting absolute water value (currently only additive)
- Add battery optimization handling
- Add service health monitoring
- Add data export/import functionality
- Add step history tracking in native service







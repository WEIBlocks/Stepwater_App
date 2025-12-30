 import { PedometerService } from './pedometer';
import { NotificationService } from './notifications';
import { nativeStepWaterService } from './nativeStepWaterService';
import { Platform, PermissionsAndroid } from 'react-native';
import { useStore } from '../state/store';

/**
 * Permission Helper Service
 * 
 * Requests OS permissions sequentially with delays to prevent blocking UI,
 * navigation, or app initialization. These should be called after the UI
 * is ready (e.g., in HomeScreen after onboarding/profile completion).
 * 
 * NOTE: The native foreground service starts immediately on app launch (in App.tsx),
 * independently of permissions. This service only handles permission requests.
 * Step tracking will begin working once permissions are granted.
 */

const PERMISSION_REQUEST_DELAY_MS = 500;

/**
 * Check if ACTIVITY_RECOGNITION permission is already granted
 */
async function checkActivityRecognitionPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 29) {
    return true; // Android < 10 doesn't need explicit permission
  }

  try {
    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
    );
    return result;
  } catch (error) {
    console.warn('Error checking permission:', error);
    return false;
  }
}

/**
 * Sync goals and data to native service after permissions are granted
 * The service is already running from app launch, but we need to:
 * 1. Re-initialize the sensor (so it registers with permissions now granted)
 * 2. Sync goals and data
 * This runs synchronously without waiting for any UI or other steps
 */
async function syncGoalsToNativeService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    console.log('🔄 Syncing goals and data to native service after permissions granted...');
    
    // CRITICAL: Re-initialize the sensor now that permissions are granted
    // This will register the sensor listener, which failed silently before
    await nativeStepWaterService.reinitializeSensor().catch((err) => {
      console.warn('⚠️ Error reinitializing sensor:', err);
    });
    
    // Service is already running from app launch, just sync goals and data
    // Use getState() to access store without hooks
    const store = useStore.getState();
    try {
      await store.loadGoals();
      const goals = useStore.getState();
      
      // Sync goals to native service (non-blocking)
      await Promise.all([
        nativeStepWaterService.setStepGoal(goals.stepGoal).catch(() => {}),
        nativeStepWaterService.setWaterGoal(goals.waterGoal).catch(() => {}),
      ]);
      
      // Sync water unit
      const waterUnit = goals.settings.unit === 'imperial' ? 'oz' : 'ml';
      await nativeStepWaterService.setWaterUnit(waterUnit).catch(() => {});
      
      // Sync current values from native service (source of truth)
      await store.syncFromNativeService().catch(() => {});
      
      console.log('✅ Goals and data synced to native service, sensor re-initialized');
    } catch (error) {
      console.warn('⚠️ Error syncing goals to native service:', error);
      // Continue even if sync fails
    }
  } catch (error) {
    console.error('❌ Error syncing to native service after permissions:', error);
    // Don't throw - app should continue working
  }
}

/**
 * Request all app permissions sequentially with delays
 * This prevents permission dialogs from blocking the UI or navigation
 * 
 * NOTE: The native service is already running from app launch (in App.tsx).
 * Once permissions are granted, step tracking will begin working automatically.
 * We just sync goals/data after permissions are granted.
 * 
 * @returns Promise that resolves when all permission requests complete
 */
export async function requestAllPermissionsSequentially(): Promise<void> {
  try {
    // Request pedometer/motion permissions first (with delay before starting)
    await new Promise(resolve => setTimeout(resolve, PERMISSION_REQUEST_DELAY_MS));
    const pedometerGranted = await PedometerService.requestPermissions().catch(err => {
      console.warn('Pedometer permissions request failed:', err);
      return false;
    });

    // If pedometer permission is granted, sync goals/data to native service
    // Service is already running from app launch, so step tracking will now work
    if (pedometerGranted && Platform.OS === 'android') {
      // Sync goals and data (non-blocking)
      syncGoalsToNativeService().catch(err => {
        console.warn('Error syncing to service after permissions:', err);
      });
    }

    // Request notification permissions second (with delay between requests)
    await new Promise(resolve => setTimeout(resolve, PERMISSION_REQUEST_DELAY_MS));
    await NotificationService.requestPermissions().catch(err => {
      console.warn('Notification permissions request failed:', err);
    });

    console.log('✅ All permission requests completed');
  } catch (error) {
    console.warn('Error during permission requests:', error);
    // Never throw - permissions are not critical for app functionality
  }
}

/**
 * Request permissions in the background without blocking
 * Useful for post-UI permission requests that should not interfere with user experience
 */
export function requestAllPermissionsInBackground(): void {
  // Fire and forget - don't await or block on this
  requestAllPermissionsSequentially().catch(err => {
    console.warn('Background permission requests failed:', err);
  });
}

/**
 * Check if permissions are already granted and sync goals/data if so
 * This is useful for existing users who already have permissions
 * NOTE: Service is already running from app launch, we just sync goals/data
 */
export async function checkPermissionsAndStartService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const hasPermission = await checkActivityRecognitionPermission();
    if (hasPermission) {
      // Permissions already granted - sync goals/data to service
      // Service is already running from app launch
      console.log('✅ Permissions already granted, syncing goals/data to native service...');
      await syncGoalsToNativeService();
    }
  } catch (error) {
    console.warn('Error checking permissions:', error);
  }
}



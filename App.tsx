import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/utils/errorBoundary';
import { useStore } from './src/state/store';
import { useHydration } from './src/hooks/useHydration';
import { nativeStepWaterService } from './src/services/nativeStepWaterService';
import { requestAllPermissionsInBackground, checkPermissionsAndStartService } from './src/services/permissions';
// Import notification handler early to ensure it's registered before any notifications
import './src/services/notifications';

// Initialize app hooks
const AppContent = () => {
  const syncFromNativeService = useStore((state) => state.syncFromNativeService);
  const loadGoals = useStore((state) => state.loadGoals);
  const setStepGoal = useStore((state) => state.setStepGoal);
  const setWaterGoal = useStore((state) => state.setWaterGoal);

  // Initialize native foreground service on Android IMMEDIATELY on app launch
  // Service starts without waiting for permissions - step tracking will begin once permissions are granted
  useEffect(() => {
    if (Platform.OS === 'android') {
      let syncInterval: NodeJS.Timeout | null = null;

      const initializeNativeService = async () => {
        try {
          // Start the native foreground service IMMEDIATELY without permission checks
          // The service can start and run without permissions - step tracking will work once permissions are granted
          console.log('🚀 Starting native foreground service immediately on app launch...');
          const serviceStarted = await nativeStepWaterService.startService();
          if (serviceStarted) {
            console.log('✅ Native foreground service started immediately (permissions independent)');
          } else {
            console.warn('⚠️ Native service not started (may not be available)');
          }

          // Load goals and sync them to native service (non-blocking)
          try {
            await loadGoals();
            const goals = useStore.getState();

            // Sync goals to native service (non-blocking)
            await nativeStepWaterService.setStepGoal(goals.stepGoal).catch(() => { });
            await nativeStepWaterService.setWaterGoal(goals.waterGoal).catch(() => { });

            // Sync water unit
            const waterUnit = goals.settings.unit === 'imperial' ? 'oz' : 'ml';
            await nativeStepWaterService.setWaterUnit(waterUnit).catch(() => { });

            // Sync current values from native service (source of truth)
            await syncFromNativeService().catch((error) => {
              console.warn('Initial sync error:', error);
            });

            // Set up periodic sync from native service (every 5 seconds)
            syncInterval = setInterval(() => {
              syncFromNativeService().catch((error) => {
                console.warn('Sync error:', error);
              });
            }, 5000);
          } catch (error) {
            console.error('❌ Error loading goals or syncing:', error);
            // App continues to work even if sync fails
          }
        } catch (error) {
          console.error('❌ Error initializing native service:', error);
          // App continues to work even if native service fails
        }
      };

      // Start service immediately - no delays, no permission checks
      initializeNativeService();

      // Cleanup interval on unmount
      return () => {
        if (syncInterval) {
          clearInterval(syncInterval);
        }
      };
    }
  }, [syncFromNativeService, loadGoals]);

  // Request permissions immediately for both new and returning users
  // This ensures foreground service can start tracking as soon as possible,
  // even before the user completes onboarding/profile setup
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Small delay to let the app initialize, then request permissions
      const permissionTimer = setTimeout(() => {
        // First check if permissions already granted (returning users)
        // Then request any missing permissions (prompts dialogs if needed)
        checkPermissionsAndStartService()
          .then(() => {
            requestAllPermissionsInBackground();
          })
          .catch((error) => {
            console.warn('Permission check error:', error);
            // Still try to request permissions even if check fails
            requestAllPermissionsInBackground();
          });
      }, 1000);

      return () => clearTimeout(permissionTimer);
    }
  }, []);

  // Initialize hydration tracking (non-blocking)
  // Step tracking is now handled by native service
  // This hook must be called in component body, not in try-catch
  useHydration();

  // Test Supabase connection (non-blocking, deferred)
  useEffect(() => {
    // Test Supabase connection after a delay (non-blocking)
    // Use a longer delay in production to ensure app is fully loaded
    const delay = __DEV__ ? 2000 : 3000;
    const timeoutId = setTimeout(async () => {
      try {
        const { testSupabaseConnection } = await import('./src/services/supabase');
        testSupabaseConnection().catch(() => {
          // Connection test failure shouldn't break the app
        });
      } catch (error) {
        // Ignore import/connection errors - app works without Supabase
        console.warn('Supabase connection test skipped:', error);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, []);

  // Data restoration and app initialization is now handled in AppNavigator
  // This component only initializes hooks that need to run continuously
  return <AppNavigator />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppContent />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}


import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/utils/errorBoundary';
import { useStore } from './src/state/store';
import { usePedometer } from './src/hooks/usePedometer';
import { useHydration } from './src/hooks/useHydration';
import { ForegroundServiceManager } from './src/services/foregroundServiceManager';
// Import notification handler early to ensure it's registered before any notifications
import './src/services/notifications';

// Initialize app hooks
const AppContent = () => {
  // Initialize pedometer and hydration tracking (these are non-blocking)
  // Data restoration is now handled in AppNavigator during splash screen
  usePedometer();
  useHydration();

  // Test Supabase connection (non-blocking, deferred)
  useEffect(() => {
    // Test Supabase connection after a delay (non-blocking)
    setTimeout(async () => {
      try {
        const { testSupabaseConnection } = await import('./src/services/supabase');
        testSupabaseConnection().catch(() => {
          // Connection test failure shouldn't break the app
        });
      } catch (error) {
        // Ignore import/connection errors
      }
    }, 2000);
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


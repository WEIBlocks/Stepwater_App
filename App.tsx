import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/utils/errorBoundary';
import { useStore } from './src/state/store';
import { usePedometer } from './src/hooks/usePedometer';
import { useHydration } from './src/hooks/useHydration';

// Initialize app hooks
const AppContent = () => {
  // Use selectors to get stable references
  const loadTodayData = useStore((state) => state.loadTodayData);
  const loadGoals = useStore((state) => state.loadGoals);
  const loadReminders = useStore((state) => state.loadReminders);
  const loadSettings = useStore((state) => state.loadSettings);
  const setLoading = useStore((state) => state.setLoading);

  useEffect(() => {
    // Load all initial data and test Supabase connection
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // Use Promise.allSettled to prevent one failure from blocking others
        const results = await Promise.allSettled([
          loadTodayData().catch(err => console.warn('loadTodayData failed:', err)),
          loadGoals().catch(err => console.warn('loadGoals failed:', err)),
          loadReminders().catch(err => console.warn('loadReminders failed:', err)),
          loadSettings().catch(err => console.warn('loadSettings failed:', err)),
        ]);

        // Log any failures but don't block
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const names = ['loadTodayData', 'loadGoals', 'loadReminders', 'loadSettings'];
            console.warn(`Failed to ${names[index]}:`, result.reason);
          }
        });

        // Test Supabase connection (non-blocking, after initial load)
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
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initialize asynchronously without blocking - use setTimeout to defer
    setTimeout(() => {
      initializeApp().catch((error) => {
        console.error('Unhandled error in app initialization:', error);
        setLoading(false);
      });
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - Zustand actions are stable

  // Initialize pedometer and hydration tracking (these are non-blocking)
  usePedometer();
  useHydration();

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


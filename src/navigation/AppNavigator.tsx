import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Text, View, AppState as RNAppState, Platform } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../state/store';
import { StorageService } from '../services/storage';
import { nativeStepWaterService } from '../services/nativeStepWaterService';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import GenderSelectionScreen from '../screens/GenderSelectionScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { Gender, UserProfile } from '../types';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          height: 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.captionSmall,
          fontWeight: theme.typography.fontWeight.medium,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'bar-chart' : 'bar-chart-outline'} 
              size={24} 
              color={color} 
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'flag' : 'flag-outline'} 
              size={24} 
              color={color} 
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'notifications' : 'notifications-outline'} 
              size={24} 
              color={color} 
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={24} 
              color={color} 
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const settings = useStore((state) => state.settings);
  const loadSettings = useStore((state) => state.loadSettings);
  const loadTodayData = useStore((state) => state.loadTodayData);
  const loadGoals = useStore((state) => state.loadGoals);
  const loadReminders = useStore((state) => state.loadReminders);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender | 'skipped' | 'pending'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isColdLaunch, setIsColdLaunch] = useState(true);
  const navigationRef = useNavigationContainerRef();
  const appStateRef = useRef(RNAppState.currentState);
  const hasRestoredDataRef = useRef(false);
  // Track pending navigation to handle it after state updates
  const pendingNavigation = useRef<'GenderSelection' | 'ProfileSetup' | 'Main' | null>(null);
  // Track if navigation reset is in progress to prevent multiple simultaneous resets
  const isResettingNavigation = useRef(false);

  // Check user setup status
  const checkSetup = async (skipLoadingState = false) => {
    try {
      if (!skipLoadingState) {
        setIsLoading(true);
      }
      const [onboardingCompleted, profileCompleted] = await Promise.allSettled([
        StorageService.hasCompletedOnboarding(),
        StorageService.hasCompletedProfile(),
      ]);

      // Load settings with error handling
      try {
        await loadSettings();
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }

      // Default to false for new users (if storage read fails or returns null)
      const onboarding = onboardingCompleted.status === 'fulfilled' ? onboardingCompleted.value : false;
      const profile = profileCompleted.status === 'fulfilled' ? profileCompleted.value : false;

      // Ensure new users always start at onboarding
      // Only set to true if explicitly marked as completed
      setHasCompletedOnboarding(onboarding === true);
      setHasCompletedProfile(profile === true);
      
      // Reset gender selection state based on completion status
      if (!profile && onboarding) {
        setSelectedGender('pending'); // Need to show gender selection
      } else if (!onboarding) {
        setSelectedGender('pending'); // Reset to pending if onboarding not completed
      }
    } catch (error) {
      console.error('Error in checkSetup:', error);
      // Set defaults on error - new users should start at onboarding
      setHasCompletedOnboarding(false);
      setHasCompletedProfile(false);
      setSelectedGender('pending');
    } finally {
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  };

  // Silent data refresh for background/foreground transitions
  const silentRefreshData = async () => {
    try {
      // Refresh data silently without showing splash or loading states
      await Promise.allSettled([
        loadTodayData().catch(err => console.warn('Silent refresh loadTodayData failed:', err)),
        loadGoals().catch(err => console.warn('Silent refresh loadGoals failed:', err)),
        loadReminders().catch(err => console.warn('Silent refresh loadReminders failed:', err)),
        loadSettings().catch(err => console.warn('Silent refresh loadSettings failed:', err)),
      ]);

      // Check setup status silently (in case user deleted data)
      await checkSetup(true);

      // Ensure native service is running (should already be running from App.tsx)
      // But check and restart if needed (e.g., if service was killed)
      if (Platform.OS === 'android') {
        const isRunning = await nativeStepWaterService.isServiceRunning();
        if (!isRunning) {
          console.log('🔄 Native service not running, restarting...');
          await nativeStepWaterService.startService().catch(err => {
            console.warn('Silent refresh native service start failed:', err);
          });
        }
      }
    } catch (error) {
      console.warn('Silent refresh error:', error);
    }
  };

  // Detect cold launch vs background/foreground
  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        // App returned from background - skip splash, refresh data silently
        setIsColdLaunch(false);
        setShowSplash(false);
        silentRefreshData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadTodayData, loadGoals, loadReminders, loadSettings]); // Add dependencies

  // Restore all data on cold launch (during splash screen)
  useEffect(() => {
    if (isColdLaunch && !hasRestoredDataRef.current) {
      restoreAppData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isColdLaunch]);

  // Full data restoration on cold launch
  const restoreAppData = async () => {
    if (hasRestoredDataRef.current) return;
    hasRestoredDataRef.current = true;

    try {
      setIsLoading(true);

      // Restore all app data
      await Promise.allSettled([
        // Step data
        loadTodayData().catch(err => console.warn('Restore loadTodayData failed:', err)),
        
        // Water intake state
        loadTodayData().catch(err => console.warn('Restore water data failed:', err)), // Already loads water
        
        // Goals
        loadGoals().catch(err => console.warn('Restore loadGoals failed:', err)),
        
        // Reminders
        loadReminders().catch(err => console.warn('Restore loadReminders failed:', err)),
        
        // Theme and settings
        loadSettings().catch(err => console.warn('Restore loadSettings failed:', err)),
      ]);

      // Permissions are now requested after UI is ready (in HomeScreen)
      // to prevent blocking cold launch, splash dismissal, or data restoration

      // Note: Native service is already started immediately in App.tsx on app launch
      // No need to start it here - it's already running independently of permissions

      // Check user setup status (skip loading state since we're managing it here)
      await checkSetup(true);

      // Hide splash after a minimum display time (for smooth UX)
      setTimeout(() => {
        setShowSplash(false);
        setIsLoading(false);
      }, 1000); // Fixed 1 second splash display

    } catch (error) {
      console.error('Error restoring app data:', error);
      setShowSplash(false);
      setIsLoading(false);
    }
  };

  // Determine initial route based on setup status
  const getInitialRouteName = (): string => {
    if (!hasCompletedOnboarding) return 'Onboarding';
    if (!hasCompletedProfile) {
      return selectedGender === 'pending' ? 'GenderSelection' : 'ProfileSetup';
    }
    return 'Main';
  };

  useEffect(() => {
    // Only check setup on cold launch after data is restored
    // For background/foreground, setup is checked in silentRefreshData
    if (!isColdLaunch || hasRestoredDataRef.current) {
      return;
    }
    // checkSetup is called in restoreAppData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isColdLaunch]);

  // Navigate to appropriate screen after splash is hidden on cold launch
  useEffect(() => {
    if (!showSplash && !isLoading && isColdLaunch && navigationRef.isReady() && !isResettingNavigation.current) {
      const targetRoute = getInitialRouteName();
      const currentRoute = navigationRef.getCurrentRoute();
      
      // Only navigate if we're not already on the correct route
      if (currentRoute?.name !== targetRoute && currentRoute?.name !== 'Splash') {
        isResettingNavigation.current = true;
        // Use requestAnimationFrame to ensure view hierarchy is stable
        requestAnimationFrame(() => {
          try {
            navigationRef.reset({
              index: 0,
              routes: [{ name: targetRoute }],
            });
          } catch (error) {
            console.warn('Navigation reset error:', error);
          } finally {
            // Reset flag after a short delay
            setTimeout(() => {
              isResettingNavigation.current = false;
            }, 100);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSplash, isLoading, isColdLaunch, hasCompletedOnboarding, hasCompletedProfile, selectedGender]);

  // Reset navigation when data is deleted (state changes from completed to not completed)
  const prevHasCompletedOnboarding = useRef(hasCompletedOnboarding);
  const prevHasCompletedProfile = useRef(hasCompletedProfile);
  
  useEffect(() => {
    if (!isLoading && navigationRef.isReady() && !isResettingNavigation.current) {
      // Only reset if transitioning from completed to not completed (data was deleted)
      const wasCompleted = prevHasCompletedOnboarding.current && prevHasCompletedProfile.current;
      const isNotCompleted = !hasCompletedOnboarding || !hasCompletedProfile;
      
      if (wasCompleted && isNotCompleted) {
        isResettingNavigation.current = true;
        // Use requestAnimationFrame to ensure view hierarchy is stable
        requestAnimationFrame(() => {
          try {
            // Data was deleted - reset to onboarding flow
            if (!hasCompletedOnboarding) {
              navigationRef.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } else if (!hasCompletedProfile) {
              // Navigate to appropriate screen in profile setup flow
              const targetRoute = selectedGender === 'pending' ? 'GenderSelection' : 'ProfileSetup';
              navigationRef.reset({
                index: 0,
                routes: [{ name: targetRoute }],
              });
            }
          } catch (error) {
            console.warn('Navigation reset error:', error);
          } finally {
            // Reset flag after a short delay
            setTimeout(() => {
              isResettingNavigation.current = false;
            }, 100);
          }
        });
      }
      
      // Update refs for next comparison
      prevHasCompletedOnboarding.current = hasCompletedOnboarding;
      prevHasCompletedProfile.current = hasCompletedProfile;
    }
  }, [hasCompletedOnboarding, hasCompletedProfile, selectedGender, isLoading]);

  // Expose checkSetup globally so it can be called from SettingsScreen
  useEffect(() => {
    // Store checkSetup in a global location that SettingsScreen can access
    // This allows SettingsScreen to trigger a re-check after deleting data
    (global as any).__appNavigatorCheckSetup = checkSetup;
    
    return () => {
      delete (global as any).__appNavigatorCheckSetup;
    };
  }, [checkSetup]);

  // Function to reset gender selection - allows ProfileSetupScreen to go back to GenderSelection
  const resetGenderSelection = React.useCallback(() => {
    setSelectedGender('pending');
    // Queue navigation to happen after state update (useLayoutEffect will handle it)
    pendingNavigation.current = 'GenderSelection';
  }, []);

  // Expose resetGenderSelection globally so ProfileSetupScreen can access it
  useEffect(() => {
    (global as any).__appNavigatorResetGenderSelection = resetGenderSelection;
    
    return () => {
      delete (global as any).__appNavigatorResetGenderSelection;
    };
  }, [resetGenderSelection]);

  // Navigate after state updates are processed (runs synchronously before paint)
  useLayoutEffect(() => {
    if (pendingNavigation.current && navigationRef.isReady() && !isLoading && !isResettingNavigation.current) {
      const nextScreen = pendingNavigation.current;
      
      // Verify the target screen should be available before navigating
      let shouldNavigate = false;
      if (nextScreen === 'Main') {
        // Main should only be navigated to when setup is complete
        shouldNavigate = hasCompletedOnboarding && hasCompletedProfile;
      } else if (nextScreen === 'GenderSelection') {
        // GenderSelection should be available when onboarding is complete but profile is not
        shouldNavigate = hasCompletedOnboarding && !hasCompletedProfile && selectedGender === 'pending';
      } else if (nextScreen === 'ProfileSetup') {
        // ProfileSetup should be available when onboarding is complete and gender is selected/skipped
        shouldNavigate = hasCompletedOnboarding && !hasCompletedProfile && selectedGender !== 'pending';
      }
      
      if (shouldNavigate) {
        pendingNavigation.current = null;
        isResettingNavigation.current = true;
        try {
          navigationRef.reset({
            index: 0,
            routes: [{ name: nextScreen }],
          });
        } catch (error) {
          console.warn(`Navigation to ${nextScreen} failed:`, error);
        } finally {
          // Reset flag after a short delay
          setTimeout(() => {
            isResettingNavigation.current = false;
          }, 100);
        }
      } else {
        // If screen isn't ready yet, keep the pending navigation for next render
        // This handles edge cases where state hasn't fully updated
      }
    }
  }, [hasCompletedOnboarding, hasCompletedProfile, selectedGender, isLoading]);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setSelectedGender('pending'); // Next step is gender selection
    // Queue navigation to happen after state update
    pendingNavigation.current = 'GenderSelection';
  };

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
    // Queue navigation to happen after state update
    pendingNavigation.current = 'ProfileSetup';
  };

  const handleGenderSkip = () => {
    setSelectedGender('skipped'); // Skip gender, go to profile setup
    // Queue navigation to happen after state update
    pendingNavigation.current = 'ProfileSetup';
  };

  const handleProfileComplete = async (profile: UserProfile) => {
    await StorageService.saveProfile(profile);
    // Update state - this will trigger re-render and add Main to stack
    setHasCompletedProfile(true);
    
    // Try immediate navigation first (optimistic)
    // Since we just set hasCompletedProfile to true, React will re-render and add Main to stack
    // We attempt navigation immediately, and useLayoutEffect will handle it if this fails
    if (navigationRef.isReady()) {
      try {
        // Try to navigate immediately - might work if React has processed the state update
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        // If successful, we're done
        return;
      } catch (error) {
        // If it fails (Main not in stack yet), fall through to useLayoutEffect
      }
    }
    
    // Fallback: queue for useLayoutEffect (runs synchronously after state update, before paint)
    // This ensures navigation happens as soon as Main is added to the stack
    pendingNavigation.current = 'Main';
  };

  // Show splash screen on cold launch while restoring data
  if (showSplash && isColdLaunch) {
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show loading state only if needed (shouldn't happen often)
  if (isLoading && !isColdLaunch) {
    // Return a minimal loading view instead of null to prevent rendering issues
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.textPrimary }}>Loading...</Text>
      </View>
    );
  }

  // Determine if setup is complete
  const isSetupComplete = hasCompletedOnboarding && hasCompletedProfile;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Navigation is ready - let the useEffects handle navigation logic
        // This callback is mainly for tracking readiness, not for navigation resets
        // to avoid race conditions with multiple reset calls
      }}
    >
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          // Prevent going back during onboarding flow
          gestureEnabled: isSetupComplete,
        }}
        initialRouteName={getInitialRouteName()}
      >
        {/* Only include Main in the stack when setup is complete */}
        {isSetupComplete ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ProfileSetup">
              {(props) => {
                const routeParams = props.route?.params as any;
                const existingProfile = routeParams?.existingProfile;
                const isEditing = routeParams?.isEditing || false;
                return (
                  <ProfileSetupScreen
                    gender={existingProfile?.gender || null}
                    onComplete={async (profile: UserProfile) => {
                      await StorageService.saveProfile(profile);
                      if (isEditing) {
                        props.navigation.goBack();
                      } else {
                        setHasCompletedProfile(true);
                      }
                    }}
                  />
                );
              }}
            </Stack.Screen>
          </>
        ) : !hasCompletedOnboarding ? (
          <Stack.Screen 
            name="Onboarding"
            options={{
              gestureEnabled: false, // Prevent swipe back during onboarding
            }}
          >
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : selectedGender === 'pending' ? (
          <Stack.Screen 
            name="GenderSelection"
            options={{
              gestureEnabled: false, // Prevent going back to onboarding
            }}
          >
            {(props) => (
              <GenderSelectionScreen
                {...props}
                onSelect={handleGenderSelect}
                onSkip={handleGenderSkip}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen 
            name="ProfileSetup"
            options={{
              gestureEnabled: false, // Prevent going back during setup
            }}
          >
            {(props) => (
              <ProfileSetupScreen
                {...props}
                gender={selectedGender === 'skipped' ? null : selectedGender}
                onComplete={handleProfileComplete}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;


import React, { useEffect, useState, useRef } from 'react';
import { Text, View, AppState as RNAppState } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../state/store';
import { StorageService } from '../services/storage';

// Screens
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender | 'skipped'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    checkSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadSettings is stable, no need in deps

  // Re-check setup when app comes to foreground (in case data was deleted)
  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Re-check setup when app becomes active (user might have deleted data)
        checkSetup();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Reset navigation when data is deleted (state changes from completed to not completed)
  const prevHasCompletedOnboarding = useRef(hasCompletedOnboarding);
  const prevHasCompletedProfile = useRef(hasCompletedProfile);
  
  useEffect(() => {
    if (!isLoading && navigationRef.isReady()) {
      // Only reset if transitioning from completed to not completed (data was deleted)
      const wasCompleted = prevHasCompletedOnboarding.current && prevHasCompletedProfile.current;
      const isNotCompleted = !hasCompletedOnboarding || !hasCompletedProfile;
      
      if (wasCompleted && isNotCompleted) {
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
      }
      
      // Update refs for next comparison
      prevHasCompletedOnboarding.current = hasCompletedOnboarding;
      prevHasCompletedProfile.current = hasCompletedProfile;
    }
  }, [hasCompletedOnboarding, hasCompletedProfile, selectedGender, isLoading]);

  // Navigate to GenderSelection when onboarding completes
  useEffect(() => {
    if (!isLoading && navigationRef.isReady() && hasCompletedOnboarding && !hasCompletedProfile && selectedGender === 'pending') {
      // When onboarding completes, navigate to GenderSelection
      // Use a small delay to ensure state is updated
      const timer = setTimeout(() => {
        try {
          navigationRef.navigate('GenderSelection');
        } catch (error) {
          // Navigation might fail if screen is not in stack yet, that's okay
          // The conditional rendering will handle it
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, hasCompletedProfile, selectedGender, isLoading]);

  // Navigate to ProfileSetup when gender is selected or skipped
  useEffect(() => {
    if (!isLoading && navigationRef.isReady() && hasCompletedOnboarding && !hasCompletedProfile && selectedGender !== 'pending') {
      // When gender is selected or skipped, navigate to ProfileSetup
      // Use a small delay to ensure state is updated
      const timer = setTimeout(() => {
        try {
          navigationRef.navigate('ProfileSetup');
        } catch (error) {
          // Navigation might fail if screen is not in stack yet, that's okay
          // The conditional rendering will handle it
        }
      }, 100);
      return () => clearTimeout(timer);
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
  }, []);

  const checkSetup = async () => {
    try {
      setIsLoading(true);
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

      const onboarding = onboardingCompleted.status === 'fulfilled' ? onboardingCompleted.value : false;
      const profile = profileCompleted.status === 'fulfilled' ? profileCompleted.value : false;

      setHasCompletedOnboarding(onboarding);
      setHasCompletedProfile(profile);
      if (!profile && onboarding) {
        setSelectedGender('pending'); // Need to show gender selection
      } else if (!onboarding) {
        setSelectedGender('pending'); // Reset to pending if onboarding not completed
      }
    } catch (error) {
      console.error('Error in checkSetup:', error);
      // Set defaults on error
      setHasCompletedOnboarding(false);
      setHasCompletedProfile(false);
      setSelectedGender('pending');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setSelectedGender('pending'); // Next step is gender selection
  };

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
  };

  const handleGenderSkip = () => {
    setSelectedGender('skipped'); // Skip gender, go to profile setup
  };

  const handleProfileComplete = async (profile: UserProfile) => {
    await StorageService.saveProfile(profile);
    setHasCompletedProfile(true);
  };

  if (isLoading) {
    // Return a minimal loading view instead of null to prevent rendering issues
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.textPrimary }}>Loading...</Text>
      </View>
    );
  }

  // Determine initial route based on setup status
  const getInitialRouteName = () => {
    if (!hasCompletedOnboarding) return 'Onboarding';
    if (!hasCompletedProfile) {
      return selectedGender === 'pending' ? 'GenderSelection' : 'ProfileSetup';
    }
    return 'Main';
  };

  return (
    <NavigationContainer
      ref={navigationRef}
    >
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRouteName()}
      >
        {/* Always include Main in the stack for smooth navigation */}
        <Stack.Screen name="Main" component={TabNavigator} />
        
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : !hasCompletedProfile ? (
          selectedGender === 'pending' ? (
            <Stack.Screen name="GenderSelection">
              {(props) => (
                <GenderSelectionScreen
                  {...props}
                  onSelect={handleGenderSelect}
                  onSkip={handleGenderSkip}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="ProfileSetup">
              {(props) => (
                <ProfileSetupScreen
                  {...props}
                  gender={selectedGender === 'skipped' ? null : selectedGender}
                  onComplete={handleProfileComplete}
                />
              )}
            </Stack.Screen>
          )
        ) : (
          <>
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
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;


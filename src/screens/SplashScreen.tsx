import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

interface SplashScreenProps {
  // This screen doesn't need props - it just displays while data is being restored
}

/**
 * Premium splash screen shown during cold app launch
 * Minimal design with centered logo, subtle animations, and adaptive light/dark mode
 */
const SplashScreen: React.FC<SplashScreenProps> = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const logoPulse = useSharedValue(1);
  const ringScale = useSharedValue(0.9);
  const ringOpacity = useSharedValue(0);
  const ringRotation = useSharedValue(0);

  // Background colors that adapt to light/dark mode
  const backgroundColor = isDark ? '#111827' : '#F9FAFB';
  const ringColor = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)';
  const logoColor = isDark ? theme.colors.primary : theme.colors.primary;

  useEffect(() => {
    // Logo entrance animation - subtle fade and scale
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    // Logo pulse animation - subtle and non-distracting (starts after entrance)
    logoPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Ring entrance animation - brief appearance
    ringOpacity.value = withSequence(
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(0.25, { duration: 500, easing: Easing.inOut(Easing.ease) })
    );
    ringScale.value = withSequence(
      withTiming(1.05, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
    );

    // Subtle rotation for the decorative ring (very slow)
    ringRotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  // Logo animated style
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [
        { scale: logoScale.value * logoPulse.value },
      ],
    };
  });

  // Ring animated style
  const ringAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: ringOpacity.value,
      transform: [
        { scale: ringScale.value },
        { rotate: `${ringRotation.value}deg` },
      ],
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={[]}>
      <View style={styles.content}>
        {/* Decorative ring - optional, subtle animation */}
        <Animated.View
          style={[
            styles.ring,
            { borderColor: ringColor },
            ringAnimatedStyle,
          ]}
        />
        
        {/* Centered app logo with pulse animation */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          {/* Simple, elegant logo - using a single icon that represents activity/health */}
          <Ionicons name="walk" size={56} color={logoColor} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    zIndex: 1,
  },
});

export default SplashScreen;


import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
}

const FAB: React.FC<FABProps> = ({ onPress, icon = '+', label }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.3);
  const iconScale = useSharedValue(1);

  // Enhanced continuous flip animation with multiple effects
  useEffect(() => {
    // More pronounced vertical movement
    translateY.value = withRepeat(
      withSequence(
        withTiming(-12, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        withTiming(12, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      ),
      -1, // Infinite repeat
      false
    );
    
    // Enhanced flip rotation - more pronounced
    flipRotation.value = withRepeat(
      withSequence(
        withTiming(25, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        withTiming(-25, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      ),
      -1, // Infinite repeat
      false
    );

    // Pulsing scale effect for breathing animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Shadow/elevation pulsing
    shadowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.3, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Icon scale animation (slight bounce)
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
      { rotate: `${rotation.value}deg` },
      { translateY: translateY.value },
      { rotateZ: `${flipRotation.value}deg` },
    ],
    shadowOpacity: shadowOpacity.value,
    elevation: shadowOpacity.value * 12,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
    ],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Enhanced press animation with more dynamic effects
    scale.value = withSequence(
      withSpring(0.85, { 
        damping: 8,
        stiffness: 200,
      }),
      withSpring(1, { 
        damping: 10,
        stiffness: 150,
      })
    );
    rotation.value = withSequence(
      withSpring(360, { 
        damping: 12,
        stiffness: 180,
      }),
      withSpring(0, { 
        damping: 15,
        stiffness: 150,
      })
    );
    // Add a quick bounce to icon
    iconScale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.container}
    >
      <Animated.View style={[styles.fab, animatedStyle]}>
        <Animated.View style={iconAnimatedStyle}>
          <Text style={styles.icon}>{icon}</Text>
          {label && <Text style={styles.label}>{label}</Text>}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    zIndex: 1000,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: theme.typography.fontSize.valueMedium,
    color: '#ffffff',
    fontWeight: theme.typography.fontWeight.regular,
  },
  label: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: '#ffffff',
    marginTop: theme.spacing.xs / 2,
  },
});

export default FAB;


import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/constants';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

interface AchievementModalProps {
  visible: boolean;
  type: 'steps' | 'water';
  onClose: () => void;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
}

const AchievementModal: React.FC<AchievementModalProps> = ({
  visible,
  type,
  onClose,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      opacity.value = withTiming(1, { duration: 300 });
      rotation.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 1000 }),
          withTiming(-10, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      scale.value = 0;
      opacity.value = 0;
      rotation.value = 0;
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleClose = () => {
    scale.value = withTiming(0, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const emoji = type === 'steps' ? '🎉' : '💧';
  const title = type === 'steps' ? 'Step Goal Achieved!' : 'Water Goal Achieved!';
  const message =
    type === 'steps'
      ? 'Congratulations! You reached your daily step goal!'
      : 'Amazing! You hit your daily water intake goal!';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View 
          style={[styles.container, animatedContainerStyle]}
          pointerEvents="box-none"
        >
          <Animated.Text style={[styles.emoji, animatedIconStyle]}>
            {emoji}
          </Animated.Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          {/* Confetti particles - reduced count for better performance */}
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} visible={visible} />
          ))}
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ConfettiParticle: React.FC<{ index: number; visible: boolean }> = ({
  index,
  visible,
}) => {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  const colors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.accent,
    COLORS.success,
    COLORS.warning,
  ];

  useEffect(() => {
    if (visible) {
      const angle = (index * 12) * (Math.PI / 180);
      const distance = 200 + Math.random() * 100;
      
      translateX.value = withDelay(
        index * 20,
        withSpring(Math.cos(angle) * distance, { damping: 10 })
      );
      translateY.value = withDelay(
        index * 20,
        withSpring(Math.sin(angle) * distance + 400, { damping: 10 })
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 + Math.random() * 1000 }),
        -1,
        false
      );
      opacity.value = withDelay(
        index * 20 + 1000,
        withTiming(0, { duration: 500 })
      );
    } else {
      translateY.value = -100;
      translateX.value = 0;
      opacity.value = 1;
      rotation.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: colors[index % colors.length],
          left: SCREEN_WIDTH / 2,
          top: SCREEN_HEIGHT / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    backgroundColor: COLORS.light.background,
    borderRadius: rs(24),
    padding: rp(32),
    alignItems: 'center',
    width: wp(85),
    maxWidth: wp(90),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: 0.3,
    shadowRadius: rs(16),
    elevation: 16,
    overflow: 'visible', // Changed to visible so confetti can escape
    zIndex: 1000,
  },
  emoji: {
    fontSize: rf(80),
    marginBottom: rm(16),
  },
  title: {
    fontSize: rf(28),
    fontWeight: 'bold',
    color: COLORS.light.text,
    marginBottom: rm(8),
    textAlign: 'center',
  },
  message: {
    fontSize: rf(16),
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    marginBottom: rm(24),
    lineHeight: rf(24),
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: rs(16),
    paddingVertical: rp(14),
    paddingHorizontal: rp(32),
    marginTop: rm(8),
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: rf(18),
    fontWeight: '600',
  },
  confetti: {
    position: 'absolute',
    width: rs(12),
    height: rs(12),
    borderRadius: rs(2),
  },
});

export default AchievementModal;


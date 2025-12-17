import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '../state/store';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { formatWater } from '../utils/formatting';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

// Calculate glass size for 5 glasses per row with proper spacing
// Container padding: 3.5% on each side = 7% total
// Available width: 100% - 7% = 93%
// For 5 glasses with equal spacing: 5*GLASS_SIZE + 4 gaps = 93%
// Using flexbox with space-between: 5*GLASS_SIZE + margins = 93%
// GLASS_SIZE = (93% - margins) / 5 ≈ 17% per glass
// Using 16.5% to ensure proper fit with responsive margins
const GLASS_SIZE = wp(16.5); // Responsive glass size for 5 per row (16.5% of screen width)
const WATER_AMOUNT_PER_GLASS = 250; // ml per glass
const INITIAL_GLASSES_COUNT = 10; // Show 10 glasses initially (2 rows of 5)

interface AddWaterModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number) => void | Promise<void>;
  presets: number[];
  unit?: 'metric' | 'imperial';
}

interface GlassState {
  id: number;
  filled: boolean;
  fillProgress: number;
}

const WaterGlass: React.FC<{
  glass: GlassState;
  onPress: () => void;
  unit: 'metric' | 'imperial';
  isNew?: boolean;
}> = ({ glass, onPress, unit, isNew = false }) => {
  const fillAnimation = useSharedValue(glass.filled ? 1 : 0);
  const scaleAnimation = useSharedValue(isNew ? 0 : 1);
  const opacityAnimation = useSharedValue(glass.filled ? 1 : 0.7);
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(glass.filled ? 1 : 0);
  const bounceAnimation = useSharedValue(1);
  const pulseAnimation = useSharedValue(glass.filled ? 1 : 0);
  const glowAnimation = useSharedValue(glass.filled ? 1 : 0);
  const shimmerAnimation = useSharedValue(0);
  const rotateAnimation = useSharedValue(0);

  useEffect(() => {
    if (isNew) {
      // Fast entrance animation for new glass - instant visibility
      scaleAnimation.value = withSequence(
        withSpring(0, { damping: 10, stiffness: 200 }),
        withSpring(1.1, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
      rotateAnimation.value = withSequence(
        withTiming(-3, { duration: 100 }), // Faster
        withTiming(3, { duration: 100 }), // Faster
        withTiming(0, { duration: 100 }) // Faster
      );
    }
  }, [isNew]);

  useEffect(() => {
    if (glass.filled) {
      // Fast fill animation - instant visual feedback
      fillAnimation.value = withSpring(1, {
        damping: 15,
        stiffness: 200, // Increased stiffness for faster animation
      });
      opacityAnimation.value = withTiming(1, { duration: 150 }); // Faster opacity
      
      // Faster ripple animation
      rippleScale.value = withSequence(
        withTiming(1.8, { duration: 300 }), // Reduced from 500ms
        withTiming(1, { duration: 0 })
      );
      rippleOpacity.value = withSequence(
        withTiming(0.6, { duration: 150 }), // Reduced from 250ms
        withTiming(0, { duration: 150 }) // Reduced from 250ms
      );

      // Pulse animation for filled glass
      pulseAnimation.value = 1;

      // Faster glow animation
      glowAnimation.value = withSequence(
        withTiming(1.2, { duration: 200 }), // Reduced from 300ms
        withTiming(1, { duration: 200 }) // Reduced from 300ms
      );

      // Faster shimmer effect
      shimmerAnimation.value = withSequence(
        withTiming(1, { duration: 400 }), // Reduced from 800ms
        withTiming(0, { duration: 0 })
      );

      // Faster checkmark animation - no delay
      checkmarkScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    } else {
      fillAnimation.value = withTiming(0, { duration: 150 }); // Faster
      opacityAnimation.value = withTiming(0.7, { duration: 150 }); // Faster
      checkmarkScale.value = withTiming(0, { duration: 100 }); // Faster
      pulseAnimation.value = withTiming(0, { duration: 150 }); // Faster
      glowAnimation.value = withTiming(0, { duration: 150 }); // Faster
    }
  }, [glass.filled]);

  // Continuous pulse animation for filled glasses
  useEffect(() => {
    if (glass.filled) {
      const pulseInterval = setInterval(() => {
        pulseAnimation.value = withSequence(
          withTiming(1.03, { duration: 600 }),
          withTiming(1, { duration: 600 })
        );
      }, 1200);
      return () => clearInterval(pulseInterval);
    }
  }, [glass.filled]);

  const handlePress = () => {
    if (!glass.filled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Lighter haptic for faster feel
      // Faster bounce animation for immediate feedback
      bounceAnimation.value = withSequence(
        withSpring(0.9, { damping: 8, stiffness: 250 }), // Faster spring
        withSpring(1.02, { damping: 8, stiffness: 250 }), // Faster spring
        withSpring(1, { damping: 10, stiffness: 200 }) // Faster spring
      );
      rotateAnimation.value = withSequence(
        withTiming(-2, { duration: 50 }), // Faster
        withTiming(2, { duration: 50 }), // Faster
        withTiming(0, { duration: 50 }) // Faster
      );
      onPress();
    }
  };

  const waterStyle = useAnimatedStyle(() => {
    const fillHeight = interpolate(
      fillAnimation.value,
      [0, 1],
      [0, GLASS_SIZE * 0.7],
      Extrapolate.CLAMP
    );

    return {
      height: fillHeight,
    };
  });

  const glassStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnimation.value * bounceAnimation.value * (1 + (pulseAnimation.value - 1) * 0.5) },
      { rotate: `${rotateAnimation.value}deg` }
    ],
    opacity: opacityAnimation.value,
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      glowAnimation.value,
      [0, 1],
      [0, 0.3],
      Extrapolate.CLAMP
    );
    return {
      shadowOpacity: glowOpacity,
      shadowRadius: 8 * glowAnimation.value,
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const shimmerTranslate = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [-100, 100],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX: shimmerTranslate }],
      opacity: shimmerAnimation.value * 0.5,
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkScale.value,
    transform: [
      {
        scale: interpolate(
          checkmarkScale.value,
          [0, 1],
          [0.3, 1],
          Extrapolate.CLAMP
        ),
      },
      {
        rotate: `${interpolate(
          checkmarkScale.value,
          [0, 1],
          [-180, 0],
          Extrapolate.CLAMP
        )}deg`,
      },
    ],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.glassContainer}
      disabled={glass.filled}
    >
      <Animated.View style={[styles.glassWrapper, glassStyle, glowStyle]}>
        {/* Glass Container */}
        <View style={styles.glassOutline}>
          {/* Glass rim */}
          <Animated.View
            style={[
              styles.glassRim,
              glass.filled ? styles.glassRimFilled : styles.glassRimEmpty,
            ]}
          />
          
          {/* Glass body */}
          <View
            style={[
              styles.glassBody,
              glass.filled ? styles.glassBodyFilled : styles.glassBodyEmpty,
            ]}
          >
            {/* Glass background gradient */}
            <View style={styles.glassBackground} />
            
            {/* Animated Water Fill */}
            <Animated.View style={[styles.waterFill, waterStyle]}>
              <View style={styles.waterGradient}>
                {/* Water gradient layers for depth */}
                <View style={styles.waterGradientTop} />
                <View style={styles.waterGradientMiddle} />
                {/* Shimmer effect */}
                <Animated.View style={[styles.shimmer, shimmerStyle]}>
                  <View style={styles.shimmerGradient} />
                </Animated.View>
                {/* Water shine effect */}
                <View style={styles.waterShine} />
                {/* Ripple effect */}
                <Animated.View style={[styles.ripple, rippleStyle]}>
                  <View style={styles.rippleCircle} />
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Amount Label */}
        <View style={styles.amountLabel}>
          <Text style={styles.amountText}>
            {formatWater(WATER_AMOUNT_PER_GLASS, unit)}
          </Text>
        </View>

        {/* Checkmark when filled */}
        <Animated.View style={[styles.checkmark, checkmarkStyle]}>
          <Text style={styles.checkmarkText}>✓</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const AddWaterModal: React.FC<AddWaterModalProps> = ({
  visible,
  onClose,
  onAdd,
  presets,
  unit = 'metric',
}) => {
  const { waterConsumed } = useStore();
  const [glasses, setGlasses] = useState<GlassState[]>([]);
  const [newGlassIds, setNewGlassIds] = useState<Set<number>>(new Set());
  const nextGlassIdRef = useRef<number>(0);
  const newGlassIdsRef = useRef<Set<number>>(new Set()); // Ref to track new glass IDs synchronously

  // Initialize glasses based on current water consumption when modal opens
  useEffect(() => {
    if (visible) {
      // Calculate how many full glasses based on water consumed
      const filledGlassesCount = Math.floor(waterConsumed / WATER_AMOUNT_PER_GLASS);
      // Always show at least INITIAL_GLASSES_COUNT (10) glasses, or more if needed
      const minGlasses = Math.max(INITIAL_GLASSES_COUNT, filledGlassesCount + 1);
      
      const initialGlasses: GlassState[] = Array.from({ length: minGlasses }, (_, i) => ({
        id: i,
        filled: i < filledGlassesCount,
        fillProgress: i < filledGlassesCount ? 1 : 0,
      }));

      setGlasses(initialGlasses);
      const emptySet = new Set<number>();
      setNewGlassIds(emptySet);
      newGlassIdsRef.current = emptySet;
      // Set the next ID to continue from where we left off
      nextGlassIdRef.current = minGlasses;
    }
  }, [visible, waterConsumed]);

  const handleGlassPress = async (glassId: number) => {
    const glass = glasses.find((g) => g.id === glassId);
    if (!glass || glass.filled) return;

    // Update glass state immediately for instant visual feedback
    let newGlassId: number | null = null;
    
    setGlasses((prev) => {
      // Create updated array with the clicked glass marked as filled
      const updated = prev.map((g) => 
        g.id === glassId ? { ...g, filled: true, fillProgress: 1 } : g
      );
      
      // Check if all current glasses are filled
      const allFilled = updated.every((g) => g.filled);
      
      if (allFilled) {
        // Generate new glass ID immediately
        newGlassId = nextGlassIdRef.current;
        nextGlassIdRef.current += 1;
        
        // Create new glass object
        const newGlass: GlassState = {
          id: newGlassId,
          filled: false,
          fillProgress: 0,
        };
        
        // Return updated array with new glass appended at the end
        // This ensures the new glass appears immediately after the last filled glass
        const newArray = [...updated, newGlass];
        
        console.log(`✅ Added glass ${newGlassId} at position ${newArray.length - 1} (total: ${newArray.length})`);
        
        return newArray;
      }
      
      return updated;
    });
    
    // Update new glass IDs outside of setGlasses to avoid nested state updates
    if (newGlassId !== null) {
      newGlassIdsRef.current = new Set([...newGlassIdsRef.current, newGlassId]);
      setNewGlassIds(newGlassIdsRef.current);
    }

    try {
      // Add water (this updates the store and Supabase) - do this after UI update
      const result = onAdd(WATER_AMOUNT_PER_GLASS);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      // Revert on error
      setGlasses((prev) =>
        prev.map((g) => (g.id === glassId ? { ...g, filled: false, fillProgress: 0 } : g))
      );
      console.error('Error adding water:', error);
    }
  };

  const filledCount = glasses.filter((g) => g.filled).length;
  const totalAmount = filledCount * WATER_AMOUNT_PER_GLASS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View 
          style={styles.modalContentWrapper}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalContent}>
            <SafeAreaView edges={['bottom']} style={styles.safeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.title}>Add Water</Text>
                  <Text style={styles.subtitle}>
                    Tap a glass to add {formatWater(WATER_AMOUNT_PER_GLASS, unit)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButtonContainer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Glasses</Text>
                  <Text style={styles.summaryValue}>
                    {filledCount} / {glasses.length}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>
                    {formatWater(totalAmount, unit)}
                  </Text>
                </View>
              </View>

              {/* Glasses Grid */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.glassesGrid}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {glasses.map((glass, index) => (
                  <WaterGlass
                    key={glass.id} // Use only glass.id as key - React will maintain order based on array position
                    glass={glass}
                    onPress={() => handleGlassPress(glass.id)}
                    unit={unit}
                    isNew={newGlassIds.has(glass.id)}
                  />
                ))}
                {/* Spacer to ensure last row doesn't get cut off */}
                <View style={{ width: GLASS_SIZE, height: 0 }} />
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: rs(28),
    borderTopRightRadius: rs(28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(-4) },
    shadowOpacity: 0.15,
    shadowRadius: rs(16),
    elevation: 10,
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: rp(24),
    paddingTop: rp(20),
    paddingBottom: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  headerLeft: {
    flex: 1,
    marginRight: rm(16),
  },
  title: {
    fontSize: theme.typography.fontSize.titleSmall,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: rm(4),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: rf(20),
  },
  closeButtonContainer: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
    elevation: 2,
  },
  closeButton: {
    fontSize: rf(20),
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.regular,
    lineHeight: rf(20),
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    marginHorizontal: rm(20),
    marginTop: rm(16),
    marginBottom: rm(16),
    borderRadius: rs(14),
    paddingVertical: rp(14),
    paddingHorizontal: rp(16),
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    marginBottom: rm(6),
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.sectionHeader,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.water,
    letterSpacing: -0.3,
  },
  summaryDivider: {
    width: 1,
    height: rs(40),
    backgroundColor: theme.colors.border + '60',
    marginHorizontal: rm(16),
  },
  scrollView: {
    flex: 1,
  },
  glassesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Changed from space-between to ensure correct order
    paddingHorizontal: wp(3.5), // Container padding (reduced for better fit)
    paddingBottom: rp(32),
    paddingTop: rp(8),
  },
  glassContainer: {
    width: GLASS_SIZE,
    height: GLASS_SIZE + rs(28), // Extra space for label
    marginBottom: rm(12), // Vertical margin between rows
    marginRight: wp(1.2), // Horizontal margin between glasses (calculated for 5 per row)
    alignItems: 'center',
    justifyContent: 'center',
    padding: rp(4), // Reduced padding for smaller glasses
    borderRadius: rs(12), // Smaller radius for smaller glasses
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(1) },
    shadowOpacity: 0.06,
    shadowRadius: rs(3),
    elevation: 1,
  },
  glassWrapper: {
    width: GLASS_SIZE - rs(8),
    height: GLASS_SIZE - rs(8),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glassOutline: {
    width: GLASS_SIZE * 0.6,
    height: GLASS_SIZE * 0.8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glassRim: {
    width: GLASS_SIZE * 0.7,
    height: rs(5),
    borderRadius: rs(2.5),
    marginBottom: rs(-2.5),
    zIndex: 3,
    shadowOffset: { width: 0, height: rs(1) },
    shadowRadius: rs(2),
    elevation: 2,
  },
  glassRimEmpty: {
    backgroundColor: '#e2e8f0', // Light gray
    borderWidth: 1.5,
    borderColor: '#cbd5e1', // Light border
  },
  glassRimFilled: {
    backgroundColor: theme.colors.water, // Water blue
    borderWidth: 2,
    borderColor: theme.colors.water, // Water blue border
    shadowColor: theme.colors.water,
    shadowOpacity: 0.4,
  },
  glassBody: {
    width: GLASS_SIZE * 0.6,
    height: GLASS_SIZE * 0.75,
    borderWidth: rs(2),
    borderTopWidth: 0,
    borderBottomLeftRadius: GLASS_SIZE * 0.3,
    borderBottomRightRadius: GLASS_SIZE * 0.3,
    overflow: 'hidden',
    position: 'relative',
  },
  glassBodyEmpty: {
    borderColor: theme.colors.border, // Light gray border
    backgroundColor: theme.colors.background, // Very light gray background
  },
  glassBodyFilled: {
    borderColor: theme.colors.water, // Water blue border
    backgroundColor: theme.colors.water + '15', // Light blue background
    shadowColor: theme.colors.water,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.25,
    shadowRadius: rs(5),
    elevation: 3,
  },
  glassBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.water + '20', // Water blue tint
    borderBottomLeftRadius: GLASS_SIZE * 0.3,
    borderBottomRightRadius: GLASS_SIZE * 0.3,
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: GLASS_SIZE * 0.3 - rs(2),
    borderBottomRightRadius: GLASS_SIZE * 0.3 - rs(2),
  },
  waterGradient: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.water, // Water blue base
    position: 'relative',
    overflow: 'hidden',
  },
  waterGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: theme.colors.water + 'CC', // Lighter water blue top
    opacity: 0.9,
  },
  waterGradientMiddle: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: theme.colors.water + 'AA', // Medium water blue middle
    opacity: 0.7,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  shimmerGradient: {
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  waterShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: rs(8),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopLeftRadius: GLASS_SIZE * 0.3,
    borderTopRightRadius: GLASS_SIZE * 0.3,
    zIndex: 1,
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: GLASS_SIZE * 0.5,
    height: GLASS_SIZE * 0.5,
    marginLeft: -GLASS_SIZE * 0.25,
    marginTop: -GLASS_SIZE * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleCircle: {
    width: GLASS_SIZE * 0.4,
    height: GLASS_SIZE * 0.4,
    borderRadius: GLASS_SIZE * 0.2,
    backgroundColor: theme.colors.water, // Water blue for ripple
    opacity: 0.4,
  },
  amountLabel: {
    position: 'absolute',
    bottom: rs(-24), // Adjusted for smaller glasses
    alignItems: 'center',
    width: GLASS_SIZE,
    paddingHorizontal: rp(2),
  },
  amountText: {
    fontSize: rf(9), // Slightly smaller for smaller glasses
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: rp(4),
    paddingVertical: rp(2),
    borderRadius: rs(6),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  checkmark: {
    position: 'absolute',
    top: GLASS_SIZE * 0.12,
    right: GLASS_SIZE * 0.12,
    width: rs(18), // Slightly smaller for smaller glasses
    height: rs(18),
    borderRadius: rs(9),
    backgroundColor: theme.colors.steps,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: theme.colors.steps,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.4,
    shadowRadius: rs(4),
    elevation: 4,
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: rf(11), // Slightly smaller
    fontWeight: '700',
  },
});

export default AddWaterModal;


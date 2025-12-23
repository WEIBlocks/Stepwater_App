import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { rs, rp, rm, rf } from '../utils/responsive';

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
  animated?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = theme.colors.primary,
  onPress,
  animated = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (animated) {
      scale.value = withSequence(
        withSpring(0.95, { damping: 12, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );
    }
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const CardContent = (
    <View style={[styles.card, { borderLeftColor: color }]}>
      {icon && (
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      )}
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={animated ? animatedStyle : undefined}>
          {CardContent}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return <Animated.View style={animated ? animatedStyle : undefined}>{CardContent}</Animated.View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: rs(theme.borderRadius.card),
    padding: rp(theme.spacing.md),
    marginVertical: rm(theme.spacing.sm),
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: rs(4),
    ...theme.shadows.card,
  },
  icon: {
    fontSize: rf(theme.typography.fontSize.valueMedium),
    marginRight: rm(theme.spacing.md),
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: rf(theme.typography.fontSize.captionSmall),
    color: theme.colors.textSecondary,
    marginBottom: rm(theme.spacing.xs),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.typography.fontWeight.medium,
  },
  value: {
    fontSize: rf(theme.typography.fontSize.valueMedium),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
});

export default StatCard;


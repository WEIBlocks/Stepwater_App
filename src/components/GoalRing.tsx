import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { formatSteps, formatWater } from '../utils/formatting';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GoalRingProps {
  progress: number; // 0-1
  goal: number;
  current: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  type: 'steps' | 'water';
  unit?: 'metric' | 'imperial';
}

const GoalRing: React.FC<GoalRingProps> = ({
  progress,
  goal,
  current,
  size = 200,
  strokeWidth = 16,
  color = type === 'steps' ? theme.colors.steps : theme.colors.water,
  type,
  unit = 'metric',
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    animatedProgress.value = withSpring(Math.min(progress, 1), {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const textSize = size * 0.25;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.2}
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.currentText, { fontSize: textSize, color }]}>
          {type === 'steps'
            ? formatSteps(current)
            : formatWater(current, unit)}
        </Text>
        <Text style={styles.goalText}>
          / {type === 'steps'
            ? formatSteps(goal)
            : formatWater(goal, unit)}
        </Text>
        <Text style={styles.label}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  goalText: {
    fontSize: theme.typography.fontSize.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

export default GoalRing;


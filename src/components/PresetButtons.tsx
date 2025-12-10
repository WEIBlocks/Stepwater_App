import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatWater } from '../utils/formatting';
import { COLORS } from '../utils/constants';

interface PresetButtonsProps {
  presets: number[];
  onPress: (amount: number) => void | Promise<void>;
  unit?: 'metric' | 'imperial';
}

const PresetButtons: React.FC<PresetButtonsProps> = ({
  presets,
  onPress,
  unit = 'metric',
}) => {
  return (
    <View style={styles.container}>
      {presets.map((amount, index) => (
        <PresetButton
          key={index}
          amount={amount}
          onPress={() => onPress(amount)}
          unit={unit}
        />
      ))}
    </View>
  );
};

const PresetButton: React.FC<{
  amount: number;
  onPress: () => void | Promise<void>;
  unit: 'metric' | 'imperial';
}> = ({ amount, onPress, unit }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    
    try {
      const result = onPress();
      // Handle both sync and async onPress
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error('Error in preset button press:', error);
        });
      }
    } catch (error) {
      console.error('Error in preset button press:', error);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.buttonContainer}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text style={styles.amount}>{formatWater(amount, unit)}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingVertical: 16,
  },
  buttonContainer: {
    margin: 8,
  },
  button: {
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.light.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default PresetButtons;


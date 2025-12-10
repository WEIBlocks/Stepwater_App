import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Gender } from '../types';
import { COLORS } from '../utils/constants';
import { Svg, Circle, Path } from 'react-native-svg';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

interface GenderSelectionScreenProps {
  onSelect: (gender: Gender) => void;
  onSkip: () => void;
}

const GenderSelectionScreen: React.FC<GenderSelectionScreenProps> = ({
  onSelect,
  onSkip,
}) => {
  const [selectedGender, setSelectedGender] = useState<Gender>(null);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handleSelect = (gender: Gender) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGender(gender);
  };

  const handleNext = () => {
    if (selectedGender) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(selectedGender);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const GenderOption = ({
    gender,
    label,
    symbol,
    color,
  }: {
    gender: Gender;
    label: string;
    symbol: string;
    color: string;
  }) => {
    const isSelected = selectedGender === gender;
    const optionScale = useSharedValue(1);

    const handlePress = () => {
      handleSelect(gender);
      optionScale.value = withSpring(0.95, {}, () => {
        optionScale.value = withSpring(1);
      });
    };

    const optionAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: optionScale.value }],
    }));

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.genderOption,
          isSelected && styles.genderOptionSelected,
          { borderColor: isSelected ? color : COLORS.light.border },
        ]}
      >
        <Animated.View style={optionAnimatedStyle}>
          <View
            style={[
              styles.genderCircle,
              { backgroundColor: isSelected ? color + '20' : 'transparent' },
            ]}
          >
            <View style={styles.genderSymbolContainer}>
              <Svg width={60} height={60} viewBox="0 0 60 60">
                <Circle
                  cx="30"
                  cy="30"
                  r="25"
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                />
                {gender === 'female' && (
                  <>
                    {/* Female symbol - circle with cross */}
                    <Circle cx="30" cy="20" r="6" fill={color} />
                    <Path
                      d="M 30 26 L 30 44"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 22 32 L 30 26 L 38 32"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </>
                )}
                {gender === 'male' && (
                  <>
                    {/* Male symbol - circle with arrow */}
                    <Circle cx="30" cy="20" r="6" fill={color} />
                    <Path
                      d="M 30 26 L 30 40"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 26 28 L 30 24 L 34 28"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </>
                )}
                {gender === 'other' && (
                  <>
                    <Circle cx="30" cy="20" r="8" fill="none" stroke={color} strokeWidth="2.5" />
                    <Path
                      d="M 30 28 L 30 42"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <Circle cx="30" cy="46" r="3" fill={color} />
                  </>
                )}
              </Svg>
            </View>
          </View>
          <Text style={[styles.genderLabel, isSelected && { color }]}>
            {label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, animatedOpacity]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Select Gender</Text>
          <Text style={styles.subtitle}>
            Calories & stride length calculation needs it.
          </Text>
        </View>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          <View style={styles.row}>
            <GenderOption
              gender="female"
              label="Female"
              symbol="♀"
              color="#EC4899"
            />
            <GenderOption
              gender="male"
              label="Male"
              symbol="♂"
              color="#3B82F6"
            />
          </View>

          <GenderOption
            gender="other"
            label="Others / I'd rather not say"
            symbol="?"
            color="#6366F1"
          />
        </View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedGender && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedGender}
          >
            <Text style={styles.nextButtonText}>NEXT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={styles.restoreButton}>
            <Text style={styles.restoreText}>Restore Data</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark blue background
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  titleSection: {
    marginTop: 40,
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: rf(32),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: rm(12),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: rf(16),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: rf(22),
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: rm(32),
    gap: rm(20),
  },
  genderOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: rp(24),
    borderRadius: rs(20),
    borderWidth: 2,
    backgroundColor: '#1E293B',
    minWidth: rs(140),
  },
  genderOptionSelected: {
    borderWidth: 2.5,
  },
  genderCircle: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rm(16),
  },
  genderLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: rp(40),
    gap: rm(16),
  },
  nextButton: {
    backgroundColor: '#10B981',
    borderRadius: rs(30),
    paddingVertical: rp(18),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.3,
    shadowRadius: rs(8),
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  restoreButton: {
    padding: rp(12),
    alignItems: 'center',
  },
  restoreText: {
    fontSize: rf(14),
    color: '#94A3B8',
  },
  genderSymbolContainer: {
    width: rs(60),
    height: rs(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GenderSelectionScreen;


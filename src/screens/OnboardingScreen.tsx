import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '../state/store';
import { StorageService } from '../services/storage';
import { COLORS } from '../utils/constants';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

const AnimatedSlideContent: React.FC<{ item: OnboardingSlide; isActive: boolean }> = ({ item, isActive }) => {
  const opacity = useSharedValue(isActive ? 1 : 0);
  const translateY = useSharedValue(isActive ? 0 : 20);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      <Animated.Text style={[styles.emoji, animatedStyle]}>
        {item.emoji}
      </Animated.Text>
      <Animated.Text style={[styles.title, animatedStyle]}>
        {item.title}
      </Animated.Text>
      <Animated.Text style={[styles.description, animatedStyle]}>
        {item.description}
      </Animated.Text>
    </>
  );
};

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Track Your Steps',
    description: 'Monitor your daily activity and reach your fitness goals with our step counter.',
    emoji: '🚶',
  },
  {
    id: '2',
    title: 'Stay Hydrated',
    description: 'Never forget to drink water with smart reminders and easy tracking.',
    emoji: '💧',
  },
  {
    id: '3',
    title: 'Achieve Your Goals',
    description: 'Set daily targets and watch yourself progress with beautiful visualizations.',
    emoji: '🎯',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleFinish();
  };

  const handleFinish = async () => {
    // Mark onboarding as complete
    // Permissions are now requested after UI is ready (in HomeScreen)
    // to prevent blocking onboarding completion
    await StorageService.setOnboardingCompleted();
    const settings = await StorageService.getSettings();
    await StorageService.saveSettings({
      ...settings,
      hasCompletedOnboarding: true,
    });
    
    useStore.setState({
      settings: {
        ...settings,
        hasCompletedOnboarding: true,
      },
    });
    
    onComplete();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const isActive = index === currentIndex;
    
    return (
      <View style={styles.slide}>
        <AnimatedSlideContent 
          item={item} 
          isActive={isActive}
        />
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        scrollEnabled={true}
      />

      {renderPagination()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  skipButton: {
    position: 'absolute',
    top: hp(7),
    right: wp(6),
    zIndex: 10,
    padding: rp(8),
  },
  skipText: {
    fontSize: rf(16),
    color: COLORS.light.textSecondary,
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emoji: {
    fontSize: rf(80),
    marginBottom: rm(32),
  },
  title: {
    fontSize: rf(32),
    fontWeight: 'bold',
    color: COLORS.light.text,
    marginBottom: rm(16),
    textAlign: 'center',
  },
  description: {
    fontSize: rf(18),
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    lineHeight: rf(26),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rm(40),
  },
  paginationDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: COLORS.light.border,
    marginHorizontal: rm(4),
  },
  paginationDotActive: {
    width: rs(24),
    backgroundColor: COLORS.primary,
  },
  buttonContainer: {
    paddingHorizontal: wp(6),
    paddingBottom: hp(5),
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: rs(24),
    paddingVertical: rp(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: rf(18),
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default OnboardingScreen;


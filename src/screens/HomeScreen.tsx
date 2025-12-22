import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { GoalRing, StatCard, FAB, AchievementModal, WeeklyProgress } from '../components';
import { useStore } from '../state/store';
import { useHydration } from '../hooks/useHydration';
import { formatSteps, formatWater, formatDistance, formatCalories } from '../utils/formatting';
import { COLORS, WATER_PRESETS_ML } from '../utils/constants';
import { theme } from '../utils/theme';
import { calculateStatistics, TrackingStatistics } from '../utils/statistics';
import { StorageService } from '../services/storage';
import { DaySummary } from '../types';
import AddWaterModal from './AddWaterModal';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

// Animated Circle for Progress Ring
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Progress Ring Component
const ProgressRing: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}> = ({ progress, size, strokeWidth, color }) => {
  const responsiveSize = rs(size);
  const responsiveStrokeWidth = rs(strokeWidth);
  const radius = (responsiveSize - responsiveStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.value = withSpring(Math.min(progress, 1), {
      damping: 15,
      stiffness: 150,
    });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const isSteps = color === theme.colors.steps;
  const gradientId = isSteps ? 'progressGradientSteps' : 'progressGradientWater';
  const offset = -responsiveSize / 2;

  return (
    <Svg 
      width={responsiveSize} 
      height={responsiveSize} 
      style={[styles.progressRingSvg, {
        marginLeft: offset,
        marginTop: offset,
      }]}
    >
      <Defs>
        <SvgLinearGradient id="progressGradientSteps" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={theme.colors.steps} stopOpacity="1" />
          <Stop offset="100%" stopColor={theme.colors.steps} stopOpacity="1" />
        </SvgLinearGradient>
        <SvgLinearGradient id="progressGradientWater" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={theme.colors.water} stopOpacity="1" />
          <Stop offset="100%" stopColor={theme.colors.water} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      {/* Background circle */}
      <Circle
        cx={responsiveSize / 2}
        cy={responsiveSize / 2}
        r={radius}
        stroke={theme.colors.border + '40'}
        strokeWidth={responsiveStrokeWidth}
        fill="transparent"
      />
      {/* Animated progress circle */}
      <AnimatedCircle
        cx={responsiveSize / 2}
        cy={responsiveSize / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={responsiveStrokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeLinecap="round"
        animatedProps={animatedProps}
        transform={`rotate(-90 ${responsiveSize / 2} ${responsiveSize / 2})`}
      />
    </Svg>
  );
};

const HomeScreen: React.FC = () => {
  // Use selector to ensure reactivity - this forces re-render when currentSteps changes
  const currentSteps = useStore((state) => state.currentSteps);
  const stepGoal = useStore((state) => state.stepGoal);
  const waterGoal = useStore((state) => state.waterGoal);
  const waterConsumed = useStore((state) => state.waterConsumed);
  const loadTodayData = useStore((state) => state.loadTodayData);
  const loadGoals = useStore((state) => state.loadGoals);
  const settings = useStore((state) => state.settings);
  const lastAchievementStep = useStore((state) => state.lastAchievementStep);
  const lastAchievementWater = useStore((state) => state.lastAchievementWater);
  const resetAchievements = useStore((state) => state.resetAchievements);
  const isStepTrackingPaused = useStore((state) => state.isStepTrackingPaused);
  const pauseStepTracking = useStore((state) => state.pauseStepTracking);
  const resumeStepTracking = useStore((state) => state.resumeStepTracking);

  const { addWater } = useHydration();
  // Note: usePedometer is initialized in App.tsx, no need to call it here

  const [refreshing, setRefreshing] = useState(false);
  const [showAddWater, setShowAddWater] = useState(false);
  const [showStepAchievement, setShowStepAchievement] = useState(false);
  const [showWaterAchievement, setShowWaterAchievement] = useState(false);
  const [statistics, setStatistics] = useState<TrackingStatistics | null>(null);
  const [allSummaries, setAllSummaries] = useState<DaySummary[]>([]);
  const [pendingWaterAchievement, setPendingWaterAchievement] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Debug: Log when currentSteps changes to verify re-renders
  useEffect(() => {
    console.log('🖥️ HomeScreen re-render - currentSteps:', currentSteps);
  }, [currentSteps]);

  useEffect(() => {
    // Always calculate statistics, even with empty data (will return zeros)
    // This ensures cards are always visible, even for new users
    // Merge today's live data into summaries for accurate statistics
    const today = new Date().toISOString().split('T')[0];
    const summariesWithLiveData = [...allSummaries];
    const todayIndex = summariesWithLiveData.findIndex(s => s.date === today);
    
    if (todayIndex >= 0) {
      // Update today's summary with live data
      summariesWithLiveData[todayIndex] = {
        ...summariesWithLiveData[todayIndex],
        steps: currentSteps,
        waterMl: waterConsumed,
      };
    } else {
      // Add today's summary if it doesn't exist
      summariesWithLiveData.push({
        date: today,
        steps: currentSteps,
        waterMl: waterConsumed,
        stepDistanceMeters: currentSteps * 0.762,
        calories: Math.round(currentSteps * 0.04),
      });
    }
    
    const stats = calculateStatistics(summariesWithLiveData, stepGoal, waterGoal);
    setStatistics(stats);
  }, [allSummaries, stepGoal, waterGoal, currentSteps, waterConsumed]);

  const loadDashboardData = async () => {
    await Promise.all([loadTodayData(), loadGoals()]);
    const summaries = await StorageService.getAllDaySummaries();
    setAllSummaries(summaries);
  };

  // Show achievement modals when goals are reached
  // Use setTimeout to prevent blocking the UI thread
  useEffect(() => {
    if (lastAchievementStep) {
      // Delay showing modal slightly to prevent UI freeze
      const timer = setTimeout(() => {
        setShowStepAchievement(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastAchievementStep]);

  useEffect(() => {
    if (lastAchievementWater) {
      // On iOS, we need to close AddWaterModal first before showing AchievementModal
      // to prevent modal conflicts that cause UI freezing
      if (showAddWater) {
        // Close AddWaterModal first
        setShowAddWater(false);
        // Mark that we have a pending achievement to show
        setPendingWaterAchievement(true);
      } else {
        // AddWaterModal is not open, show achievement modal directly
        const timer = setTimeout(() => {
          setShowWaterAchievement(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [lastAchievementWater, showAddWater]);

  // Show water achievement modal after AddWaterModal closes
  useEffect(() => {
    if (pendingWaterAchievement && !showAddWater) {
      // Wait for AddWaterModal to fully close before showing achievement
      // iOS needs time for modal transition to complete
      const timer = setTimeout(() => {
        setShowWaterAchievement(true);
        setPendingWaterAchievement(false);
      }, 300); // Increased delay to ensure modal transition completes on iOS
      return () => clearTimeout(timer);
    }
  }, [pendingWaterAchievement, showAddWater]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const stepProgress = stepGoal > 0 ? Math.min(currentSteps / stepGoal, 1) : 0;
  const waterProgress = waterGoal > 0 ? Math.min(waterConsumed / waterGoal, 1) : 0;

  // Calculate average based on daily goal ÷ one day (24 hours)
  // This shows the target average per hour to reach the daily goal
  const hoursInDay = 24;
  const stepAverage = stepGoal / hoursInDay; // Steps per hour to reach daily goal
  const waterAverage = waterGoal / hoursInDay; // Water per hour to reach daily goal

  // Calculate estimated distance and calories
  const estimatedDistance = currentSteps * 0.762; // Average step length in meters
  const estimatedCalories = Math.round(currentSteps * 0.04); // Rough estimate

  const handleAddWater = async (amount: number) => {
    try {
      if (!amount || amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid water amount.');
        return;
      }
      
      // addWater already updates the store state immediately
      // No need to reload, UI will update automatically via Zustand
      await addWater(amount);
      
      // If goal was achieved, the useEffect will handle closing AddWaterModal
      // and showing AchievementModal. Don't close modal manually here.
      // The modal will be closed by the achievement effect if needed.
    } catch (error: any) {
      console.error('Error adding water:', error);
      Alert.alert(
        'Error', 
        error?.message || 'Failed to add water. Please try again.'
      );
    }
  };

  const handleStepAchievementClose = () => {
    setShowStepAchievement(false);
    resetAchievements();
  };

  const handleWaterAchievementClose = () => {
    setShowWaterAchievement(false);
    resetAchievements();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Steps Section - Hero Display */}
        <View style={styles.heroStepsCard}>
          <LinearGradient
            colors={[theme.colors.card, theme.colors.card, theme.colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              {/* Pause/Play Button */}
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={() => {
                  if (isStepTrackingPaused) {
                    resumeStepTracking();
                  } else {
                    pauseStepTracking();
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isStepTrackingPaused ? "play-circle" : "pause-circle"}
                  size={32}
                  color={theme.colors.steps}
                />
              </TouchableOpacity>

              {/* Progress Ring with Step Count */}
              <View style={styles.heroRingContainer}>
                <ProgressRing
                  progress={stepProgress}
                  size={Math.min(SCREEN_WIDTH * 0.7, SCREEN_HEIGHT * 0.35)}
                  strokeWidth={rs(16)}
                  color={theme.colors.steps}
                />
                <View style={styles.heroCounterContainer}>
                  <Text 
                    style={styles.heroCounter}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}
                  >
                    {formatSteps(currentSteps)}
                  </Text>
                  <Text style={styles.heroCounterLabel}>Steps</Text>
                  <Text style={styles.heroCounterGoal}>
                    {Math.round(stepProgress * 100)}% of {formatSteps(stepGoal)}
                  </Text>
                </View>
              </View>

              {/* Additional Info */}
              <View style={styles.heroInfoRow}>
                <View style={styles.heroInfoItem}>
                  <Ionicons name="stats-chart" size={18} color={theme.colors.steps} />
                  <Text style={styles.heroInfoText}>
                    {formatSteps(Math.round(stepAverage))} avg
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Water Section - Hero Display */}
        <View style={styles.heroWaterCard}>
          <LinearGradient
            colors={[theme.colors.card, theme.colors.card, theme.colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              {/* Progress Ring with Water Count */}
              <View style={styles.heroRingContainer}>
                <ProgressRing
                  progress={waterProgress}
                  size={Math.min(SCREEN_WIDTH * 0.7, SCREEN_HEIGHT * 0.35)}
                  strokeWidth={rs(16)}
                  color={theme.colors.water}
                />
                <View style={styles.heroCounterContainer}>
                  <Text 
                    style={styles.heroCounter}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}
                  >
                    {formatWater(waterConsumed, settings.unit)}
                  </Text>
                  <Text style={styles.heroCounterLabel}>Water</Text>
                  <Text style={styles.heroCounterGoal}>
                    {Math.round(waterProgress * 100)}% of {formatWater(waterGoal, settings.unit)}
                  </Text>
                </View>
              </View>

              {/* Additional Info */}
              <View style={styles.heroInfoRow}>
                <View style={styles.heroInfoItem}>
                  <Ionicons name="stats-chart" size={18} color={theme.colors.water} />
                  <Text style={styles.heroInfoText}>
                    {formatWater(Math.round(waterAverage), settings.unit)} avg
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.heroEditButton, { backgroundColor: theme.colors.water + '15', borderColor: theme.colors.water + '30' }]}
                  onPress={() => setShowAddWater(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={20} color={theme.colors.water} />
                  <Text style={[styles.heroEditText, { color: theme.colors.water }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <View style={styles.quickStatIconContainer}>
              <Ionicons name="location" size={28} color={theme.colors.steps} />
            </View>
            <Text style={styles.quickStatValue}>
              {formatDistance(estimatedDistance, settings.unit)}
            </Text>
            <Text style={styles.quickStatLabel}>Distance</Text>
          </View>
          <View style={styles.quickStatCard}>
            <View style={styles.quickStatIconContainer}>
              <Ionicons name="flame" size={28} color={theme.colors.steps} />
            </View>
            <Text style={styles.quickStatValue}>
              {formatCalories(estimatedCalories)}
            </Text>
            <Text style={styles.quickStatLabel}>Calories</Text>
          </View>
          <View style={styles.quickStatCard}>
            <View style={styles.quickStatIconContainer}>
              <Ionicons name="time-outline" size={28} color={theme.colors.water} />
            </View>
            <Text style={styles.quickStatValue}>
              {Math.round(currentSteps * 0.0005)}h {Math.round((currentSteps * 0.0005 % 1) * 60)}m
            </Text>
            <Text style={styles.quickStatLabel}>Time</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.weeklySection}>
          <WeeklyProgress
            summaries={allSummaries}
            stepGoal={stepGoal}
            waterGoal={waterGoal}
            type="steps"
            currentSteps={currentSteps}
            waterConsumed={waterConsumed}
          />
        </View>

        

        {/* Tracking Statistics Section */}
        {statistics && (
          <View style={styles.trackingSection}>
            <Text style={styles.sectionTitle}>TRACKING OVERVIEW</Text>
            
            {/* Streaks */}
            <View style={styles.streakContainer}>
              <TouchableOpacity
                style={[styles.streakCard, styles.streakCardNeumorphic]}
                activeOpacity={0.7}
              >
                <View style={styles.streakIconContainer}>
                  <Ionicons name="flame" size={28} color={theme.colors.steps} />
                </View>
                <View style={styles.streakContent}>
                  <Text style={styles.streakLabel}>STEP STREAK</Text>
                  <Text style={styles.streakValue}>{statistics.currentStepStreak} days</Text>
                </View>
                {statistics.currentStepStreak > 0 && (
                  <Text style={styles.streakBadge}>Active</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.streakCard, styles.streakCardNeumorphic]}
                activeOpacity={0.7}
              >
                <View style={styles.streakIconContainer}>
                  <Ionicons name="water" size={28} color={theme.colors.water} />
                </View>
                <View style={styles.streakContent}>
                  <Text style={styles.streakLabel}>WATER STREAK</Text>
                  <Text style={styles.streakValue}>{statistics.currentWaterStreak} days</Text>
                </View>
                {statistics.currentWaterStreak > 0 && (
                  <Text style={styles.streakBadge}>Active</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Weekly Progress */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Weekly Average</Text>
                <Text style={styles.progressSubtitle}>Last 7 days</Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarRow}>
                  <View style={styles.progressBarLabelContainer}>
                    <Text style={styles.progressBarLabel}>Steps</Text>
                    <Text style={styles.progressBarValue}>
                      {formatSteps(Math.round(statistics.weeklyAverageSteps))}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min((statistics.weeklyAverageSteps / stepGoal) * 100, 100)}%`,
                          backgroundColor: theme.colors.steps,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.progressBarRow}>
                  <View style={styles.progressBarLabelContainer}>
                    <Text style={styles.progressBarLabel}>Water</Text>
                    <Text style={styles.progressBarValue}>
                      {formatWater(Math.round(statistics.weeklyAverageWater), settings.unit)}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min((statistics.weeklyAverageWater / waterGoal) * 100, 100)}%`,
                          backgroundColor: theme.colors.water,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Lifetime Stats */}
            <View style={styles.lifetimeContainer}>
              <TouchableOpacity
                style={styles.lifetimeCard}
                activeOpacity={0.8}
              >
                <Text style={styles.lifetimeIcon}>👣</Text>
                <View style={styles.lifetimeContent}>
                  <Text style={styles.lifetimeLabel}>Total Steps</Text>
                  <Text style={styles.lifetimeValue}>
                    {formatSteps(statistics.lifetimeSteps)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lifetimeCard}
                activeOpacity={0.8}
              >
                <Ionicons name="wine" size={rf(28)} color={theme.colors.water} style={styles.lifetimeIcon} />
                <View style={styles.lifetimeContent}>
                  <Text style={styles.lifetimeLabel}>Total Water</Text>
                  <Text style={styles.lifetimeValue}>
                    {formatWater(statistics.lifetimeWater, settings.unit)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lifetimeCard}
                activeOpacity={0.8}
              >
                <Text style={styles.lifetimeIcon}>📅</Text>
                <View style={styles.lifetimeContent}>
                  <Text style={styles.lifetimeLabel}>Days Tracked</Text>
                  <Text style={styles.lifetimeValue}>
                    {statistics.totalDaysTracked}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TODAY'S SUMMARY</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Steps</Text>
              <Text style={styles.summaryValue}>{formatSteps(currentSteps)}</Text>
              <Text style={styles.summaryGoal}>Goal: {formatSteps(stepGoal)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Water</Text>
              <Text style={styles.summaryValue}>
                {formatWater(waterConsumed, settings.unit)}
              </Text>
              <Text style={styles.summaryGoal}>
                Goal: {formatWater(waterGoal, settings.unit)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <FAB onPress={() => setShowAddWater(true)} icon="💧" />

      <AddWaterModal
        visible={showAddWater}
        onClose={() => setShowAddWater(false)}
        onAdd={handleAddWater}
        presets={WATER_PRESETS_ML}
        unit={settings.unit}
      />

      <AchievementModal
        visible={showStepAchievement}
        type="steps"
        onClose={handleStepAchievementClose}
      />

      <AchievementModal
        visible={showWaterAchievement}
        type="water"
        onClose={handleWaterAchievementClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: rp(20),
    paddingBottom: rp(32),
  },
  header: {
    marginBottom: rm(24),
    paddingHorizontal: rp(4),
  },
  title: {
    fontSize: theme.typography.fontSize.title,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: rm(6),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.bodySmall,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: theme.typography.fontWeight.medium,
  },
  heroStepsCard: {
    borderRadius: rs(24),
    marginBottom: rm(20),
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    // Glowing teal border effect
    borderWidth: 2,
    borderColor: theme.colors.steps + '60',
    // Multiple shadow layers for glowing effect
    shadowColor: theme.colors.steps,
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.4,
    shadowRadius: rs(20),
    elevation: 12,
  },
  heroWaterCard: {
    borderRadius: rs(24),
    marginBottom: rm(20),
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    // Glowing blue border effect
    borderWidth: 2,
    borderColor: theme.colors.water + '60',
    // Multiple shadow layers for glowing effect
    shadowColor: theme.colors.water,
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.4,
    shadowRadius: rs(20),
    elevation: 12,
  },
  heroGradient: {
    padding: rp(28),
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroRingContainer: {
    width: Math.min(SCREEN_WIDTH * 0.7, SCREEN_HEIGHT * 0.35),
    height: Math.min(SCREEN_WIDTH * 0.7, SCREEN_HEIGHT * 0.35),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rm(24),
    alignSelf: 'center',
    position: 'relative',
  },
  progressRingSvg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1,
  },
  heroCounterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    width: '100%',
    height: '100%',
    paddingHorizontal: rp(24),
    paddingVertical: rp(20),
  },
  pauseButton: {
    position: 'absolute',
    top: rp(8),
    right: rp(8),
    zIndex: 10,
    padding: rp(8),
    borderRadius: rs(20),
    backgroundColor: theme.colors.card + 'E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
    elevation: 3,
  },
  heroCounter: {
    fontSize: theme.typography.fontSize.valueMedium,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -1.5,
    textAlign: 'center',
    marginBottom: rm(4),
    width: '100%',
    includeFontPadding: false,
  },
  heroCounterLabel: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: rm(4),
  },
  heroCounterGoal: {
    fontSize: theme.typography.fontSize.captionSmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  heroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: rp(8),
  },
  heroInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
  },
  heroInfoText: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  heroEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rp(12),
    paddingVertical: rp(8),
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.primary + '15',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  heroEditText: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  mainProgressCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: rs(20),
    padding: rp(22),
    marginBottom: rm(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.08,
    shadowRadius: rs(12),
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.light.border + '40',
  },
  mainProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rm(18),
  },
  mainProgressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainProgressIcon: {
    fontSize: rf(32),
    marginRight: rm(14),
  },
  mainProgressTitle: {
    fontSize: rf(20),
    fontWeight: '700',
    color: COLORS.light.text,
    marginBottom: rm(3),
    letterSpacing: -0.3,
  },
  mainProgressSubtitle: {
    fontSize: rf(13),
    color: COLORS.light.textSecondary,
    fontWeight: '500',
  },
  editButton: {
    paddingHorizontal: rp(12),
    paddingVertical: rp(8),
    borderRadius: rs(10),
    backgroundColor: COLORS.light.background,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  editIcon: {
    fontSize: rf(14),
    fontWeight: '600',
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: rp(18),
    paddingVertical: rp(10),
    borderRadius: rs(12),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.2,
    shadowRadius: rs(4),
    elevation: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: rf(14),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mainCounterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: rm(18),
    flexWrap: 'wrap',
  },
  mainCounter: {
    fontSize: rf(44),
    fontWeight: '700',
    color: COLORS.light.text,
    marginRight: rm(8),
    letterSpacing: -1,
  },
  mainCounterGoal: {
    fontSize: rf(17),
    color: COLORS.light.textSecondary,
    fontWeight: '600',
  },
  progressBarWrapper: {
    marginTop: rm(4),
  },
  progressBarTrack: {
    height: rs(14),
    backgroundColor: COLORS.light.border + '60',
    borderRadius: rs(7),
    overflow: 'hidden',
    marginBottom: rm(10),
  },
  progressBarFilled: {
    height: '100%',
    borderRadius: rs(7),
  },
  progressPercentage: {
    fontSize: rf(13),
    color: COLORS.light.textSecondary,
    textAlign: 'right',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rm(24),
    gap: rs(12),
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: rp(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
    ...theme.shadows.card,
  },
  quickStatIconContainer: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rm(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.06,
    shadowRadius: rs(6),
    elevation: 2,
  },
  quickStatValue: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: rm(6),
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  quickStatLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  weeklySection: {
    marginTop: rm(8),
    marginBottom: rm(8),
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: rp(22),
    marginTop: rm(20),
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.caption,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: rm(18),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: rs(50),
    backgroundColor: theme.colors.border + '60',
    marginHorizontal: rm(20),
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    marginBottom: rm(10),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.valueMedium,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: rm(6),
    letterSpacing: -0.5,
  },
  summaryGoal: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  trackingSection: {
    marginTop: rm(28),
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.caption,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: rm(18),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  streakContainer: {
    flexDirection: 'row',
    gap: rs(12),
    marginBottom: rm(18),
  },
  streakCard: {
    flexBasis: '48%',
    minWidth: '47%',
    minHeight: rp(90),
    borderRadius: theme.borderRadius.card,
    paddingVertical: rp(2),
    paddingHorizontal: rp(3),
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: rp(2),
    rowGap: rp(2),
    backgroundColor: theme.colors.card,
    flexWrap: 'wrap',
    // Keep children in a single horizontal line where possible
    justifyContent: 'center',
  },
  streakCardNeumorphic: {
    // Neumorphic effect - soft, wide shadows
    shadowColor: '#000',
    shadowOffset: { width: rs(6), height: rs(6) },
    shadowOpacity: 0.06,
    shadowRadius: rs(16),
    elevation: 4,
    // Inset shadow effect using border
    borderWidth: 1,
    borderColor: theme.colors.border + '20',
    // Additional depth with background
    backgroundColor: theme.colors.card,
  },
  streakIconContainer: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rm(10),
    // Neumorphic icon container - soft shadows
    shadowColor: '#000',
    marginTop: rm(30),
    shadowOffset: { width: rs(3), height: rs(3) },
    shadowOpacity: 0.08,
    shadowRadius: rs(8),
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  streakContent: {
    flex: 1,
    minWidth: 0,
    gap: rm(2),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  streakLabel: {
    fontSize: rf(10),
    lineHeight: rf(12),
    color: theme.colors.textPrimary,
    marginBottom: rm(2),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'left',
    width: '100%',
    flexShrink: 1,
  },
  streakValue: {
    fontSize: rf(14),
    lineHeight: rf(16),
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
    textAlign: 'left',
    width: '100%',
  },
  streakBadge: {
    fontSize: rf(10),
    color: theme.colors.steps,
    fontWeight: theme.typography.fontWeight.semibold,
    backgroundColor: theme.colors.steps + '18',
    paddingHorizontal: rp(8),
    paddingVertical: rp(3),
    borderRadius: rs(8),
    overflow: 'hidden',
    letterSpacing: 0.2,
    minWidth: rs(42),
    textAlign: 'center',
    flexShrink: 1,
  },
  progressCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: rp(20),
    marginBottom: rm(18),
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  progressHeader: {
    marginBottom: rm(18),
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: rm(5),
    letterSpacing: -0.2,
  },
  progressSubtitle: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressBarContainer: {
    gap: rm(18),
  },
  progressBarRow: {
    gap: rm(10),
  },
  progressBarLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rm(6),
  },
  progressBarLabel: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  progressBarValue: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  progressBar: {
    height: rs(10),
    backgroundColor: theme.colors.border + '60',
    borderRadius: rs(5),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: rs(5),
  },
  lifetimeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(12),
  },
  lifetimeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: rp(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.05,
    shadowRadius: rs(4),
    elevation: 2,
  },
  lifetimeIcon: {
    fontSize: rf(28),
    marginBottom: rm(10),
  },
  lifetimeContent: {
    alignItems: 'center',
  },
  lifetimeLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    marginBottom: rm(6),
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.6,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  lifetimeValue: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});

export default HomeScreen;


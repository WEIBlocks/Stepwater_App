import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DaySummary } from '../types';
import { COLORS, ACCENT_COLORS } from '../utils/constants';
import { format, parseISO, isToday, subDays } from 'date-fns';

interface WeeklyProgressProps {
  summaries: DaySummary[];
  stepGoal: number;
  waterGoal: number;
  type?: 'steps' | 'water';
  onDayPress?: (date: string) => void;
  currentSteps?: number;
  waterConsumed?: number;
}

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  summaries,
  stepGoal,
  waterGoal,
  type = 'steps',
  onDayPress,
  currentSteps = 0,
  waterConsumed = 0,
}) => {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd'),
    };
  });

  // Create summary map and merge today's live data
  const summaryMap = new Map<string, DaySummary>();
  summaries.forEach(s => {
    summaryMap.set(s.date, s);
  });
  
  // Merge today's live data if available
  if (!summaryMap.has(todayKey)) {
    summaryMap.set(todayKey, {
      date: todayKey,
      steps: currentSteps,
      waterMl: waterConsumed,
    });
  } else {
    // Update today's summary with live data
    const todaySummary = summaryMap.get(todayKey)!;
    summaryMap.set(todayKey, {
      ...todaySummary,
      steps: currentSteps,
      waterMl: waterConsumed,
    });
  }

  const [pressedDay, setPressedDay] = useState<string | null>(null);

  const getProgress = (dateStr: string) => {
    const summary = summaryMap.get(dateStr);
    // Return 0 for inactive days (no data), otherwise calculate progress
    if (!summary) return 0;
    
    if (type === 'steps') {
      return stepGoal > 0 ? Math.min(summary.steps / stepGoal, 1) : 0;
    } else {
      return waterGoal > 0 ? Math.min(summary.waterMl / waterGoal, 1) : 0;
    }
  };

  const isActiveDay = (dateStr: string) => {
    const summary = summaryMap.get(dateStr);
    if (!summary) return false;
    
    if (type === 'steps') {
      return summary.steps > 0;
    } else {
      return summary.waterMl > 0;
    }
  };

  const getCircleColor = (dateStr: string, progress: number, index: number) => {
    const isActive = isActiveDay(dateStr);
    const baseColor = type === 'steps' ? COLORS.primary : COLORS.secondary;
    
    if (!isActive || progress === 0) {
      // Inactive days - show 0% with muted colors
      return {
        backgroundColor: baseColor + '12',
        borderColor: baseColor + '30',
        fillColor: baseColor + '20', // Show 0% fill for inactive days
      };
    } else if (progress < 0.5) {
      // Low progress - warning colors
      return {
        backgroundColor: COLORS.warning + '20',
        borderColor: COLORS.warning + '50',
        fillColor: COLORS.warning,
      };
    } else if (progress < 1) {
      // Medium progress - accent colors
      return {
        backgroundColor: COLORS.accent + '20',
        borderColor: COLORS.accent + '50',
        fillColor: COLORS.accent,
      };
    } else {
      // Goal achieved - success colors
      return {
        backgroundColor: COLORS.success + '20',
        borderColor: COLORS.success + '50',
        fillColor: COLORS.success,
      };
    }
  };

  const getDayValue = (dateStr: string) => {
    const summary = summaryMap.get(dateStr);
    if (!summary) return null;
    
    if (type === 'steps') {
      return summary.steps || 0;
    } else {
      return summary.waterMl || 0;
    }
  };

  const formatDayValue = (value: number | null) => {
    if (value === null || value === 0) return null;
    
    // Return exact number without compact notation
    if (type === 'steps') {
      return String(value);
    } else {
      return `${String(Math.round(value))}ml`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.subtitle}>Your 7-day progress</Text>
      </View>
      <View style={styles.daysContainer}>
        {days.map((day, index) => {
          const progress = getProgress(day.dateStr);
          const daySummary = summaryMap.get(day.dateStr);
          const isTodayDate = isToday(day.date);
          const isPressed = pressedDay === day.dateStr;
          const colors = getCircleColor(day.dateStr, progress, index);
          const isActive = isActiveDay(day.dateStr);
          const baseColor = type === 'steps' ? COLORS.primary : COLORS.secondary;
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dayItem, isPressed && styles.dayItemPressed]}
              onPress={() => {
                setPressedDay(day.dateStr);
                setTimeout(() => setPressedDay(null), 200);
                onDayPress?.(day.dateStr);
              }}
              activeOpacity={0.6}
            >
              <View 
                style={[
                  styles.circle, 
                  isTodayDate && styles.circleToday,
                  {
                    backgroundColor: colors.backgroundColor,
                    borderColor: colors.borderColor,
                    transform: [{ scale: isPressed ? 0.95 : 1 }],
                  }
                ]}
              >
                {/* Progress Fill - Always show for active days */}
                {isActive && (
                  <View
                    style={[
                      styles.progressFill,
                      {
                        height: `${Math.max(progress * 100, 0)}%`,
                        backgroundColor: colors.fillColor || baseColor,
                      },
                    ]}
                  />
                )}
                {!isActive && (
                  <View
                    style={[
                      styles.progressFill,
                      {
                        height: '0%',
                        backgroundColor: baseColor + '20',
                      },
                    ]}
                  />
                )}
                
                {/* Today indicator - Show at top right */}
                {isTodayDate && <View style={styles.todayIndicator} />}
                
                {/* Checkmark for completed days - Show at top left */}
                {isActive && progress >= 1 && (
                  <View style={styles.completeBadge}>
                    <Text style={styles.completeBadgeText}>✓</Text>
                  </View>
                )}
                
                {/* Percentage - Always show for active days at center */}
                {isActive && (
                  <View style={[
                    styles.progressIndicator,
                    progress >= 1 && styles.progressIndicatorComplete
                  ]}>
                    <Text style={[
                      styles.progressIndicatorText,
                      progress >= 1 && styles.progressIndicatorTextComplete
                    ]}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                )}
                {!isActive && (
                  <View style={styles.progressIndicator}>
                    <Text style={styles.progressIndicatorText}>
                      0%
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.dayName, 
                isTodayDate && styles.dayNameToday,
                progress >= 1 && styles.dayNameComplete
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.dayNumber, 
                isTodayDate && styles.dayNumberToday,
                progress >= 1 && styles.dayNumberComplete
              ]}>
                {day.dayNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.light.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.light.textSecondary,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
    minWidth: 0,
    marginHorizontal: 4,
  },
  dayItemPressed: {
    backgroundColor: COLORS.light.surface,
    transform: [{ scale: 0.98 }],
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circleToday: {
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  progressFill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  todayIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.light.background,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 4,
  },
  completeBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 3,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  completeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  progressIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIndicatorText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  progressIndicatorTextComplete: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '800',
  },
  progressIndicatorComplete: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.success + '60',
  },
  dayName: {
    fontSize: 12,
    color: COLORS.light.textSecondary,
    marginBottom: 3,
    fontWeight: '500',
  },
  dayNameToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayNameComplete: {
    color: COLORS.success,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 11,
    color: COLORS.light.textSecondary,
    fontWeight: '500',
  },
  dayNumberToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayNumberComplete: {
    color: COLORS.success,
    fontWeight: '600',
  },
});

export default WeeklyProgress;


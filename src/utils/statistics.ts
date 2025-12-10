import { DaySummary } from '../types';
import { format, parseISO, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isSameDay } from 'date-fns';

export interface TrackingStatistics {
  // Daily Stats
  todaySteps: number;
  todayWater: number;
  todayDistance: number;
  todayCalories: number;
  
  // Weekly Stats
  weeklyAverageSteps: number;
  weeklyAverageWater: number;
  weeklyTotalSteps: number;
  weeklyTotalWater: number;
  weeklyDaysWithData: number;
  
  // Monthly Stats
  monthlyAverageSteps: number;
  monthlyAverageWater: number;
  monthlyTotalSteps: number;
  monthlyTotalWater: number;
  monthlyDaysWithData: number;
  
  // Streaks
  currentStepStreak: number;
  currentWaterStreak: number;
  longestStepStreak: number;
  longestWaterStreak: number;
  
  // Totals
  totalDaysTracked: number;
  lifetimeSteps: number;
  lifetimeWater: number;
  
  // Goals Achievement
  weeklyGoalAchievement: number; // percentage
  monthlyGoalAchievement: number; // percentage
}

export const calculateStatistics = (
  summaries: DaySummary[],
  stepGoal: number = 10000,
  waterGoal: number = 2000
): TrackingStatistics => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Today's stats
  const todaySummary = summaries.find(s => s.date === todayStr);
  const todaySteps = todaySummary?.steps || 0;
  const todayWater = todaySummary?.waterMl || 0;
  const todayDistance = todaySummary?.stepDistanceMeters || todaySteps * 0.762;
  const todayCalories = todaySummary?.calories || Math.round(todaySteps * 0.04);
  
  // Weekly stats (last 7 days)
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekSummaries = summaries.filter(s => {
    const date = parseISO(s.date);
    return date >= weekStart && date <= today;
  });
  
  const weeklyTotalSteps = weekSummaries.reduce((sum, s) => sum + (s.steps || 0), 0);
  const weeklyTotalWater = weekSummaries.reduce((sum, s) => sum + (s.waterMl || 0), 0);
  const weeklyDaysWithData = weekSummaries.length;
  const weeklyAverageSteps = weeklyDaysWithData > 0 ? weeklyTotalSteps / weeklyDaysWithData : 0;
  const weeklyAverageWater = weeklyDaysWithData > 0 ? weeklyTotalWater / weeklyDaysWithData : 0;
  
  // Monthly stats (current month)
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthSummaries = summaries.filter(s => {
    const date = parseISO(s.date);
    return date >= monthStart && date <= monthEnd;
  });
  
  const monthlyTotalSteps = monthSummaries.reduce((sum, s) => sum + (s.steps || 0), 0);
  const monthlyTotalWater = monthSummaries.reduce((sum, s) => sum + (s.waterMl || 0), 0);
  const monthlyDaysWithData = monthSummaries.length;
  const monthlyAverageSteps = monthlyDaysWithData > 0 ? monthlyTotalSteps / monthlyDaysWithData : 0;
  const monthlyAverageWater = monthlyDaysWithData > 0 ? monthlyTotalWater / monthlyDaysWithData : 0;
  
  // Calculate streaks
  const sortedSummaries = [...summaries].sort((a, b) => 
    parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );
  
  let currentStepStreak = 0;
  let currentWaterStreak = 0;
  let longestStepStreak = 0;
  let longestWaterStreak = 0;
  let tempStepStreak = 0;
  let tempWaterStreak = 0;
  
  // Check current streaks (backwards from today)
  let checkDate = new Date(today);
  for (let i = 0; i < 100; i++) { // Check up to 100 days back
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const summary = summaries.find(s => s.date === dateStr);
    
    if (summary) {
      // Check step streak
      if (summary.steps >= stepGoal) {
        if (currentStepStreak === 0 && i === 0) {
          // Today achieved, start counting
          let streakDate = new Date(checkDate);
          while (true) {
            const streakDateStr = format(streakDate, 'yyyy-MM-dd');
            const streakSummary = summaries.find(s => s.date === streakDateStr);
            if (!streakSummary || streakSummary.steps < stepGoal) break;
            currentStepStreak++;
            streakDate = subDays(streakDate, 1);
          }
        }
      }
      
      // Check water streak
      if (summary.waterMl >= waterGoal) {
        if (currentWaterStreak === 0 && i === 0) {
          // Today achieved, start counting
          let streakDate = new Date(checkDate);
          while (true) {
            const streakDateStr = format(streakDate, 'yyyy-MM-dd');
            const streakSummary = summaries.find(s => s.date === streakDateStr);
            if (!streakSummary || streakSummary.waterMl < waterGoal) break;
            currentWaterStreak++;
            streakDate = subDays(streakDate, 1);
          }
        }
      }
    }
    
    checkDate = subDays(checkDate, 1);
  }
  
  // Calculate longest streaks
  sortedSummaries.forEach((summary) => {
    if (summary.steps >= stepGoal) {
      tempStepStreak++;
      longestStepStreak = Math.max(longestStepStreak, tempStepStreak);
    } else {
      tempStepStreak = 0;
    }
    
    if (summary.waterMl >= waterGoal) {
      tempWaterStreak++;
      longestWaterStreak = Math.max(longestWaterStreak, tempWaterStreak);
    } else {
      tempWaterStreak = 0;
    }
  });
  
  // Totals
  const totalDaysTracked = summaries.length;
  const lifetimeSteps = summaries.reduce((sum, s) => sum + (s.steps || 0), 0);
  const lifetimeWater = summaries.reduce((sum, s) => sum + (s.waterMl || 0), 0);
  
  // Goal achievement percentages
  const weeklyGoalAchievement = stepGoal > 0 
    ? (weeklyAverageSteps / stepGoal) * 100 
    : 0;
  const monthlyGoalAchievement = stepGoal > 0 
    ? (monthlyAverageSteps / stepGoal) * 100 
    : 0;
  
  return {
    todaySteps,
    todayWater,
    todayDistance,
    todayCalories,
    weeklyAverageSteps,
    weeklyAverageWater,
    weeklyTotalSteps,
    weeklyTotalWater,
    weeklyDaysWithData,
    monthlyAverageSteps,
    monthlyAverageWater,
    monthlyTotalSteps,
    monthlyTotalWater,
    monthlyDaysWithData,
    currentStepStreak,
    currentWaterStreak,
    longestStepStreak,
    longestWaterStreak,
    totalDaysTracked,
    lifetimeSteps,
    lifetimeWater,
    weeklyGoalAchievement,
    monthlyGoalAchievement,
  };
};

export const getWeeklyData = (summaries: DaySummary[], days: number = 7): DaySummary[] => {
  const today = new Date();
  const cutoffDate = subDays(today, days);
  
  return summaries.filter(s => {
    const date = parseISO(s.date);
    return date >= cutoffDate && date <= today;
  }).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
};

export const getMonthlyData = (summaries: DaySummary[]): DaySummary[] => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  return summaries.filter(s => {
    const date = parseISO(s.date);
    return date >= monthStart && date <= monthEnd;
  }).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
};



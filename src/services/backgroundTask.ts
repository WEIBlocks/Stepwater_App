/**
 * Background Task Handler
 * Handles background updates for foreground notification
 * Note: Uses periodic updates from app state instead of expo-background-fetch
 * (expo-background-fetch may not be available for all Expo SDK versions)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ForegroundNotificationService } from './foregroundNotification';

const BACKGROUND_TASK_NAME = 'STEP_WATER_BACKGROUND_TASK';
const STORAGE_KEY_GOALS = '@stepwater:goals';
const STORAGE_KEY_DAY_SUMMARIES = '@stepwater:day_summaries';
const STORAGE_KEY_WATER_LOGS = '@stepwater:water_logs';

// Store last known values to detect changes (throttling)
let lastKnownSteps: number | null = null;
let lastKnownWater: number | null = null;
let lastKnownStepGoal: number | null = null;
let lastKnownWaterGoal: number | null = null;

/**
 * Get current step count from storage
 */
async function getCurrentSteps(): Promise<number> {
  try {
    // Get today's date string
    const today = new Date().toISOString().split('T')[0];
    
    // Read from day summaries storage
    const summariesData = await AsyncStorage.getItem(STORAGE_KEY_DAY_SUMMARIES);
    if (summariesData) {
      const summaries: Record<string, any> = JSON.parse(summariesData);
      const todaySummary = summaries[today];
      if (todaySummary && typeof todaySummary.steps === 'number') {
        return todaySummary.steps;
      }
    }
    
    return 0;
  } catch (error) {
    console.error('❌ Error getting current steps:', error);
    return 0;
  }
}

/**
 * Get current water intake from storage
 */
async function getCurrentWater(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const waterLogsKey = `${STORAGE_KEY_WATER_LOGS}_${today}`;
    
    const waterLogsData = await AsyncStorage.getItem(waterLogsKey);
    if (waterLogsData) {
      const logs = JSON.parse(waterLogsData);
      if (Array.isArray(logs)) {
        const totalWater = logs.reduce((sum: number, log: any) => sum + (log.amount || 0), 0);
        return totalWater;
      }
    }
    
    return 0;
  } catch (error) {
    console.error('❌ Error getting current water:', error);
    return 0;
  }
}

/**
 * Get goals from storage
 */
async function getGoals(): Promise<{ stepGoal: number; waterGoal: number }> {
  try {
    const goalsData = await AsyncStorage.getItem(STORAGE_KEY_GOALS);
    if (goalsData) {
      const goals = JSON.parse(goalsData);
      return {
        stepGoal: goals.dailySteps || 10000,
        waterGoal: goals.dailyWaterMl || 2000,
      };
    }
    
    return {
      stepGoal: 10000,
      waterGoal: 2000,
    };
  } catch (error) {
    console.error('❌ Error getting goals:', error);
    return {
      stepGoal: 10000,
      waterGoal: 2000,
    };
  }
}

/**
 * Get water unit from settings
 */
async function getWaterUnit(): Promise<string> {
  try {
    const settingsData = await AsyncStorage.getItem('@stepwater:settings');
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      return settings.unit === 'imperial' ? 'oz' : 'ml';
    }
    return 'ml';
  } catch (error) {
    return 'ml';
  }
}

/**
 * Background task handler function
 * This runs periodically to update the foreground notification
 * IMPORTANT: Only updates if values actually changed (throttling to prevent spam)
 */
async function backgroundTaskHandler(): Promise<void> {
  try {
    // Get current data
    const [steps, water, goals, unit] = await Promise.all([
      getCurrentSteps(),
      getCurrentWater(),
      getGoals(),
      getWaterUnit(),
    ]);
    
    // Convert water to appropriate unit if needed
    let waterDisplay = water;
    let waterGoalDisplay = goals.waterGoal;
    if (unit === 'oz') {
      waterDisplay = Math.round(water / 29.5735); // Convert ml to oz
      waterGoalDisplay = Math.round(goals.waterGoal / 29.5735);
    }
    
    // THROTTLING: Only update if values actually changed
    // This prevents notification spam when data hasn't changed
    const stepsChanged = lastKnownSteps === null || steps !== lastKnownSteps;
    const waterChanged = lastKnownWater === null || waterDisplay !== lastKnownWater;
    const stepGoalChanged = lastKnownStepGoal === null || goals.stepGoal !== lastKnownStepGoal;
    const waterGoalChanged = lastKnownWaterGoal === null || waterGoalDisplay !== lastKnownWaterGoal;
    
    const hasChanges = stepsChanged || waterChanged || stepGoalChanged || waterGoalChanged;
    
    // Only update notification if there are actual changes
    if (hasChanges && ForegroundNotificationService.isRunning()) {
      // Update existing notification in place (this will NOT create a new notification)
      await ForegroundNotificationService.updateForegroundService(
        steps,
        goals.stepGoal,
        waterDisplay,
        waterGoalDisplay,
        unit
      );
      
      // Update last known values after successful update
      lastKnownSteps = steps;
      lastKnownWater = waterDisplay;
      lastKnownStepGoal = goals.stepGoal;
      lastKnownWaterGoal = waterGoalDisplay;
    }
    // If no changes detected, skip the update to prevent notification spam
    // If notification is not running, do nothing here
    // Let ForegroundServiceManager handle the initial creation on app start
  } catch (error) {
    console.error('❌ Error in background task:', error);
  }
}

/**
 * Note: Background task registration is handled by ForegroundServiceManager
 * using periodic intervals instead of expo-background-fetch
 */

/**
 * Background Task Service Class
 * Manages periodic background updates for the foreground notification
 * Uses app state and periodic intervals instead of expo-background-fetch
 */
export class BackgroundTaskService {
  private static updateInterval: NodeJS.Timeout | null = null;
  private static isRunning: boolean = false;

  /**
   * Register and start periodic background updates
   */
  static async registerBackgroundTask(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('⚠️ Background updates are Android-only');
      return false;
    }

    if (this.isRunning) {
      console.log('✅ Background task already running');
      return true;
    }

    try {
      // Start periodic updates (every 60 seconds)
      // This only UPDATES the existing notification if values changed, never creates new ones
      // Throttling prevents notification spam when data hasn't changed
      this.updateInterval = setInterval(async () => {
        await backgroundTaskHandler();
      }, 60000); // Update every 60 seconds (increased from 30 to reduce frequency)

      this.isRunning = true;
      console.log('✅ Background task registered and running (60s interval with change-based throttling)');
      return true;
    } catch (error) {
      console.error('❌ Error registering background task:', error);
      return false;
    }
  }

  /**
   * Unregister background task
   */
  static async unregisterBackgroundTask(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      this.isRunning = false;
      
      // Reset last known values when stopping
      lastKnownSteps = null;
      lastKnownWater = null;
      lastKnownStepGoal = null;
      lastKnownWaterGoal = null;
      
      console.log('🛑 Background task unregistered');
    } catch (error) {
      console.error('❌ Error unregistering background task:', error);
    }
  }

  /**
   * Check if background task is registered
   */
  static isTaskRegistered(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger the background task (for testing)
   */
  static async triggerTask(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await backgroundTaskHandler();
    } catch (error) {
      console.error('❌ Error triggering background task:', error);
    }
  }
}


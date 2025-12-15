/**
 * Foreground Service Manager
 * Coordinates foreground notification and background task services
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ForegroundNotificationService } from './foregroundNotification';
import { BackgroundTaskService } from './backgroundTask';

/**
 * Foreground Service Manager Class
 * Provides a unified interface to start/stop the foreground service
 * All updates are handled by BackgroundTaskService with throttling
 */
export class ForegroundServiceManager {
  private static isRunning: boolean = false;

  /**
   * Start the foreground service
   * Loads persisted values and starts the notification + background task
   */
  static async start(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('⚠️ Foreground service is Android-only');
      return;
    }

    if (this.isRunning) {
      console.log('⚠️ Foreground service already running');
      await BackgroundTaskService.triggerTask();
      return;
    }

    try {
      // Lazy import store to avoid circular dependency
      const { useStore } = await import('../state/store');
      const store = useStore.getState();

      // -----------------------------
      // 1️⃣ Load persisted water value
      // -----------------------------
      let waterConsumed = store.waterConsumed;
      try {
        const savedWater = await AsyncStorage.getItem('waterConsumed');
        if (savedWater !== null) {
          waterConsumed = Number(savedWater);
        }
      } catch (e) {
        console.log('⚠️ Error loading persisted water:', e);
      }

      const waterUnit = store.settings.unit === 'imperial' ? 'oz' : 'ml';
      let waterDisplay = waterConsumed;
      let waterGoalDisplay = store.waterGoal;

      // Convert to oz if imperial
      if (waterUnit === 'oz') {
        waterDisplay = Math.round(waterConsumed / 29.5735);
        waterGoalDisplay = Math.round(store.waterGoal / 29.5735);
      }

      // -----------------------------
      // 2️⃣ Start foreground notification
      // -----------------------------
      await ForegroundNotificationService.startForegroundService(
        store.currentSteps,
        store.stepGoal,
        waterDisplay,
        waterGoalDisplay,
        waterUnit
      );

      // -----------------------------
      // 3️⃣ Register background task
      // -----------------------------
      await BackgroundTaskService.registerBackgroundTask();

      this.isRunning = true;
      console.log('✅ Foreground service manager started with persisted water:', waterConsumed);
    } catch (error) {
      console.error('❌ Error starting foreground service manager:', error);
    }
  }

  /**
   * Stop the foreground service
   */
  static async stop(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await ForegroundNotificationService.stopForegroundService();
      await BackgroundTaskService.unregisterBackgroundTask();
      this.isRunning = false;
      console.log('🛑 Foreground service manager stopped');
    } catch (error) {
      console.error('❌ Error stopping foreground service manager:', error);
    }
  }

  /**
   * Check if the service is running
   */
  static isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Trigger immediate update of foreground notification
   * Updates both steps and water values
   */
  static async triggerUpdate(
    currentSteps: number,
    stepGoal: number,
    waterConsumed: number,
    waterGoal: number,
    waterUnit: 'ml' | 'oz'
  ): Promise<void> {
    if (Platform.OS !== 'android' || !this.isRunning) return;

    try {
      let waterDisplay = waterConsumed;
      let waterGoalDisplay = waterGoal;

      // Convert to oz if needed
      if (waterUnit === 'oz') {
        waterDisplay = Math.round(waterConsumed / 29.5735);
        waterGoalDisplay = Math.round(waterGoal / 29.5735);
      }

      await ForegroundNotificationService.updateForegroundService(
        currentSteps,
        stepGoal,
        waterDisplay,
        waterGoalDisplay,
        waterUnit
      );
    } catch (error) {
      console.error('❌ Error triggering foreground service update:', error);
    }
  }

  /**
   * Helper: Update water consumed both in store and foreground service
   */
  static async updateWater(
    newWaterValue: number,
    waterGoal: number,
    currentSteps: number,
    stepGoal: number,
    waterUnit: 'ml' | 'oz'
  ) {
    try {
      // 1️⃣ Persist water
      await AsyncStorage.setItem('waterConsumed', newWaterValue.toString());

      // 2️⃣ Trigger notification update
      await this.triggerUpdate(currentSteps, stepGoal, newWaterValue, waterGoal, waterUnit);

      console.log('💧 Water updated in foreground service:', newWaterValue);
    } catch (error) {
      console.error('❌ Error updating water in foreground service:', error);
    }
  }
}

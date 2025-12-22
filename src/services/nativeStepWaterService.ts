/**
 * Native Step Water Service
 * React Native bridge to native Android foreground service
 * This is the ONLY way to interact with the native service
 */

import { NativeModules, Platform } from 'react-native';

const { StepWaterService } = NativeModules;

interface StepWaterServiceInterface {
  startService(): Promise<boolean>;
  stopService(): Promise<boolean>;
  updateWater(amountMl: number): Promise<boolean>;
  getCurrentSteps(): Promise<number>;
  getCurrentWater(): Promise<number>;
  isServiceRunning(): Promise<boolean>;
  setStepGoal(goal: number): Promise<boolean>;
  setWaterGoal(goal: number): Promise<boolean>;
  setWaterUnit(unit: string): Promise<boolean>;
  resetAllData(): Promise<boolean>;
}

class NativeStepWaterService {
  private service: StepWaterServiceInterface | null = null;

  constructor() {
    if (Platform.OS === 'android' && StepWaterService) {
      this.service = StepWaterService as StepWaterServiceInterface;
    }
  }

  /**
   * Start the native foreground service
   * This must be called when the app starts
   */
  async startService(): Promise<boolean> {
    if (!this.service) {
      console.warn('⚠️ Native service not available (iOS or not configured)');
      return false;
    }

    try {
      return await this.service.startService();
    } catch (error) {
      console.error('❌ Error starting native service:', error);
      return false;
    }
  }

  /**
   * Stop the native foreground service
   */
  async stopService(): Promise<boolean> {
    if (!this.service) {
      return false;
    }

    try {
      return await this.service.stopService();
    } catch (error) {
      console.error('❌ Error stopping native service:', error);
      return false;
    }
  }

  /**
   * Update water intake in the native service
   * This will immediately update the notification
   */
  async updateWater(amountMl: number): Promise<boolean> {
    if (!this.service) {
      return false;
    }

    try {
      return await this.service.updateWater(amountMl);
    } catch (error) {
      console.error('❌ Error updating water in native service:', error);
      return false;
    }
  }

  /**
   * Get current step count from native service
   * This is the source of truth
   */
  async getCurrentSteps(): Promise<number> {
    if (!this.service) {
      return 0;
    }

    try {
      return await this.service.getCurrentSteps();
    } catch (error) {
      console.error('❌ Error getting steps from native service:', error);
      return 0;
    }
  }

  /**
   * Get current water intake from native service
   * This is the source of truth
   */
  async getCurrentWater(): Promise<number> {
    if (!this.service) {
      return 0;
    }

    try {
      return await this.service.getCurrentWater();
    } catch (error) {
      console.error('❌ Error getting water from native service:', error);
      return 0;
    }
  }

  /**
   * Check if the native service is running
   */
  async isServiceRunning(): Promise<boolean> {
    if (!this.service) {
      return false;
    }

    try {
      return await this.service.isServiceRunning();
    } catch (error) {
      console.error('❌ Error checking service status:', error);
      return false;
    }
  }

  /**
   * Set step goal in native service
   */
  async setStepGoal(goal: number): Promise<boolean> {
    if (!this.service) {
      return false;
    }

    try {
      return await this.service.setStepGoal(goal);
    } catch (error) {
      console.error('❌ Error setting step goal:', error);
      return false;
    }
  }

  /**
   * Set water goal in native service
   */
  async setWaterGoal(goal: number): Promise<boolean> {
    if (!this.service) {
      return false;
    }

    try {
      return await this.service.setWaterGoal(goal);
    } catch (error) {
      console.error('❌ Error setting water goal:', error);
      return false;
    }
  }

  /**
   * Set water unit in native service
   */
  async setWaterUnit(unit: string): Promise<boolean> {
    if (!this.service) {
      return false;
    }

    try {
      return await this.service.setWaterUnit(unit);
    } catch (error) {
      console.error('❌ Error setting water unit:', error);
      return false;
    }
  }

  /**
   * Reset all data in native service (steps, water, goals)
   */
  async resetAllData(): Promise<boolean> {
    if (!this.service) {
      return false;
    }

    try {
      return await this.service.resetAllData();
    } catch (error) {
      console.error('❌ Error resetting native service data:', error);
      return false;
    }
  }
}

export const nativeStepWaterService = new NativeStepWaterService();


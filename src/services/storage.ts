import AsyncStorage from '@react-native-async-storage/async-storage';
import { DaySummary, WaterLogItem, UserGoals, Reminder, AppSettings, UserProfile } from '../types';
import { DEFAULT_GOALS } from '../utils/constants';
import { getTodayDateString } from '../utils/formatting';
import { SupabaseStorageService } from './supabaseStorage';

const STORAGE_KEYS = {
  DAY_SUMMARIES: '@stepwater:day_summaries',
  WATER_LOGS: '@stepwater:water_logs',
  GOALS: '@stepwater:goals',
  REMINDERS: '@stepwater:reminders',
  SETTINGS: '@stepwater:settings',
  ONBOARDING: '@stepwater:onboarding_completed',
  PROFILE: '@stepwater:user_profile',
  ACHIEVEMENTS: '@stepwater:achievements',

};

export class StorageService {
  // Day Summaries
  static async getDaySummary(date: string): Promise<DaySummary | null> {
    try {
      const summariesJson = await AsyncStorage.getItem(STORAGE_KEYS.DAY_SUMMARIES);
      if (!summariesJson) return null;

      const summaries: Record<string, DaySummary> = JSON.parse(summariesJson);
      return summaries[date] || null;
    } catch (error) {
      console.error('Error getting day summary:', error);
      return null;
    }
  }

  static async saveDaySummary(summary: DaySummary): Promise<void> {
    try {
      // Save to local storage first (always works)
      const summariesJson = await AsyncStorage.getItem(STORAGE_KEYS.DAY_SUMMARIES);
      const summaries: Record<string, DaySummary> = summariesJson
        ? JSON.parse(summariesJson)
        : {};

      summaries[summary.date] = summary;
      await AsyncStorage.setItem(STORAGE_KEYS.DAY_SUMMARIES, JSON.stringify(summaries));

      // Log for debugging - confirms storage save completed
      console.log('💾 Steps saved to storage:', summary.steps, 'for date:', summary.date);

      // Sync to Supabase if configured
      await SupabaseStorageService.saveDaySummary(summary).catch(err => {
        console.warn('Supabase sync failed for day summary:', err);
      });
    } catch (error) {
      console.error('Error saving day summary:', error);
      throw error; // Re-throw so caller knows save failed
    }
  }

  static async getAllDaySummaries(): Promise<DaySummary[]> {
    try {
      const summariesJson = await AsyncStorage.getItem(STORAGE_KEYS.DAY_SUMMARIES);
      if (!summariesJson) return [];

      const summaries: Record<string, DaySummary> = JSON.parse(summariesJson);
      return Object.values(summaries).sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('Error getting all day summaries:', error);
      return [];
    }
  }

  // Water Logs
  static async getWaterLogs(date?: string): Promise<WaterLogItem[]> {
    try {
      const logsJson = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
      if (!logsJson) return [];

      const logs: WaterLogItem[] = JSON.parse(logsJson);
      if (date) {
        return logs.filter(log => log.date === date);
      }
      return logs.sort((a, b) => b.time.localeCompare(a.time));
    } catch (error) {
      console.error('Error getting water logs:', error);
      return [];
    }
  }

  static async addWaterLog(log: WaterLogItem): Promise<void> {
    try {
      // Save to local storage first
      const logsJson = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
      const logs: WaterLogItem[] = logsJson ? JSON.parse(logsJson) : [];

      logs.push(log);
      await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(logs));

      // Sync to Supabase if configured (silently fail if tables don't exist)
      await SupabaseStorageService.addWaterLog(log).catch(() => {
        // Error is already handled silently in SupabaseStorageService
        // No need to log here to avoid console spam
      });
    } catch (error) {
      console.error('Error adding water log:', error);
    }
  }

  static async deleteWaterLog(id: string): Promise<void> {
    try {
      // Delete from local storage
      const logsJson = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
      if (!logsJson) return;

      const logs: WaterLogItem[] = JSON.parse(logsJson);
      const filtered = logs.filter(log => log.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(filtered));

      // Delete from Supabase if configured
      await SupabaseStorageService.deleteWaterLog(id).catch(err => {
        console.warn('Supabase sync failed for water log deletion:', err);
      });
    } catch (error) {
      console.error('Error deleting water log:', error);
    }
  }

  // Goals
  static async getGoals(): Promise<UserGoals> {
    try {
      const goalsJson = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      return goalsJson ? JSON.parse(goalsJson) : DEFAULT_GOALS;
    } catch (error) {
      console.error('Error getting goals:', error);
      return DEFAULT_GOALS;
    }
  }

  static async saveGoals(goals: UserGoals): Promise<void> {
    try {
      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));

      // Sync to Supabase if configured
      await SupabaseStorageService.saveGoals(goals).catch(err => {
        console.warn('Supabase sync failed for goals:', err);
      });
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }

  // Reminders
  static async getReminders(): Promise<Reminder[]> {
    try {
      const remindersJson = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      return remindersJson ? JSON.parse(remindersJson) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  static async saveReminders(reminders: Reminder[]): Promise<void> {
    try {
      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));

      // Sync to Supabase if configured
      await SupabaseStorageService.saveReminders(reminders).catch(err => {
        console.warn('Supabase sync failed for reminders:', err);
      });
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }

  // Settings
  static async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : {
        unit: 'metric' as const,
        theme: 'auto' as const,
        accentColor: '#6366f1',
        notificationsEnabled: true,
        hasCompletedOnboarding: false,
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        unit: 'metric' as const,
        theme: 'auto' as const,
        accentColor: '#6366f1',
        notificationsEnabled: true,
        hasCompletedOnboarding: false,
      };
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Onboarding
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return completed === 'true';
    } catch (error) {
      return false;
    }
  }

  static async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
    }
  }

  // User Profile
  static async getProfile(): Promise<UserProfile | null> {
    try {
      const profileJson = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  static async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

      // Sync to Supabase if configured
      // Note: Profile sync can be added later if needed
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }

  static async hasCompletedProfile(): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      return profile?.hasCompletedProfile || false;
    } catch (error) {
      return false;
    }
  }

  // Achievements
  static async getAchievements(): Promise<{ lastAchievementStep: boolean; lastAchievementWater: boolean }> {
    try {
      const achievementsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return achievementsJson ? JSON.parse(achievementsJson) : { lastAchievementStep: false, lastAchievementWater: false };
    } catch (error) {
      console.error('Error getting achievements:', error);
      return { lastAchievementStep: false, lastAchievementWater: false };
    }
  }

  static async saveAchievements(achievements: { lastAchievementStep: boolean; lastAchievementWater: boolean }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  // Export/Import
  static async exportData(): Promise<string> {
    try {
      const data = {
        daySummaries: await this.getAllDaySummaries(),
        waterLogs: await this.getWaterLogs(),
        goals: await this.getGoals(),
        reminders: await this.getReminders(),
        settings: await this.getSettings(),
        exportDate: new Date().toISOString(),
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      if (data.daySummaries) {
        const summaries: Record<string, DaySummary> = {};
        data.daySummaries.forEach((summary: DaySummary) => {
          summaries[summary.date] = summary;
        });
        await AsyncStorage.setItem(STORAGE_KEYS.DAY_SUMMARIES, JSON.stringify(summaries));
      }

      if (data.waterLogs) {
        await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(data.waterLogs));
      }

      if (data.goals) {
        await this.saveGoals(data.goals);
      }

      if (data.reminders) {
        await this.saveReminders(data.reminders);
      }

      if (data.settings) {
        await this.saveSettings(data.settings);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }


}


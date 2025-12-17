import { supabase } from './supabase';
import { StorageService } from './storage';
import { SupabaseStorageService } from './supabaseStorage';
import { DaySummary, WaterLogItem, UserGoals, Reminder } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RestoreData {
  daySummaries: DaySummary[];
  waterLogs: WaterLogItem[];
  goals: UserGoals | null;
  reminders: Reminder[];
  achievements: { lastAchievementStep: boolean; lastAchievementWater: boolean } | null;
}

export type RestoreMode = 'merge' | 'replace';

export class RestoreService {
  /**
   * Check if user is logged in to Supabase
   */
  static async isUserLoggedIn(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session && !!session.user;
    } catch (error) {
      console.error('Error checking user session:', error);
      return false;
    }
  }

  /**
   * Fetch data from cloud storage (Supabase)
   */
  static async fetchCloudData(): Promise<RestoreData | null> {
    try {
      // Verify user identity
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.user) {
        console.error('User not authenticated:', sessionError);
        return null;
      }

      // Fetch all data from cloud
      const [daySummaries, waterLogs, goals, reminders] = await Promise.all([
        SupabaseStorageService.getAllDaySummaries(),
        SupabaseStorageService.getWaterLogs(),
        SupabaseStorageService.getGoals(),
        SupabaseStorageService.getReminders(),
      ]);

      // Achievements are not stored in cloud, so return null for them
      return {
        daySummaries,
        waterLogs,
        goals,
        reminders,
        achievements: null, // Achievements are local-only
      };
    } catch (error) {
      console.error('Error fetching cloud data:', error);
      return null;
    }
  }

  /**
   * Fetch data from local backup
   */
  static async fetchLocalBackup(): Promise<RestoreData | null> {
    try {
      const [daySummaries, waterLogs, goals, reminders, achievements] = await Promise.all([
        StorageService.getAllDaySummaries(),
        StorageService.getWaterLogs(),
        StorageService.getGoals(),
        StorageService.getReminders(),
        StorageService.getAchievements(),
      ]);

      // Check if any data exists
      const hasData = 
        daySummaries.length > 0 ||
        waterLogs.length > 0 ||
        goals !== null ||
        reminders.length > 0 ||
        achievements !== null;

      if (!hasData) {
        return null;
      }

      return {
        daySummaries,
        waterLogs,
        goals,
        reminders,
        achievements,
      };
    } catch (error) {
      console.error('Error fetching local backup:', error);
      return null;
    }
  }

  /**
   * Restore data to the app
   */
  static async restoreData(
    restoreData: RestoreData,
    mode: RestoreMode
  ): Promise<void> {
    try {
      if (mode === 'replace') {
        // Replace all data
        await this.replaceData(restoreData);
      } else {
        // Merge with existing data
        await this.mergeData(restoreData);
      }

      // Restore achievements if available
      if (restoreData.achievements) {
        await StorageService.saveAchievements(restoreData.achievements);
      }

      // If user is logged in, sync restored data to cloud
      const isLoggedIn = await this.isUserLoggedIn();
      if (isLoggedIn) {
        try {
          // Sync day summaries to cloud
          for (const summary of restoreData.daySummaries) {
            await SupabaseStorageService.saveDaySummary(summary).catch(() => {
              // Silently fail - cloud sync is not critical
            });
          }

          // Sync water logs to cloud
          for (const log of restoreData.waterLogs) {
            await SupabaseStorageService.addWaterLog(log).catch(() => {
              // Silently fail - cloud sync is not critical
            });
          }

          // Sync goals to cloud
          if (restoreData.goals) {
            await SupabaseStorageService.saveGoals(restoreData.goals).catch(() => {
              // Silently fail - cloud sync is not critical
            });
          }

          // Sync reminders to cloud
          if (restoreData.reminders.length > 0) {
            await SupabaseStorageService.saveReminders(restoreData.reminders).catch(() => {
              // Silently fail - cloud sync is not critical
            });
          }
        } catch (error) {
          // Log but don't fail - local restore succeeded
          console.warn('Cloud sync after restore failed:', error);
        }
      }
    } catch (error) {
      console.error('Error restoring data:', error);
      throw error;
    }
  }

  /**
   * Replace all existing data with restored data
   */
  private static async replaceData(restoreData: RestoreData): Promise<void> {
    // Restore day summaries
    const summaries: Record<string, DaySummary> = {};
    for (const summary of restoreData.daySummaries) {
      summaries[summary.date] = summary;
    }
    await AsyncStorage.setItem('@stepwater:day_summaries', JSON.stringify(summaries));

    // Restore water logs (replace all)
    await AsyncStorage.setItem('@stepwater:water_logs', JSON.stringify(restoreData.waterLogs));

    // Restore goals
    if (restoreData.goals) {
      await StorageService.saveGoals(restoreData.goals);
    }

    // Restore reminders
    await StorageService.saveReminders(restoreData.reminders);

    // Restore achievements
    if (restoreData.achievements) {
      await StorageService.saveAchievements(restoreData.achievements);
    }
  }

  /**
   * Merge restored data with existing data
   */
  private static async mergeData(restoreData: RestoreData): Promise<void> {
    // Get existing data
    const existingSummaries = await StorageService.getAllDaySummaries();
    const existingWaterLogs = await StorageService.getWaterLogs();
    const existingGoals = await StorageService.getGoals();
    const existingReminders = await StorageService.getReminders();
    const existingAchievements = await StorageService.getAchievements();

    // Merge day summaries (keep the latest for each date)
    const summariesMap = new Map<string, DaySummary>();
    
    // Add existing summaries
    for (const summary of existingSummaries) {
      summariesMap.set(summary.date, summary);
    }
    
    // Merge with restored summaries (restored data takes precedence if same date)
    for (const summary of restoreData.daySummaries) {
      const existing = summariesMap.get(summary.date);
      if (!existing || new Date(summary.date) >= new Date(existing.date)) {
        summariesMap.set(summary.date, summary);
      }
    }

    // Save merged summaries
    for (const summary of summariesMap.values()) {
      await StorageService.saveDaySummary(summary);
    }

    // Merge water logs (avoid duplicates by ID)
    const waterLogsMap = new Map<string, WaterLogItem>();
    
    // Add existing logs
    for (const log of existingWaterLogs) {
      waterLogsMap.set(log.id, log);
    }
    
    // Merge with restored logs
    for (const log of restoreData.waterLogs) {
      if (!waterLogsMap.has(log.id)) {
        waterLogsMap.set(log.id, log);
      }
    }

    // Save merged water logs (replace all)
    const mergedWaterLogs = Array.from(waterLogsMap.values());
    await AsyncStorage.setItem('@stepwater:water_logs', JSON.stringify(mergedWaterLogs));

    // Merge goals (prefer restored if available)
    if (restoreData.goals) {
      await StorageService.saveGoals(restoreData.goals);
    }

    // Merge reminders (avoid duplicates by ID)
    const remindersMap = new Map<string, Reminder>();
    
    // Add existing reminders
    for (const reminder of existingReminders) {
      remindersMap.set(reminder.id, reminder);
    }
    
    // Merge with restored reminders
    for (const reminder of restoreData.reminders) {
      remindersMap.set(reminder.id, reminder);
    }

    // Save merged reminders
    await StorageService.saveReminders(Array.from(remindersMap.values()));

    // Merge achievements (prefer restored if available)
    if (restoreData.achievements) {
      await StorageService.saveAchievements(restoreData.achievements);
    }
  }

  /**
   * Main restore function - checks login status and fetches from appropriate source
   */
  static async attemptRestore(): Promise<RestoreData | null> {
    const isLoggedIn = await this.isUserLoggedIn();
    
    if (isLoggedIn) {
      // Try cloud first
      const cloudData = await this.fetchCloudData();
      if (cloudData) {
        return cloudData;
      }
    }

    // Fall back to local backup
    const localData = await this.fetchLocalBackup();
    return localData;
  }
}


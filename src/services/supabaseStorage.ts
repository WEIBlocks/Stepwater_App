import { supabase } from './supabase';
import { DaySummary, WaterLogItem, UserGoals, Reminder, AppSettings } from '../types';
import { getTodayDateString } from '../utils/formatting';

/**
 * Supabase Storage Service
 * This service syncs data with Supabase database
 * Falls back to local storage if Supabase is not configured
 */
export class SupabaseStorageService {
  private static isConfigured(): boolean {
    // Check if Supabase is properly configured
    try {
      // Use Constants.expoConfig for production builds, fallback to process.env
      let url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      let key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      // Try to get from expo-constants if available (production builds)
      try {
        const Constants = require('expo-constants').default;
        if (Constants?.expoConfig?.extra?.supabaseUrl) {
          url = Constants.expoConfig.extra.supabaseUrl;
        }
        if (Constants?.expoConfig?.extra?.supabaseAnonKey) {
          key = Constants.expoConfig.extra.supabaseAnonKey;
        }
      } catch {
        // Constants might not be available, use process.env
      }
      
      // Validate that we have real credentials (not placeholder)
      const hasValidUrl = url && url.length > 0 && !url.includes('placeholder') && !url.includes('not-configured');
      const hasValidKey = key && key.length > 0 && !key.includes('placeholder') && !key.includes('not-configured');
      
      return hasValidUrl && hasValidKey;
    } catch {
      return false;
    }
  }

  private static isTableError(error: any): boolean {
    // Check if error is due to missing table
    if (!error) return false;
    const message = error.message || '';
    const code = error.code || '';
    return (
      message.includes('Could not find the table') ||
      message.includes('relation') && message.includes('does not exist') ||
      code === 'PGRST205' ||
      code === '42P01'
    );
  }

  private static handleSupabaseError(operation: string, error: any): void {
    if (this.isTableError(error)) {
      // Silently ignore table missing errors - tables haven't been set up yet
      // User can set up Supabase tables later if they want cloud sync
      return;
    }
    // Suppress UUID syntax errors - they occur when trying to delete invalid IDs
    // This is not critical and doesn't affect functionality
    if (error?.message?.includes('invalid input syntax for type uuid')) {
      return;
    }
    // Only log non-table and non-UUID errors
    console.error(`Error in Supabase ${operation}:`, error);
  }

  // Day Summaries
  static async getDaySummary(date: string): Promise<DaySummary | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('day_summaries')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (error) {
        this.handleSupabaseError('getDaySummary', error);
        return null;
      }

      if (!data) return null;

      return {
        date: data.date,
        steps: data.steps,
        stepDistanceMeters: data.step_distance_meters,
        calories: data.calories,
        waterMl: data.water_ml,
        notes: data.notes,
      };
    } catch (error) {
      this.handleSupabaseError('getDaySummary', error);
      return null;
    }
  }

  static async saveDaySummary(summary: DaySummary): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('day_summaries')
        .upsert({
          date: summary.date,
          steps: summary.steps,
          step_distance_meters: summary.stepDistanceMeters,
          calories: summary.calories,
          water_ml: summary.waterMl,
          notes: summary.notes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'date',
        });

      if (error) {
        this.handleSupabaseError('saveDaySummary', error);
      }
    } catch (error) {
      this.handleSupabaseError('saveDaySummary', error);
    }
  }

  static async getAllDaySummaries(): Promise<DaySummary[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('day_summaries')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        this.handleSupabaseError('getAllDaySummaries', error);
        return [];
      }

      return (data || []).map((item) => ({
        date: item.date,
        steps: item.steps,
        stepDistanceMeters: item.step_distance_meters,
        calories: item.calories,
        waterMl: item.water_ml,
        notes: item.notes,
      }));
    } catch (error) {
      console.error('Error getting all day summaries:', error);
      return [];
    }
  }

  // Water Logs
  static async getWaterLogs(date?: string): Promise<WaterLogItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      let query = supabase
        .from('water_logs')
        .select('*')
        .order('time', { ascending: false });

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;

      if (error) {
        this.handleSupabaseError('getWaterLogs', error);
        return [];
      }

      return (data || []).map((item) => ({
        id: item.id,
        date: item.date,
        time: item.time,
        amountMl: item.amount_ml,
      }));
    } catch (error) {
      this.handleSupabaseError('getWaterLogs', error);
      return [];
    }
  }

  static async addWaterLog(log: WaterLogItem): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('water_logs')
        .insert({
          id: log.id,
          date: log.date,
          time: log.time,
          amount_ml: log.amountMl,
        });

      if (error) {
        this.handleSupabaseError('addWaterLog', error);
      }
    } catch (error) {
      this.handleSupabaseError('addWaterLog', error);
    }
  }

  static async deleteWaterLog(id: string): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleSupabaseError('deleteWaterLog', error);
      }
    } catch (error) {
      this.handleSupabaseError('deleteWaterLog', error);
    }
  }

  // Goals
  static async getGoals(): Promise<UserGoals | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .maybeSingle();

      if (error) {
        this.handleSupabaseError('getGoals', error);
        return null;
      }

      if (!data) return null;

      return {
        dailySteps: data.daily_steps,
        dailyWaterMl: data.daily_water_ml,
      };
    } catch (error) {
      this.handleSupabaseError('getGoals', error);
      return null;
    }
  }

  static async saveGoals(goals: UserGoals): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_goals')
        .upsert({
          daily_steps: goals.dailySteps,
          daily_water_ml: goals.dailyWaterMl,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        this.handleSupabaseError('saveGoals', error);
      }
    } catch (error) {
      this.handleSupabaseError('saveGoals', error);
    }
  }

  // Reminders
  static async getReminders(): Promise<Reminder[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('time', { ascending: true });

      if (error) {
        this.handleSupabaseError('getReminders', error);
        return [];
      }

      return (data || []).map((item) => ({
        id: item.id,
        time: item.time,
        enabled: item.enabled,
        daysOfWeek: item.days_of_week,
      }));
    } catch (error) {
      this.handleSupabaseError('getReminders', error);
      return [];
    }
  }

  static async saveReminders(reminders: Reminder[]): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      // Use upsert to handle both insert and update without duplicate key errors
      // This will update existing reminders and insert new ones
      if (reminders.length > 0) {
        const { error } = await supabase
          .from('reminders')
          .upsert(
            reminders.map((r) => ({
              id: r.id,
              time: r.time,
              enabled: r.enabled,
              days_of_week: r.daysOfWeek,
            })),
            {
              onConflict: 'id', // Use id as the conflict resolution key
            }
          );

        if (error) {
          this.handleSupabaseError('saveReminders (upsert)', error);
        }

        // Delete reminders that are no longer in the list
        // Get all current reminder IDs from database
        const { data: existingReminders } = await supabase
          .from('reminders')
          .select('id');

        if (existingReminders) {
          const currentIds = new Set(reminders.map(r => r.id));
          const idsToDelete = existingReminders
            .map(r => r.id)
            .filter(id => !currentIds.has(id));

          if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase
              .from('reminders')
              .delete()
              .in('id', idsToDelete);

            if (deleteError) {
              this.handleSupabaseError('saveReminders (delete)', deleteError);
            }
          }
        }
      } else {
        // If no reminders, delete all
        // Use individual deletions to avoid UUID array syntax errors
        try {
          const { data: allReminders, error: fetchError } = await supabase
            .from('reminders')
            .select('id');

          if (fetchError) {
            // Silently ignore fetch errors
            return;
          }

          if (allReminders && allReminders.length > 0) {
            // Delete reminders individually to avoid UUID array issues
            // This prevents the "invalid input syntax for type uuid" error
            for (const reminder of allReminders) {
              try {
                const id = reminder?.id;
                // Only delete if it's a valid UUID
                if (id && typeof id === 'string' && id.trim().length > 0) {
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (uuidRegex.test(id.trim())) {
                    // Delete individually using .eq() instead of .in() to avoid array issues
                    const { error } = await supabase
                      .from('reminders')
                      .delete()
                      .eq('id', id);
                    
                    // Silently ignore all errors when deleting - they're not critical
                    // The goal is to clear all reminders, and invalid ones will be skipped
                  }
                }
              } catch (deleteError: any) {
                // Silently ignore individual delete errors
                // This prevents UUID syntax errors from being logged
              }
            }
          }
        } catch (error: any) {
          // Silently ignore all errors when deleting all reminders
          // This prevents UUID syntax errors from cluttering the console
        }
      }
    } catch (error) {
      this.handleSupabaseError('saveReminders', error);
    }
  }

  // Delete all data from Supabase
  static async deleteAllData(): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      // Delete all day summaries - use gte with a very old date to match all records
      const { error: daySummariesError } = await supabase
        .from('day_summaries')
        .delete()
        .gte('date', '1900-01-01'); // This will match all dates (all records)
      
      if (daySummariesError && !this.isTableError(daySummariesError)) {
        this.handleSupabaseError('deleteAllData (day_summaries)', daySummariesError);
      }

      // Delete all water logs - fetch all and delete individually to avoid issues
      try {
        const { data: allWaterLogs } = await supabase
          .from('water_logs')
          .select('id');
        
        if (allWaterLogs && allWaterLogs.length > 0) {
          // Delete in batches to avoid issues
          for (const log of allWaterLogs) {
            if (log?.id) {
              await supabase
                .from('water_logs')
                .delete()
                .eq('id', log.id);
            }
          }
        }
      } catch (waterLogsError) {
        if (!this.isTableError(waterLogsError)) {
          this.handleSupabaseError('deleteAllData (water_logs)', waterLogsError);
        }
      }

      // Delete all reminders - fetch all and delete individually
      try {
        const { data: allReminders } = await supabase
          .from('reminders')
          .select('id');
        
        if (allReminders && allReminders.length > 0) {
          for (const reminder of allReminders) {
            if (reminder?.id) {
              await supabase
                .from('reminders')
                .delete()
                .eq('id', reminder.id);
            }
          }
        }
      } catch (remindersError) {
        if (!this.isTableError(remindersError)) {
          this.handleSupabaseError('deleteAllData (reminders)', remindersError);
        }
      }

      // Reset goals to defaults
      // Note: user_goals might have a unique constraint, so we'll update it instead
      const { error: goalsError } = await supabase
        .from('user_goals')
        .update({
          daily_steps: 10000,
          daily_water_ml: 2000,
          updated_at: new Date().toISOString(),
        });
      
      if (goalsError && !this.isTableError(goalsError)) {
        // If update fails, try to delete all and let it recreate on next save
        try {
          const { data: allGoals } = await supabase
            .from('user_goals')
            .select('id');
          
          if (allGoals && allGoals.length > 0) {
            for (const goal of allGoals) {
              if (goal?.id) {
                await supabase
                  .from('user_goals')
                  .delete()
                  .eq('id', goal.id);
              }
            }
          }
        } catch (deleteGoalsError) {
          // Silently ignore - goals will be reset on next save
        }
      }
    } catch (error) {
      this.handleSupabaseError('deleteAllData', error);
    }
  }
}


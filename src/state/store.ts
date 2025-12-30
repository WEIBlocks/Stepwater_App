import { create } from 'zustand';
import { generateUUIDSecure } from '../utils/uuid';
import { DaySummary, WaterLogItem, UserGoals, Reminder, AppSettings, PedometerResult } from '../types';
import { StorageService } from '../services/storage';
import { getTodayDateString } from '../utils/formatting';
import { nativeStepWaterService } from '../services/nativeStepWaterService';
import { Platform } from 'react-native';

interface AppState {
  // State
  currentSteps: number;
  stepGoal: number;
  waterGoal: number;
  waterConsumed: number;
  todaySummary: DaySummary | null;
  waterLogs: WaterLogItem[];
  reminders: Reminder[];
  settings: AppSettings;
  isPedometerAvailable: boolean;
  isLoading: boolean;
  lastAchievementStep: boolean;
  lastAchievementWater: boolean;
  isStepTrackingPaused: boolean;

  // Actions
  setCurrentSteps: (steps: number) => void;
  syncFromNativeService: () => Promise<void>;
  pauseStepTracking: () => void;
  resumeStepTracking: () => void;
  setStepGoal: (goal: number) => Promise<void>;
  setWaterGoal: (goal: number) => Promise<void>;
  addWater: (amountMl: number) => Promise<void>;
  deleteWaterLog: (id: string) => Promise<void>;
  loadTodayData: () => Promise<void>;
  loadGoals: () => Promise<void>;
  saveGoals: () => Promise<void>;
  loadReminders: () => Promise<void>;
  saveReminders: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  setSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setPedometerAvailable: (available: boolean) => void;
  setLoading: (loading: boolean) => void;
  resetAchievements: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  currentSteps: 0,
  stepGoal: 10000,
  waterGoal: 2000,
  waterConsumed: 0,
  todaySummary: null,
  waterLogs: [],
  reminders: [],
  settings: {
    unit: 'metric',
    theme: 'auto',
    accentColor: '#6366f1',
    notificationsEnabled: true,
    hasCompletedOnboarding: false,
  },
  isPedometerAvailable: false,
  isLoading: true,
  lastAchievementStep: false,
  lastAchievementWater: false,
  isStepTrackingPaused: false,

  // Actions
  setCurrentSteps: (steps: number) => {
    const prevSteps = get().currentSteps;
    
    // Only update if steps actually changed - prevents unnecessary re-renders
    if (steps === prevSteps) {
      return;
    }
    
    const stepGoal = get().stepGoal;
    const hadAchieved = prevSteps >= stepGoal;
    const nowAchieved = steps >= stepGoal;
    
    // Update state IMMEDIATELY - currentSteps is the single source of truth
    const updates: Partial<AppState> = { currentSteps: steps };
    
    // Check for achievement (synchronous)
    if (!hadAchieved && nowAchieved && !get().lastAchievementStep) {
      updates.lastAchievementStep = true;
    }
    
    // Log for debugging
    console.log('🔄 Store update - currentSteps:', prevSteps, '→', steps);
    
    // Single set() call ensures immediate re-render
    set(updates);
    
    // NOTE: Notification updates are handled by native service - no JS updates needed
    
    // Save to storage AFTER updating store (non-blocking, async)
    // DO NOT reload from storage - currentSteps is the source of truth
    const today = getTodayDateString();
    Promise.resolve().then(async () => {
      try {
        const summary = get().todaySummary;
        
        // Save to storage (async, non-blocking)
        if (summary) {
          await StorageService.saveDaySummary({
            ...summary,
            steps,
          });
        } else {
          await StorageService.saveDaySummary({
            date: today,
            steps,
            waterMl: get().waterConsumed,
          });
        }
        
        // Update todaySummary in state to keep it in sync (but don't change currentSteps)
        const updatedSummary = await StorageService.getDaySummary(today);
        if (updatedSummary) {
          set({ todaySummary: updatedSummary });
        }
        
        console.log('💾 Steps saved to storage:', steps);
      } catch (error) {
        console.error('Error saving steps to storage:', error);
        // Silently handle save errors - don't block UI
      }
    });
  },

  syncFromNativeService: async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      // Check if service is running first
      let isRunning = await nativeStepWaterService.isServiceRunning();
      
      if (!isRunning) {
        // Attempt to start service
        const started = await nativeStepWaterService.startService();
        if (!started) {
          // Service start failed, might not be available - skip sync silently
          return;
        }
        
        // Poll for service to become available (up to 3 seconds with exponential backoff)
        let retries = 0;
        const maxRetries = 6;
        while (retries < maxRetries && !isRunning) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
          isRunning = await nativeStepWaterService.isServiceRunning();
          retries++;
        }
        
        if (!isRunning) {
          // Service still not running after retries - log once but don't spam warnings
          if (retries >= maxRetries) {
            console.warn('⚠️ Native service not running after startup attempt - will retry on next sync');
          }
          return;
        }
      }

      // Read current values from native service (source of truth)
      const nativeSteps = await nativeStepWaterService.getCurrentSteps();
      const nativeWater = await nativeStepWaterService.getCurrentWater();

      const prevSteps = get().currentSteps;
      const prevWater = get().waterConsumed;

      // Debug logging
      if (nativeSteps !== prevSteps) {
        console.log('🔄 Native service sync:', {
          nativeSteps,
          prevSteps,
          difference: nativeSteps - prevSteps,
          isRunning,
        });
      }

      // Update steps - always update if native value is different and >= 0
      if (nativeSteps !== prevSteps && nativeSteps >= 0) {
        // Always use native value - it's the source of truth
        get().setCurrentSteps(nativeSteps);
        if (nativeSteps > prevSteps) {
          console.log('✅ Steps increased:', prevSteps, '→', nativeSteps);
        }
      }

      // Update water if changed
      if (nativeWater !== prevWater) {
        set({ waterConsumed: nativeWater });
      }
    } catch (error) {
      console.error('❌ Error syncing from native service:', error);
      // If native service fails, log it but don't break the app
    }
  },

  setStepGoal: async (goal: number) => {
    set({ stepGoal: goal });
    // Sync goal to native service
    if (Platform.OS === 'android') {
      await nativeStepWaterService.setStepGoal(goal).catch((error) => {
        console.warn('Failed to sync step goal to native service:', error);
      });
    }
  },

  setWaterGoal: async (goal: number) => {
    set({ waterGoal: goal });
    // Sync goal to native service
    if (Platform.OS === 'android') {
      await nativeStepWaterService.setWaterGoal(goal).catch((error) => {
        console.warn('Failed to sync water goal to native service:', error);
      });
    }
  },

  addWater: async (amountMl: number) => {
    try {
      if (!amountMl || amountMl <= 0) {
        throw new Error('Invalid water amount');
      }

      const log: WaterLogItem = {
        id: generateUUIDSecure(),
        date: getTodayDateString(),
        time: new Date().toISOString(),
        amountMl,
      };

      const prevConsumed = get().waterConsumed;
      const newConsumed = prevConsumed + amountMl;
      const waterGoal = get().waterGoal;
      const hadAchieved = prevConsumed >= waterGoal;
      const nowAchieved = newConsumed >= waterGoal;

      // Update native service FIRST (source of truth)
      // This will immediately update the notification
      if (Platform.OS === 'android') {
        await nativeStepWaterService.updateWater(amountMl).catch((error) => {
          console.warn('Failed to update native service:', error);
        });
      }

      // Update state immediately for responsive UI
      const currentLogs = get().waterLogs || [];
      set({ 
        waterConsumed: newConsumed, 
        waterLogs: [...currentLogs, log] 
      });

      // Check for achievement
      if (!hadAchieved && nowAchieved && !get().lastAchievementWater) {
        set({ lastAchievementWater: true });
      }

      // Save to storage (async, non-blocking)
      // Errors are handled internally - don't let them propagate
      await StorageService.addWaterLog(log).catch(() => {
        // Error already logged/handled in StorageService
        // UI is already updated, so don't throw
      });

      // Update today's summary
      const today = getTodayDateString();
      const summary = get().todaySummary;
      if (summary) {
        await StorageService.saveDaySummary({
          ...summary,
          waterMl: newConsumed,
        }).catch((err) => {
          console.error('Failed to save day summary:', err);
        });
      } else {
        await StorageService.saveDaySummary({
          date: today,
          steps: get().currentSteps,
          waterMl: newConsumed,
        }).catch((err) => {
          console.error('Failed to save day summary:', err);
        });
        // Update todaySummary in state
        set({
          todaySummary: {
            date: today,
            steps: get().currentSteps,
            waterMl: newConsumed,
          },
        });
      }
    } catch (error: any) {
      // Only log unexpected errors (not Supabase table errors)
      const errorMessage = error?.message || '';
      if (!errorMessage.includes('Could not find the table') && 
          !errorMessage.includes('PGRST205')) {
        console.error('Error in addWater:', error);
      }
      // Don't throw - UI is already updated, let storage handle errors silently
    }
  },

  deleteWaterLog: async (id: string) => {
    const log = get().waterLogs.find(l => l.id === id);
    if (!log) return;

    await StorageService.deleteWaterLog(id);
    const newConsumed = Math.max(0, get().waterConsumed - log.amountMl);
    const newLogs = get().waterLogs.filter(l => l.id !== id);
    
    set({ waterConsumed: newConsumed, waterLogs: newLogs });

    // Update native service with new total (negative amount to subtract)
    // Note: Native service uses additive updates, so we need to set the absolute value
    // For now, we'll sync the total by reading from native after deletion
    // This is a limitation - ideally native service would support setWater()
    if (Platform.OS === 'android') {
      // Sync from native to ensure consistency
      await get().syncFromNativeService();
    }

    // Update today's summary
    const summary = get().todaySummary;
    if (summary) {
      await StorageService.saveDaySummary({
        ...summary,
        waterMl: newConsumed,
      });
    }
  },

  loadTodayData: async () => {
    const today = getTodayDateString();
    const summary = await StorageService.getDaySummary(today);
    const logs = await StorageService.getWaterLogs(today);
    const totalWaterFromLogs = logs.reduce((sum, log) => sum + log.amountMl, 0);
    
    // On Android, native service is the source of truth
    let stepsToUse = summary?.steps ?? 0;
    let waterToUse = totalWaterFromLogs;
    
    if (Platform.OS === 'android') {
      try {
        // Read from native service (source of truth)
        const [nativeSteps, nativeWater] = await Promise.all([
          nativeStepWaterService.getCurrentSteps(),
          nativeStepWaterService.getCurrentWater(),
        ]);
        
        // Use native values, but keep highest to prevent going backwards
        stepsToUse = Math.max(stepsToUse, nativeSteps);
        waterToUse = Math.max(waterToUse, nativeWater);
      } catch (error) {
        console.warn('Failed to read from native service, using stored values:', error);
      }
    } else {
      // iOS or other platforms - use stored values
      const inMemorySteps = get().currentSteps || 0;
      const storedSteps = summary?.steps ?? 0;
      stepsToUse = Math.max(storedSteps, inMemorySteps);

      const inMemoryWater = get().waterConsumed || 0;
      waterToUse = Math.max(totalWaterFromLogs, inMemoryWater);
    }

    set({
      todaySummary: summary
        ? {
            ...summary,
            steps: stepsToUse,
            // Keep water in summary in sync with what we actually use
            waterMl: summary.waterMl ?? waterToUse,
          }
        : {
            date: today,
            steps: stepsToUse,
            waterMl: waterToUse,
          },
      waterConsumed: waterToUse,
      waterLogs: logs,
      currentSteps: stepsToUse,
    });
    
    console.log('📊 Loaded today\'s data - steps:', stepsToUse, 'water:', waterToUse);
  },

  loadGoals: async () => {
    const goals = await StorageService.getGoals();
    set({
      stepGoal: goals.dailySteps,
      waterGoal: goals.dailyWaterMl,
    });
  },

  saveGoals: async () => {
    const { stepGoal, waterGoal } = get();
    await StorageService.saveGoals({
      dailySteps: stepGoal,
      dailyWaterMl: waterGoal,
    });
  },

  loadReminders: async () => {
    const reminders = await StorageService.getReminders();
    set({ reminders });
  },

  saveReminders: async () => {
    const { reminders } = get();
    await StorageService.saveReminders(reminders);
    set({ reminders });
  },

  loadSettings: async () => {
    const settings = await StorageService.getSettings();
    set({ settings });
  },

  saveSettings: async () => {
    const { settings } = get();
    await StorageService.saveSettings(settings);
  },

  setSettings: async (newSettings: Partial<AppSettings>) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
    
    // Sync water unit to native service if unit changed
    if (newSettings.unit && Platform.OS === 'android') {
      const waterUnit = newSettings.unit === 'imperial' ? 'oz' : 'ml';
      await nativeStepWaterService.setWaterUnit(waterUnit).catch((error) => {
        console.warn('Failed to sync water unit to native service:', error);
      });
    }
  },

  setPedometerAvailable: (available: boolean) => {
    set({ isPedometerAvailable: available });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  resetAchievements: () => {
    set({ lastAchievementStep: false, lastAchievementWater: false });
  },

  pauseStepTracking: () => {
    set({ isStepTrackingPaused: true });
    console.log('⏸️ Step tracking paused');
  },

  resumeStepTracking: () => {
    set({ isStepTrackingPaused: false });
    console.log('▶️ Step tracking resumed');
  },
}));


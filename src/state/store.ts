import { create } from 'zustand';
import { generateUUIDSecure } from '../utils/uuid';
import { DaySummary, WaterLogItem, UserGoals, Reminder, AppSettings, PedometerResult } from '../types';
import { StorageService } from '../services/storage';
import { getTodayDateString } from '../utils/formatting';
import { ForegroundServiceManager } from '../services/foregroundServiceManager';

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
  pauseStepTracking: () => void;
  resumeStepTracking: () => void;
  setStepGoal: (goal: number) => void;
  setWaterGoal: (goal: number) => void;
  addWater: (amountMl: number) => Promise<void>;
  deleteWaterLog: (id: string) => Promise<void>;
  loadTodayData: () => Promise<void>;
  loadGoals: () => Promise<void>;
  saveGoals: () => Promise<void>;
  loadReminders: () => Promise<void>;
  saveReminders: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  setSettings: (settings: Partial<AppSettings>) => void;
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
    
    // Update foreground notification immediately when steps change
    // This ensures the notification reflects the new step count instantly
    const state = get();
    const waterUnit = state.settings.unit === 'imperial' ? 'oz' : 'ml';
    ForegroundServiceManager.triggerUpdate(
      steps,
      state.stepGoal,
      state.waterConsumed,
      state.waterGoal,
      waterUnit
    ).catch((error) => {
      // Log error but don't block - notification update is non-critical
      console.warn('Failed to update foreground notification:', error);
    });
    
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

  setStepGoal: (goal: number) => {
    set({ stepGoal: goal });
    
    // Update foreground notification immediately when step goal changes
    const state = get();
    const waterUnit = state.settings.unit === 'imperial' ? 'oz' : 'ml';
    ForegroundServiceManager.triggerUpdate(
      state.currentSteps,
      goal,
      state.waterConsumed,
      state.waterGoal,
      waterUnit
    ).catch((error) => {
      console.warn('Failed to update foreground notification:', error);
    });
  },

  setWaterGoal: (goal: number) => {
    set({ waterGoal: goal });
    
    // Update foreground notification immediately when water goal changes
    const state = get();
    const waterUnit = state.settings.unit === 'imperial' ? 'oz' : 'ml';
    ForegroundServiceManager.triggerUpdate(
      state.currentSteps,
      state.stepGoal,
      state.waterConsumed,
      goal,
      waterUnit
    ).catch((error) => {
      console.warn('Failed to update foreground notification:', error);
    });
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

      // Update foreground notification immediately when water is added
      // This ensures the notification reflects the new water amount instantly
      const state = get();
      const waterUnit = state.settings.unit === 'imperial' ? 'oz' : 'ml';
      ForegroundServiceManager.triggerUpdate(
        state.currentSteps,
        state.stepGoal,
        newConsumed,
        state.waterGoal,
        waterUnit
      ).catch((error) => {
        // Log error but don't block - notification update is non-critical
        console.warn('Failed to update foreground notification:', error);
      });

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

    // Update foreground notification immediately when water is deleted
    // This ensures the notification reflects the updated water amount instantly
    const state = get();
    const waterUnit = state.settings.unit === 'imperial' ? 'oz' : 'ml';
    ForegroundServiceManager.triggerUpdate(
      state.currentSteps,
      state.stepGoal,
      newConsumed,
      state.waterGoal,
      waterUnit
    ).catch((error) => {
      // Log error but don't block - notification update is non-critical
      console.warn('Failed to update foreground notification:', error);
    });

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
    
    // Keep the highest value between stored and in-memory steps so we NEVER go backwards to 0
    const inMemorySteps = get().currentSteps || 0;
    const storedSteps = summary?.steps ?? 0;
    const stepsToUse = Math.max(storedSteps, inMemorySteps);

    // Do the same for water: prefer the higher of logs vs. in-memory
    const inMemoryWater = get().waterConsumed || 0;
    const waterToUse = Math.max(totalWaterFromLogs, inMemoryWater);

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

  setSettings: (newSettings: Partial<AppSettings>) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
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


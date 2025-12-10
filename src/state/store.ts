import { create } from 'zustand';
import { generateUUIDSecure } from '../utils/uuid';
import { DaySummary, WaterLogItem, UserGoals, Reminder, AppSettings, PedometerResult } from '../types';
import { StorageService } from '../services/storage';
import { getTodayDateString } from '../utils/formatting';

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
  },

  setWaterGoal: (goal: number) => {
    set({ waterGoal: goal });
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
    const totalWater = logs.reduce((sum, log) => sum + log.amountMl, 0);
    
    // Always load steps from storage first - this ensures persistence across app reloads
    // The pedometer will update this value once it has a valid reading
    const storedSteps = summary?.steps || 0;
    
    // Use stored steps - they represent the actual steps taken today
    // The pedometer will only update if it has a higher value (meaning user took more steps)
    const stepsToUse = storedSteps;

    set({
      todaySummary: summary || {
        date: today,
        steps: stepsToUse,
        waterMl: 0,
      },
      waterConsumed: totalWater,
      waterLogs: logs,
      currentSteps: stepsToUse,
    });
    
    console.log('📊 Loaded today\'s data - steps:', stepsToUse);
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


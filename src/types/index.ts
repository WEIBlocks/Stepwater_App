export interface DaySummary {
  date: string; // YYYY-MM-DD
  steps: number;
  stepDistanceMeters?: number;
  calories?: number;
  waterMl: number;
  notes?: string;
}

export interface WaterLogItem {
  id: string; // uuid
  date: string; // YYYY-MM-DD
  time: string; // ISO time
  amountMl: number;
}

export interface UserGoals {
  dailySteps: number;
  dailyWaterMl: number;
}

export interface Reminder {
  id: string;
  time: string; // HH:mm format
  enabled: boolean;
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
}

export interface AppSettings {
  unit: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

export interface PedometerResult {
  steps: number;
  isAvailable: boolean;
}

export type Gender = 'male' | 'female' | 'other' | null;

export interface UserProfile {
  gender: Gender;
  height?: {
    feet?: number;
    inches?: number;
    centimeters?: number;
  };
  weight?: {
    pounds?: number;
    kilograms?: number;
  };
  hasCompletedProfile: boolean;
}


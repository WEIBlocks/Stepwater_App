import { UserGoals } from '../types';
import { colors } from './theme';

export const DEFAULT_GOALS: UserGoals = {
  dailySteps: 10000,
  dailyWaterMl: 2000,
};

export const WATER_PRESETS_ML = [100, 200, 250, 300, 500];

// Updated COLORS to use new theme
// Keeping backward compatibility with existing structure
export const COLORS = {
  primary: colors.primary,
  primaryDark: colors.primary, // Same as primary
  secondary: colors.water, // Water color for secondary actions
  accent: colors.accent, // Accent color from theme
  success: colors.success, // Success color from theme
  warning: colors.warning, // Warning color from theme
  error: colors.error,
  light: {
    background: colors.background,
    surface: colors.surface,
    text: colors.textPrimary,
    textSecondary: colors.textSecondary,
    border: colors.border,
  },
  dark: {
    background: colors.background,
    surface: colors.surface,
    text: colors.textPrimary,
    textSecondary: colors.textSecondary,
    border: colors.border,
  },
};

export const ACCENT_COLORS = [
  colors.primary, // indigo
  colors.water, // blue
  colors.steps, // green
  colors.warning, // amber/yellow
  colors.error, // red
];


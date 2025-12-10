/**
 * Global Design System Theme
 * 
 * This file contains the complete design system for the app.
 * All colors, typography, spacing, and design tokens must come from here.
 * DO NOT hardcode colors or styles in components - always use this theme.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary colors
  primary: '#6366F1', // Primary buttons, active tabs, highlights
  
  // Feature-specific accents
  steps: '#34D399',      // Steps / success accents (green)
  water: '#60A5FA',      // Water / hydration accents (blue)
  
  // Background colors
  background: '#111827',  // App background (soft dark-blue, not black)
  surface: '#1F2937',     // Surface / elevated background
  card: '#273449',        // Card / surface background
  
  // Text colors
  textPrimary: '#F9FAFB',   // Primary text
  textSecondary: '#CBD5E1', // Secondary text
  textMuted: '#9CA3AF',     // Muted text
  
  // UI elements
  border: '#374151',     // Borders / dividers
  
  // Status colors
  accent: '#FB7185',     // Accent color
  success: '#22C55E',    // Success states
  warning: '#FACC15',    // Warning states
  danger: '#F87171',     // Danger / error states
  error: '#F87171',      // Error states (alias for danger)
} as const;

// ============================================================================
// GRADIENTS
// ============================================================================

export const gradients = {
  stepsGradient: ['#34D399', '#059669'] as const,
  waterGradient: ['#60A5FA', '#2563EB'] as const,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font family (using system font)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes
  fontSize: {
    // Screen titles
    title: 28,
    titleSmall: 24,
    
    // Section headers
    sectionHeader: 20,
    sectionHeaderSmall: 18,
    
    // Main values (steps, water count)
    valueLarge: 40,
    valueMedium: 32,
    
    // Body text
    body: 16,
    bodySmall: 14,
    
    // Caption text
    caption: 13,
    captionSmall: 12,
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    title: 34,
    sectionHeader: 24,
    body: 22,
    caption: 18,
  },
} as const;

// ============================================================================
// SPACING SYSTEM (multiples of 4)
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  card: 16,
  button: 12,
  pill: 999, // For rounded pill tabs
  small: 8,
} as const;

// ============================================================================
// SHADOWS / ELEVATION
// ============================================================================

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, // Increased for dark surfaces
    shadowRadius: 8,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Increased for dark surfaces
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, // Increased for dark surfaces
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  // Spring animation configs
  spring: {
    default: {
      damping: 15,
      stiffness: 150,
    },
    fast: {
      damping: 12,
      stiffness: 200,
    },
    slow: {
      damping: 18,
      stiffness: 120,
    },
  },
  
  // Timing animation configs
  timing: {
    fast: 150,
    default: 250,
    slow: 400,
  },
} as const;

// ============================================================================
// COMPONENT-SPECIFIC STYLES
// ============================================================================

export const components = {
  // Card styles
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  
  // Button styles
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      ...shadows.button,
    },
    pill: {
      borderRadius: borderRadius.pill,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
  },
  
  // Tab styles
  tab: {
    active: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.pill,
    },
    inactive: {
      backgroundColor: colors.border + '30',
      borderRadius: borderRadius.pill,
    },
  },
} as const;

// ============================================================================
// THEME EXPORT
// ============================================================================

export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components,
} as const;

// Type exports for TypeScript
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Gradients = typeof gradients;
export type Typography = typeof typography;
export type Spacing = typeof spacing;

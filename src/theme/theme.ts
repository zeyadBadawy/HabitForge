/**
 * CONCEPT: Theme system — centralises all design tokens in one place.
 * Every colour, spacing value, and typography style is defined here.
 * Components import from here instead of hard-coding values, so you
 * can reskin the entire app by changing this one file.
 *
 * WHY: Prevents the "hex value soup" problem where #3B82F6 appears
 * 40 times across the codebase and changing the brand colour requires
 * a global find-replace.
 *
 * GOTCHA: React Native does not cascade styles the way CSS does,
 * so every component must explicitly pull what it needs from the theme.
 */

export const palette = {
  // Brand
  primary: "#6C63FF",       // violet — main accent
  primaryLight: "#8B85FF",
  primaryDark: "#4B44CC",

  // Semantic
  success: "#22C55E",       // green — completed state
  warning: "#F59E0B",       // amber — streak freeze
  danger: "#EF4444",        // red — delete / destructive
  info: "#3B82F6",          // blue — informational

  // Intensity scale for heatmap cells (light mode)
  intensity0: "#E5E7EB",   // no completion — gray
  intensity1: "#BBF7D0",   // partial — light green
  intensity2: "#4ADE80",   // completed — medium green
  intensity3: "#16A34A",   // exceeded — strong green
  intensity4: "#14532D",   // perfect — darkest green

  // Neutrals
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  black: "#000000",
} as const

export const lightTheme = {
  // Surface colours
  background: palette.gray50,
  surface: palette.white,
  surfaceElevated: palette.white,

  // Text colours
  textPrimary: palette.gray900,
  textSecondary: palette.gray500,
  textDisabled: palette.gray300,
  textOnPrimary: palette.white,

  // Border
  border: palette.gray200,
  borderFocused: palette.primary,

  // Brand
  primary: palette.primary,
  primaryLight: palette.primaryLight,
  primaryDark: palette.primaryDark,

  // Semantic
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,

  // Heatmap intensities
  intensity0: palette.intensity0,
  intensity1: palette.intensity1,
  intensity2: palette.intensity2,
  intensity3: palette.intensity3,
  intensity4: palette.intensity4,

  // Tab bar
  tabBarBackground: palette.white,
  tabBarActive: palette.primary,
  tabBarInactive: palette.gray400,
} as const

/**
 * Explicit Theme interface with string-typed properties.
 *
 * WHY NOT `typeof lightTheme`:
 * `typeof lightTheme` infers each property as a *literal* type (e.g.
 * `background: "#F9FAFB"`). That means darkTheme, which assigns different
 * hex values, would fail the type check — TypeScript would complain that
 * `"#0F172A"` is not assignable to `"#F9FAFB"`.
 *
 * By declaring Theme as an interface with `string` properties, both themes
 * satisfy the same contract without being locked to the light palette values.
 */
export interface Theme {
  // Surfaces
  background: string
  surface: string
  surfaceElevated: string

  // Text
  textPrimary: string
  textSecondary: string
  textDisabled: string
  textOnPrimary: string

  // Borders
  border: string
  borderFocused: string

  // Brand
  primary: string
  primaryLight: string
  primaryDark: string

  // Semantic
  success: string
  warning: string
  danger: string

  // Heatmap intensity scale
  intensity0: string
  intensity1: string
  intensity2: string
  intensity3: string
  intensity4: string

  // Tab bar
  tabBarBackground: string
  tabBarActive: string
  tabBarInactive: string
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Font weights — React Native uses string literals
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const

export const shadows = {
  sm: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
  },
  md: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
} as const

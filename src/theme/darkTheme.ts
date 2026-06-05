/**
 * CONCEPT: Dark theme — same shape as lightTheme but different values.
 * React Native's useColorScheme() tells you if the OS is in dark mode.
 * By providing both themes with identical keys, components can use either
 * without any conditional logic — they just call useTheme() and get the
 * right colours automatically.
 *
 * WHY THIS SHAPE: TypeScript ensures both themes satisfy the same `Theme`
 * type, so you get a compile error if you add a token to one but not the other.
 */

import type { Theme } from "./theme"
import { palette } from "./theme"

// Dark mode intensity scale — same semantic meaning, different colours
// (inverted green scale against a dark background)
const darkIntensities = {
  intensity0: "#1F2937",   // no completion — dark gray
  intensity1: "#064E3B",   // partial — darkest green
  intensity2: "#065F46",   // completed — medium green
  intensity3: "#047857",   // exceeded — stronger green
  intensity4: "#059669",   // perfect — brightest green on dark bg
} as const

export const darkTheme: Theme = {
  background: "#0F172A",          // slate-900
  surface: "#1E293B",             // slate-800
  surfaceElevated: "#334155",     // slate-700

  textPrimary: "#F8FAFC",         // near-white
  textSecondary: "#94A3B8",       // slate-400
  textDisabled: "#475569",        // slate-600
  textOnPrimary: palette.white,

  border: "#334155",              // slate-700
  borderFocused: palette.primaryLight,

  primary: palette.primaryLight,  // slightly lighter violet on dark bg
  primaryLight: "#A5B4FC",
  primaryDark: palette.primary,

  success: "#4ADE80",             // brighter green on dark
  warning: "#FCD34D",
  danger: "#F87171",

  ...darkIntensities,

  tabBarBackground: "#1E293B",
  tabBarActive: palette.primaryLight,
  tabBarInactive: "#64748B",
}

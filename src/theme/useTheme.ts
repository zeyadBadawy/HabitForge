/**
 * CONCEPT: Custom hook for theme access — single source of truth for which
 * theme is currently active.
 *
 * Priority chain:
 *   1. User preference (from useSettingsStore) — "light" or "dark"
 *   2. OS setting (useColorScheme) — when preference is "auto"
 *   3. Light fallback — when OS preference is null/unknown
 *
 * WHY A HOOK: All theme logic lives here. If we change the priority chain
 * (e.g. add a per-habit accent theme), only this file changes — every
 * component that calls useTheme() gets the new logic for free.
 *
 * USAGE:
 *   const theme = useTheme()
 *   <View style={{ backgroundColor: theme.background }} />
 */

import { useColorScheme } from "react-native"
import { lightTheme, type Theme } from "./theme"
import { darkTheme } from "./darkTheme"
import { useSettingsStore } from "../features/settings/store/useSettingsStore"

export const useTheme = (): Theme => {
  const osScheme  = useColorScheme()
  const themeMode = useSettingsStore((s) => s.themeMode)

  // Resolve effective color scheme:
  //   "auto"  → use OS preference (fallback to light if null)
  //   "light" → always light
  //   "dark"  → always dark
  const effectiveScheme =
    themeMode === "auto" ? osScheme ?? "light" : themeMode

  return effectiveScheme === "dark" ? darkTheme : lightTheme
}

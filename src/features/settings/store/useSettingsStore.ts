/**
 * CONCEPT: Secondary Zustand store — stores user preferences separately
 * from habit data. Keeping them in separate stores means a preferences
 * change (e.g. dark mode toggle) doesn't cause the habit list to re-render.
 *
 * WHY SEPARATE STORE: Zustand is "subscription by selector" — components
 * subscribe to exactly what they need. A component reading `habits` won't
 * re-render when `themeMode` changes, because they're in different stores.
 *
 * MMKV PERSISTENCE: Same adapter pattern as useHabitStore. The preference
 * key is different so MMKV keeps the two stores' data separate.
 *
 * THEME OVERRIDE:
 *   "auto"  → follow the OS dark/light setting (default)
 *   "light" → always light mode regardless of OS
 *   "dark"  → always dark mode regardless of OS
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { createMMKV } from "react-native-mmkv"

// ─────────────────────────────────────────────────────────────────
// MMKV ADAPTER (settings-specific key)
// ─────────────────────────────────────────────────────────────────

const mmkv = createMMKV({ id: "settings-store" })

const mmkvStorageAdapter = {
  setItem: (key: string, value: string): void => {
    mmkv.set(key, value)
  },
  getItem: (key: string): string | null => {
    return mmkv.getString(key) ?? null
  },
  removeItem: (key: string): void => {
    mmkv.remove(key)
  },
}

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

/** Possible theme modes. "auto" defers to the operating system. */
export type ThemeMode = "auto" | "light" | "dark"

interface ISettingsStore {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void

  /** Whether the seed data has been loaded on first launch */
  seeded: boolean
  markSeeded: () => void
}

// ─────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────

export const useSettingsStore = create<ISettingsStore>()(
  persist(
    (set) => ({
      // ── STATE ──────────────────────────────────────────────────
      themeMode: "auto",   // default: follow OS
      seeded: false,       // false until seed data is loaded once

      // ── ACTIONS ────────────────────────────────────────────────
      setThemeMode: (mode) => set({ themeMode: mode }),
      markSeeded: () => set({ seeded: true }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => mmkvStorageAdapter),
    }
  )
)

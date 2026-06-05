/**
 * CONCEPT: Zustand store — global state without Redux boilerplate.
 * All habit data lives here. Components read from this store via hooks
 * and call actions to mutate it. Zustand's persist middleware
 * automatically saves every state change to MMKV storage on the device.
 *
 * WHY ZUSTAND OVER CONTEXT: React Context re-renders every consumer when
 * any value changes. Zustand uses selector-based subscriptions — a component
 * subscribed to `habits` only re-renders when `habits` changes, not when
 * `completions` or `milestones` change.
 *
 * WHY MMKV OVER ASYNCSTORAGE: MMKV reads are synchronous (no await needed).
 * The store hydrates instantly on startup — no loading flash.
 *
 * ARCHITECTURE:
 *   State    = plain data (habits, completions, milestones)
 *   Actions  = functions that call `set()` to produce new state immutably
 *   Selectors = functions that call `get()` to derive computed values
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { createMMKV } from "react-native-mmkv"
import type { IHabit, ICompletion, IMilestone } from "../types"
import { calculateStreak } from "../utils/streakCalculator"
import { checkForNewMilestone } from "../utils/milestoneChecker"
import { getTodayDateString } from "../../../shared/utils/dateUtils"

// ─────────────────────────────────────────────────────────────────
// MMKV STORAGE ADAPTER
// Zustand's persist middleware expects a storage with setItem/getItem/removeItem.
// MMKV provides synchronous equivalents — we wrap them to match the interface.
// ─────────────────────────────────────────────────────────────────

const mmkv = createMMKV({ id: "habit-store" })

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
// STORE INTERFACE
// TypeScript requires us to define the shape of everything in the store.
// ─────────────────────────────────────────────────────────────────

interface IHabitStore {
  // ─── STATE ────────────────────────────────────────────────────
  habits: IHabit[]
  completions: ICompletion[]
  milestones: IMilestone[]
  pendingCelebration: IMilestone | null // milestone waiting to animate

  // ─── HABIT ACTIONS ────────────────────────────────────────────
  addHabit: (habit: Omit<IHabit, "id" | "createdAt" | "isArchived" | "streakFreezeAvailable">) => void
  updateHabit: (id: string, updates: Partial<IHabit>) => void
  archiveHabit: (id: string) => void
  deleteHabit: (id: string) => void

  // ─── COMPLETION ACTIONS ───────────────────────────────────────
  checkIn: (habitId: string) => void
  undoCheckIn: (habitId: string) => void
  useStreakFreeze: (habitId: string) => void

  // ─── MILESTONE ACTIONS ────────────────────────────────────────
  celebrateMilestone: (milestoneId: string) => void

  // ─── SELECTORS (derived data) ─────────────────────────────────
  // Functions instead of computed properties because Zustand re-runs
  // them on demand; components memoize the results with useMemo.
  getHabitById: (id: string) => IHabit | undefined
  getTodayCompletions: () => ICompletion[]
  getCompletionsForHabit: (habitId: string) => ICompletion[]
  isCompletedToday: (habitId: string) => boolean
}

// ─────────────────────────────────────────────────────────────────
// STORE CREATION
// ─────────────────────────────────────────────────────────────────

export const useHabitStore = create<IHabitStore>()(
  persist(
    (set, get) => ({
      // ─── INITIAL STATE ─────────────────────────────────────────
      habits: [],
      completions: [],
      milestones: [],
      pendingCelebration: null,

      // ─── HABIT ACTIONS ─────────────────────────────────────────

      addHabit: (habitData) => {
        set((state) => ({
          habits: [
            ...state.habits,
            {
              ...habitData,
              id: generateId(),
              createdAt: new Date().toISOString(),
              isArchived: false,
              streakFreezeAvailable: true,
            },
          ],
        }))
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }))
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, isArchived: true } : h
          ),
        }))
      },

      deleteHabit: (id) => {
        // Cascading delete — remove the habit AND all related data
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.filter((c) => c.habitId !== id),
          milestones: state.milestones.filter((m) => m.habitId !== id),
        }))
      },

      // ─── COMPLETION ACTIONS ────────────────────────────────────

      checkIn: (habitId) => {
        const state = get()
        const today = getTodayDateString()

        // Prevent duplicate check-ins on the same calendar day
        const alreadyDoneToday = state.completions.some(
          (c) => c.habitId === habitId && c.completedAt.startsWith(today)
        )
        if (alreadyDoneToday) return

        const newCompletion: ICompletion = {
          id: generateId(),
          habitId,
          completedAt: new Date().toISOString(),
        }

        set((prevState) => ({
          completions: [...prevState.completions, newCompletion],
        }))

        // After updating completions, recalculate streak and check milestones.
        // We call get() again here to read the updated completions list.
        const updatedState = get()
        const habit = updatedState.habits.find((h) => h.id === habitId)
        if (!habit) return

        const streak = calculateStreak(habit, updatedState.completions)
        const newMilestone = checkForNewMilestone(streak, updatedState.milestones)

        if (newMilestone) {
          set((prevState) => ({
            milestones: [...prevState.milestones, newMilestone],
            pendingCelebration: newMilestone,
          }))
        }
      },

      undoCheckIn: (habitId) => {
        const today = getTodayDateString()
        set((state) => ({
          completions: state.completions.filter(
            (c) => !(c.habitId === habitId && c.completedAt.startsWith(today))
          ),
        }))
      },

      useStreakFreeze: (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, streakFreezeAvailable: false } : h
          ),
        }))
      },

      // ─── MILESTONE ACTIONS ─────────────────────────────────────

      celebrateMilestone: (milestoneId) => {
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId ? { ...m, celebrated: true } : m
          ),
          pendingCelebration: null,
        }))
      },

      // ─── SELECTORS ─────────────────────────────────────────────

      getHabitById: (id) => get().habits.find((h) => h.id === id),

      getTodayCompletions: () => {
        const today = getTodayDateString()
        return get().completions.filter((c) => c.completedAt.startsWith(today))
      },

      getCompletionsForHabit: (habitId) =>
        get().completions.filter((c) => c.habitId === habitId),

      isCompletedToday: (habitId) => {
        const today = getTodayDateString()
        return get().completions.some(
          (c) => c.habitId === habitId && c.completedAt.startsWith(today)
        )
      },
    }),
    {
      name: "habit-store", // MMKV key
      storage: createJSONStorage(() => mmkvStorageAdapter),
    }
  )
)

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

/** Generates a unique ID using timestamp + random suffix. */
const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

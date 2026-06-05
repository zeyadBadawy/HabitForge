/**
 * CONCEPT: Custom hook — encapsulates a derived-data computation so that
 * any component can get the streak for a habit with a single line.
 *
 * WHY A HOOK INSTEAD OF INLINE COMPUTATION:
 * Multiple screens (HomeScreen, HabitDetailScreen) need the streak for
 * a habit. Without this hook every screen would duplicate the
 * "filter completions → calculateStreak" pattern. The hook is the
 * single source of truth for that derivation.
 *
 * SUBSCRIPTION STRATEGY:
 * We subscribe to `completions` (the raw array) rather than calling the
 * store selector `getCompletionsForHabit` directly. Selector functions
 * return new array references on every call, which would cause the hook
 * to re-render on every store mutation even if this habit's completions
 * didn't change. Subscribing to the whole array and filtering with useMemo
 * lets React bail out via referential equality on the `completions` array
 * itself (Zustand only changes this reference when a completion is added
 * or removed).
 */

import { useMemo } from "react"
import { useHabitStore } from "../store/useHabitStore"
import { calculateStreak } from "../utils/streakCalculator"
import type { IStreak } from "../types"

/**
 * Returns the computed streak for a single habit.
 * Re-computes whenever the habit definition or any completion changes.
 *
 * @param habitId  The id of the habit whose streak you want
 */
export const useStreak = (habitId: string): IStreak => {
  // Subscribe to the slice we actually need; Zustand won't re-render this
  // hook unless these two values change reference.
  const habit     = useHabitStore((s) => s.habits.find((h) => h.id === habitId))
  const completions = useHabitStore((s) => s.completions)

  return useMemo(() => {
    if (!habit) {
      // Habit deleted mid-render — return a safe zero-value streak
      return { habitId, current: 0, longest: 0, lastCompletedDate: null }
    }
    // Filter to this habit's completions inside useMemo, not in the selector,
    // so we don't create a new array on every Zustand read.
    const habitCompletions = completions.filter((c) => c.habitId === habitId)
    return calculateStreak(habit, habitCompletions)
  }, [habit, completions, habitId])
}

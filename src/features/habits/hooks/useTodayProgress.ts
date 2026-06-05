/**
 * CONCEPT: Derived state hook — combines two store slices into a single
 * composite value that the HomeScreen header uses.
 *
 * WHY NOT INLINE IN HOMESCREEN:
 * The "X of Y habits done today" logic is self-contained enough to deserve
 * its own hook. This makes HomeScreen easier to read, and makes the
 * calculation independently testable if needed.
 *
 * PERFORMANCE: useMemo re-runs only when `habits` or `completions` change
 * (i.e. when the user adds a habit or checks in). It does not re-run on
 * every render of HomeScreen.
 */

import { useMemo } from "react"
import { useHabitStore } from "../store/useHabitStore"
import { getTodayDateString } from "../../../shared/utils/dateUtils"

export interface TodayProgress {
  completed: number    // habits completed today
  total: number        // total active (non-archived) habits
  percentage: number   // 0–1, safe to pass directly to ProgressBar
}

/** Returns the overall completion progress across all active habits for today. */
export const useTodayProgress = (): TodayProgress => {
  const habits      = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)

  return useMemo(() => {
    const activeHabits = habits.filter((h) => !h.isArchived)
    const today = getTodayDateString()

    const completed = activeHabits.filter((h) =>
      completions.some(
        (c) => c.habitId === h.id && c.completedAt.startsWith(today)
      )
    ).length

    const total = activeHabits.length
    const percentage = total > 0 ? completed / total : 0

    return { completed, total, percentage }
  }, [habits, completions])
}

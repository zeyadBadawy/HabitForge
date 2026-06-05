/**
 * CONCEPT: useMemo for expensive data transformation.
 * The heatmap transform (buildHeatmapData) iterates over every completion
 * and builds a 2-D grid. For a user with months of history that could be
 * thousands of records. We memoize so it only re-runs when completions
 * actually change — not on every render.
 *
 * Same subscription strategy as useStreak: subscribe to the raw
 * `completions` array and filter inside useMemo to avoid creating
 * new array references in the Zustand selector.
 */

import { useMemo } from "react"
import { useHabitStore } from "../store/useHabitStore"
import { buildHeatmapData } from "../utils/heatmapTransformer"
import type { IHeatmapCell } from "../types"

/**
 * Returns a 2-D grid of heatmap cells for the given habit.
 *
 * @param habitId  The habit whose completion history to visualise
 * @param weeks    How many weeks to show (default 12 = ~3 months)
 */
export const useHeatmap = (
  habitId: string,
  weeks: number = 12
): IHeatmapCell[][] => {
  const allCompletions = useHabitStore((s) => s.completions)

  return useMemo(() => {
    const habitCompletions = allCompletions.filter(
      (c) => c.habitId === habitId
    )
    return buildHeatmapData(habitCompletions, weeks)
  }, [allCompletions, habitId, weeks])
}

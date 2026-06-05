/**
 * CONCEPT: Data transformation — converts raw completions (flat array)
 * into a structured 2D grid the HeatmapGrid component can render directly.
 * This separation keeps the UI layer free of date arithmetic.
 *
 * WHY A SEPARATE MODULE: The HeatmapGrid component should only know how
 * to render IHeatmapCell arrays — it should not know how to build them.
 * If the grid layout changes (rows vs columns, day-of-week ordering),
 * only this file needs updating.
 *
 * OUTPUT SHAPE:
 *   grid[weekIndex][dayIndex]   — weekIndex 0 = oldest week
 *   Each week is 7 cells, Mon–Sun (index 0–6)
 *   grid[0][0] = oldest day shown, grid[weeks-1][6] = today (or near today)
 */

import type { ICompletion, IHeatmapCell, HeatmapIntensity } from "../types"
import { getLocalDateString } from "../../../shared/utils/dateUtils"

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

/**
 * Transforms completions into a grid of heatmap cells.
 * @param completions all completions for ONE habit
 * @param weeks how many weeks to include (default 12 = ~3 months)
 * @returns 2D array: grid[weekIndex][dayIndex], oldest → newest
 */
export const buildHeatmapData = (
  completions: ICompletion[],
  weeks: number = 12
): IHeatmapCell[][] => {
  const today = new Date()

  // Start date: offset so that the LAST cell lands on today.
  // The grid has (weeks * 7) cells indexed 0..(weeks*7-1).
  // Last cell index = weeks*7 - 1, so: startDate + (weeks*7 - 1) = today
  // → startDate = today - (weeks*7 - 1)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeks * 7 - 1))

  // Build a Map<"YYYY-MM-DD", count> for O(1) lookup per cell
  const completionMap = buildCompletionMap(completions)

  // Build the grid — week columns, day rows
  const grid: IHeatmapCell[][] = []

  for (let week = 0; week < weeks; week++) {
    const weekCells: IHeatmapCell[] = []

    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(startDate)
      cellDate.setDate(startDate.getDate() + week * 7 + day)

      const dateString = getLocalDateString(cellDate)
      const count = completionMap.get(dateString) ?? 0

      weekCells.push({
        date: dateString,
        completionCount: count,
        intensity: countToIntensity(count),
      })
    }

    grid.push(weekCells)
  }

  return grid
}

/**
 * Flattens the 2D grid into a 1D array for cases where you need
 * all cells in chronological order (e.g. for accessibility labels).
 */
export const flattenHeatmapGrid = (grid: IHeatmapCell[][]): IHeatmapCell[] => {
  return grid.flat()
}

/**
 * Returns the label for a given intensity level (for accessibility).
 */
export const intensityLabel = (intensity: HeatmapIntensity): string => {
  switch (intensity) {
    case 0: return "No completion"
    case 1: return "Partial"
    case 2: return "Completed"
    case 3: return "Exceeded"
    case 4: return "Perfect"
  }
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Builds a Map of "YYYY-MM-DD" → completion count from a flat array.
 * O(n) construction, O(1) lookup during grid build.
 */
export const buildCompletionMap = (completions: ICompletion[]): Map<string, number> => {
  const map = new Map<string, number>()

  for (const completion of completions) {
    const date = completion.completedAt.split("T")[0]
    map.set(date, (map.get(date) ?? 0) + 1)
  }

  return map
}

/**
 * Maps completion count → intensity level (0–4 scale).
 * 0 completions = intensity 0 (no activity)
 * 1 completion  = intensity 2 (completed — skips 1 to match GitHub style)
 * 2 completions = intensity 3 (exceeded)
 * 3+ completions = intensity 4 (max)
 *
 * Intensity 1 (light) is reserved for "partial" (future: half-done tasks).
 * Currently unused in the check-in flow (you're either done or not).
 */
export const countToIntensity = (count: number): HeatmapIntensity => {
  if (count === 0) return 0
  if (count === 1) return 2
  if (count === 2) return 3
  return 4
}

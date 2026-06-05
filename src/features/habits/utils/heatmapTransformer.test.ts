/**
 * Tests for heatmapTransformer.ts
 * Run: npm test -- heatmapTransformer
 */

import {
  buildHeatmapData,
  buildCompletionMap,
  countToIntensity,
  flattenHeatmapGrid,
  intensityLabel,
} from "./heatmapTransformer"
import type { ICompletion } from "../types"
import { getTodayDateString, getDateString } from "../../../shared/utils/dateUtils"

const makeCompletion = (date: string, id = date): ICompletion => ({
  id,
  habitId: "habit-1",
  completedAt: `${date}T12:00:00.000Z`,
})

describe("buildCompletionMap", () => {
  it("returns an empty map for no completions", () => {
    expect(buildCompletionMap([])).toEqual(new Map())
  })

  it("maps each date to its count", () => {
    const completions = [makeCompletion(getTodayDateString())]
    const map = buildCompletionMap(completions)
    expect(map.get(getTodayDateString())).toBe(1)
  })

  it("accumulates multiple completions on the same day", () => {
    const today = getTodayDateString()
    const completions = [
      { ...makeCompletion(today), id: "c1", completedAt: `${today}T08:00:00Z` },
      { ...makeCompletion(today), id: "c2", completedAt: `${today}T20:00:00Z` },
    ]
    const map = buildCompletionMap(completions)
    expect(map.get(today)).toBe(2)
  })

  it("keeps different dates separate", () => {
    const today = getTodayDateString()
    const yesterday = getDateString(-1)
    const completions = [makeCompletion(today), makeCompletion(yesterday)]
    const map = buildCompletionMap(completions)
    expect(map.get(today)).toBe(1)
    expect(map.get(yesterday)).toBe(1)
  })
})

describe("countToIntensity", () => {
  it("returns 0 for no completions", () => {
    expect(countToIntensity(0)).toBe(0)
  })

  it("returns 2 for exactly 1 completion", () => {
    expect(countToIntensity(1)).toBe(2)
  })

  it("returns 3 for 2 completions", () => {
    expect(countToIntensity(2)).toBe(3)
  })

  it("returns 4 for 3+ completions", () => {
    expect(countToIntensity(3)).toBe(4)
    expect(countToIntensity(10)).toBe(4)
  })
})

describe("buildHeatmapData", () => {
  it("returns the correct number of weeks", () => {
    const grid = buildHeatmapData([], 12)
    expect(grid).toHaveLength(12)
  })

  it("returns 7 cells per week", () => {
    const grid = buildHeatmapData([], 4)
    grid.forEach(week => {
      expect(week).toHaveLength(7)
    })
  })

  it("uses intensity 0 for days with no completions", () => {
    const grid = buildHeatmapData([], 4)
    grid.forEach(week => {
      week.forEach(cell => {
        expect(cell.intensity).toBe(0)
        expect(cell.completionCount).toBe(0)
      })
    })
  })

  it("sets correct intensity for a day with a completion", () => {
    const today = getTodayDateString()
    const completions = [makeCompletion(today)]
    const grid = buildHeatmapData(completions, 12)

    const flat = grid.flat()
    const todayCell = flat.find(cell => cell.date === today)

    expect(todayCell).toBeDefined()
    expect(todayCell!.completionCount).toBe(1)
    expect(todayCell!.intensity).toBe(2)
  })

  it("sets intensity 3 for a day with 2 completions", () => {
    const today = getTodayDateString()
    const completions = [
      { ...makeCompletion(today), id: "c1", completedAt: `${today}T08:00:00Z` },
      { ...makeCompletion(today), id: "c2", completedAt: `${today}T20:00:00Z` },
    ]
    const grid = buildHeatmapData(completions, 12)
    const flat = grid.flat()
    const todayCell = flat.find(cell => cell.date === today)

    expect(todayCell!.intensity).toBe(3)
  })

  it("orders grid from oldest to newest (grid[0] is oldest)", () => {
    const grid = buildHeatmapData([], 12)
    const firstCell = grid[0][0]
    const lastCell = grid[grid.length - 1][6]
    // First cell should be older than last cell
    expect(firstCell.date < lastCell.date).toBe(true)
  })

  it("all cell dates are valid YYYY-MM-DD strings", () => {
    const grid = buildHeatmapData([], 4)
    grid.flat().forEach(cell => {
      expect(cell.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it("uses custom week count when provided", () => {
    const grid = buildHeatmapData([], 24)
    expect(grid).toHaveLength(24)
  })
})

describe("flattenHeatmapGrid", () => {
  it("flattens a 2D grid into a 1D array", () => {
    const grid = buildHeatmapData([], 4)
    const flat = flattenHeatmapGrid(grid)
    expect(flat).toHaveLength(4 * 7)
  })
})

describe("intensityLabel", () => {
  it("returns correct labels for each intensity", () => {
    expect(intensityLabel(0)).toBe("No completion")
    expect(intensityLabel(1)).toBe("Partial")
    expect(intensityLabel(2)).toBe("Completed")
    expect(intensityLabel(3)).toBe("Exceeded")
    expect(intensityLabel(4)).toBe("Perfect")
  })
})

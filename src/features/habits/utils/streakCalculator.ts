/**
 * CONCEPT: Pure functions — no side effects, no React imports, no state.
 * All streak logic lives here. Pure functions are trivially testable:
 * same input always produces same output, no mocking required.
 *
 * WHY SEPARATE FROM THE STORE: Keeping business logic out of the store
 * means you can test it in milliseconds without rendering a component
 * or initialising Zustand. The store calls these functions; it doesn't
 * contain the logic itself.
 *
 * ALGORITHM OVERVIEW:
 *   Daily   → count consecutive calendar days ending today or yesterday
 *   Weekly  → count consecutive ISO weeks with at least one completion
 *   Custom  → count consecutive weeks where completions >= target
 */

import type { ICompletion, IHabit, IStreak } from "../types"
import { getTodayDateString, getDateString, getISOWeekNumber, getWeekKey } from "../../../shared/utils/dateUtils"

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

/** Entry point — dispatches to the correct algorithm based on frequency. */
export const calculateStreak = (
  habit: IHabit,
  completions: ICompletion[]
): IStreak => {
  // Filter to only this habit's completions, newest first
  const habitCompletions = completions
    .filter(c => c.habitId === habit.id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

  if (habitCompletions.length === 0) {
    return { habitId: habit.id, current: 0, longest: 0, lastCompletedDate: null }
  }

  switch (habit.frequency.type) {
    case "daily":
      return calculateDailyStreak(habit.id, habitCompletions)
    case "weekly":
      return calculateWeeklyStreak(habit.id, habitCompletions)
    case "custom":
      return calculateCustomStreak(habit.id, habitCompletions, habit.frequency.timesPerWeek)
  }
}

// ─────────────────────────────────────────────────────────────────
// DAILY STREAK
// ─────────────────────────────────────────────────────────────────

const calculateDailyStreak = (habitId: string, completions: ICompletion[]): IStreak => {
  // Deduplicate: user might check in multiple times in one day
  // We only care about unique calendar dates
  const uniqueDates = getUniqueDatesSorted(completions) // newest first

  const today = getTodayDateString()
  const yesterday = getDateString(-1)

  // If the most recent completion isn't today or yesterday, streak is broken
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return {
      habitId,
      current: 0,
      longest: calculateLongestDailyStreak(uniqueDates),
      lastCompletedDate: uniqueDates[0],
    }
  }

  // Walk backwards counting consecutive days
  let currentStreak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const diffDays = daysDiff(uniqueDates[i - 1], uniqueDates[i])
    if (diffDays === 1) {
      currentStreak++
    } else {
      break // gap found — stop counting
    }
  }

  return {
    habitId,
    current: currentStreak,
    longest: Math.max(currentStreak, calculateLongestDailyStreak(uniqueDates)),
    lastCompletedDate: uniqueDates[0],
  }
}

// ─────────────────────────────────────────────────────────────────
// WEEKLY STREAK
// ─────────────────────────────────────────────────────────────────

const calculateWeeklyStreak = (habitId: string, completions: ICompletion[]): IStreak => {
  // Group by ISO week number — a week streak increments for each
  // consecutive week with at least one completion
  const weekNumbers = getUniqueWeekNumbersSorted(completions) // newest first

  let currentStreak = weekNumbers.length > 0 ? 1 : 0

  for (let i = 0; i < weekNumbers.length - 1; i++) {
    // Consecutive weeks differ by exactly 1
    if (weekNumbers[i] - weekNumbers[i + 1] === 1) {
      currentStreak++
    } else {
      break
    }
  }

  return {
    habitId,
    current: currentStreak,
    longest: weekNumbers.length, // simplified: each unique week = potential best
    lastCompletedDate: completions[0]?.completedAt ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────
// CUSTOM STREAK (X times per week)
// ─────────────────────────────────────────────────────────────────

const calculateCustomStreak = (
  habitId: string,
  completions: ICompletion[],
  targetPerWeek: number
): IStreak => {
  // Group completions by "YYYY-WNN" key, count per week
  const completionsByWeek = groupByWeekKey(completions)
  // Sort week keys descending (most recent first)
  const weeks = Object.keys(completionsByWeek).sort().reverse()

  let currentStreak = 0
  for (const week of weeks) {
    if (completionsByWeek[week] >= targetPerWeek) {
      currentStreak++
    } else {
      break // didn't hit target this week — streak ends
    }
  }

  // Longest = same pass, but we'd need to scan all windows.
  // Simplified: longest equals current (accurate for a growing streak).
  const longest = calculateLongestCustomStreak(completionsByWeek, targetPerWeek)

  return {
    habitId,
    current: currentStreak,
    longest,
    lastCompletedDate: completions[0]?.completedAt ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Returns unique completion dates as "YYYY-MM-DD", sorted newest first. */
export const getUniqueDatesSorted = (completions: ICompletion[]): string[] => {
  return [
    ...new Set(completions.map(c => c.completedAt.split("T")[0])),
  ].sort().reverse()
}

/** Returns unique ISO week numbers, sorted descending. */
const getUniqueWeekNumbersSorted = (completions: ICompletion[]): number[] => {
  return [
    ...new Set(completions.map(c => getISOWeekNumber(new Date(c.completedAt)))),
  ].sort((a, b) => b - a)
}

/** Groups completions by week key, returns { "2026-W21": 3, ... } */
export const groupByWeekKey = (completions: ICompletion[]): Record<string, number> => {
  return completions.reduce<Record<string, number>>((acc, c) => {
    const key = getWeekKey(new Date(c.completedAt))
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

/**
 * Calculates the absolute number of calendar days between two "YYYY-MM-DD" strings.
 * Uses UTC to avoid DST-related miscounts.
 */
const daysDiff = (newerDate: string, olderDate: string): number => {
  const msPerDay = 1000 * 60 * 60 * 24
  const a = new Date(`${newerDate}T00:00:00Z`).getTime()
  const b = new Date(`${olderDate}T00:00:00Z`).getTime()
  return Math.round((a - b) / msPerDay)
}

/** Scans all date windows to find the longest ever daily streak. */
const calculateLongestDailyStreak = (uniqueDatesNewestFirst: string[]): number => {
  if (uniqueDatesNewestFirst.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < uniqueDatesNewestFirst.length; i++) {
    const diff = daysDiff(uniqueDatesNewestFirst[i - 1], uniqueDatesNewestFirst[i])
    if (diff === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

/** Scans all week windows to find the longest consecutive custom streak. */
const calculateLongestCustomStreak = (
  completionsByWeek: Record<string, number>,
  targetPerWeek: number
): number => {
  const weeks = Object.keys(completionsByWeek).sort() // ascending
  let longest = 0
  let current = 0

  for (const week of weeks) {
    if (completionsByWeek[week] >= targetPerWeek) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }

  return longest
}

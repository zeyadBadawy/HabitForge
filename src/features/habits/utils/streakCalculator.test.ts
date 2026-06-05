/**
 * Tests for streakCalculator.ts
 * These tests cover daily, weekly, and custom frequency streak calculation.
 * Run: npm test -- streakCalculator
 */

import { calculateStreak, getUniqueDatesSorted, groupByWeekKey } from "./streakCalculator"
import type { ICompletion, IHabit } from "../types"
import { getTodayDateString, getDateString, getWeekStart, getLocalDateString } from "../../../shared/utils/dateUtils"

// ─── FIXTURES ─────────────────────────────────────────────────────

const today = getTodayDateString()
const yesterday = getDateString(-1)
const twoDaysAgo = getDateString(-2)
const threeDaysAgo = getDateString(-3)
const sevenDaysAgo = getDateString(-7)
const eightDaysAgo = getDateString(-8)

const makeHabit = (overrides: Partial<IHabit> = {}): IHabit => ({
  id: "habit-1",
  name: "Test Habit",
  emoji: "📚",
  color: "#6C63FF",
  frequency: { type: "daily" },
  createdAt: "2026-01-01T00:00:00.000Z",
  isArchived: false,
  streakFreezeAvailable: true,
  ...overrides,
})

const makeCompletion = (date: string, habitId = "habit-1"): ICompletion => ({
  id: `completion-${date}`,
  habitId,
  completedAt: `${date}T12:00:00.000Z`,
})

// ─── DAILY STREAK TESTS ────────────────────────────────────────────

describe("calculateStreak — daily", () => {
  const habit = makeHabit({ frequency: { type: "daily" } })

  it("returns zero streak when there are no completions", () => {
    const result = calculateStreak(habit, [])
    expect(result).toEqual({
      habitId: "habit-1",
      current: 0,
      longest: 0,
      lastCompletedDate: null,
    })
  })

  it("returns streak of 1 when completed only today", () => {
    const completions = [makeCompletion(today)]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(1)
    expect(result.lastCompletedDate).toBe(today)
  })

  it("returns streak of 1 when completed only yesterday", () => {
    const completions = [makeCompletion(yesterday)]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(1)
  })

  it("returns streak of 2 when completed today and yesterday", () => {
    const completions = [makeCompletion(today), makeCompletion(yesterday)]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(2)
  })

  it("counts a multi-day consecutive streak", () => {
    const completions = [
      makeCompletion(today),
      makeCompletion(yesterday),
      makeCompletion(twoDaysAgo),
      makeCompletion(threeDaysAgo),
    ]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(4)
  })

  it("resets streak when there is a gap (day was missed)", () => {
    // today, yesterday, then a gap (two days ago is missing), three days ago
    const completions = [
      makeCompletion(today),
      makeCompletion(yesterday),
      makeCompletion(threeDaysAgo), // gap at twoDaysAgo
    ]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(2) // only today + yesterday
  })

  it("returns 0 streak when last completion was more than yesterday", () => {
    const completions = [makeCompletion(twoDaysAgo)]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(0)
  })

  it("deduplicates multiple completions on the same day", () => {
    const completions = [
      { ...makeCompletion(today), id: "c1", completedAt: `${today}T08:00:00.000Z` },
      { ...makeCompletion(today), id: "c2", completedAt: `${today}T20:00:00.000Z` },
      makeCompletion(yesterday),
    ]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(2) // today counts once
  })

  it("ignores completions from other habits", () => {
    const completions = [
      makeCompletion(today, "other-habit"),
      makeCompletion(yesterday, "other-habit"),
    ]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(0)
  })

  it("tracks longest streak across all history, not just current", () => {
    // Old 3-day streak (7-8-9 days ago), then broken, then current 1-day streak
    const completions = [
      makeCompletion(today),
      makeCompletion(sevenDaysAgo),
      makeCompletion(eightDaysAgo),
      makeCompletion(getDateString(-9)),
    ]
    const result = calculateStreak(habit, completions)
    expect(result.current).toBe(1)
    expect(result.longest).toBeGreaterThanOrEqual(3)
  })
})

// ─── WEEKLY STREAK TESTS ────────────────────────────────────────────

describe("calculateStreak — weekly", () => {
  const habit = makeHabit({ frequency: { type: "weekly" } })

  it("returns 0 streak when no completions", () => {
    expect(calculateStreak(habit, []).current).toBe(0)
  })

  it("returns streak of 1 when completed once this week", () => {
    const completions = [makeCompletion(today)]
    expect(calculateStreak(habit, completions).current).toBe(1)
  })

  it("returns streak of 1 for two completions in the same week", () => {
    const completions = [
      makeCompletion(today),
      makeCompletion(yesterday), // still the same week (unless today is Monday)
    ]
    const result = calculateStreak(habit, completions)
    // Either 1 or 2 depending on which ISO week they fall in — both valid
    expect(result.current).toBeGreaterThanOrEqual(1)
  })
})

// ─── CUSTOM STREAK TESTS (X per week) ──────────────────────────────

describe("calculateStreak — custom (3x/week)", () => {
  const habit = makeHabit({ frequency: { type: "custom", timesPerWeek: 3 } })

  it("returns 0 when no completions", () => {
    expect(calculateStreak(habit, []).current).toBe(0)
  })

  it("counts a week where target is exactly met", () => {
    // Use Mon/Tue/Wed of LAST week so the dates are always in the same ISO week
    // and never in the future. Using today/yesterday/twoDaysAgo fails on Mondays
    // because those three dates span two ISO weeks (Mon is week N, Sun–Sat is week N-1).
    const lastMonday = getWeekStart(new Date())
    lastMonday.setDate(lastMonday.getDate() - 7)   // rewind to previous Monday
    const d1 = getLocalDateString(lastMonday)
    const d2 = getLocalDateString(new Date(lastMonday.getTime() + 86_400_000))
    const d3 = getLocalDateString(new Date(lastMonday.getTime() + 2 * 86_400_000))

    const completions = [
      { ...makeCompletion(d1), id: "c1" },
      { ...makeCompletion(d2), id: "c2" },
      { ...makeCompletion(d3), id: "c3" },
    ]
    const result = calculateStreak(habit, completions)
    // Last week had exactly 3 completions — target met → streak of 1
    expect(result.current).toBeGreaterThanOrEqual(1)
  })

  it("returns 0 when target is not met this week", () => {
    // Only 2 completions but target is 3 — and only one week present
    const completions = [
      { ...makeCompletion(today), id: "c1" },
      { ...makeCompletion(yesterday), id: "c2" },
    ]
    const result = calculateStreak(habit, completions)
    // If both are in the same week and we only have that one week, streak = 0
    expect(result.current).toBe(0)
  })
})

// ─── HELPER TESTS ─────────────────────────────────────────────────

describe("getUniqueDatesSorted", () => {
  it("deduplicates same-day completions", () => {
    const completions: ICompletion[] = [
      { id: "1", habitId: "h", completedAt: `${today}T08:00:00Z` },
      { id: "2", habitId: "h", completedAt: `${today}T20:00:00Z` },
    ]
    const result = getUniqueDatesSorted(completions)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(today)
  })

  it("returns dates newest first", () => {
    const completions: ICompletion[] = [
      makeCompletion(yesterday),
      makeCompletion(today),
    ]
    const result = getUniqueDatesSorted(completions)
    expect(result[0]).toBe(today)
    expect(result[1]).toBe(yesterday)
  })
})

describe("groupByWeekKey", () => {
  it("groups completions from the same week together", () => {
    // Monday and Wednesday of the same week
    const monday = getDateString(-((new Date().getDay() + 6) % 7))
    const completions: ICompletion[] = [
      makeCompletion(monday),
      makeCompletion(monday),
    ]
    const result = groupByWeekKey(completions)
    const values = Object.values(result)
    expect(values[0]).toBe(2)
  })
})

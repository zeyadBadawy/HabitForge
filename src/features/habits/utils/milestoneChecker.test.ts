/**
 * Tests for milestoneChecker.ts
 * Run: npm test -- milestoneChecker
 */

import { checkForNewMilestone, findMissingMilestones, MILESTONE_THRESHOLDS } from "./milestoneChecker"
import type { IMilestone, IStreak } from "../types"

// ─── FIXTURES ─────────────────────────────────────────────────────

const makeStreak = (current: number, habitId = "habit-1"): IStreak => ({
  habitId,
  current,
  longest: current,
  lastCompletedDate: "2026-05-24",
})

const makeMilestone = (threshold: 7 | 30 | 100 | 365, habitId = "habit-1"): IMilestone => ({
  id: `m-${threshold}`,
  habitId,
  threshold,
  unlockedAt: "2026-05-01T00:00:00.000Z",
  celebrated: false,
})

// A deterministic ID generator so tests don't need to deal with random values
const fakeId = () => "test-id"

// ─── checkForNewMilestone ────────────────────────────────────────

describe("checkForNewMilestone", () => {
  it("returns null when streak is below all thresholds", () => {
    const result = checkForNewMilestone(makeStreak(5), [], fakeId)
    expect(result).toBeNull()
  })

  it("returns null when streak is exactly 6 (just below 7-day threshold)", () => {
    const result = checkForNewMilestone(makeStreak(6), [], fakeId)
    expect(result).toBeNull()
  })

  it("detects the 7-day milestone when streak reaches 7", () => {
    const result = checkForNewMilestone(makeStreak(7), [], fakeId)
    expect(result).not.toBeNull()
    expect(result!.threshold).toBe(7)
    expect(result!.habitId).toBe("habit-1")
    expect(result!.celebrated).toBe(false)
  })

  it("detects the 30-day milestone when streak reaches 30", () => {
    const result = checkForNewMilestone(makeStreak(30), [], fakeId)
    expect(result!.threshold).toBe(30)
  })

  it("detects the 100-day milestone when streak reaches 100", () => {
    const result = checkForNewMilestone(makeStreak(100), [], fakeId)
    expect(result!.threshold).toBe(100)
  })

  it("detects the 365-day milestone when streak reaches 365", () => {
    const result = checkForNewMilestone(makeStreak(365), [], fakeId)
    expect(result!.threshold).toBe(365)
  })

  it("returns null when the threshold is already unlocked", () => {
    const existing = [makeMilestone(7)]
    const result = checkForNewMilestone(makeStreak(7), existing, fakeId)
    expect(result).toBeNull()
  })

  it("returns the highest unearned threshold when streak crosses multiple", () => {
    // Streak jumped to 30 but only 7 was previously unlocked
    const existing = [makeMilestone(7)]
    const result = checkForNewMilestone(makeStreak(30), existing, fakeId)
    expect(result!.threshold).toBe(30) // highest new one, not 7 again
  })

  it("returns null when all earned thresholds are already unlocked", () => {
    const existing = [makeMilestone(7), makeMilestone(30), makeMilestone(100)]
    const result = checkForNewMilestone(makeStreak(100), existing, fakeId)
    expect(result).toBeNull()
  })

  it("only checks milestones for the correct habitId", () => {
    // milestone unlocked for a different habit — should not block this habit
    const existing: IMilestone[] = [
      { ...makeMilestone(7), habitId: "other-habit" },
    ]
    const result = checkForNewMilestone(makeStreak(7, "habit-1"), existing, fakeId)
    expect(result).not.toBeNull() // habit-1 has not unlocked 7 yet
    expect(result!.threshold).toBe(7)
  })

  it("uses the provided generateId function for the new milestone id", () => {
    const result = checkForNewMilestone(makeStreak(7), [], fakeId)
    expect(result!.id).toBe("test-id")
  })
})

// ─── findMissingMilestones ────────────────────────────────────────

describe("findMissingMilestones", () => {
  it("returns empty array when no milestones have been earned", () => {
    const result = findMissingMilestones(makeStreak(5), [], fakeId)
    expect(result).toHaveLength(0)
  })

  it("returns all unlocked milestones when none exist yet", () => {
    // Streak of 30 should have unlocked 7 and 30
    const result = findMissingMilestones(makeStreak(30), [], fakeId)
    const thresholds = result.map(m => m.threshold)
    expect(thresholds).toContain(7)
    expect(thresholds).toContain(30)
    expect(thresholds).not.toContain(100)
  })

  it("marks backfilled milestones as already celebrated", () => {
    const result = findMissingMilestones(makeStreak(30), [], fakeId)
    result.forEach(m => {
      expect(m.celebrated).toBe(true)
    })
  })

  it("excludes thresholds that are already in existingMilestones", () => {
    const existing = [makeMilestone(7)]
    const result = findMissingMilestones(makeStreak(30), existing, fakeId)
    const thresholds = result.map(m => m.threshold)
    expect(thresholds).not.toContain(7)
    expect(thresholds).toContain(30)
  })
})

// ─── MILESTONE_THRESHOLDS constant ────────────────────────────────

describe("MILESTONE_THRESHOLDS", () => {
  it("contains exactly [7, 30, 100, 365]", () => {
    expect(MILESTONE_THRESHOLDS).toEqual([7, 30, 100, 365])
  })
})

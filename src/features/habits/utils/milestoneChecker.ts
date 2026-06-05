/**
 * CONCEPT: Pure function with a single responsibility.
 * Given a streak and the list of already-unlocked milestones, this function
 * determines if a NEW milestone was just reached. Called after every check-in.
 *
 * WHY PURE: No I/O, no state mutations, no React. The store calls this
 * function and decides what to do with the result (save, animate, etc.).
 * Keeping the detection separate from the reaction makes testing trivial.
 *
 * DESIGN DECISION: We check the highest applicable threshold first
 * (iterate in reverse). This handles the edge case where a user installs
 * the app having already logged many days — they should only celebrate
 * the highest milestone they just reached, not all lower ones at once.
 */

import type { IMilestone, IStreak, MilestoneThreshold } from "../types"

/** All thresholds, in ascending order. */
export const MILESTONE_THRESHOLDS: MilestoneThreshold[] = [7, 30, 100, 365]

/**
 * Checks whether the current streak has crossed a new milestone threshold.
 * Returns the new milestone object if one was just reached, or null.
 *
 * @param streak       computed streak for the habit
 * @param existingMilestones all milestones already unlocked for this habit
 * @param generateId   injectable ID generator (default: timestamp-based)
 */
export const checkForNewMilestone = (
  streak: IStreak,
  existingMilestones: IMilestone[],
  generateId: () => string = defaultGenerateId
): IMilestone | null => {
  // Collect the thresholds already unlocked for this habit
  const unlockedThresholds = new Set(
    existingMilestones
      .filter(m => m.habitId === streak.habitId)
      .map(m => m.threshold)
  )

  // Walk thresholds from highest to lowest — celebrate the biggest one first
  for (const threshold of [...MILESTONE_THRESHOLDS].reverse() as MilestoneThreshold[]) {
    if (streak.current >= threshold && !unlockedThresholds.has(threshold)) {
      return {
        id: generateId(),
        habitId: streak.habitId,
        threshold,
        unlockedAt: new Date().toISOString(),
        celebrated: false,
      }
    }
  }

  return null // no new milestone unlocked
}

/**
 * Returns all milestones that should have been unlocked given the current
 * streak, but haven't been yet. Used for backfilling after import/restore.
 */
export const findMissingMilestones = (
  streak: IStreak,
  existingMilestones: IMilestone[],
  generateId: () => string = defaultGenerateId
): IMilestone[] => {
  const unlockedThresholds = new Set(
    existingMilestones
      .filter(m => m.habitId === streak.habitId)
      .map(m => m.threshold)
  )

  return (MILESTONE_THRESHOLDS as MilestoneThreshold[])
    .filter(threshold => streak.current >= threshold && !unlockedThresholds.has(threshold))
    .map(threshold => ({
      id: generateId(),
      habitId: streak.habitId,
      threshold,
      unlockedAt: new Date().toISOString(),
      celebrated: true, // backfilled milestones are pre-celebrated
    }))
}

/** Simple timestamp-based ID — good enough for local-only v1. */
const defaultGenerateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

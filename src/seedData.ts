/**
 * CONCEPT: Seed data — pre-built habits and completions that make the app
 * look populated on first launch. This is a common pattern in demo apps
 * and is useful during development when you want to see real UI states
 * without manually creating 60 days of data.
 *
 * APPROACH:
 *   1. useSettingsStore.seeded tracks whether we've already loaded seed data.
 *   2. loadSeedDataIfNeeded() checks the flag and bails early if already seeded.
 *   3. We write directly to Zustand state via setState() — this bypasses the
 *      action layer (which uses new Date() and adds new IDs), letting us
 *      inject historical data with past timestamps.
 *   4. Called once from App.tsx after the first render.
 *
 * WHY NOT USE ACTIONS:
 *   addHabit() generates a new ID each call. checkIn() uses new Date() for
 *   completedAt and won't accept past dates. Using setState() directly is
 *   the correct Zustand pattern for seeding: it's supported, testable, and
 *   doesn't trigger any unintended side effects.
 *
 * DATA DESIGN:
 *   - Morning Run (daily, 35-day streak) → demonstrates 7-day + 30-day milestones
 *   - Read 30 min (daily, 7-day streak)  → demonstrates first milestone just hit
 *   - Meditate (weekly, 5-week streak)   → demonstrates weekly frequency tracking
 */

import type { IHabit, ICompletion, IMilestone } from "./features/habits/types"
import { useHabitStore } from "./features/habits/store/useHabitStore"
import { useSettingsStore } from "./features/settings/store/useSettingsStore"

// ─────────────────────────────────────────────────────────────────
// STABLE SEED IDs
// Hardcoded so the seed is idempotent — re-seeding produces the same data.
// ─────────────────────────────────────────────────────────────────

const HABIT_RUN_ID      = "seed-habit-run"
const HABIT_READ_ID     = "seed-habit-read"
const HABIT_MEDITATE_ID = "seed-habit-meditate"

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Returns an ISO string for a date N days before today, at noon. */
const isoAgo = (daysAgo: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  // Set to noon so all seed completions have a predictable time component
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

let completionCounter = 0

/** Creates a completion record for a given habit and number of days ago. */
const makeCompletion = (habitId: string, daysAgo: number): ICompletion => ({
  id: `seed-completion-${habitId}-${daysAgo}-${completionCounter++}`,
  habitId,
  completedAt: isoAgo(daysAgo),
})

// ─────────────────────────────────────────────────────────────────
// SEED HABITS
// ─────────────────────────────────────────────────────────────────

const SEED_HABITS: IHabit[] = [
  {
    id: HABIT_RUN_ID,
    name: "Morning Run",
    emoji: "🏃",
    color: "#EF4444",       // red — energetic
    frequency: { type: "daily" },
    createdAt: isoAgo(65),
    isArchived: false,
    streakFreezeAvailable: true,
  },
  {
    id: HABIT_READ_ID,
    name: "Read 30 min",
    emoji: "📚",
    color: "#3B82F6",       // blue — calm, intellectual
    frequency: { type: "daily" },
    createdAt: isoAgo(60),
    isArchived: false,
    streakFreezeAvailable: false, // used the freeze already
  },
  {
    id: HABIT_MEDITATE_ID,
    name: "Meditate",
    emoji: "🧘",
    color: "#6C63FF",       // violet — the brand color
    frequency: { type: "weekly" },
    createdAt: isoAgo(40),
    isArchived: false,
    streakFreezeAvailable: true,
  },
]

// ─────────────────────────────────────────────────────────────────
// SEED COMPLETIONS
//
// Morning Run: 35 consecutive days (days 0–34) = 35-day streak
//   + sporadic completions 36–62 (showing a long history before the streak)
//
// Read 30 min: 7 consecutive days (days 0–6) = 7-day streak
//   + some older completions (days 14–24, days 32–38, days 47–53)
//
// Meditate: one completion per week for 5 weeks
//   (ISO-week-safe: use days 2, 9, 16, 23, 30 — spread across weeks)
// ─────────────────────────────────────────────────────────────────

const runCompletions: ICompletion[] = [
  // Current streak — every single day for 35 days
  ...Array.from({ length: 35 }, (_, i) => makeCompletion(HABIT_RUN_ID, i)),
  // Historical completions (with a 1-day gap at day 35 to break the old streak)
  ...Array.from({ length: 7 }, (_, i) => makeCompletion(HABIT_RUN_ID, 36 + i)),
  ...Array.from({ length: 8 }, (_, i) => makeCompletion(HABIT_RUN_ID, 44 + i)),
  ...Array.from({ length: 6 }, (_, i) => makeCompletion(HABIT_RUN_ID, 53 + i)),
]

const readCompletions: ICompletion[] = [
  // Current streak — 7 days (just hit the first milestone today)
  ...Array.from({ length: 7 }, (_, i) => makeCompletion(HABIT_READ_ID, i)),
  // Previous reading sessions (not consecutive enough to continue the streak)
  ...Array.from({ length: 11 }, (_, i) => makeCompletion(HABIT_READ_ID, 14 + i)),
  ...Array.from({ length: 7 }, (_, i) => makeCompletion(HABIT_READ_ID, 32 + i)),
  ...Array.from({ length: 7 }, (_, i) => makeCompletion(HABIT_READ_ID, 47 + i)),
]

const meditateCompletions: ICompletion[] = [
  // One completion per ISO week for 5 consecutive weeks
  // Using mid-week days to avoid edge cases at week boundaries
  makeCompletion(HABIT_MEDITATE_ID, 2),   // this week (Wednesday-ish)
  makeCompletion(HABIT_MEDITATE_ID, 9),   // last week
  makeCompletion(HABIT_MEDITATE_ID, 16),  // 2 weeks ago
  makeCompletion(HABIT_MEDITATE_ID, 23),  // 3 weeks ago
  makeCompletion(HABIT_MEDITATE_ID, 30),  // 4 weeks ago
]

// ─────────────────────────────────────────────────────────────────
// SEED MILESTONES
//
// Pre-computed milestones matching what the streak calculator would
// have generated after each threshold was crossed.
// marked celebrated: true so no celebration modal fires on first launch.
// ─────────────────────────────────────────────────────────────────

const SEED_MILESTONES: IMilestone[] = [
  // Morning Run crossed 7-day streak 28 days ago
  {
    id: "seed-milestone-run-7",
    habitId: HABIT_RUN_ID,
    threshold: 7,
    unlockedAt: isoAgo(28),
    celebrated: true,
  },
  // Morning Run crossed 30-day streak 5 days ago
  {
    id: "seed-milestone-run-30",
    habitId: HABIT_RUN_ID,
    threshold: 30,
    unlockedAt: isoAgo(5),
    celebrated: true,
  },
  // Read 30 min just hit 7-day streak today (celebrated so modal doesn't fire)
  {
    id: "seed-milestone-read-7",
    habitId: HABIT_READ_ID,
    threshold: 7,
    unlockedAt: isoAgo(0),
    celebrated: true,
  },
]

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

/**
 * Loads seed data into the habit store if it hasn't been seeded yet.
 *
 * Safe to call multiple times — the `seeded` flag in useSettingsStore
 * ensures we only write data once per device installation.
 *
 * Call this from App.tsx in a useEffect after the first render,
 * so it runs after the stores have hydrated from MMKV.
 */
export const loadSeedDataIfNeeded = (): void => {
  const { seeded, markSeeded } = useSettingsStore.getState()

  // Bail out if already seeded (or if the user already has habits)
  if (seeded) return
  const { habits } = useHabitStore.getState()
  if (habits.length > 0) {
    // User already has habits — don't overwrite their real data
    markSeeded()
    return
  }

  // Write all seed data directly to the store via setState.
  // This bypasses actions intentionally — actions use `new Date()` and
  // generate IDs, which would make historical data impossible to inject.
  useHabitStore.setState({
    habits: SEED_HABITS,
    completions: [
      ...runCompletions,
      ...readCompletions,
      ...meditateCompletions,
    ],
    milestones: SEED_MILESTONES,
    pendingCelebration: null,
  })

  // Mark as seeded so this never runs again on this device
  markSeeded()
}

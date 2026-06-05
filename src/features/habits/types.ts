/**
 * CONCEPT: TypeScript interfaces — the single source of truth for data shapes.
 * All data flowing through the app is typed here. No component, store, or
 * utility should invent its own shape for habit data.
 *
 * WHY INTERFACES OVER CLASSES: Plain data objects (POJOs) work best with
 * React's immutable update patterns and JSON serialisation (for MMKV).
 * Classes carry hidden mutable state which conflicts with Zustand's
 * "return new state" model.
 *
 * UNION TYPES: HabitFrequency is a discriminated union — each variant
 * has a unique `type` field so TypeScript can narrow the type in switch
 * statements and if-checks, giving exhaustive safety without casting.
 */

// ─────────────────────────────────────────────────────────────────
// HABIT FREQUENCY
// ─────────────────────────────────────────────────────────────────

/** Discriminated union — TypeScript narrows the type based on `type`. */
export type HabitFrequency =
  | { type: "daily" }
  | { type: "weekly" }
  | { type: "custom"; timesPerWeek: number }

// ─────────────────────────────────────────────────────────────────
// HABIT
// ─────────────────────────────────────────────────────────────────

export interface IHabit {
  id: string                       // uuid — unique identifier
  name: string                     // "Read 30 minutes"
  emoji: string                    // "📚" — displayed as icon
  color: string                    // hex color for card accent
  frequency: HabitFrequency        // how often to complete
  createdAt: string                // ISO date string
  isArchived: boolean              // soft delete — keeps history
  streakFreezeAvailable: boolean   // resets weekly — one freeze per week
}

// ─────────────────────────────────────────────────────────────────
// COMPLETION
// A single check-in event for a habit
// ─────────────────────────────────────────────────────────────────

export interface ICompletion {
  id: string           // uuid
  habitId: string      // foreign key → IHabit.id
  completedAt: string  // ISO date string — when user checked in
  note?: string        // optional note (v2 feature, included for schema completeness)
}

// ─────────────────────────────────────────────────────────────────
// STREAK
// Computed — never stored, always derived from completions
// ─────────────────────────────────────────────────────────────────

export interface IStreak {
  habitId: string
  current: number                    // current active streak
  longest: number                    // best streak ever for this habit
  lastCompletedDate: string | null   // ISO date of last check-in
}

// ─────────────────────────────────────────────────────────────────
// MILESTONE
// Unlocked when streak crosses a threshold
// ─────────────────────────────────────────────────────────────────

export type MilestoneThreshold = 7 | 30 | 100 | 365

export interface IMilestone {
  id: string
  habitId: string
  threshold: MilestoneThreshold   // streak days that unlock this
  unlockedAt: string              // ISO date when unlocked
  celebrated: boolean             // has the animation been shown?
}

/** Human-readable labels for each milestone threshold */
export const MILESTONE_LABELS: Record<MilestoneThreshold, string> = {
  7: "On Fire",
  30: "Electric",
  100: "Diamond",
  365: "Legend",
}

/** Emoji icons for each milestone threshold */
export const MILESTONE_EMOJIS: Record<MilestoneThreshold, string> = {
  7: "🔥",
  30: "⚡",
  100: "💎",
  365: "👑",
}

// ─────────────────────────────────────────────────────────────────
// HEATMAP CELL
// One square in the GitHub-style contribution grid
// ─────────────────────────────────────────────────────────────────

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4

export interface IHeatmapCell {
  date: string                  // "2026-05-24"
  completionCount: number       // how many times completed that day
  intensity: HeatmapIntensity
  // 0 = no completion (gray)
  // 1 = partial (light color)
  // 2 = completed (medium)
  // 3 = exceeded (strong)
  // 4 = perfect week contribution (darkest)
}

// ─────────────────────────────────────────────────────────────────
// NAVIGATION PARAM LIST
// Typed params for every screen — React Navigation requires this.
// `undefined` means the screen takes no params.
// Optional params use `?` — present in edit mode, absent in create mode.
// ─────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined
  HabitDetail: { habitId: string }
  CreateHabit: { habitId?: string }  // optional = edit mode
  Settings: undefined
}

/**
 * CONCEPT: Custom hook that encapsulates form state and submission logic.
 * This is the "controller" for CreateHabitScreen — the screen itself is
 * just a dumb view that renders whatever the hook exposes.
 *
 * WHY EXTRACT INTO A HOOK:
 * Form state (name, emoji, color, frequency, validation) plus the submit
 * logic (add vs update, store calls) would make CreateHabitScreen ~200
 * lines of mixed UI + logic. Extracting it:
 *   1. Keeps the screen file focused on layout
 *   2. Makes the validation and submit logic independently testable
 *   3. Demonstrates the "custom hook as controller" pattern common in RN
 *
 * EDIT MODE:
 * If `existingHabit` is provided the form initialises from it and the
 * submit action calls `updateHabit` instead of `addHabit`.
 */

import { useState, useCallback, useMemo } from "react"
import { useHabitStore } from "../store/useHabitStore"
import type { IHabit, HabitFrequency } from "../types"

// ─────────────────────────────────────────────────────────────────
// CONSTANTS — default values for new habits
// ─────────────────────────────────────────────────────────────────

export const EMOJI_OPTIONS = [
  "📚", "🏃", "💧", "🎯", "💪", "🧘", "✍️", "🎵",
  "🍎", "😴", "🧹", "💊", "🌱", "🏋️", "🎨", "📝",
  "🚴", "🧠", "❤️", "⭐",
] as const

export const COLOR_OPTIONS = [
  "#6C63FF", // violet (brand primary)
  "#22C55E", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#06B6D4", // cyan
] as const

const DEFAULT_EMOJI  = EMOJI_OPTIONS[0]
const DEFAULT_COLOR  = COLOR_OPTIONS[0]
const DEFAULT_FREQUENCY: HabitFrequency = { type: "daily" }

// ─────────────────────────────────────────────────────────────────
// HOOK RETURN TYPE
// ─────────────────────────────────────────────────────────────────

export interface HabitFormState {
  // Form values
  name: string
  emoji: string
  color: string
  frequency: HabitFrequency
  timesPerWeek: number          // only relevant when frequency.type === "custom"

  // Setters
  setName: (v: string) => void
  setEmoji: (v: string) => void
  setColor: (v: string) => void
  setFrequencyType: (type: HabitFrequency["type"]) => void
  setTimesPerWeek: (n: number) => void

  // Derived
  isValid: boolean              // true when name is non-empty
  isEditMode: boolean           // true when existingHabit was provided

  // Action — call onSuccess after the store is updated
  submit: (onSuccess: () => void) => void
}

// ─────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────

/**
 * @param existingHabit  Pass the habit to pre-populate the form for edit mode.
 *                       Omit (or pass `undefined`) for create mode.
 */
export const useHabitForm = (existingHabit?: IHabit): HabitFormState => {
  const addHabit    = useHabitStore((s) => s.addHabit)
  const updateHabit = useHabitStore((s) => s.updateHabit)

  // ── Form state ─────────────────────────────────────────────────
  const [name, setName]   = useState(existingHabit?.name  ?? "")
  const [emoji, setEmoji] = useState(existingHabit?.emoji ?? DEFAULT_EMOJI)
  const [color, setColor] = useState(existingHabit?.color ?? DEFAULT_COLOR)

  // Frequency is a discriminated union — store it and timesPerWeek separately
  // so we can change type without losing the timesPerWeek value
  const initialFreqType = existingHabit?.frequency.type ?? "daily"
  const initialTimes =
    existingHabit?.frequency.type === "custom"
      ? existingHabit.frequency.timesPerWeek
      : 3

  const [frequencyType, setFrequencyType] = useState<HabitFrequency["type"]>(
    initialFreqType
  )
  const [timesPerWeek, setTimesPerWeek] = useState(initialTimes)

  // ── Derived values ─────────────────────────────────────────────

  /** Reconstruct the discriminated union from the two separate state values */
  const frequency = useMemo<HabitFrequency>(() => {
    switch (frequencyType) {
      case "daily":
        return { type: "daily" }
      case "weekly":
        return { type: "weekly" }
      case "custom":
        return { type: "custom", timesPerWeek }
    }
  }, [frequencyType, timesPerWeek])

  const isValid    = name.trim().length > 0
  const isEditMode = existingHabit !== undefined

  // ── Submit ─────────────────────────────────────────────────────

  /**
   * Validates, saves to store, then calls onSuccess.
   * The screen passes `navigation.goBack()` as the success callback.
   */
  const submit = useCallback(
    (onSuccess: () => void) => {
      if (!isValid) return

      const habitData = { name: name.trim(), emoji, color, frequency }

      if (isEditMode && existingHabit) {
        updateHabit(existingHabit.id, habitData)
      } else {
        addHabit(habitData)
      }

      onSuccess()
    },
    [isValid, name, emoji, color, frequency, isEditMode, existingHabit, addHabit, updateHabit]
  )

  return {
    name,
    emoji,
    color,
    frequency,
    timesPerWeek,
    setName,
    setEmoji,
    setColor,
    setFrequencyType,
    setTimesPerWeek,
    isValid,
    isEditMode,
    submit,
  }
}

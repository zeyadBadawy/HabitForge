/**
 * CONCEPT: Typed navigation params — React Navigation is fully typed
 * when you provide a param list. Every screen in the stack is listed here
 * with the params it expects. `undefined` = no params required.
 *
 * WHY HERE AND IN habits/types.ts:
 * This file is the canonical source for navigation typing.
 * The one in habits/types.ts is duplicated for quick reference alongside
 * the data models — they must stay in sync.
 * In a larger app you'd import from here everywhere, not duplicate.
 */

export type RootTabParamList = {
  Habits: undefined
  Settings: undefined
}

export type HabitsStackParamList = {
  Home: undefined
  HabitDetail: { habitId: string }
  CreateHabit: { habitId?: string }
}

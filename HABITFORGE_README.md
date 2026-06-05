# HabitForge 🔥
### Build habits that stick — streak tracking, calendar heatmaps, and milestone celebrations

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Core Features](#2-core-features)
3. [User Stories](#3-user-stories)
4. [Technical Implementation](#4-technical-implementation)
5. [Project Structure](#5-project-structure)
6. [Data Models](#6-data-models)
7. [Screen Breakdown](#7-screen-breakdown)
8. [State Management Architecture](#8-state-management-architecture)
9. [Key Algorithms](#9-key-algorithms)
10. [Component Catalogue](#10-component-catalogue)
11. [Navigation Structure](#11-navigation-structure)
12. [Storage Strategy](#12-storage-strategy)
13. [Animation Specification](#13-animation-specification)
14. [Testing Strategy](#14-testing-strategy)
15. [Performance Requirements](#15-performance-requirements)
16. [Implementation Instructions for Claude Code](#16-implementation-instructions-for-claude-code)

---

# PART 1 — PRODUCT

---

## 1. Product Vision

HabitForge is a mobile habit tracking app that makes consistency feel rewarding. Unlike simple to-do checkers, HabitForge uses streaks, milestone badges, and a contribution heatmap to make users *feel* their progress — the same psychological mechanism that makes Duolingo addictive, applied to personal habit building.

### The core loop
```
User creates habit → checks in daily → sees streak grow →
hits milestone → celebrates → motivated to continue
```

### Who it's for
People who have tried and failed at habit apps because they felt clinical and boring. HabitForge makes consistency visual, emotional, and rewarding.

### Why it's different
- **Streak system with freeze** — miss a day? Use your weekly streak freeze instead of losing everything
- **GitHub-style heatmap** — see months of consistency at a glance, not just today
- **Frequency-aware streaks** — daily, weekly, and custom (X times per week) habits each have streak logic that makes sense for that cadence
- **Milestone badges** — 7, 30, 100, 365 day milestones with animated celebrations

---

## 2. Core Features

### V1 (this implementation)

#### Habit Management
- Create a habit with name, icon (emoji), color, and frequency
- Three frequency types: Daily, Weekly, At least X times per week
- Edit or delete existing habits
- Archive habits without losing history

#### Streak System
- **Daily habits** — streak increments each day the habit is completed. Breaks if a day is missed. One streak freeze per week protects against a single missed day.
- **Weekly habits** — streak counts consecutive weeks where the habit was completed at least once. Resets if a full week passes with no completion.
- **Custom (X/week) habits** — streak counts consecutive weeks where the target was hit. E.g. "3x per week" — must complete 3 times in a calendar week to keep the streak.

#### Milestone Badges
Unlocked automatically when streak reaches the threshold:
- 🔥 **On Fire** — 7 day streak
- ⚡ **Electric** — 30 day streak
- 💎 **Diamond** — 100 day streak
- 👑 **Legend** — 365 day streak

Each milestone triggers a full-screen animated celebration with confetti.

#### Calendar Heatmap
- GitHub contribution graph style — a scrollable grid of squares
- Each square = one day
- Color intensity = completion rate that day (0%, 50%, 100%+)
- Tapping a square shows what was completed that day
- Shows last 12 weeks by default, scrollable to full history

#### Progress Tracking
- Per-habit progress bar showing week's completion vs target
- Overall consistency score (% of habits completed today)
- Longest streak record per habit

### V2 (future — not in this implementation)
- Push notification reminders
- Cloud sync
- Social challenges
- Home screen widgets
- AI-generated habit suggestions

---

## 3. User Stories

```
As a user I want to:

HABIT CREATION
- Create a new habit with a name, emoji icon, and color
- Choose how often I want to do the habit (daily / weekly / X per week)
- See my habit appear on the home screen immediately

DAILY CHECK-IN
- See all my habits for today on the home screen
- Mark a habit as done with a satisfying tap interaction
- See my streak update immediately when I check in
- Undo a check-in if I made a mistake

STREAK & MOTIVATION
- See my current streak prominently on each habit card
- Be notified when I hit a milestone (7, 30, 100, 365 days)
- Use a streak freeze once per week if I miss a day
- See my longest ever streak for each habit

CALENDAR VIEW
- Open a habit and see a heatmap of my entire history
- See which days I completed the habit vs missed
- Navigate between months
- See a summary: total completions, current streak, best streak

MANAGEMENT
- Edit a habit's name, icon, color, or frequency
- Delete a habit (with confirmation)
- See all habits in a clean list sorted by today's completion status
```

---

# PART 2 — TECHNICAL IMPLEMENTATION

---

## 4. Technical Implementation

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React Native 0.74+ with Expo | Cross-platform iOS + Android |
| Language | TypeScript | Type safety, better DX |
| Navigation | React Navigation v6 | Industry standard |
| State management | Zustand | Simple, no boilerplate, perfect for this scale |
| Local storage | MMKV | Fast synchronous storage for habit data |
| Secure storage | Not needed (no auth in v1) | — |
| Animations | Reanimated 3 + Gesture Handler | 60fps, UI thread animations |
| Styling | StyleSheet + theme system | No extra dependencies needed |
| Testing | Jest + React Native Testing Library | Unit + component tests |
| Icons | Expo Vector Icons | Built-in with Expo |

### Concepts demonstrated (mapped to learning phases)

This codebase intentionally demonstrates every concept from the React Native learning plan:

| Phase | Concept | Where in this codebase |
|---|---|---|
| Phase 1 | TypeScript interfaces | All data models in `src/types/` |
| Phase 1 | React components + JSX | Every component in `src/features/` |
| Phase 1 | useState + useEffect | `HabitCard`, `CheckInButton` |
| Phase 1 | React Navigation (stack + tabs) | `src/navigation/` |
| Phase 2 | Zustand global state | `src/store/useHabitStore.ts` |
| Phase 2 | Custom hooks | `useStreak`, `useHeatmap`, `useHabitForm` |
| Phase 2 | MMKV persistence | `src/storage/habitStorage.ts` |
| Phase 2 | useMemo + useCallback | `HeatmapGrid`, `HabitList` |
| Phase 3 | Reanimated 3 animations | `StreakCounter`, `MilestoneCelebration`, `CheckInButton` |
| Phase 3 | Gesture Handler | `SwipeableHabitCard` |
| Phase 3 | React.memo | All list row components |
| Phase 3 | Error Boundary | `src/components/shared/ErrorBoundary` |
| Phase 3 | Feature-based folder structure | Entire `src/features/` directory |
| Phase 3 | Compound components | `HabitCard` compound pattern |
| Phase 4 | Performance optimization | `HabitList` with getItemLayout + memo |
| Phase 4 | StyleSheet theming | `src/theme/` |

---

## 5. Project Structure

```
src/
├── features/
│   ├── habits/
│   │   ├── components/
│   │   │   ├── HabitCard/
│   │   │   │   ├── HabitCard.tsx          ← compound component root
│   │   │   │   ├── HabitCard.Header.tsx   ← sub-component: name + icon
│   │   │   │   ├── HabitCard.Streak.tsx   ← sub-component: streak counter
│   │   │   │   ├── HabitCard.Progress.tsx ← sub-component: progress bar
│   │   │   │   ├── HabitCard.test.tsx
│   │   │   │   ├── styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── CheckInButton/
│   │   │   │   ├── CheckInButton.tsx      ← animated check-in with spring
│   │   │   │   ├── CheckInButton.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── HeatmapGrid/
│   │   │   │   ├── HeatmapGrid.tsx        ← GitHub contribution grid
│   │   │   │   ├── HeatmapCell.tsx        ← single day square
│   │   │   │   ├── HeatmapGrid.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── StreakCounter/
│   │   │   │   ├── StreakCounter.tsx      ← animated number + fire emoji
│   │   │   │   └── index.ts
│   │   │   ├── MilestoneCelebration/
│   │   │   │   ├── MilestoneCelebration.tsx ← full screen celebration modal
│   │   │   │   └── index.ts
│   │   │   └── SwipeableHabitCard/
│   │   │       ├── SwipeableHabitCard.tsx ← swipe to delete/archive
│   │   │       └── index.ts
│   │   ├── hooks/
│   │   │   ├── useStreak.ts               ← streak calculation logic
│   │   │   ├── useHeatmap.ts              ← heatmap data transformation
│   │   │   ├── useHabitForm.ts            ← create/edit form state
│   │   │   └── useTodayProgress.ts        ← today's completion percentage
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx             ← today's habits list
│   │   │   ├── HabitDetailScreen.tsx      ← heatmap + stats for one habit
│   │   │   └── CreateHabitScreen.tsx      ← create/edit form
│   │   ├── services/
│   │   │   └── habitService.ts            ← CRUD operations
│   │   ├── store/
│   │   │   └── useHabitStore.ts           ← Zustand store
│   │   ├── utils/
│   │   │   ├── streakCalculator.ts        ← pure streak logic
│   │   │   ├── heatmapTransformer.ts      ← transforms completions to grid
│   │   │   └── milestoneChecker.ts        ← checks if milestone reached
│   │   └── types.ts                       ← all habit-related types
│   └── settings/
│       ├── screens/
│       │   └── SettingsScreen.tsx
│       └── store/
│           └── useSettingsStore.ts        ← theme, preferences
│
├── navigation/
│   ├── RootNavigator.tsx                  ← tab navigator root
│   ├── HabitsNavigator.tsx                ← stack inside habits tab
│   └── types.ts                           ← RootStackParamList
│
├── shared/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── ProgressBar/
│   │   ├── Badge/
│   │   └── ErrorBoundary/
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── usePersistedState.ts
│   └── utils/
│       └── dateUtils.ts                   ← date helpers used everywhere
│
├── storage/
│   └── habitStorage.ts                    ← MMKV read/write abstraction
│
└── theme/
    ├── theme.ts                           ← colors, spacing, typography
    ├── darkTheme.ts
    └── useTheme.ts                        ← auto light/dark detection
```

---

## 6. Data Models

```typescript
// src/features/habits/types.ts

// ─────────────────────────────────────────
// HABIT FREQUENCY
// Defines how often a habit should be done
// ─────────────────────────────────────────
export type HabitFrequency =
  | { type: "daily" }
  | { type: "weekly" }
  | { type: "custom"; timesPerWeek: number }
  // Union type — each variant has different shape
  // "daily"  → must complete every day
  // "weekly" → must complete at least once per week
  // "custom" → must complete N times per week

// ─────────────────────────────────────────
// HABIT
// Core data model for a single habit
// ─────────────────────────────────────────
export interface IHabit {
  id: string                    // uuid — unique identifier
  name: string                  // "Read 30 minutes"
  emoji: string                 // "📚" — displayed as icon
  color: string                 // hex color for card accent
  frequency: HabitFrequency     // how often to complete
  createdAt: string             // ISO date string
  isArchived: boolean           // soft delete — keeps history
  streakFreezeAvailable: boolean // resets weekly — one freeze per week
}

// ─────────────────────────────────────────
// COMPLETION
// A single check-in event for a habit
// ─────────────────────────────────────────
export interface ICompletion {
  id: string           // uuid
  habitId: string      // foreign key → IHabit.id
  completedAt: string  // ISO date string — when user checked in
  note?: string        // optional note (v2 feature, include now)
}

// ─────────────────────────────────────────
// STREAK
// Computed — never stored, always derived from completions
// ─────────────────────────────────────────
export interface IStreak {
  habitId: string
  current: number      // current active streak
  longest: number      // best streak ever for this habit
  lastCompletedDate: string | null  // ISO date of last check-in
}

// ─────────────────────────────────────────
// MILESTONE
// Unlocked when streak crosses a threshold
// ─────────────────────────────────────────
export interface IMilestone {
  id: string
  habitId: string
  threshold: 7 | 30 | 100 | 365   // streak days that unlock this
  unlockedAt: string               // ISO date when unlocked
  celebrated: boolean              // has animation been shown?
}

// ─────────────────────────────────────────
// HEATMAP CELL
// One square in the contribution grid
// ─────────────────────────────────────────
export interface IHeatmapCell {
  date: string            // "2026-05-24"
  completionCount: number // how many times completed that day
  intensity: 0 | 1 | 2 | 3 | 4
  // 0 = no completion (gray)
  // 1 = partial (light color)
  // 2 = completed (medium)
  // 3 = exceeded (strong)
  // 4 = perfect week contribution (darkest)
}

// ─────────────────────────────────────────
// NAVIGATION PARAM LIST
// Typed params for every screen
// ─────────────────────────────────────────
export type RootStackParamList = {
  Home: undefined
  HabitDetail: { habitId: string }
  CreateHabit: { habitId?: string }  // optional = edit mode
  Settings: undefined
}
```

---

## 7. Screen Breakdown

### HomeScreen
**Purpose:** See all habits, check in for today, see streaks at a glance

**Layout:**
```
┌─────────────────────────────────┐
│  Good morning, Zeyad 👋          │
│  4/6 habits done today           │
│  ████████░░  67%                 │
├─────────────────────────────────┤
│  📚 Read 30 min        🔥 14    │
│  ████████████░░░  Daily          │
│                        [✓ Done] │
├─────────────────────────────────┤
│  🏃 Run                🔥 6     │
│  ██░░░░░░░░░░░░  3x/week 1/3   │
│                        [✓ Done] │
├─────────────────────────────────┤
│  💧 Drink water        🔥 30   │
│  ████████████████  Daily        │
│                       [✓ DONE] │  ← already completed today
└─────────────────────────────────┘
  [+] Add habit
```

**State needed:** all habits + today's completions + streaks
**Components:** `HabitCard` (compound), `CheckInButton`, `ProgressBar`, `StreakCounter`

---

### HabitDetailScreen
**Purpose:** Deep dive into one habit — full heatmap, stats, milestone badges

**Layout:**
```
┌─────────────────────────────────┐
│  ← 📚 Read 30 minutes            │
├─────────────────────────────────┤
│  🔥 14    📅 Best: 30   ✅ 67   │
│  Current  Longest       Total%  │
├─────────────────────────────────┤
│  CONSISTENCY                     │
│  May Jun Jul Aug Sep Oct Nov ... │
│  ░░▒▒▓▓██░░▒▒▓▓██░░▒▒▓▓██░░   │  ← heatmap
│  ░░▒▒▓▓██░░▒▒▓▓██░░▒▒▓▓██░░   │
│  ░░▒▒▓▓██░░▒▒▓▓██░░▒▒▓▓██░░   │
├─────────────────────────────────┤
│  MILESTONES                      │
│  🔥 7 days  ✅ May 1             │
│  ⚡ 30 days ✅ May 24            │
│  💎 100 days 🔒 locked           │
│  👑 365 days 🔒 locked           │
├─────────────────────────────────┤
│  [Edit habit]  [Archive habit]   │
└─────────────────────────────────┘
```

**Components:** `HeatmapGrid`, `StreakCounter`, `MilestoneBadge`, `StatCard`

---

### CreateHabitScreen
**Purpose:** Create a new habit or edit an existing one

**Layout:**
```
┌─────────────────────────────────┐
│  ← New Habit                     │
├─────────────────────────────────┤
│  Habit name                      │
│  [Read 30 minutes            ]   │
│                                  │
│  Icon                            │
│  [📚] [🏃] [💧] [🎯] [💪] [...]│
│                                  │
│  Color                           │
│  [🔵] [🟢] [🟡] [🔴] [🟣] [...] │
│                                  │
│  Frequency                       │
│  ○ Daily                         │
│  ○ Weekly                        │
│  ● Custom  [3] times per week    │
│                                  │
│  [Create Habit]                  │
└─────────────────────────────────┘
```

**Components:** `TextInput`, `EmojiPicker`, `ColorPicker`, `FrequencySelector`

---

## 8. State Management Architecture

```typescript
// src/features/habits/store/useHabitStore.ts
//
// CONCEPT: Zustand store — global state without Redux boilerplate
// All habit data lives here. Components read from this store
// and dispatch actions to modify it.
// 
// Think of this as the single source of truth for the app —
// equivalent to a Redux store but with much less ceremony.

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { MMKVLoader } from "react-native-mmkv"

// MMKV storage adapter — makes Zustand persist to device storage
// automatically. Every state change is saved synchronously.
const storage = new MMKVLoader().initialize()
const zustandMMKVStorage = {
  setItem: (key: string, value: string) => storage.setString(key, value),
  getItem: (key: string) => storage.getString(key) ?? null,
  removeItem: (key: string) => storage.delete(key),
}

interface IHabitStore {
  // ─── STATE ───────────────────────────────
  habits: IHabit[]
  completions: ICompletion[]
  milestones: IMilestone[]
  pendingCelebration: IMilestone | null  // milestone waiting to be celebrated

  // ─── HABIT ACTIONS ───────────────────────
  addHabit: (habit: Omit<IHabit, "id" | "createdAt">) => void
  updateHabit: (id: string, updates: Partial<IHabit>) => void
  archiveHabit: (id: string) => void
  deleteHabit: (id: string) => void

  // ─── COMPLETION ACTIONS ──────────────────
  checkIn: (habitId: string) => void        // mark habit done today
  undoCheckIn: (habitId: string) => void    // undo today's check-in
  useStreakFreeze: (habitId: string) => void // protect streak for missed day

  // ─── MILESTONE ACTIONS ───────────────────
  celebrateMilestone: (milestoneId: string) => void // mark as shown

  // ─── SELECTORS (computed values) ─────────
  // These are functions that derive data from state
  // equivalent to computed properties in Swift
  getHabitById: (id: string) => IHabit | undefined
  getTodayCompletions: () => ICompletion[]
  getCompletionsForHabit: (habitId: string) => ICompletion[]
  isCompletedToday: (habitId: string) => boolean
}

export const useHabitStore = create<IHabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: [],
      milestones: [],
      pendingCelebration: null,

      addHabit: (habitData) => set((state) => ({
        habits: [...state.habits, {
          ...habitData,
          id: generateId(),          // uuid generation
          createdAt: new Date().toISOString(),
          isArchived: false,
          streakFreezeAvailable: true,
        }]
      })),

      updateHabit: (id, updates) => set((state) => ({
        habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
      })),

      archiveHabit: (id) => set((state) => ({
        habits: state.habits.map(h =>
          h.id === id ? { ...h, isArchived: true } : h
        )
      })),

      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter(h => h.id !== id),
        completions: state.completions.filter(c => c.habitId !== id),
        milestones: state.milestones.filter(m => m.habitId !== id),
      })),

      checkIn: (habitId) => {
        const state = get()
        const today = getTodayDateString()

        // Prevent duplicate check-ins on the same day
        const alreadyDoneToday = state.completions.some(c =>
          c.habitId === habitId && c.completedAt.startsWith(today)
        )
        if (alreadyDoneToday) return

        const newCompletion: ICompletion = {
          id: generateId(),
          habitId,
          completedAt: new Date().toISOString(),
        }

        set((state) => ({
          completions: [...state.completions, newCompletion]
        }))

        // After check-in, recalculate streak and check for new milestones
        // This runs as a side effect after state update
        checkForNewMilestones(habitId)
      },

      undoCheckIn: (habitId) => {
        const today = getTodayDateString()
        set((state) => ({
          completions: state.completions.filter(c =>
            !(c.habitId === habitId && c.completedAt.startsWith(today))
          )
        }))
      },

      useStreakFreeze: (habitId) => set((state) => ({
        habits: state.habits.map(h =>
          h.id === habitId ? { ...h, streakFreezeAvailable: false } : h
        )
      })),

      celebrateMilestone: (milestoneId) => set((state) => ({
        milestones: state.milestones.map(m =>
          m.id === milestoneId ? { ...m, celebrated: true } : m
        ),
        pendingCelebration: null,
      })),

      getHabitById: (id) => get().habits.find(h => h.id === id),

      getTodayCompletions: () => {
        const today = getTodayDateString()
        return get().completions.filter(c => c.completedAt.startsWith(today))
      },

      getCompletionsForHabit: (habitId) =>
        get().completions.filter(c => c.habitId === habitId),

      isCompletedToday: (habitId) => {
        const today = getTodayDateString()
        return get().completions.some(c =>
          c.habitId === habitId && c.completedAt.startsWith(today)
        )
      },
    }),
    {
      name: "habit-store",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
)
```

---

## 9. Key Algorithms

### Streak Calculator

```typescript
// src/features/habits/utils/streakCalculator.ts
//
// CONCEPT: Pure functions — no side effects, no state
// These functions take data in and return a result.
// Easy to unit test because they're deterministic.
// This is the most critical business logic in the app.

export const calculateStreak = (
  habit: IHabit,
  completions: ICompletion[]
): IStreak => {
  
  const habitCompletions = completions
    .filter(c => c.habitId === habit.id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    // Sort newest first for streak calculation

  if (habitCompletions.length === 0) {
    return { habitId: habit.id, current: 0, longest: 0, lastCompletedDate: null }
  }

  if (habit.frequency.type === "daily") {
    return calculateDailyStreak(habit.id, habitCompletions)
  }

  if (habit.frequency.type === "weekly") {
    return calculateWeeklyStreak(habit.id, habitCompletions)
  }

  return calculateCustomStreak(habit.id, habitCompletions, habit.frequency.timesPerWeek)
}

const calculateDailyStreak = (habitId: string, completions: ICompletion[]): IStreak => {
  // Get unique completion dates (user might check in multiple times per day)
  const uniqueDates = [...new Set(
    completions.map(c => c.completedAt.split("T")[0])
  )].sort().reverse()
  // Result: ["2026-05-24", "2026-05-23", "2026-05-21", ...]

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1
  const today = getTodayDateString()
  const yesterday = getDateString(-1)

  // If most recent completion isn't today or yesterday — streak is broken
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return {
      habitId,
      current: 0,
      longest: calculateLongestStreak(uniqueDates),
      lastCompletedDate: uniqueDates[0]
    }
  }

  currentStreak = 1

  // Walk backwards through dates counting consecutive days
  for (let i = 1; i < uniqueDates.length; i++) {
    const current = new Date(uniqueDates[i - 1])
    const prev = new Date(uniqueDates[i])
    const diffDays = Math.round(
      (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 1) {
      // Consecutive day — streak continues
      currentStreak++
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      // Gap found — current streak ends here
      break
    }
  }

  return {
    habitId,
    current: currentStreak,
    longest: Math.max(currentStreak, calculateLongestStreak(uniqueDates)),
    lastCompletedDate: uniqueDates[0],
  }
}

const calculateWeeklyStreak = (habitId: string, completions: ICompletion[]): IStreak => {
  // Group completions by ISO week number
  // A week streak increments for each consecutive week with at least one completion
  const weekNumbers = [...new Set(
    completions.map(c => getISOWeekNumber(new Date(c.completedAt)))
  )].sort().reverse()

  let currentStreak = 0
  for (let i = 0; i < weekNumbers.length - 1; i++) {
    if (weekNumbers[i] - weekNumbers[i + 1] === 1) {
      currentStreak++
    } else {
      break
    }
  }

  return {
    habitId,
    current: currentStreak + (weekNumbers.length > 0 ? 1 : 0),
    longest: weekNumbers.length,
    lastCompletedDate: completions[0]?.completedAt ?? null,
  }
}

const calculateCustomStreak = (
  habitId: string,
  completions: ICompletion[],
  targetPerWeek: number
): IStreak => {
  // Group completions by week, count per week
  // Streak counts consecutive weeks where count >= targetPerWeek
  const completionsByWeek = groupByWeek(completions)
  const weeks = Object.keys(completionsByWeek).sort().reverse()

  let currentStreak = 0
  for (const week of weeks) {
    if (completionsByWeek[week] >= targetPerWeek) {
      currentStreak++
    } else {
      break
    }
  }

  return {
    habitId,
    current: currentStreak,
    longest: currentStreak, // simplified — full longest calc omitted for brevity
    lastCompletedDate: completions[0]?.completedAt ?? null,
  }
}
```

### Heatmap Transformer

```typescript
// src/features/habits/utils/heatmapTransformer.ts
//
// CONCEPT: Data transformation — takes raw completions and converts
// them into a structured grid format the UI component can render.
// Separates data logic from display logic.

export const buildHeatmapData = (
  completions: ICompletion[],
  weeks: number = 12  // how many weeks to show
): IHeatmapCell[][] => {
  
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeks * 7))

  // Build a map of date → completion count for O(1) lookup
  const completionMap = new Map<string, number>()
  completions.forEach(c => {
    const date = c.completedAt.split("T")[0]
    completionMap.set(date, (completionMap.get(date) ?? 0) + 1)
  })

  // Build the grid — weeks as columns, days as rows
  const grid: IHeatmapCell[][] = []

  for (let week = 0; week < weeks; week++) {
    const weekCells: IHeatmapCell[] = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + (week * 7) + day)
      const dateString = date.toISOString().split("T")[0]
      const count = completionMap.get(dateString) ?? 0

      weekCells.push({
        date: dateString,
        completionCount: count,
        intensity: getIntensity(count),  // 0-4 scale
      })
    }
    grid.push(weekCells)
  }

  return grid
  // Returns: array of weeks, each week is array of 7 day cells
  // grid[0][0] = oldest day, grid[11][6] = most recent day
}

const getIntensity = (count: number): 0 | 1 | 2 | 3 | 4 => {
  if (count === 0) return 0
  if (count === 1) return 2   // completed = medium intensity
  if (count === 2) return 3   // exceeded = strong
  return 4                    // 3+ = maximum intensity
}
```

### Milestone Checker

```typescript
// src/features/habits/utils/milestoneChecker.ts
//
// CONCEPT: Pure function that checks if a new milestone was just reached.
// Called after every check-in to see if we should celebrate.

const MILESTONE_THRESHOLDS = [7, 30, 100, 365] as const

export const checkForNewMilestone = (
  streak: IStreak,
  existingMilestones: IMilestone[]
): IMilestone | null => {
  
  const unlockedThresholds = existingMilestones
    .filter(m => m.habitId === streak.habitId)
    .map(m => m.threshold)

  // Find the highest threshold that:
  // 1. Current streak has reached it
  // 2. Hasn't been unlocked yet
  for (const threshold of [...MILESTONE_THRESHOLDS].reverse()) {
    if (streak.current >= threshold && !unlockedThresholds.includes(threshold)) {
      return {
        id: generateId(),
        habitId: streak.habitId,
        threshold,
        unlockedAt: new Date().toISOString(),
        celebrated: false,
      }
    }
  }

  return null  // no new milestone
}
```

---

## 10. Component Catalogue

### HabitCard (Compound Component)

```typescript
// src/features/habits/components/HabitCard/HabitCard.tsx
//
// CONCEPT: Compound component pattern
// HabitCard is a family of components that work together.
// Each sub-component is attached as a property of the parent.
// This gives callers flexibility to compose the card differently
// for different contexts (home screen vs detail screen).
//
// Usage:
// <HabitCard onPress={handlePress}>
//   <HabitCard.Header habit={habit} />
//   <HabitCard.Progress habit={habit} completions={completions} />
//   <HabitCard.Streak streak={streak} />
// </HabitCard>

const HabitCard = ({ children, onPress, style }: IHabitCardProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.card, style]}>
    {children}
  </TouchableOpacity>
)

HabitCard.Header = ({ habit }: { habit: IHabit }) => (...)
HabitCard.Progress = ({ habit, completions }: IProgressProps) => (...)
HabitCard.Streak = ({ streak }: { streak: IStreak }) => (...)
```

### CheckInButton

```typescript
// CONCEPT: Reanimated 3 spring animation + Gesture Handler tap
// The check-in button scales down on press and springs back.
// On completion it animates to a checkmark with a color change.
// Uses useSharedValue + useAnimatedStyle + withSpring.
//
// Visual states:
// DEFAULT:   [  Check in  ]  gray border, white background
// PRESSING:  [  Check in  ]  scaled to 0.95
// DONE:      [    ✓ Done  ]  green background, white text, scale spring
```

### HeatmapGrid

```typescript
// CONCEPT: useMemo for heavy data transformation
// The heatmap receives raw completions and transforms them to grid data.
// This transformation is memoized — only recalculates when completions change.
// Each cell is a React.memo component to prevent unnecessary re-renders.
//
// Performance note: a 12-week grid has 84 cells. Without React.memo
// on HeatmapCell, every cell re-renders when any state changes.
// With React.memo, only changed cells re-render.
```

### StreakCounter

```typescript
// CONCEPT: Reanimated withTiming for counting animation
// When streak updates, the number counts up from previous value
// to new value using withTiming over 600ms.
// The fire emoji scales in with withSpring when streak increases.
```

### MilestoneCelebration

```typescript
// CONCEPT: Modal with entering/exiting animations
// Full screen overlay with:
// - Badge animates in with BounceIn (Reanimated entering animation)
// - Confetti particles using multiple useSharedValue instances
// - Auto-dismisses after 3 seconds or on tap
// - Calls celebrateMilestone() in store when dismissed
```

---

## 11. Navigation Structure

```typescript
// src/navigation/RootNavigator.tsx
//
// CONCEPT: Tab navigator containing a stack navigator
// This is the standard pattern for mobile apps:
// - Bottom tabs = top level navigation (Home, Settings)
// - Stack inside each tab = sub-navigation within that section
//
// Equivalent to UITabBarController containing UINavigationControllers

const Tab = createBottomTabNavigator()
const HabitsStack = createNativeStackNavigator<RootStackParamList>()

// Habits tab has its own stack: Home → HabitDetail → CreateHabit
const HabitsNavigator = () => (
  <HabitsStack.Navigator>
    <HabitsStack.Screen name="Home" component={HomeScreen} />
    <HabitsStack.Screen name="HabitDetail" component={HabitDetailScreen} />
    <HabitsStack.Screen name="CreateHabit" component={CreateHabitScreen} />
  </HabitsStack.Navigator>
)

// Root has two tabs: Habits and Settings
const RootNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Habits" component={HabitsNavigator} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
)
```

---

## 12. Storage Strategy

```
Data type              Storage          Why
─────────────────────────────────────────────────────
Habits array           MMKV via Zustand persist  Fast sync reads
Completions array      MMKV via Zustand persist  Fast sync reads
Milestones array       MMKV via Zustand persist  Fast sync reads
Theme preference       MMKV direct               Simple key-value
No sensitive data      —                         No Keychain needed
```

All data persists automatically through Zustand's persist middleware with MMKV adapter. No manual save/load calls needed anywhere in the app.

---

## 13. Animation Specification

| Interaction | Animation | Library | Duration |
|---|---|---|---|
| Check-in button press | Scale 1.0 → 0.95 | Reanimated withSpring | Physics |
| Check-in completion | Scale spring + color fade | Reanimated withSpring | Physics |
| Habit card enter (list) | SlideInRight staggered | Reanimated entering | 300ms |
| Swipe to delete | translateX + opacity | Reanimated + Gesture | Physics |
| Streak number update | Count up withTiming | Reanimated | 600ms |
| Milestone celebration | BounceIn + confetti | Reanimated | 800ms |
| Progress bar fill | Width withTiming | Reanimated | 400ms |
| Screen transitions | Default stack animation | React Navigation | Default |

---

## 14. Testing Strategy

### What to test

```
Unit tests (Jest):
- streakCalculator.ts — all streak calculation logic
  - daily: consecutive days, broken streak, streak freeze
  - weekly: consecutive weeks, missed week
  - custom: target met vs missed per week
- heatmapTransformer.ts — grid data transformation
- milestoneChecker.ts — threshold detection
- dateUtils.ts — all date helper functions

Component tests (React Native Testing Library):
- HabitCard — renders name, emoji, streak correctly
- CheckInButton — calls onPress, shows done state
- HeatmapCell — correct color for each intensity level
- ProgressBar — correct width for completion percentage

Store tests (renderHook):
- useHabitStore — addHabit, checkIn, undoCheckIn
- checkIn prevents duplicate same-day completions
- deleteHabit removes all related completions and milestones
```

### Test file locations
Every component has a co-located `.test.tsx` file.
Every utility has a co-located `.test.ts` file.

---

## 15. Performance Requirements

| Metric | Target |
|---|---|
| App startup (cold) | < 2 seconds |
| Home screen render | < 100ms |
| Check-in response | < 16ms (1 frame) |
| Heatmap render (84 cells) | < 50ms |
| Scroll FPS | 60fps constant |

### Performance techniques applied
- `React.memo` on all list row components (`HabitCard`, `HeatmapCell`)
- `useCallback` on all handlers passed as props
- `useMemo` on heatmap data transformation and streak calculations
- `getItemLayout` on habit list (fixed height rows)
- `InteractionManager.runAfterInteractions` for non-critical startup work
- Zustand selectors — components only subscribe to the slice they need

---

## 16. Implementation Instructions for Claude Code

### How to use this README

This README is the complete specification for HabitForge. Follow these instructions exactly:

### Setup commands
```bash
npx create-expo-app HabitForge --template blank-typescript
cd HabitForge
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
npm install zustand
npm install react-native-mmkv
npm install @testing-library/react-native
npx expo install expo-haptics  # for check-in haptic feedback
```

### Implementation order
Implement in this exact order — each step builds on the previous:

```
1. src/theme/theme.ts + darkTheme.ts + useTheme.ts
2. src/features/habits/types.ts
3. src/shared/utils/dateUtils.ts + tests
4. src/features/habits/utils/streakCalculator.ts + tests
5. src/features/habits/utils/heatmapTransformer.ts + tests
6. src/features/habits/utils/milestoneChecker.ts + tests
7. src/features/habits/store/useHabitStore.ts
8. src/navigation/ (all navigation files)
9. src/shared/components/ (Button, ProgressBar, Card, ErrorBoundary)
10. src/features/habits/components/HeatmapGrid/ + HeatmapCell/
11. src/features/habits/components/StreakCounter/
12. src/features/habits/components/CheckInButton/
13. src/features/habits/components/HabitCard/ (compound component)
14. src/features/habits/components/MilestoneCelebration/
15. src/features/habits/components/SwipeableHabitCard/
16. src/features/habits/screens/CreateHabitScreen.tsx
17. src/features/habits/screens/HabitDetailScreen.tsx
18. src/features/habits/screens/HomeScreen.tsx
19. src/features/settings/screens/SettingsScreen.tsx
20. App.tsx (root setup with all providers)
```

### Code style requirements
- **Every file must have a comment block at the top** explaining:
  - What concept from the RN learning plan this demonstrates
  - Why this approach was chosen over alternatives
  - Any gotchas or things to watch out for
- **Every non-obvious line must have an inline comment**
- Use TypeScript strictly — no `any` types anywhere
- Follow the feature-based folder structure exactly as specified
- Every component must have a corresponding `.test.tsx` file
- Use the theme system for all colors — no hardcoded hex values in components

### Dark mode
The app must support dark mode automatically. Use `useTheme()` for all colors. Test both modes.

### Seed data
Include a `seedData.ts` file with 3 pre-created habits and 60 days of completions so the app looks populated on first launch during development and demos.

---

---

## 17. Multi-Session Implementation Guide

### Why multiple sessions are needed
HabitForge is ~3,000-5,000 lines of code across 20+ files. Claude Code has a context window limit — attempting to build everything in one session causes the model to lose track of earlier files and produce inconsistent code around step 10-12. Four focused sessions produce better, more consistent code than one overloaded session.

---

### Session 1 — Foundation
**Steps:** 1-8
**Covers:** theme, types, date utils, streak calculator, heatmap transformer, milestone checker, Zustand store, navigation

**Start prompt for Claude Code:**
```
I am building HabitForge, a React Native habit tracking app.
Here is the complete README spec: [attach README]

Please implement Session 1 — Foundation (steps 1-8 from Section 16):
1. src/theme/theme.ts + darkTheme.ts + useTheme.ts
2. src/features/habits/types.ts
3. src/shared/utils/dateUtils.ts + tests
4. src/features/habits/utils/streakCalculator.ts + tests
5. src/features/habits/utils/heatmapTransformer.ts + tests
6. src/features/habits/utils/milestoneChecker.ts + tests
7. src/features/habits/store/useHabitStore.ts
8. src/navigation/ (all navigation files)

Requirements:
- Add comments everywhere explaining the RN concept each file demonstrates
- No any types — strict TypeScript throughout
- Every utility file must have a corresponding .test.ts file
- Follow the folder structure exactly as specified in Section 5
- Use the data models exactly as specified in Section 6
- End state: app should run with empty screens and working navigation

Run npm test after completing utils to confirm all tests pass.
```

**End state check:** Run `npx expo start` — app opens, tabs visible, navigation works, no errors.

---

### Session 2 — Core Components
**Steps:** 9-13
**Covers:** shared components, HeatmapGrid, StreakCounter, CheckInButton, HabitCard compound component

**Start prompt for Claude Code:**
```
I am continuing building HabitForge. Session 1 is complete.
Here is the complete README spec: [attach README]

The following files already exist and are working:
- src/theme/ (complete)
- src/features/habits/types.ts (complete)
- src/shared/utils/dateUtils.ts (complete)
- src/features/habits/utils/ (all complete with tests)
- src/features/habits/store/useHabitStore.ts (complete)
- src/navigation/ (complete)

Please implement Session 2 — Core Components (steps 9-13 from Section 16):
9.  src/shared/components/ (Button, ProgressBar, Card, ErrorBoundary)
10. src/features/habits/components/HeatmapGrid/ + HeatmapCell/
11. src/features/habits/components/StreakCounter/
12. src/features/habits/components/CheckInButton/
13. src/features/habits/components/HabitCard/ (compound component)

Requirements:
- HabitCard must use the compound component pattern as specified in Section 10
- CheckInButton must use Reanimated 3 withSpring as specified in Section 13
- HeatmapGrid must use React.memo on HeatmapCell and useMemo on data transformation
- Every component must have a .test.tsx file
- Add comments explaining the RN concept each component demonstrates
- Use theme colors exclusively — no hardcoded hex values

End state: all components render correctly with mock data in a test screen.
```

**End state check:** Create a temporary `TestScreen.tsx` that renders all components with mock data — confirm they all display correctly.

---

### Session 3 — Screens and Animations
**Steps:** 14-18
**Covers:** MilestoneCelebration, SwipeableHabitCard, CreateHabitScreen, HabitDetailScreen, HomeScreen

**Start prompt for Claude Code:**
```
I am continuing building HabitForge. Sessions 1 and 2 are complete.
Here is the complete README spec: [attach README]

All foundation files, utils, store, navigation, and core components
are complete. Please implement Session 3 — Screens and Animations
(steps 14-18 from Section 16):

14. src/features/habits/components/MilestoneCelebration/
15. src/features/habits/components/SwipeableHabitCard/
16. src/features/habits/screens/CreateHabitScreen.tsx
17. src/features/habits/screens/HabitDetailScreen.tsx
18. src/features/habits/screens/HomeScreen.tsx

Requirements:
- MilestoneCelebration must use Reanimated BounceIn entering animation
  and auto-dismiss after 3 seconds
- SwipeableHabitCard must use Gesture Handler pan gesture with
  runOnJS for the delete callback as specified in Section 13
- HomeScreen must use React.memo on HabitCard, useCallback on handlers,
  useMemo on today's completions filter, and getItemLayout on FlatList
- HabitDetailScreen must show the HeatmapGrid scrollable over 12 weeks
- CreateHabitScreen must use the useHabitForm custom hook
- All screens must handle loading, empty, and error states
- Add comments explaining performance optimizations in HomeScreen

End state: complete app flow works — create habit → home screen →
check in → streak updates → detail screen → heatmap visible.
```

**End state check:** Full user flow works end to end. Create a habit, check it in, see streak update, open detail, see heatmap.

---

### Session 4 — Polish and Completion
**Steps:** 19-20 + seed data + dark mode + bug fixes
**Covers:** SettingsScreen, App.tsx root setup, seed data, dark mode verification, test coverage

**Start prompt for Claude Code:**
```
I am completing HabitForge. Sessions 1, 2, and 3 are complete.
Here is the complete README spec: [attach README]

The full app is working. Please implement Session 4 — Polish
(steps 19-20 from Section 16 plus final requirements):

19. src/features/settings/screens/SettingsScreen.tsx
20. App.tsx — root setup with all providers in correct order:
    GestureHandlerRootView → NavigationContainer → ErrorBoundary

Additional requirements:
- Create src/seedData.ts with 3 pre-built habits and 60 days of
  completions so the app looks populated on first launch
- Verify dark mode works on every screen — test with
  useColorScheme returning "dark"
- Run full test suite with npm test — all tests must pass
- Add haptic feedback on check-in using expo-haptics
- Add streak freeze UI to HabitCard — show if available,
  trigger useStreakFreeze action when tapped
- Performance audit: confirm React.memo, useCallback, useMemo
  are applied everywhere specified in Section 15
- Final README update: add actual screenshots placeholder section

End state: production-ready app. npm test passes.
npx expo start runs without warnings. Dark mode works.
Seed data makes the app look great on first launch.
```

**End state check:** Run `npm test` — all tests pass. Run `npx expo start` — no warnings. Toggle dark mode — every screen looks correct.

---

### Handoff checklist between sessions

Before ending each session, ask Claude Code to confirm:

```
Before we end this session, please:
1. Run npm test and confirm all tests pass
2. List every file created in this session
3. List any TODOs or known issues for the next session
4. Confirm the app runs without errors with npx expo start
```

This gives you a clean handoff document to start the next session with.

---

### If Claude Code loses context mid-session

If Claude Code starts making decisions inconsistent with the README (wrong folder structure, missing types, different state management approach), stop and say:

```
Please re-read the README spec, specifically:
- Section 5 (Project Structure)
- Section 6 (Data Models)
- Section 8 (State Management)

Then continue from where we left off.
```

Always keep the README open and reference it — it's the source of truth.

---

*HabitForge — built as an educational React Native reference implementation*
*Every pattern, every hook, every animation is intentional and documented*

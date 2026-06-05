# HabitForge 🔥
### Build habits that stick — streak tracking, heatmaps, and milestone celebrations

> A fully-featured React Native habit tracker built with **Expo SDK 56**, **Zustand**, **Reanimated 4**, **Gesture Handler**, and **MMKV** — demonstrating every major React Native concept from navigation to 60fps animations.

---

## Screenshots

<!-- Add simulator / device screenshots here -->

| Home | Detail | Milestones | Settings |
|------|--------|------------|----------|
| *coming soon* | *coming soon* | *coming soon* | *coming soon* |

---

## Features

- 🔥 **Streak system** — daily, weekly, and custom (X times/week) frequency modes, each with their own streak logic
- 🛡️ **Streak freeze** — one freeze per week to protect against a single missed day
- 📊 **GitHub-style heatmap** — 12-week contribution grid showing your full history at a glance
- 🏆 **Milestone badges** — 7, 30, 100, 365-day milestones with full-screen animated celebrations
- 📱 **Swipe to archive/delete** — 60fps pan gesture with snap physics
- 🌗 **Dark mode** — auto-follows OS or manually overrideable in Settings
- ⚡ **Instant storage** — MMKV synchronous reads mean zero loading flash on startup

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 56 |
| Language | TypeScript (strict, no `any`) |
| Navigation | React Navigation v6 (stack + bottom tabs) |
| State | Zustand with persist middleware |
| Storage | MMKV v4 (synchronous, fast) |
| Animations | Reanimated 4 + Gesture Handler |
| Testing | Jest + React Native Testing Library |

---

## React Native Concepts Demonstrated

This codebase is intentionally structured to showcase every concept from a full React Native learning path:

| Concept | Where |
|---|---|
| TypeScript interfaces + discriminated unions | `src/features/habits/types.ts` |
| Zustand global state + MMKV persistence | `src/features/habits/store/useHabitStore.ts` |
| Custom hooks | `useStreak`, `useHeatmap`, `useHabitForm`, `useTodayProgress` |
| React.memo + useCallback + useMemo | `HomeScreen.tsx` — all five performance pillars |
| getItemLayout on FlatList | `HomeScreen.tsx` — fixed-height rows, no async measurement |
| Compound component pattern | `HabitCard/` — HabitCard.Header, .Progress, .Streak, .Footer |
| Reanimated 4 spring animations | `CheckInButton.tsx`, `MilestoneCelebration.tsx` |
| Gesture Handler pan gesture | `SwipeableHabitCard.tsx` — UI-thread swipe with runOnJS |
| Error boundary (class component) | `ErrorBoundary.tsx` |
| Feature-based folder structure | `src/features/habits/` |
| Theme system (light + dark) | `src/theme/` |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Xcode 15+ (for iOS)
- CocoaPods

### Install

```bash
git clone https://github.com/zeyadBadawy/HabitForge.git
cd HabitForge
npm install
```

### Run on iOS

```bash
npx expo run:ios
```

> **Note:** This project uses `react-native-nitro-modules` (via Reanimated 4), which requires a **native development build** — Expo Go will not work.

### Run tests

```bash
npm test
```

All **128 tests** pass across 13 test suites.

---

## Project Structure

```
src/
├── features/
│   ├── habits/
│   │   ├── components/     # HabitCard, CheckInButton, HeatmapGrid,
│   │   │                   # StreakCounter, MilestoneCelebration, SwipeableHabitCard
│   │   ├── hooks/          # useStreak, useHeatmap, useHabitForm, useTodayProgress
│   │   ├── screens/        # HomeScreen, HabitDetailScreen, CreateHabitScreen
│   │   ├── store/          # useHabitStore (Zustand + MMKV)
│   │   ├── utils/          # streakCalculator, heatmapTransformer, milestoneChecker
│   │   └── types.ts
│   └── settings/
│       ├── screens/        # SettingsScreen (theme toggle)
│       └── store/          # useSettingsStore (theme preference)
├── navigation/             # RootNavigator, HabitsNavigator, types
├── shared/
│   ├── components/         # Button, Card, ProgressBar, Badge, ErrorBoundary
│   └── utils/              # dateUtils
└── theme/                  # theme.ts, darkTheme.ts, useTheme.ts
```

---

## Architecture Highlights

### Streak Calculator
Pure functions — no side effects, fully unit-tested. Handles three cadences:
- **Daily**: consecutive days, with streak-freeze support
- **Weekly**: consecutive ISO weeks with at least one completion
- **Custom**: consecutive weeks where `count ≥ timesPerWeek`

### Performance — HomeScreen's Five Pillars
1. `HabitRow` defined **outside** `HomeScreen` (stable component type → memo works)
2. `useCallback` on every handler (stable references to every row)
3. `useMemo` on `todayCompletions` filter (only refilters on actual check-ins)
4. `getItemLayout` on `FlatList` (fixed height → skips async measurement)
5. Custom `React.memo` comparator (excludes stable handler identity)

### SwipeableHabitCard
Three-layer gesture pattern used in all professional swipe UIs:
- **Gesture Handler** `Gesture.Pan()` — runs entirely on the UI thread
- **Reanimated** `useSharedValue` + `useAnimatedStyle` — frame-perfect translation
- **`runOnJS`** — safely bridges UI-thread gesture callbacks to JS store actions

---

## Seed Data

On first launch the app loads three pre-built habits with 60 days of history so you see real UI states immediately:
- **Morning Run** 🏃 — 35-day streak, 7-day and 30-day milestones earned
- **Read 30 min** 📚 — 7-day streak, first milestone just hit
- **Meditate** 🧘 — 5-week streak (weekly frequency)

---

## License

MIT

/**
 * CONCEPT: The main list screen — combines React performance optimizations
 * to ensure smooth scrolling even with many habit cards.
 *
 * PERFORMANCE OPTIMIZATIONS (the five pillars):
 *
 * 1. HabitRow IS React.memo (defined OUTSIDE HomeScreen).
 *    If defined inside the screen component, React recreates the component
 *    type on every HomeScreen render — that unmounts + remounts every card,
 *    losing animation state and defeating memo entirely.
 *    Defined outside, the type is stable for the lifetime of the module.
 *
 * 2. useCallback on every event handler in HomeScreen.
 *    Handlers take `habitId: string` rather than capturing it in a closure,
 *    so the same stable function reference is passed to every HabitRow.
 *    Inside HabitRow, `useCallback(() => onCheckIn(habit.id), [onCheckIn, habit.id])`
 *    creates a stable bound version — cheap because `habit.id` never changes.
 *
 * 3. useMemo on today's completions filter.
 *    `todayCompletions` is computed once from the raw completions array and
 *    only recalculates when the array reference changes (i.e. after a check-in).
 *    Without this, the filter would run on every HomeScreen render.
 *
 * 4. getItemLayout — tells FlatList the pixel height of each row without
 *    measuring it. FlatList uses this for scroll-to-index, initial scroll
 *    position, and to skip async layout measurement on mount.
 *    IMPORTANT: ITEM_HEIGHT must match the actual rendered height.
 *
 * 5. Custom React.memo comparator on HabitRow.
 *    Only re-renders when the habit object, completions array, or
 *    isCompletedToday boolean changes — not on every HomeScreen render.
 *    Handler identity is excluded from the comparator because the handlers
 *    are bound to `habit.id` inside HabitRow with their own useCallback.
 *
 * MILESTONE CELEBRATION:
 *   `pendingCelebration` in the Zustand store is set by `checkIn()` when a
 *   milestone threshold is crossed. HomeScreen renders MilestoneCelebration
 *   as a transparent Modal overlay. When the animation ends or the user taps,
 *   `celebrateMilestone()` clears `pendingCelebration`.
 *
 * HAPTICS:
 *   `Haptics.impactAsync(Medium)` fires on every successful check-in to give
 *   tactile confirmation. It's called after `checkIn()` to avoid blocking the
 *   state update in case haptics permission is denied.
 */

import React, { useCallback, useMemo } from "react"
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  type ListRenderItemInfo,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import * as Haptics from "expo-haptics"
import type { HabitsStackParamList } from "../../../navigation/types"
import type { IHabit, ICompletion } from "../types"
import { useHabitStore } from "../store/useHabitStore"
import { useStreak } from "../hooks/useStreak"
import { useTodayProgress, type TodayProgress } from "../hooks/useTodayProgress"
import HabitCard from "../components/HabitCard"
import CheckInButton from "../components/CheckInButton"
import SwipeableHabitCard from "../components/SwipeableHabitCard"
import MilestoneCelebration from "../components/MilestoneCelebration"
import ProgressBar from "../../../shared/components/ProgressBar"
import { useTheme } from "../../../theme/useTheme"
import { spacing, typography, borderRadius, type Theme } from "../../../theme/theme"
import { getTodayDateString } from "../../../shared/utils/dateUtils"

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

/**
 * Fixed pixel height for each HabitRow (SwipeableHabitCard wrapper included).
 * Breakdown:
 *   card vertical padding        = spacing.md * 2 = 32
 *   header row (~emoji 24)       = ~48   (emoji + name + freq label)
 *   progress bar section         = ~34   (labels + bar + margin)
 *   footer row                   = ~36   (streak + check-in button)
 *   SwipeableHabitCard.container
 *     marginBottom (spacing.sm)  = 8     (gap between cards)
 *   ────────────────────────────────
 *   total ≈ 158
 *
 * NOTE: HabitCard itself has no marginBottom — the gap is provided by the
 * SwipeableHabitCard container. See SwipeableHabitCard/styles for details.
 *
 * Must stay in sync with the actual layout — if cards grow or shrink,
 * update this constant to keep getItemLayout accurate.
 */
const ITEM_HEIGHT = 158

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<HabitsStackParamList, "Home">

interface HabitRowProps {
  habit: IHabit
  /** ALL completions — HabitCard.Progress and useStreak filter by habitId internally */
  completions: ICompletion[]
  isCompletedToday: boolean
  /** Stable useCallback refs from HomeScreen — take habitId as the argument */
  onPress: (habitId: string) => void
  onCheckIn: (habitId: string) => void
  onUseFreeze: (habitId: string) => void
  onDelete: (habitId: string) => void
  onArchive: (habitId: string) => void
}

// ─────────────────────────────────────────────────────────────────
// HABIT ROW
// Defined outside HomeScreen so React never recreates the component
// type during HomeScreen re-renders — a prerequisite for React.memo
// to work correctly on FlatList items.
// ─────────────────────────────────────────────────────────────────

const HabitRowBase: React.FC<HabitRowProps> = ({
  habit,
  completions,
  isCompletedToday,
  onPress,
  onCheckIn,
  onUseFreeze,
  onDelete,
  onArchive,
}) => {
  // useStreak is a hook — valid here because HabitRowBase is a real component.
  // It recomputes only when the completions array reference or the habit changes.
  const streak = useStreak(habit.id)

  // Bind the habitId to each stable handler from HomeScreen.
  // These useCallbacks are cheap: `habit.id` is a string constant for the
  // lifetime of this item, and the parent handlers are stable references.
  const handlePress     = useCallback(() => onPress(habit.id),     [onPress, habit.id])
  const handleCheckIn   = useCallback(() => onCheckIn(habit.id),   [onCheckIn, habit.id])
  const handleUseFreeze = useCallback(() => onUseFreeze(habit.id), [onUseFreeze, habit.id])
  const handleDelete    = useCallback(() => onDelete(habit.id),    [onDelete, habit.id])
  const handleArchive   = useCallback(() => onArchive(habit.id),   [onArchive, habit.id])

  return (
    <SwipeableHabitCard onDelete={handleDelete} onArchive={handleArchive}>
      <HabitCard habit={habit} onPress={handlePress}>
        <HabitCard.Header habit={habit} />
        <HabitCard.Progress habit={habit} completions={completions} />
        <HabitCard.Footer>
          <HabitCard.Streak
            streak={streak}
            habit={habit}
            onUseFreeze={handleUseFreeze}
          />
          <CheckInButton
            isCompleted={isCompletedToday}
            onPress={handleCheckIn}
          />
        </HabitCard.Footer>
      </HabitCard>
    </SwipeableHabitCard>
  )
}

/**
 * Custom memo comparator — re-render only when data that affects display changes.
 *
 * Intentionally excluded from comparison:
 *   • onPress / onCheckIn / etc — these are stable references from HomeScreen's
 *     useCallback AND are bound to `habit.id` inside HabitRowBase, so even if
 *     the handler identity changed, the internal callbacks would be stable.
 *
 * Result: a card re-renders only when:
 *   • Its habit object changes (name, color, emoji, frequency edited)
 *   • Any completion is added/removed (completions array reference changes)
 *   • Its today-completion status flips (checked in or undone)
 */
const HabitRow = React.memo(HabitRowBase, (prev, next) =>
  prev.habit            === next.habit &&
  prev.completions      === next.completions &&
  prev.isCompletedToday === next.isCompletedToday
)

// ─────────────────────────────────────────────────────────────────
// HOME HEADER — extracted so it can be memoized as ListHeaderComponent
// ─────────────────────────────────────────────────────────────────

interface HomeHeaderProps {
  greeting: string
  progress: TodayProgress
  theme: Theme
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ greeting, progress, theme }) => (
  <View style={styles.headerContainer}>
    {/* App title + greeting */}
    <Text style={[styles.greeting, { color: theme.textSecondary }]}>
      {greeting}
    </Text>
    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
      🔥 HabitForge
    </Text>

    {/* Daily progress card — only shown when there are active habits */}
    {progress.total > 0 && (
      <View
        style={[
          styles.progressCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
            Today's progress
          </Text>
          <Text style={[styles.progressCount, { color: theme.textPrimary }]}>
            {progress.completed}/{progress.total}
          </Text>
        </View>
        <ProgressBar
          progress={progress.percentage}
          color={theme.primary}
          height={8}
        />
        {progress.completed === progress.total && progress.total > 0 && (
          <Text style={[styles.progressAllDone, { color: theme.success }]}>
            All done for today! 🎉
          </Text>
        )}
      </View>
    )}

    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
      MY HABITS
    </Text>
  </View>
)

// ─────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  theme: Theme
  onCreate: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ theme, onCreate }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>🌱</Text>
    <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
      No habits yet
    </Text>
    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
      Start building positive routines.{"\n"}Tap + to create your first habit.
    </Text>
    <Pressable
      onPress={onCreate}
      style={[styles.emptyButton, { backgroundColor: theme.primary }]}
      accessibilityLabel="Create first habit"
      accessibilityRole="button"
    >
      <Text style={[styles.emptyButtonLabel, { color: theme.textOnPrimary }]}>
        Create a habit
      </Text>
    </Pressable>
  </View>
)

// ─────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()

  // ── Store subscriptions ────────────────────────────────────────
  // Each subscription is as narrow as possible — components subscribed to
  // `habits` only re-render when `habits` changes, not when `completions` does.
  const habits             = useHabitStore((s) => s.habits)
  const completions        = useHabitStore((s) => s.completions)
  const pendingCelebration = useHabitStore((s) => s.pendingCelebration)
  const checkIn            = useHabitStore((s) => s.checkIn)
  const undoCheckIn        = useHabitStore((s) => s.undoCheckIn)
  const useStreakFreeze     = useHabitStore((s) => s.useStreakFreeze)
  const deleteHabit        = useHabitStore((s) => s.deleteHabit)
  const archiveHabit       = useHabitStore((s) => s.archiveHabit)
  const celebrateMilestone = useHabitStore((s) => s.celebrateMilestone)

  // ── Derived data ───────────────────────────────────────────────

  /** Only non-archived habits are shown on the home screen. */
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.isArchived),
    [habits]
  )

  /** Overall progress bar in the header (X of Y done today). */
  const todayProgress = useTodayProgress()

  /**
   * Today's completions — memoized so we only refilter when the completions
   * array reference changes (i.e. on actual check-ins), not on every render.
   */
  const today = getTodayDateString()
  const todayCompletions = useMemo(
    () => completions.filter((c) => c.completedAt.startsWith(today)),
    [completions, today]
  )

  /** Greeting text — derived from current hour, stable within a session. */
  const greeting = getGreeting()

  // ── Handlers — all wrapped in useCallback ─────────────────────
  // Handlers take `habitId: string` so the same function reference works
  // for every HabitRow. Arrow functions inside renderItem would create new
  // references on every FlatList render, defeating HabitRow's memo.

  const handleCheckIn = useCallback(
    (habitId: string) => {
      const alreadyDone = todayCompletions.some((c) => c.habitId === habitId)
      if (alreadyDone) {
        // Toggle: second tap undoes the check-in
        undoCheckIn(habitId)
      } else {
        checkIn(habitId)
        // Tactile feedback makes the check-in feel satisfying
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      }
    },
    [todayCompletions, checkIn, undoCheckIn]
  )

  const handleUseFreeze = useCallback(
    (habitId: string) => {
      useStreakFreeze(habitId)
    },
    [useStreakFreeze]
  )

  const handlePress = useCallback(
    (habitId: string) => {
      navigation.push("HabitDetail", { habitId })
    },
    [navigation]
  )

  const handleDelete = useCallback(
    (habitId: string) => {
      Alert.alert(
        "Delete habit",
        "Delete this habit and all its history? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteHabit(habitId),
          },
        ]
      )
    },
    [deleteHabit]
  )

  const handleArchive = useCallback(
    (habitId: string) => {
      archiveHabit(habitId)
    },
    [archiveHabit]
  )

  const handleDismissCelebration = useCallback(() => {
    if (pendingCelebration) {
      celebrateMilestone(pendingCelebration.id)
    }
  }, [pendingCelebration, celebrateMilestone])

  const handleCreateHabit = useCallback(() => {
    navigation.push("CreateHabit", {})
  }, [navigation])

  // ── FlatList helpers ───────────────────────────────────────────

  /** Stable key extractor — avoids creating a new function on every render. */
  const keyExtractor = useCallback((item: IHabit) => item.id, [])

  /**
   * getItemLayout — FlatList calls this instead of measuring each row.
   * Enables scroll-to-index, scroll-to-offset, and initial scroll position,
   * and skips the async layout-measurement pass on first mount.
   *
   * The `_data` parameter is unused but required by the FlatList API.
   */
  const getItemLayout = useCallback(
    (_data: ArrayLike<IHabit> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  )

  /**
   * renderItem — wrapped in useCallback so FlatList doesn't see a new prop
   * reference on every HomeScreen render.
   *
   * `isCompletedToday` is computed inline from the memoized `todayCompletions`
   * — it's a boolean so React.memo's comparator catches changes cheaply.
   *
   * `completions` (full array) is passed to HabitRow rather than filtering
   * here, because the filtered result would be a new array reference on every
   * renderItem call, defeating HabitRow's memo comparator.
   */
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IHabit>) => {
      const isCompletedToday = todayCompletions.some((c) => c.habitId === item.id)
      return (
        <HabitRow
          habit={item}
          completions={completions}
          isCompletedToday={isCompletedToday}
          onPress={handlePress}
          onCheckIn={handleCheckIn}
          onUseFreeze={handleUseFreeze}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )
    },
    [
      completions,
      todayCompletions,
      handlePress,
      handleCheckIn,
      handleUseFreeze,
      handleDelete,
      handleArchive,
    ]
  )

  /** Header memoized — avoids re-rendering the header section on every list scroll. */
  const listHeader = useMemo(
    () => <HomeHeader greeting={greeting} progress={todayProgress} theme={theme} />,
    [greeting, todayProgress, theme]
  )

  /** Empty state memoized — only re-renders if theme changes. */
  const listEmpty = useMemo(
    () => <EmptyState theme={theme} onCreate={handleCreateHabit} />,
    [theme, handleCreateHabit]
  )

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Main list ───────────────────────────────────────────── */}
      <FlatList
        data={activeHabits}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // removeClippedSubviews reduces memory for very long lists (100+ habits)
        removeClippedSubviews
      />

      {/* ── Floating action button ───────────────────────────────── */}
      <Pressable
        onPress={handleCreateHabit}
        style={[styles.fab, { backgroundColor: theme.primary }]}
        accessibilityLabel="Create new habit"
        accessibilityRole="button"
      >
        <Text style={[styles.fabIcon, { color: theme.textOnPrimary }]}>+</Text>
      </Pressable>

      {/* ── Milestone celebration overlay ────────────────────────── */}
      {/* Rendered as a Modal inside MilestoneCelebration — sits above everything */}
      {pendingCelebration && (
        <MilestoneCelebration
          milestone={pendingCelebration}
          onDismiss={handleDismissCelebration}
        />
      )}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Returns a time-appropriate greeting. Recalculated each mount — good enough. */
const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    // Extra padding at the bottom so the last card is not hidden behind the FAB
    paddingBottom: spacing.xxl + spacing.xl,
  },

  // ── Header ────────────────────────────────────────────────────
  headerContainer: {
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.sm,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.xl + 4,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  progressCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.sm,
    fontWeight: "500",
  },
  progressCount: {
    fontSize: typography.sm,
    fontWeight: "700",
  },
  progressAllDone: {
    fontSize: typography.sm,
    fontWeight: "500",
    marginTop: spacing.xs,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  // ── Empty state ────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: typography.md,
    textAlign: "center",
    lineHeight: typography.md * 1.6,
  },
  emptyButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  emptyButtonLabel: {
    fontSize: typography.md,
    fontWeight: "600",
  },

  // ── FAB (floating action button) ──────────────────────────────
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Android elevation
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 34,
  },
})

export default HomeScreen

/**
 * CONCEPT: Derived-state screen — everything displayed is computed from the
 * Zustand store; the screen holds no local state of its own (except the
 * alert confirmation flag).
 *
 * HOOKS USED:
 *  useStreak   → computes current + longest streak from completions
 *  useHeatmap  → builds the 12-week contribution grid
 *  Both are memoized custom hooks so they only recompute when the underlying
 *  completions array actually changes.
 *
 * SCROLLABLE HEATMAP:
 *  The HeatmapGrid is rendered inside a horizontal ScrollView. The grid is
 *  12 weeks wide by default — on small screens it overflows and the user
 *  scrolls horizontally to see older weeks.
 *
 * MILESTONE LIST:
 *  All four milestone thresholds are always displayed (locked or unlocked).
 *  We use MILESTONE_THRESHOLDS from the checker util to drive the list so
 *  new thresholds automatically appear if the array grows in the future.
 *
 * EDIT / ARCHIVE / DELETE:
 *  Edit → pushes CreateHabit with the habitId param (edit mode)
 *  Archive → calls archiveHabit and pops back to Home
 *  Delete → shows a confirm Alert, then calls deleteHabit + goBack
 */

import React, { useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { HabitsStackParamList } from "../../../navigation/types"
import { useHabitStore } from "../store/useHabitStore"
import { useShallow } from "zustand/shallow"
import { useStreak } from "../hooks/useStreak"
import { useHeatmap } from "../hooks/useHeatmap"
import { MILESTONE_THRESHOLDS } from "../utils/milestoneChecker"
import { MILESTONE_LABELS, MILESTONE_EMOJIS } from "../types"
import HeatmapGrid from "../components/HeatmapGrid"
import Badge from "../../../shared/components/Badge"
import { useTheme } from "../../../theme/useTheme"
import { spacing, typography, borderRadius } from "../../../theme/theme"
import { formatDate } from "../../../shared/utils/dateUtils"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<HabitsStackParamList, "HabitDetail">

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const HabitDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme   = useTheme()
  const habitId = route.params.habitId

  // ── Store subscriptions ────────────────────────────────────────
  const habit        = useHabitStore((s) => s.habits.find((h) => h.id === habitId))
  const milestones   = useHabitStore(useShallow((s) => s.milestones.filter((m) => m.habitId === habitId)))
  const completions  = useHabitStore(useShallow((s) => s.completions.filter((c) => c.habitId === habitId)))
  const archiveHabit = useHabitStore((s) => s.archiveHabit)
  const deleteHabit  = useHabitStore((s) => s.deleteHabit)

  // ── Derived data (memoized custom hooks) ──────────────────────
  const streak  = useStreak(habitId)
  // 12 weeks of history, scrollable horizontally in the HeatmapGrid
  const heatmap = useHeatmap(habitId, 12)

  // ── Guard: habit not found (e.g. deleted while screen is open) ─
  if (!habit) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
          Habit not found
        </Text>
      </View>
    )
  }

  // ── Handlers ──────────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    navigation.push("CreateHabit", { habitId })
  }, [navigation, habitId])

  const handleArchive = useCallback(() => {
    Alert.alert(
      "Archive habit",
      `Archive "${habit.name}"? Your streak history is kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: () => {
            archiveHabit(habitId)
            navigation.goBack()
          },
        },
      ]
    )
  }, [habit.name, habitId, archiveHabit, navigation])

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete habit",
      `Delete "${habit.name}" and all its history? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteHabit(habitId)
            navigation.goBack()
          },
        },
      ]
    )
  }, [habit.name, habitId, deleteHabit, navigation])

  // Total completions count
  const totalCompletions = completions.length

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HABIT HEADER ───────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { backgroundColor: habit.color + "22", borderColor: habit.color + "44" },
        ]}
      >
        <View style={[styles.headerAccent, { backgroundColor: habit.color }]} />
        <Text style={styles.headerEmoji}>{habit.emoji}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: theme.textPrimary }]}>
            {habit.name}
          </Text>
          <Text style={[styles.headerFreq, { color: theme.textSecondary }]}>
            {frequencyLabel(habit.frequency.type,
              habit.frequency.type === "custom"
                ? habit.frequency.timesPerWeek
                : undefined)}
          </Text>
        </View>
      </View>

      {/* ── STATS ROW ──────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatBox
          value={streak.current.toString()}
          label="Current streak"
          suffix="🔥"
          theme={theme}
        />
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <StatBox
          value={streak.longest.toString()}
          label="Best streak"
          suffix="🏆"
          theme={theme}
        />
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <StatBox
          value={totalCompletions.toString()}
          label="Total done"
          suffix="✅"
          theme={theme}
        />
      </View>

      {/* ── HEATMAP ────────────────────────────────────────────── */}
      <SectionTitle title="Consistency" theme={theme} />
      <View
        style={[
          styles.heatmapCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* HeatmapGrid is horizontally scrollable for 12+ weeks */}
        <HeatmapGrid completions={completions} weeks={12} />
      </View>

      {/* ── MILESTONES ─────────────────────────────────────────── */}
      <SectionTitle title="Milestones" theme={theme} />
      <View style={styles.milestones}>
        {MILESTONE_THRESHOLDS.map((threshold) => {
          const earned = milestones.find((m) => m.threshold === threshold)
          return (
            <Badge
              key={threshold}
              emoji={MILESTONE_EMOJIS[threshold]}
              label={MILESTONE_LABELS[threshold]}
              sublabel={
                earned
                  ? `Unlocked ${formatDate(earned.unlockedAt)}`
                  : `${threshold}-day streak`
              }
              unlocked={!!earned}
              style={styles.badge}
            />
          )
        })}
      </View>

      {/* ── ACTIONS ────────────────────────────────────────────── */}
      <SectionTitle title="Actions" theme={theme} />
      <View style={styles.actions}>
        <Pressable
          onPress={handleEdit}
          style={[
            styles.actionBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.actionLabel, { color: theme.primary }]}>
            ✏️  Edit habit
          </Text>
        </Pressable>

        <Pressable
          onPress={handleArchive}
          style={[
            styles.actionBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.actionLabel, { color: theme.warning }]}>
            📦  Archive habit
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={[
            styles.actionBtn,
            { backgroundColor: theme.surface, borderColor: theme.danger + "66" },
          ]}
        >
          <Text style={[styles.actionLabel, { color: theme.danger }]}>
            🗑️  Delete habit
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface StatBoxProps {
  value: string
  label: string
  suffix: string
  theme: ReturnType<typeof useTheme>
}

const StatBox: React.FC<StatBoxProps> = ({ value, label, suffix, theme }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color: theme.textPrimary }]}>
      {value}{suffix}
    </Text>
    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
      {label}
    </Text>
  </View>
)

interface SectionTitleProps {
  title: string
  theme: ReturnType<typeof useTheme>
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, theme }) => (
  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
    {title.toUpperCase()}
  </Text>
)

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const frequencyLabel = (
  type: "daily" | "weekly" | "custom",
  timesPerWeek?: number
): string => {
  switch (type) {
    case "daily":  return "Daily"
    case "weekly": return "Weekly"
    case "custom": return `${timesPerWeek}× per week`
  }
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: typography.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    gap: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  headerAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  headerEmoji: {
    fontSize: 40,
    marginLeft: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: typography.xl,
    fontWeight: "700",
  },
  headerFreq: {
    fontSize: typography.sm,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: typography.xs,
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
  },

  // Section title
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  // Heatmap
  heatmapCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: "hidden",
  },

  // Milestones
  milestones: {
    gap: spacing.sm,
  },
  badge: {
    // Badge is full-width in this context — override its default compact style
  },

  // Actions
  actions: {
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  actionLabel: {
    fontSize: typography.md,
    fontWeight: "500",
  },
})

export default HabitDetailScreen

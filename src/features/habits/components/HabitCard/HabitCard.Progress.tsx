/**
 * HabitCard.Progress — sub-component showing this week's completion progress.
 *
 * CONCEPT: Derived data in components — the progress percentage is computed
 * from raw completions inside the component. In a higher-stakes performance
 * scenario you'd compute this in a useMemo at the parent level and pass the
 * result down. For individual cards this computation is negligible.
 *
 * WEEKLY PROGRESS LOGIC:
 *   Daily   → target 7, count = completed days this week
 *   Weekly  → target 1, count = 0 or 1 (did any completion this week?)
 *   Custom  → target = timesPerWeek, count = completions this week
 */

import React from "react"
import { View, Text } from "react-native"
import type { IHabit, ICompletion } from "../../types"
import { useTheme } from "../../../../theme/useTheme"
import { habitCardStyles as styles } from "./styles"
import ProgressBar from "../../../../shared/components/ProgressBar"
import { getWeekStart } from "../../../../shared/utils/dateUtils"

interface ProgressProps {
  habit: IHabit
  completions: ICompletion[]  // all completions for this specific habit
}

/** Returns how many completions fell within the current calendar week */
const getThisWeeksCompletions = (habitId: string, completions: ICompletion[]): number => {
  const weekStart = getWeekStart(new Date())
  return completions.filter(
    (c) => c.habitId === habitId && new Date(c.completedAt) >= weekStart
  ).length
}

/** Returns the completion target for the current week */
const getWeeklyTarget = (habit: IHabit): number => {
  switch (habit.frequency.type) {
    case "daily":
      return 7
    case "weekly":
      return 1
    case "custom":
      return habit.frequency.timesPerWeek
  }
}

const HabitCardProgress: React.FC<ProgressProps> = ({ habit, completions }) => {
  const theme = useTheme()

  const thisWeek = getThisWeeksCompletions(habit.id, completions)
  const target = getWeeklyTarget(habit)
  // Clamp progress to [0, 1] — `thisWeek` can exceed target (extra check-ins)
  const progress = Math.min(thisWeek / target, 1)

  return (
    <View style={styles.progressContainer}>
      {/* Labels: "1/3 this week" */}
      <View style={styles.progressLabels}>
        <Text
          style={[styles.progressLabelText, { color: theme.textSecondary }]}
        >
          {thisWeek}/{target} this week
        </Text>
        <Text
          style={[styles.progressLabelText, { color: theme.textSecondary }]}
        >
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={habit.color}
        height={6}
        testID={`progress-bar-${habit.id}`}
      />
    </View>
  )
}

export default HabitCardProgress

/**
 * HabitCard.Header — sub-component of the compound HabitCard.
 * Shows the habit emoji, name, and frequency label.
 *
 * CONCEPT: Sub-components are normal React components attached as
 * properties of the parent component. They share the same file boundary
 * (co-located) but are independently composable.
 */

import React from "react"
import { View, Text } from "react-native"
import type { IHabit } from "../../types"
import { useTheme } from "../../../../theme/useTheme"
import { habitCardStyles as styles } from "./styles"

interface HeaderProps {
  habit: IHabit
}

/** Formats a frequency descriptor for display below the habit name */
const frequencyLabel = (habit: IHabit): string => {
  switch (habit.frequency.type) {
    case "daily":
      return "Daily"
    case "weekly":
      return "Weekly"
    case "custom":
      return `${habit.frequency.timesPerWeek}× per week`
  }
}

const HabitCardHeader: React.FC<HeaderProps> = ({ habit }) => {
  const theme = useTheme()

  return (
    <View style={styles.header}>
      {/* Emoji — displayed at a larger size for quick visual scanning */}
      <Text style={styles.emoji}>{habit.emoji}</Text>

      <View style={styles.headerText}>
        <Text
          style={[styles.habitName, { color: theme.textPrimary }]}
          numberOfLines={1} // truncate with ellipsis if too long
        >
          {habit.name}
        </Text>
        <Text
          style={[styles.frequencyLabel, { color: theme.textSecondary }]}
        >
          {frequencyLabel(habit)}
        </Text>
      </View>
    </View>
  )
}

export default HabitCardHeader

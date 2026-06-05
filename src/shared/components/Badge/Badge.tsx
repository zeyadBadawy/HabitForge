/**
 * CONCEPT: Conditional rendering + styled pill components.
 * Badge demonstrates how to change visual appearance based on boolean props
 * without conditional JSX branches — just conditional style arrays.
 *
 * Used for milestone badges (🔥 On Fire, ⚡ Electric, etc.) in HabitDetailScreen.
 *
 * PATTERN: style={[base, variant === "locked" && styles.locked]}
 * Falsy values in style arrays are ignored by React Native's StyleSheet,
 * so conditional styles are safe to write this way.
 */

import React from "react"
import { View, Text, StyleSheet, type ViewStyle } from "react-native"
import { useTheme } from "../../../theme/useTheme"
import { spacing, borderRadius, typography } from "../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface BadgeProps {
  emoji: string
  label: string
  sublabel?: string         // e.g. "Unlocked May 1" or "Locked"
  unlocked: boolean
  style?: ViewStyle
  testID?: string
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const Badge: React.FC<BadgeProps> = ({
  emoji,
  label,
  sublabel,
  unlocked,
  style,
  testID,
}) => {
  const theme = useTheme()

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: unlocked ? theme.surface : theme.background,
          borderColor: unlocked ? theme.primary : theme.border,
          // Locked badges are dimmed to signal they're not yet earned
          opacity: unlocked ? 1 : 0.5,
        },
        style,
      ]}
    >
      {/* Emoji scales up on unlock in the MilestoneCelebration component */}
      <Text style={styles.emoji}>{unlocked ? emoji : "🔒"}</Text>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.label,
            { color: unlocked ? theme.textPrimary : theme.textSecondary },
          ]}
        >
          {label}
        </Text>

        {sublabel ? (
          <Text style={[styles.sublabel, { color: theme.textSecondary }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: typography.lg,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  sublabel: {
    fontSize: typography.xs,
    marginTop: 2,
  },
})

export default Badge

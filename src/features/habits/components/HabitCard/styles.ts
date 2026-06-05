/**
 * Co-located styles — kept in a separate file to keep HabitCard.tsx readable.
 * This is the recommended pattern when a component's styles exceed ~10 rules.
 *
 * GOTCHA: StyleSheet.create() validates style keys at development time
 * and optimises style objects for transfer across the JS-Native bridge.
 * Always prefer StyleSheet.create over plain objects.
 */

import { StyleSheet } from "react-native"
import { spacing, borderRadius, typography } from "../../../../theme/theme"

export const habitCardStyles = StyleSheet.create({
  // ─── Root card container ─────────────────────────────────────────
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    // marginBottom is intentionally omitted here.
    // SwipeableHabitCard.container already provides marginBottom: spacing.sm.
    // Having a bottom margin inside the Animated.View creates a transparent gap
    // through which the absolute-positioned action buttons bleed through.
    borderWidth: 1,
    // Shadow applied at render time using theme tokens
  },

  // ─── Color accent bar on the left edge ──────────────────────────
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },

  // ─── Header sub-component ────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: typography.xl,
  },
  headerText: {
    flex: 1,
  },
  habitName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  frequencyLabel: {
    fontSize: typography.xs,
    marginTop: 2,
  },

  // ─── Progress sub-component ──────────────────────────────────────
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressLabelText: {
    fontSize: typography.xs,
  },

  // ─── Footer row (streak + check-in button) ───────────────────────
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // ─── Streak sub-component ────────────────────────────────────────
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  streakLabel: {
    fontSize: typography.xs,
  },
})

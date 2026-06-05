/**
 * CONCEPT: Compound component pattern — a family of components that work
 * together, attached as properties on the parent component.
 *
 * USAGE:
 *   <HabitCard onPress={handlePress} habit={habit}>
 *     <HabitCard.Header habit={habit} />
 *     <HabitCard.Progress habit={habit} completions={completions} />
 *     <HabitCard.Footer>
 *       <HabitCard.Streak streak={streak} habit={habit} />
 *       <CheckInButton isCompleted={done} onPress={handleCheckIn} />
 *     </HabitCard.Footer>
 *   </HabitCard>
 *
 * WHY COMPOUND COMPONENTS:
 * The HomeScreen and HabitDetailScreen use HabitCard differently:
 *   - Home: shows Header + Progress + Streak + CheckInButton
 *   - Detail: only shows Header + Streak (no check-in button)
 *
 * Instead of a pile of boolean props (showProgress, showCheckIn, showStreak),
 * the caller composes exactly what they need. This is more flexible AND
 * more readable.
 *
 * TypeScript typing: the compound type is declared as React.FC<Props> & { ... }
 * so `HabitCard.Header`, `HabitCard.Streak`, etc. are valid TypeScript.
 *
 * PERFORMANCE: Wrapped in React.memo so a card only re-renders when its
 * own data changes — not when other habits are checked in.
 */

import React from "react"
import { View, TouchableOpacity, type ViewStyle } from "react-native"
import { useTheme } from "../../../../theme/useTheme"
import { shadows } from "../../../../theme/theme"
import { habitCardStyles as styles } from "./styles"
import HabitCardHeader from "./HabitCard.Header"
import HabitCardStreak from "./HabitCard.Streak"
import HabitCardProgress from "./HabitCard.Progress"
import type { IHabit } from "../../types"

// ─────────────────────────────────────────────────────────────────
// COMPOUND COMPONENT TYPE
// ─────────────────────────────────────────────────────────────────

interface HabitCardProps {
  children: React.ReactNode
  onPress?: () => void
  habit: IHabit              // needed for the accent bar color
  style?: ViewStyle
  testID?: string
}

interface FooterProps {
  children: React.ReactNode
}

// ─────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────

const HabitCardBase: React.FC<HabitCardProps> = ({
  children,
  onPress,
  habit,
  style,
  testID,
}) => {
  const theme = useTheme()

  const cardContent = (
    <>
      {/* Color accent bar using the habit's custom color */}
      <View
        style={[styles.accentBar, { backgroundColor: habit.color }]}
        pointerEvents="none"
      />
      {/* Indent content to clear the accent bar */}
      <View style={{ paddingLeft: 8 }}>
        {children}
      </View>
    </>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          shadows.md,
          style,
        ]}
      >
        {cardContent}
      </TouchableOpacity>
    )
  }

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        shadows.md,
        style,
      ]}
    >
      {cardContent}
    </View>
  )
}

// Footer sub-component — horizontal row for streak + check-in button
const Footer: React.FC<FooterProps> = ({ children }) => (
  <View style={styles.footer}>{children}</View>
)

/**
 * COMPOUND COMPONENT — Object.assign pattern.
 * Object.assign(target, source) returns target typed as target & source.
 * This preserves the compound type through React.memo, which otherwise
 * returns NamedExoticComponent<Props> (losing the sub-component types).
 *
 * Equivalent to: const HabitCard = React.memo(Base) but with .Header etc.
 */
const HabitCard = Object.assign(
  React.memo(HabitCardBase),  // memoised root — only re-renders when props change
  {
    Header: HabitCardHeader,
    Streak: HabitCardStreak,
    Progress: HabitCardProgress,
    Footer,
  }
)

export default HabitCard

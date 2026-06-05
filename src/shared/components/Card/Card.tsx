/**
 * CONCEPT: Composition via children prop.
 * Card is a "layout primitive" — it provides visual structure (background,
 * border radius, shadow) and lets the caller decide the content.
 * This is the React equivalent of SwiftUI's ZStack with a styled container.
 *
 * WHY COMPOSITION OVER CONFIGURATION: A Card with a dozen props for every
 * possible content combination is hard to maintain. Accepting `children`
 * keeps Card simple and infinitely flexible — HabitCard, StatCard, and
 * MilestoneBadge all reuse it with entirely different content.
 *
 * GOTCHA — Android elevation vs iOS shadow: React Native uses two completely
 * different shadow systems. `elevation` on Android creates a shadow using
 * the OS's material elevation API. iOS requires the full 4-property shadow
 * (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`).
 * The `shadows` tokens in theme.ts handle both.
 */

import React from "react"
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from "react-native"
import { useTheme } from "../../../theme/useTheme"
import { shadows, spacing, borderRadius } from "../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  onPress?: () => void          // optional — makes card tappable
  style?: ViewStyle
  testID?: string
  elevation?: "sm" | "md" | "lg" | "none"  // shadow depth
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  testID,
  elevation = "md",
}) => {
  const theme = useTheme()

  const shadowStyle = elevation === "none" ? {} : shadows[elevation]

  const containerStyle = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
    shadowStyle,
    style,
  ]

  // If onPress is provided, wrap in TouchableOpacity for tap feedback.
  // Otherwise render a plain View — no unnecessary touch handling.
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={containerStyle}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
})

export default Card

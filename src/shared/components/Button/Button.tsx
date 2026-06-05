/**
 * CONCEPT: Pressable — React Native's preferred touch handler.
 * Unlike TouchableOpacity (which is older), Pressable gives you a
 * render-time callback so you can style based on pressed state directly
 * inside JSX, without extra state variables.
 *
 * WHY NOT TouchableOpacity: Pressable is more composable. It replaces the
 * entire TouchableX family introduced in RN 0.63. The `pressed` argument
 * in the style callback means "is my finger currently down?" — perfect for
 * providing visual feedback without animation libraries.
 *
 * GOTCHA — hit slop: On mobile, touch targets should be at least 44×44pt.
 * Use `hitSlop` to expand the touchable area without changing the visual size.
 */

import React from "react"
import {
  Pressable,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  ActivityIndicator,
} from "react-native"
import { useTheme } from "../../../theme/useTheme"
import { spacing, borderRadius, typography } from "../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant   // visual style — defaults to "primary"
  disabled?: boolean
  loading?: boolean         // shows spinner instead of label
  style?: ViewStyle         // override container style
  textStyle?: TextStyle     // override label style
  testID?: string
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const theme = useTheme()

  // Derive colors from variant — all from theme, no hardcoded hex values
  const bgColor = {
    primary: theme.primary,
    secondary: theme.surface,
    danger: theme.danger,
    ghost: "transparent",
  }[variant]

  const textColor = {
    primary: theme.textOnPrimary,
    secondary: theme.textPrimary,
    danger: theme.textOnPrimary,
    ghost: theme.primary,
  }[variant]

  const borderColor = {
    primary: "transparent",
    secondary: theme.border,
    danger: "transparent",
    ghost: "transparent",
  }[variant]

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      // Style callback receives `{ pressed }` — React Native re-calls this
      // on every press state change, no extra state needed
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          opacity: pressed || disabled ? 0.7 : 1, // dim on press or disabled
        },
        style,
      ]}
      // Expand touch target to meet 44pt accessibility minimum
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size="small"
          testID="button-loading"
        />
      ) : (
        <Text
          style={[styles.label, { color: textColor }, textStyle]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44, // accessibility: minimum touch target
  },
  label: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
})

export default Button

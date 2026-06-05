/**
 * CONCEPT: Reanimated withSpring + Pressable for satisfying check-in UI.
 * This component demonstrates the most common Reanimated pattern:
 *
 *   useSharedValue → drives the animation value on the UI thread
 *   useAnimatedStyle → maps shared value to style props
 *   withSpring → physics-based animation (mass, stiffness, damping)
 *
 * VISUAL STATES:
 *   DEFAULT  → [  Check in  ]  border only, transparent bg, scale 1.0
 *   PRESSING → [  Check in  ]  scaled to 0.95 (spring with high damping)
 *   DONE     → [  ✓ Done   ]  green bg, white text, bounces to 1.08 then settles
 *   DONE+PRESS→ [  ✓ Done  ]  slightly dimmed (undo gesture hint)
 *
 * WHY PRESSABLE over GestureHandler for this component:
 * Pressable is React Native's built-in touch handler with onPressIn/onPressOut.
 * These fire synchronously on press, giving us exactly the right moments to
 * start/stop the scale animation. GestureHandler's Tap gesture is better for
 * complex multi-finger gestures — Pressable is the right tool here.
 * (GestureHandler shines in SwipeableHabitCard for the swipe-to-delete gesture.)
 *
 * WHY withSpring over withTiming:
 * Springs feel physical — the button "presses in" like a real button.
 * withTiming with Easing.out would feel like CSS — correct but sterile.
 * The spec calls for springs; this is one of the main teaching moments.
 */

import React, { useEffect } from "react"
import {
  Pressable,
  Text,
  StyleSheet,
  type ViewStyle,
} from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated"
import { useTheme } from "../../../../theme/useTheme"
import { spacing, borderRadius, typography } from "../../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface CheckInButtonProps {
  isCompleted: boolean
  onPress: () => void          // fires on check-in OR undo
  style?: ViewStyle
  testID?: string
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const CheckInButton: React.FC<CheckInButtonProps> = ({
  isCompleted,
  onPress,
  style,
  testID,
}) => {
  const theme = useTheme()

  // Drives the scale animation: 1.0 = normal, 0.95 = pressed, 1.08 = done bounce
  const scale = useSharedValue(1)

  // Drives the color interpolation: 0 = not done (default), 1 = done (success)
  const completedProgress = useSharedValue(isCompleted ? 1 : 0)

  // When isCompleted prop changes, animate to the new state
  useEffect(() => {
    if (isCompleted) {
      // Done state: spring bounce up then settle
      scale.value = withSpring(1.08, { damping: 6, stiffness: 200 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 })
      })
      completedProgress.value = withSpring(1, { damping: 20, stiffness: 200 })
    } else {
      // Undo: gently scale back to default
      scale.value = withSpring(1, { damping: 20, stiffness: 200 })
      completedProgress.value = withSpring(0, { damping: 20, stiffness: 200 })
    }
  }, [isCompleted])

  // Animated scale style — applied to the outer wrapper so text scales too
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  // Interpolate background color from transparent → success green
  // Note: Reanimated's interpolateColor requires the shared value to drive it
  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      completedProgress.value,
      [0, 1],
      ["transparent", theme.success]
    ),
    borderColor: interpolateColor(
      completedProgress.value,
      [0, 1],
      [theme.border, theme.success]
    ),
  }))

  const label = isCompleted ? "✓ Done" : "Check in"
  const textColor = isCompleted ? theme.textOnPrimary : theme.textSecondary

  return (
    <Animated.View style={[animatedContainerStyle, style]}>
      <Pressable
        testID={testID ?? "checkin-button"}
        onPress={onPress}
        onPressIn={() => {
          // Scale down on press start — gives the "button depresses" feel
          scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
        }}
        onPressOut={() => {
          // Spring back — if isCompleted the useEffect will handle the bounce
          if (!isCompleted) {
            scale.value = withSpring(1, { damping: 12, stiffness: 200 })
          }
        }}
      >
        <Animated.View
          style={[styles.button, animatedBgStyle]}
          pointerEvents="none" // let Pressable handle all touches
        >
          <Text
            style={[
              styles.label,
              { color: textColor },
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
})

export default CheckInButton

/**
 * CONCEPT: Reanimated withTiming for number count-up animation.
 * When the streak value increases, the number visually counts up from the
 * previous value to the new value over 600ms — the same effect you see in
 * fitness apps when your step count updates.
 *
 * APPROACH — useAnimatedReaction + runOnJS:
 * Reanimated runs animations on the UI thread for 60fps performance.
 * To update React state (which re-renders the component), we must bridge
 * back to the JS thread using runOnJS. The pattern is:
 *
 *   useAnimatedReaction(
 *     () => Math.round(animatedValue.value),   // runs on UI thread
 *     (current, prev) => {
 *       if (current !== prev) runOnJS(setState)(current)  // jumps to JS thread
 *     }
 *   )
 *
 * WHY NOT useAnimatedProps for text: Animating text content requires a
 * special AnimatedText component with animatedProps. The runOnJS approach
 * is simpler and accurate enough for integer streak counts.
 *
 * FIRE EMOJI SCALE: When streak increases, the 🔥 emoji springs in with
 * a withSpring bounce — this provides extra celebration feedback.
 */

import React, { useState, useEffect, useRef } from "react"
import { StyleSheet, View, Text, type ViewStyle } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated"
import { useTheme } from "../../../../theme/useTheme"
import { typography } from "../../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type StreakCounterSize = "sm" | "md" | "lg"

interface StreakCounterProps {
  streak: number
  size?: StreakCounterSize
  showLabel?: boolean   // show "day streak" label below the number
  style?: ViewStyle
  testID?: string
}

// Font sizes for each size variant
const SIZE_CONFIG: Record<StreakCounterSize, { number: number; emoji: number; label: number }> = {
  sm: { number: typography.md, emoji: typography.sm, label: typography.xs },
  md: { number: typography.xl, emoji: typography.lg, label: typography.sm },
  lg: { number: typography.xxxl, emoji: typography.xxl, label: typography.md },
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  size = "md",
  showLabel = false,
  style,
  testID,
}) => {
  const theme = useTheme()
  const fontSizes = SIZE_CONFIG[size]

  // displayValue is what's shown in the Text — updated from the UI thread
  const [displayValue, setDisplayValue] = useState(streak)

  // animatedValue drives the count-up animation on the UI thread
  const animatedValue = useSharedValue(streak)

  // emojiScale drives the fire emoji spring animation
  const emojiScale = useSharedValue(1)

  // Track previous streak so we know if it increased
  const prevStreakRef = useRef(streak)

  useEffect(() => {
    const didIncrease = streak > prevStreakRef.current
    prevStreakRef.current = streak

    // Animate the number counting up to the new streak value
    animatedValue.value = withTiming(streak, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    })

    // Spring the fire emoji when the streak increases
    if (didIncrease) {
      emojiScale.value = withSpring(1.4, { damping: 6, stiffness: 200 }, () => {
        // After the spring peak, settle back to 1.0
        emojiScale.value = withSpring(1)
      })
    }
  }, [streak])

  // useAnimatedReaction: runs on the UI thread, syncs display value to JS state
  // This is how you bridge from the Reanimated world back to React state
  useAnimatedReaction(
    () => Math.round(animatedValue.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayValue)(current) // bridge to JS thread
      }
    }
  )

  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }))

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Animated.View style={emojiAnimatedStyle}>
        <Text style={{ fontSize: fontSizes.emoji }}>🔥</Text>
      </Animated.View>

      <Text
        style={[
          styles.number,
          {
            fontSize: fontSizes.number,
            color: theme.textPrimary,
          },
        ]}
        testID="streak-value"
      >
        {displayValue}
      </Text>

      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize: fontSizes.label, color: theme.textSecondary },
          ]}
        >
          {displayValue === 1 ? "day streak" : "day streak"}
        </Text>
      )}
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
    gap: 4,
  },
  number: {
    fontWeight: "700",
  },
  label: {
    alignSelf: "flex-end",
    paddingBottom: 2,
  },
})

export default StreakCounter

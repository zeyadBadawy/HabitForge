/**
 * CONCEPT: Animated layout — using onLayout + Reanimated withTiming
 * to animate a progress bar's fill width smoothly.
 *
 * WHY NOT use `width: "50%"` in useAnimatedStyle:
 * Reanimated's animated style values must be numbers, not strings.
 * To animate as a percentage we measure the container pixel width via
 * `onLayout`, then animate the fill to (containerWidth × progress) pixels.
 *
 * WHY onLayout: React Native doesn't have direct access to computed
 * layout dimensions at render time — you get them asynchronously via
 * the `onLayout` callback. This is equivalent to reading element.clientWidth
 * in the browser after the DOM has painted.
 *
 * PERFORMANCE: The fill View sits inside a clipping container so the
 * animation never causes relayout — only the fill View's width changes,
 * which is isolated from the rest of the component tree.
 */

import React, { useState, useEffect } from "react"
import { View, StyleSheet, type ViewStyle, type LayoutChangeEvent } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated"
import { useTheme } from "../../../theme/useTheme"
import { borderRadius } from "../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  /** 0.0 (empty) → 1.0 (full) */
  progress: number
  /** Override the fill colour — defaults to theme.primary */
  color?: string
  height?: number
  style?: ViewStyle
  testID?: string
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  style,
  testID,
}) => {
  const theme = useTheme()
  const fillColor = color ?? theme.primary

  // Container width in pixels — set by onLayout when the View first renders
  const [containerWidth, setContainerWidth] = useState(0)

  // Animated fill width in pixels
  const fillWidth = useSharedValue(0)

  // Whenever progress or containerWidth changes, animate to the new fill width
  useEffect(() => {
    if (containerWidth <= 0) return
    const targetWidth = Math.max(0, Math.min(1, progress)) * containerWidth
    fillWidth.value = withTiming(targetWidth, {
      duration: 400,
      easing: Easing.out(Easing.quad), // ease-out feels natural for progress fill
    })
  }, [progress, containerWidth])

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width)
  }

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }))

  return (
    <View
      testID={testID}
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          height,
          backgroundColor: theme.border,
        },
        style,
      ]}
    >
      <Animated.View
        testID="progress-fill"
        style={[
          styles.fill,
          { backgroundColor: fillColor, height },
          animatedFillStyle,
        ]}
      />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: borderRadius.full,
    overflow: "hidden", // clip the fill so it never extends past the track
  },
  fill: {
    borderRadius: borderRadius.full,
  },
})

export default ProgressBar

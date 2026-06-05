/**
 * CONCEPT: Gesture Handler pan gesture + Reanimated + runOnJS.
 *
 * This component demonstrates the three-layer gesture pattern used in
 * all professional React Native swipe UIs:
 *
 * 1. PAN GESTURE (Gesture Handler)
 *    `Gesture.Pan()` tracks finger movement. Its callbacks (onUpdate, onEnd)
 *    run on the UI thread — never blocking JS. This is what makes swipe UIs
 *    feel 60fps even when JS is busy.
 *
 * 2. ANIMATED STYLE (Reanimated)
 *    `useSharedValue` + `useAnimatedStyle` connects the gesture position
 *    directly to the card's translateX style. No setState, no bridge round-
 *    trip — the card follows the finger at native speed.
 *
 * 3. runOnJS — the UI→JS bridge
 *    Gesture callbacks run on the UI thread. To call a JS function (like
 *    `onDelete`, which will dispatch to Zustand), we must wrap it with
 *    `runOnJS`. This schedules the JS call from the UI thread safely.
 *    Without runOnJS, calling a closure that references JS state from a
 *    worklet would crash.
 *
 * SWIPE BEHAVIOUR:
 *   • Swipe left < SNAP_THRESHOLD   → snap back to closed
 *   • Swipe left ≥ SNAP_THRESHOLD   → snap to reveal action buttons (archive / delete)
 *   • Swipe left ≥ DELETE_THRESHOLD → call onDelete immediately (full-swipe delete)
 *
 * GESTURE CONFIGURATION:
 *   • activeOffsetX — requires 10px horizontal movement before the gesture
 *     activates, letting vertical scrolling work naturally in FlatList
 *   • failOffsetY — if the finger moves ≥ 15px vertically first, fail the
 *     gesture so the FlatList scroll takes over (crucial for usability!)
 */

import React, { useCallback } from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated"
import { useTheme } from "../../../../theme/useTheme"
import { spacing, borderRadius, typography } from "../../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const ACTION_WIDTH     = 140  // total width of revealed action buttons (px)
const SNAP_THRESHOLD   = -60  // swipe this far to snap open
const DELETE_THRESHOLD = -200 // swipe this far to delete immediately

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface SwipeableHabitCardProps {
  children: React.ReactNode
  onDelete?: () => void
  onArchive?: () => void
  testID?: string
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const SwipeableHabitCard: React.FC<SwipeableHabitCardProps> = ({
  children,
  onDelete,
  onArchive,
  testID,
}) => {
  const theme      = useTheme()
  // translateX drives how far the card has slid left (always ≤ 0)
  const translateX = useSharedValue(0)

  // ── Close helper — called from JS thread (e.g. Pressable onPress) ──
  const close = useCallback(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
  }, [])

  // ── Action handlers — close first, then call the callback ──────
  const handleDelete = useCallback(() => {
    close()
    onDelete?.()
  }, [close, onDelete])

  const handleArchive = useCallback(() => {
    close()
    onArchive?.()
  }, [close, onArchive])

  // ── Pan gesture — runs on the UI thread ────────────────────────
  const panGesture = Gesture.Pan()
    // Only activate after 10px horizontal movement — lets vertical scroll work
    .activeOffsetX([-10, 10])
    // Fail (hand off to scroll) if finger moves ≥ 15px vertically first
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      // Clamp: only allow left swipe (negative) up to ACTION_WIDTH past that
      translateX.value = Math.max(
        -(ACTION_WIDTH + 40),   // a little extra room for momentum
        Math.min(0, e.translationX)
      )
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        // ── Full swipe → delete immediately ──────────────────────
        // runOnJS is REQUIRED here: gesture callbacks run on the UI thread,
        // but onDelete dispatches to Zustand (JS). Without runOnJS this would
        // silently fail or crash the UI thread.
        if (onDelete) runOnJS(onDelete)()
        // Snap back so the card doesn't stay off-screen during the re-render
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
      } else if (e.translationX < SNAP_THRESHOLD) {
        // ── Half swipe → snap open to reveal action buttons ──────
        translateX.value = withSpring(-ACTION_WIDTH, {
          damping: 20,
          stiffness: 200,
        })
      } else {
        // ── Short swipe → snap back to closed ────────────────────
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
      }
    })

  // Card slides left, revealing the fixed-position action buttons behind it
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View style={styles.container} testID={testID}>
      {/* ── Action buttons (fixed, behind the card) ─────────────── */}
      <View style={[styles.actions, { width: ACTION_WIDTH }]}>
        {/* Archive */}
        <Pressable
          onPress={handleArchive}
          style={[
            styles.actionButton,
            { backgroundColor: theme.warning },
          ]}
          accessibilityLabel="Archive habit"
        >
          <Text style={styles.actionEmoji}>📦</Text>
          <Text style={[styles.actionLabel, { color: theme.textOnPrimary }]}>
            Archive
          </Text>
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={handleDelete}
          style={[
            styles.actionButton,
            { backgroundColor: theme.danger },
          ]}
          accessibilityLabel="Delete habit"
        >
          <Text style={styles.actionEmoji}>🗑️</Text>
          <Text style={[styles.actionLabel, { color: theme.textOnPrimary }]}>
            Delete
          </Text>
        </Pressable>
      </View>

      {/* ── Swipeable card ──────────────────────────────────────── */}
      <GestureDetector gesture={panGesture}>
        {/* backgroundColor matches the screen background so the card's
            transparent rounded corners don't reveal action buttons behind. */}
        <Animated.View style={[styles.card, { backgroundColor: theme.background }, cardAnimatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Outer container clips the card so it doesn't overlap adjacent rows
  container: {
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  // Action buttons sit at the trailing edge, revealed as the card slides
  actions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionEmoji: {
    fontSize: typography.lg,
  },
  actionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  // Card fills the container and slides left over the action buttons
  card: {
    // No border-radius here — that's on HabitCard.tsx inside
  },
})

export default SwipeableHabitCard

/**
 * CONCEPT: Reanimated entering animations + Modal overlay.
 *
 * Two Reanimated concepts demonstrated here:
 *
 * 1. ENTERING ANIMATIONS (BounceIn)
 *    Reanimated provides pre-built entering/exiting animations that play
 *    when a component is mounted/unmounted in the tree. You attach them
 *    via the `entering` prop on Animated.View. BounceIn makes the badge
 *    overshoot its final size and spring back — physics-based, not tweened.
 *
 * 2. SHARED VALUE → progress indicator
 *    A useSharedValue drives the countdown bar. withTiming animates it
 *    from 1→0 over 3 seconds, and when it reaches 0 we call runOnJS(onDismiss)
 *    to bridge back from the UI thread to JS and trigger navigation.
 *
 * CONFETTI PARTICLES:
 *    Four emoji particles are independently animated with staggered
 *    withTiming calls (translateY + opacity). Each has its own
 *    useSharedValue so they move independently on the UI thread with
 *    zero JS involvement after the initial `startAnimations()` call.
 *
 * AUTO-DISMISS:
 *    useEffect sets a 3-second timer. The component also dismisses on tap.
 *    Both paths call the same `onDismiss` callback, which the HomeScreen
 *    wires to `celebrateMilestone()` in the Zustand store.
 *
 * WHY MODAL:
 *    React Native's Modal renders above everything else (including the
 *    tab bar and status bar) without any z-index juggling. `transparent`
 *    keeps the overlay semi-transparent so the user knows they can come
 *    back to the app.
 */

import React, { useEffect, useRef } from "react"
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native"
import Animated, {
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated"
import { useTheme } from "../../../../theme/useTheme"
import { spacing, typography, borderRadius } from "../../../../theme/theme"
import { MILESTONE_LABELS, MILESTONE_EMOJIS } from "../../types"
import type { IMilestone } from "../../types"

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const AUTO_DISMISS_MS = 3000

// Confetti particles — each has a fixed random horizontal offset so they
// spread across the screen without needing JS randomisation at runtime.
const PARTICLES = [
  { emoji: "🎉", x: -120, delay: 0   },
  { emoji: "✨", x:  -60, delay: 200 },
  { emoji: "⭐", x:   60, delay: 100 },
  { emoji: "🌟", x:  120, delay: 300 },
  { emoji: "💫", x:  -30, delay: 150 },
  { emoji: "⚡", x:   90, delay: 250 },
]

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface MilestoneCelebrationProps {
  milestone: IMilestone
  onDismiss: () => void
}

// ─────────────────────────────────────────────────────────────────
// CONFETTI PARTICLE — isolated component so each has its own shared values
// ─────────────────────────────────────────────────────────────────

interface ParticleProps {
  emoji: string
  offsetX: number
  delay: number
}

const ConfettiParticle: React.FC<ParticleProps> = ({ emoji, offsetX, delay }) => {
  // Each particle has independent shared values — they all animate on the
  // UI thread simultaneously with zero JS involvement after mount.
  const translateY = useSharedValue(0)
  const opacity    = useSharedValue(1)
  const scale      = useSharedValue(1)

  useEffect(() => {
    // Staggered fall: particles start at their current position and fall
    // down over 1.8 seconds, fading out in the last 600ms.
    const config = { duration: 1800, easing: Easing.in(Easing.quad) }

    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT * 0.4, config))
    opacity.value    = withDelay(delay + 1200, withTiming(0, { duration: 600 }))
    scale.value      = withDelay(delay, withTiming(0.5, { duration: 1800 }))
  }, []) // run once on mount

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.Text
      style={[styles.particle, { left: SCREEN_WIDTH / 2 + offsetX }, style]}
    >
      {emoji}
    </Animated.Text>
  )
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  milestone,
  onDismiss,
}) => {
  const theme   = useTheme()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Countdown bar ─────────────────────────────────────────────
  // Animates from 1 (full) → 0 (empty) over AUTO_DISMISS_MS
  const timerProgress = useSharedValue(1)

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%` as unknown as number,
  }))

  // ── Auto-dismiss ───────────────────────────────────────────────
  useEffect(() => {
    // Start countdown bar animation on the UI thread
    timerProgress.value = withTiming(0, {
      duration: AUTO_DISMISS_MS,
      easing: Easing.linear,
    })

    // Auto-dismiss via JS timer (simpler than using runOnJS on the animation
    // callback, which would couple the dismiss to the animation end)
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, []) // intentionally empty — fires once when celebration mounts

  const emoji = MILESTONE_EMOJIS[milestone.threshold]
  const label = MILESTONE_LABELS[milestone.threshold]

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Dim overlay — tapping anywhere dismisses */}
      <Pressable style={styles.overlay} onPress={onDismiss}>
        {/* Confetti particles rendered absolutely over the overlay */}
        {PARTICLES.map((p) => (
          <ConfettiParticle
            key={p.emoji}
            emoji={p.emoji}
            offsetX={p.x}
            delay={p.delay}
          />
        ))}

        {/* Main celebration card — BounceIn entering animation */}
        {/* Stop propagation so tapping the card doesn't dismiss */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={BounceIn}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Large badge emoji */}
            <Text style={styles.bigEmoji}>{emoji}</Text>

            {/* Title */}
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {label}!
            </Text>

            {/* Description */}
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              You've maintained a {milestone.threshold}-day streak 🔥
            </Text>

            {/* Countdown bar */}
            <View
              style={[styles.timerTrack, { backgroundColor: theme.border }]}
            >
              <Animated.View
                style={[
                  styles.timerFill,
                  { backgroundColor: theme.primary },
                  timerBarStyle,
                ]}
              />
            </View>

            {/* Manual dismiss button */}
            <Pressable
              onPress={onDismiss}
              style={[
                styles.dismissButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[styles.dismissLabel, { color: theme.textOnPrimary }]}
              >
                Celebrate! 🎉
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  bigEmoji: {
    fontSize: 72,
    lineHeight: 88,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.md,
    textAlign: "center",
    lineHeight: typography.md * 1.5,
  },
  timerTrack: {
    width: "100%",
    height: 4,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  timerFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  dismissButton: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  dismissLabel: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  // Confetti particles — positioned absolutely relative to the overlay
  particle: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.15,
    fontSize: 28,
  },
})

export default MilestoneCelebration

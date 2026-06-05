/**
 * HabitCard.Streak — sub-component showing the current streak count.
 * Wraps StreakCounter and adds the streak freeze affordance.
 *
 * CONCEPT: Composition — this sub-component consumes another component
 * (StreakCounter) rather than re-implementing streak display logic.
 * Each layer only adds what it specifically needs: this layer adds the
 * streak freeze button that is specific to the card context.
 */

import React from "react"
import { View, Text, Pressable } from "react-native"
import type { IStreak, IHabit } from "../../types"
import { useTheme } from "../../../../theme/useTheme"
import { habitCardStyles as styles } from "./styles"
import StreakCounter from "../StreakCounter"

interface StreakProps {
  streak: IStreak
  habit: IHabit
  onUseFreeze?: () => void  // called when user taps the freeze button
}

const HabitCardStreak: React.FC<StreakProps> = ({
  streak,
  habit,
  onUseFreeze,
}) => {
  const theme = useTheme()

  return (
    <View style={styles.streakContainer}>
      <StreakCounter streak={streak.current} size="sm" />

      {/* Streak freeze — only shown when available and streak is active */}
      {habit.streakFreezeAvailable && streak.current > 0 && onUseFreeze && (
        <Pressable
          onPress={onUseFreeze}
          testID="streak-freeze-button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          accessibilityLabel="Use streak freeze"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[styles.streakLabel, { color: theme.warning }]}
          >
            🛡️
          </Text>
        </Pressable>
      )}
    </View>
  )
}

export default HabitCardStreak

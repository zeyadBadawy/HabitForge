/**
 * CONCEPT: Stack navigator — manages a stack of screens that you can
 * push onto and pop off of. Equivalent to UINavigationController on iOS.
 * The stack is typed with HabitsStackParamList so useNavigation() and
 * useRoute() hooks know exactly which params each screen receives.
 *
 * WHY A SEPARATE NAVIGATOR FILE: Separating the habits stack from the
 * root tab navigator makes each file's responsibility clear, and makes
 * it easy to add more tabs in the future without touching this file.
 */

import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import type { HabitsStackParamList } from "./types"
import HomeScreen from "../features/habits/screens/HomeScreen"
import HabitDetailScreen from "../features/habits/screens/HabitDetailScreen"
import CreateHabitScreen from "../features/habits/screens/CreateHabitScreen"
import { useTheme } from "../theme/useTheme"

const Stack = createNativeStackNavigator<HabitsStackParamList>()

const HabitsNavigator: React.FC = () => {
  const theme = useTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        // Apply theme colours to the native navigation bar
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "HabitForge 🔥" }}
      />
      <Stack.Screen
        name="HabitDetail"
        component={HabitDetailScreen}
        options={{ title: "Habit Detail" }}
      />
      <Stack.Screen
        name="CreateHabit"
        component={CreateHabitScreen}
        // Title is set dynamically in the screen via navigation.setOptions()
        options={{ title: "New Habit" }}
      />
    </Stack.Navigator>
  )
}

export default HabitsNavigator

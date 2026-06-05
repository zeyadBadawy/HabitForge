/**
 * CONCEPT: Tab navigator containing a stack navigator.
 * This is the standard pattern for mobile apps:
 *   - Bottom tabs = top-level navigation (Habits, Settings)
 *   - Stack inside each tab = sub-navigation within that section
 *
 * iOS equivalent: UITabBarController containing UINavigationControllers.
 *
 * The RootNavigator is rendered inside NavigationContainer in App.tsx.
 * NavigationContainer manages the navigation state tree — it's the
 * equivalent of a router in web apps.
 *
 * GOTCHA — nested navigators: when you navigate from a screen inside
 * HabitsNavigator, you MUST use the HabitsNavigator's own navigation
 * instance (useNavigation() typed with HabitsStackParamList), not the
 * tab navigator's. Mixing them causes TypeScript errors.
 */

import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import type { RootTabParamList } from "./types"
import HabitsNavigator from "./HabitsNavigator"
import SettingsScreen from "../features/settings/screens/SettingsScreen"
import { useTheme } from "../theme/useTheme"
import { Text } from "react-native"

const Tab = createBottomTabNavigator<RootTabParamList>()

const RootNavigator: React.FC = () => {
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // HabitsNavigator provides its own header
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
      }}
    >
      <Tab.Screen
        name="Habits"
        component={HabitsNavigator}
        options={{
          // Simple emoji tab icons — replaced by vector icons in Session 2
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔥</Text>
          ),
          tabBarLabel: "Habits",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  )
}

export default RootNavigator

/**
 * CONCEPT: App root — the entry point React Native renders first.
 * All providers must wrap everything here.
 *
 * PROVIDER ORDER (outermost → innermost):
 * 1. GestureHandlerRootView — MUST be the outermost view. Without this,
 *    react-native-gesture-handler gestures silently break everywhere.
 * 2. SafeAreaProvider — gives safe-area insets to children.
 *    Required by react-navigation tab/stack bars on notched devices.
 * 3. NavigationContainer — manages the navigation state tree.
 *    All navigators must live inside this.
 * 4. ErrorBoundary — catches render-time exceptions from any child
 *    and shows a recovery UI instead of a blank crash screen.
 *
 * NOTE: Zustand stores need no provider — they're module-level singletons.
 * Each component imports and subscribes to the store directly.
 *
 * SEED DATA:
 * loadSeedDataIfNeeded() runs in a useEffect (after the first render and
 * after MMKV hydration has completed). It is idempotent — the `seeded`
 * flag in useSettingsStore ensures it only runs once per device installation.
 */

import React, { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { NavigationContainer } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { StyleSheet } from "react-native"
import RootNavigator from "./src/navigation/RootNavigator"
import ErrorBoundary from "./src/shared/components/ErrorBoundary"
import { useTheme } from "./src/theme/useTheme"
import { loadSeedDataIfNeeded } from "./src/seedData"

// ─────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function App() {
  // useTheme reads from useSettingsStore (theme preference) and useColorScheme
  // (OS dark mode). Both are subscribed reactively — changing either updates
  // the theme everywhere without any prop drilling.
  const theme = useTheme()

  // Seed data is loaded once, after the stores have hydrated from MMKV.
  // useEffect with empty deps runs after the first render — by that point
  // Zustand's persist middleware has already replayed the persisted state.
  useEffect(() => {
    loadSeedDataIfNeeded()
  }, [])

  return (
    // GestureHandlerRootView must wrap everything — Gesture Handler requires
    // this as the root to set up its native touch handling infrastructure.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          {/* StatusBar style adapts to the active theme */}
          <StatusBar style={theme.background === "#0F172A" ? "light" : "dark"} />
          {/* ErrorBoundary catches any uncaught render error in the nav tree */}
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1, // GestureHandlerRootView must fill the screen
  },
})

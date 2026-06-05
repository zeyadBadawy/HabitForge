/**
 * CONCEPT: Settings screen — user preferences and app information.
 *
 * WHY A SEPARATE SETTINGS STORE:
 * Preferences (theme mode, future: notifications) are orthogonal to habit
 * data. Keeping them in useSettingsStore means a theme change doesn't cause
 * the entire habit list to re-render — Zustand subscriptions are independent.
 *
 * THEME TOGGLE PATTERN:
 * Three explicit options (Auto / Light / Dark) rather than a binary toggle.
 * Auto is the polite default — respect the OS before overriding it.
 *
 * ACCESSIBILITY:
 * Each option row has accessibilityRole="radio" and accessibilityState
 * so screen readers announce the selected state correctly.
 */

import React, { useCallback } from "react"
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native"
import { useTheme } from "../../../theme/useTheme"
import {
  useSettingsStore,
  type ThemeMode,
} from "../store/useSettingsStore"
import {
  spacing,
  typography,
  borderRadius,
  shadows,
} from "../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface ThemeOption {
  mode: ThemeMode
  label: string
  description: string
  icon: string
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: "auto",
    label: "Auto",
    description: "Follow system setting",
    icon: "🌗",
  },
  {
    mode: "light",
    label: "Light",
    description: "Always light mode",
    icon: "☀️",
  },
  {
    mode: "dark",
    label: "Dark",
    description: "Always dark mode",
    icon: "🌙",
  },
]

// ─────────────────────────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  children: React.ReactNode
  theme: ReturnType<typeof useTheme>
}

const Section: React.FC<SectionProps> = ({ title, children, theme }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
        shadows.sm,
      ]}
    >
      {children}
    </View>
  </View>
)

// ─────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const theme      = useTheme()
  const themeMode  = useSettingsStore((s) => s.themeMode)
  const setThemeMode = useSettingsStore((s) => s.setThemeMode)

  // ── Handlers ──────────────────────────────────────────────────

  const handleSelectTheme = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode)
    },
    [setThemeMode]
  )

  const handleOpenGitHub = useCallback(() => {
    Linking.openURL("https://github.com")
  }, [])

  // ── Render ────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── APPEARANCE ──────────────────────────────────────────── */}
      <Section title="Appearance" theme={theme}>
        {THEME_OPTIONS.map((option, index) => {
          const isSelected = themeMode === option.mode
          const isLast = index === THEME_OPTIONS.length - 1
          return (
            <Pressable
              key={option.mode}
              onPress={() => handleSelectTheme(option.mode)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${option.label} theme: ${option.description}`}
              style={({ pressed }) => [
                styles.optionRow,
                !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
                pressed && { backgroundColor: theme.border + "33" },
              ]}
            >
              {/* Icon + labels */}
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                  {option.description}
                </Text>
              </View>

              {/* Checkmark for selected option */}
              {isSelected && (
                <View
                  style={[
                    styles.selectedBadge,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.selectedCheck}>✓</Text>
                </View>
              )}
            </Pressable>
          )
        })}
      </Section>

      {/* ── DATA ────────────────────────────────────────────────── */}
      <Section title="Data" theme={theme}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>
            Storage
          </Text>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>
            On-device (MMKV)
          </Text>
        </View>
        <View
          style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.border }]}
        >
          <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>
            Cloud sync
          </Text>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>
            Coming in v2
          </Text>
        </View>
      </Section>

      {/* ── ABOUT ───────────────────────────────────────────────── */}
      <Section title="About" theme={theme}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>
            App
          </Text>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>
            HabitForge 🔥
          </Text>
        </View>
        <View
          style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.border }]}
        >
          <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>
            Version
          </Text>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>
            1.0.0
          </Text>
        </View>
        <Pressable
          onPress={handleOpenGitHub}
          style={[
            styles.infoRow,
            { borderTopWidth: 1, borderTopColor: theme.border },
          ]}
          accessibilityRole="link"
          accessibilityLabel="View source code on GitHub"
        >
          <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>
            Source code
          </Text>
          <Text style={[styles.infoValue, { color: theme.primary }]}>
            GitHub →
          </Text>
        </Pressable>
      </Section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <Text style={[styles.footer, { color: theme.textDisabled }]}>
        Built with ❤️ using Expo + React Native{"\n"}
        Every animation is intentional and documented.
      </Text>
    </ScrollView>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },

  // ── Section ──────────────────────────────────────────────────
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },

  // ── Option row ───────────────────────────────────────────────
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 60,
  },
  optionIcon: {
    fontSize: 22,
    width: 28,
    textAlign: "center",
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.md,
    fontWeight: "500",
  },
  optionDesc: {
    fontSize: typography.xs,
    marginTop: 2,
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCheck: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Info row ─────────────────────────────────────────────────
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    minHeight: 52,
  },
  infoLabel: {
    fontSize: typography.md,
  },
  infoValue: {
    fontSize: typography.sm,
  },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    fontSize: typography.xs,
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.md,
  },
})

export default SettingsScreen

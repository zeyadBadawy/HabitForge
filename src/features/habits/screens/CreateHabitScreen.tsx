/**
 * CONCEPT: Controlled form screen using a custom hook as controller.
 *
 * PATTERN — "dumb view + smart hook":
 * This screen owns zero business logic. Every piece of state and every
 * action comes from `useHabitForm`. The screen is purely responsible for
 * rendering the form UI and connecting user interactions to the hook.
 *
 * EDIT MODE vs CREATE MODE:
 * React Navigation passes `route.params.habitId` when the user taps Edit
 * on an existing habit. We look that habit up from the store, and pass it
 * to `useHabitForm` which pre-populates the form and switches the submit
 * action to `updateHabit` instead of `addHabit`.
 *
 * KEYBOARD HANDLING:
 * `KeyboardAvoidingView` shifts content up on iOS when the keyboard appears,
 * so the TextInput stays visible. On Android the OS handles this via
 * windowSoftInputMode, but wrapping here is the cross-platform safe approach.
 *
 * REACT NAVIGATION — setOptions:
 * We call `navigation.setOptions` inside useEffect to update the header title
 * dynamically. This is the official pattern for titles that depend on screen data.
 */

import React, { useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { HabitsStackParamList } from "../../../navigation/types"
import { useHabitStore } from "../store/useHabitStore"
import {
  useHabitForm,
  EMOJI_OPTIONS,
  COLOR_OPTIONS,
} from "../hooks/useHabitForm"
import Button from "../../../shared/components/Button"
import { useTheme } from "../../../theme/useTheme"
import { spacing, typography, borderRadius } from "../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<HabitsStackParamList, "CreateHabit">

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const CreateHabitScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme()

  // Look up existing habit if habitId param was passed (edit mode)
  const existingHabit = useHabitStore((s) =>
    route.params?.habitId
      ? s.habits.find((h) => h.id === route.params?.habitId)
      : undefined
  )

  const form = useHabitForm(existingHabit)

  // ── Dynamic header title ───────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      title: form.isEditMode ? "Edit Habit" : "New Habit",
    })
  }, [form.isEditMode, navigation])

  const handleSubmit = () => {
    form.submit(() => navigation.goBack())
  }

  const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
      {label}
    </Text>
  )

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── NAME ───────────────────────────────────────────────── */}
        <SectionLabel label="Habit name" />
        <TextInput
          value={form.name}
          onChangeText={form.setName}
          placeholder="e.g. Read 30 minutes"
          placeholderTextColor={theme.textDisabled}
          maxLength={60}
          returnKeyType="done"
          style={[
            styles.textInput,
            {
              color: theme.textPrimary,
              backgroundColor: theme.surface,
              borderColor:
                form.name.length > 0 ? theme.borderFocused : theme.border,
            },
          ]}
          accessibilityLabel="Habit name input"
        />

        {/* ── EMOJI ──────────────────────────────────────────────── */}
        <SectionLabel label="Icon" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
        >
          {EMOJI_OPTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => form.setEmoji(emoji)}
              style={[
                styles.emojiOption,
                {
                  backgroundColor:
                    form.emoji === emoji
                      ? theme.primary + "22"
                      : theme.surface,
                  borderColor:
                    form.emoji === emoji ? theme.primary : theme.border,
                },
              ]}
              accessibilityLabel={`Icon ${emoji}`}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── COLOR ──────────────────────────────────────────────── */}
        <SectionLabel label="Color" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
        >
          {COLOR_OPTIONS.map((color) => (
            <Pressable
              key={color}
              onPress={() => form.setColor(color)}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                form.color === color && styles.colorOptionSelected,
              ]}
              accessibilityLabel={`Color ${color}`}
            />
          ))}
        </ScrollView>

        {/* ── FREQUENCY ──────────────────────────────────────────── */}
        <SectionLabel label="Frequency" />
        <View
          style={[
            styles.frequencyContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <FrequencyOption
            label="Daily"
            sublabel="Every day"
            selected={form.frequency.type === "daily"}
            onSelect={() => form.setFrequencyType("daily")}
            theme={theme}
          />

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <FrequencyOption
            label="Weekly"
            sublabel="At least once a week"
            selected={form.frequency.type === "weekly"}
            onSelect={() => form.setFrequencyType("weekly")}
            theme={theme}
          />

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <FrequencyOption
            label="Custom"
            sublabel={`${form.timesPerWeek}× per week`}
            selected={form.frequency.type === "custom"}
            onSelect={() => form.setFrequencyType("custom")}
            theme={theme}
          />

          {/* Stepper — only shown when Custom is selected */}
          {form.frequency.type === "custom" && (
            <View
              style={[styles.stepper, { borderTopColor: theme.border }]}
            >
              <Pressable
                onPress={() =>
                  form.setTimesPerWeek(Math.max(1, form.timesPerWeek - 1))
                }
                style={[styles.stepperBtn, { borderColor: theme.border }]}
                accessibilityLabel="Decrease times per week"
              >
                <Text
                  style={[styles.stepperBtnText, { color: theme.textPrimary }]}
                >
                  −
                </Text>
              </Pressable>

              <Text
                style={[styles.stepperValue, { color: theme.textPrimary }]}
              >
                {form.timesPerWeek}× per week
              </Text>

              <Pressable
                onPress={() =>
                  form.setTimesPerWeek(Math.min(7, form.timesPerWeek + 1))
                }
                style={[styles.stepperBtn, { borderColor: theme.border }]}
                accessibilityLabel="Increase times per week"
              >
                <Text
                  style={[styles.stepperBtnText, { color: theme.textPrimary }]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── LIVE PREVIEW ───────────────────────────────────────── */}
        <SectionLabel label="Preview" />
        <View
          style={[
            styles.preview,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[styles.previewAccent, { backgroundColor: form.color }]}
          />
          <Text style={styles.previewEmoji}>{form.emoji}</Text>
          <Text
            style={[styles.previewName, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {form.name.trim() || "Your habit name"}
          </Text>
        </View>

        {/* ── SUBMIT ─────────────────────────────────────────────── */}
        <Button
          label={form.isEditMode ? "Save changes" : "Create habit"}
          onPress={handleSubmit}
          disabled={!form.isValid}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─────────────────────────────────────────────────────────────────
// FREQUENCY OPTION ROW — extracted to keep JSX readable
// ─────────────────────────────────────────────────────────────────

interface FrequencyOptionProps {
  label: string
  sublabel: string
  selected: boolean
  onSelect: () => void
  theme: ReturnType<typeof useTheme>
}

const FrequencyOption: React.FC<FrequencyOptionProps> = ({
  label,
  sublabel,
  selected,
  onSelect,
  theme,
}) => (
  <Pressable
    onPress={onSelect}
    style={styles.frequencyOption}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
  >
    {/* Radio circle */}
    <View
      style={[
        styles.radioOuter,
        { borderColor: selected ? theme.primary : theme.border },
      ]}
    >
      {selected && (
        <View
          style={[styles.radioInner, { backgroundColor: theme.primary }]}
        />
      )}
    </View>

    <View style={{ flex: 1 }}>
      <Text
        style={[
          styles.frequencyLabel,
          { color: selected ? theme.textPrimary : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.frequencySublabel, { color: theme.textSecondary }]}>
        {sublabel}
      </Text>
    </View>
  </Pressable>
)

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  textInput: {
    fontSize: typography.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  pickerRow: {
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  emojiOption: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 24,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  frequencyContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  frequencyOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  frequencyLabel: {
    fontSize: typography.md,
    fontWeight: "500",
  },
  frequencySublabel: {
    fontSize: typography.xs,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md * 2 + 22,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: typography.lg,
    fontWeight: "300",
    lineHeight: typography.lg * 1.3,
  },
  stepperValue: {
    fontSize: typography.md,
    fontWeight: "500",
    minWidth: 120,
    textAlign: "center",
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  previewAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  previewEmoji: {
    fontSize: typography.xl,
    marginLeft: spacing.sm,
  },
  previewName: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: "500",
  },
  submitButton: {
    marginTop: spacing.lg,
  },
})

export default CreateHabitScreen

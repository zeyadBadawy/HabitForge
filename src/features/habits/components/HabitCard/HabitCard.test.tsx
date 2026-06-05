/**
 * Tests for HabitCard compound component.
 * Tests cover: renders name/emoji/streak, sub-component composition,
 * press callback, and streak freeze button.
 */

import React from "react"
import { render, fireEvent, screen } from "@testing-library/react-native"
import HabitCard from "./HabitCard"
import CheckInButton from "../CheckInButton"
import type { IHabit, IStreak, ICompletion } from "../../types"

// ─── FIXTURES ─────────────────────────────────────────────────────

const mockHabit: IHabit = {
  id: "habit-1",
  name: "Read 30 minutes",
  emoji: "📚",
  color: "#6C63FF",
  frequency: { type: "daily" },
  createdAt: "2026-01-01T00:00:00.000Z",
  isArchived: false,
  streakFreezeAvailable: true,
}

const mockStreak: IStreak = {
  habitId: "habit-1",
  current: 14,
  longest: 30,
  lastCompletedDate: "2026-05-24",
}

const mockCompletions: ICompletion[] = []

// ─── TESTS ────────────────────────────────────────────────────────

describe("HabitCard", () => {
  it("renders children inside the card", () => {
    render(
      <HabitCard habit={mockHabit} testID="card">
        <HabitCard.Header habit={mockHabit} />
      </HabitCard>
    )
    expect(screen.getByText("Read 30 minutes")).toBeTruthy()
    expect(screen.getByText("📚")).toBeTruthy()
  })

  it("shows the correct frequency label — daily", () => {
    render(
      <HabitCard habit={mockHabit} testID="card">
        <HabitCard.Header habit={mockHabit} />
      </HabitCard>
    )
    expect(screen.getByText("Daily")).toBeTruthy()
  })

  it("shows the correct frequency label — custom", () => {
    const customHabit: IHabit = {
      ...mockHabit,
      frequency: { type: "custom", timesPerWeek: 3 },
    }
    render(
      <HabitCard habit={customHabit} testID="card">
        <HabitCard.Header habit={customHabit} />
      </HabitCard>
    )
    expect(screen.getByText("3× per week")).toBeTruthy()
  })

  it("calls onPress when the card is pressed", () => {
    const onPress = jest.fn()
    render(
      <HabitCard habit={mockHabit} onPress={onPress} testID="card">
        <HabitCard.Header habit={mockHabit} />
      </HabitCard>
    )
    fireEvent.press(screen.getByTestId("card"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("renders the Streak sub-component with the streak count", () => {
    render(
      <HabitCard habit={mockHabit} testID="card">
        <HabitCard.Streak streak={mockStreak} habit={mockHabit} />
      </HabitCard>
    )
    // StreakCounter shows the streak value
    expect(screen.getByText("14")).toBeTruthy()
    expect(screen.getByText("🔥")).toBeTruthy()
  })

  it("renders the streak freeze button when available", () => {
    const onFreeze = jest.fn()
    render(
      <HabitCard habit={mockHabit} testID="card">
        <HabitCard.Streak
          streak={mockStreak}
          habit={mockHabit}
          onUseFreeze={onFreeze}
        />
      </HabitCard>
    )
    expect(screen.getByTestId("streak-freeze-button")).toBeTruthy()
  })

  it("calls onUseFreeze when streak freeze button is pressed", () => {
    const onFreeze = jest.fn()
    render(
      <HabitCard habit={mockHabit} testID="card">
        <HabitCard.Streak
          streak={mockStreak}
          habit={mockHabit}
          onUseFreeze={onFreeze}
        />
      </HabitCard>
    )
    fireEvent.press(screen.getByTestId("streak-freeze-button"))
    expect(onFreeze).toHaveBeenCalledTimes(1)
  })

  it("renders the Progress sub-component", () => {
    render(
      <HabitCard habit={mockHabit} testID="card">
        <HabitCard.Progress habit={mockHabit} completions={mockCompletions} />
      </HabitCard>
    )
    expect(screen.getByTestId("progress-bar-habit-1")).toBeTruthy()
  })

  it("renders a full compound composition without crashing", () => {
    render(
      <HabitCard habit={mockHabit} onPress={jest.fn()} testID="card">
        <HabitCard.Header habit={mockHabit} />
        <HabitCard.Progress habit={mockHabit} completions={mockCompletions} />
        <HabitCard.Footer>
          <HabitCard.Streak streak={mockStreak} habit={mockHabit} />
          <CheckInButton isCompleted={false} onPress={jest.fn()} />
        </HabitCard.Footer>
      </HabitCard>
    )
    expect(screen.getByTestId("card")).toBeTruthy()
    expect(screen.getByText("Read 30 minutes")).toBeTruthy()
    expect(screen.getByText("Check in")).toBeTruthy()
  })
})

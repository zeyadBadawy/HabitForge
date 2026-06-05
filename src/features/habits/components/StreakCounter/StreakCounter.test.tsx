/**
 * Tests for StreakCounter.
 * Since Reanimated is mocked (animations run synchronously and immediately),
 * `displayValue` will equal `streak` immediately — we test the final
 * rendered state, not the animation in-flight.
 */

import React from "react"
import { render, screen } from "@testing-library/react-native"
import StreakCounter from "./StreakCounter"

describe("StreakCounter", () => {
  it("renders the streak number", () => {
    render(<StreakCounter streak={14} testID="counter" />)
    expect(screen.getByTestId("counter")).toBeTruthy()
    expect(screen.getByTestId("streak-value")).toBeTruthy()
  })

  it("renders 0 without crashing", () => {
    render(<StreakCounter streak={0} />)
    expect(screen.getByText("0")).toBeTruthy()
  })

  it("renders the fire emoji", () => {
    render(<StreakCounter streak={7} />)
    expect(screen.getByText("🔥")).toBeTruthy()
  })

  it("shows the label when showLabel=true", () => {
    render(<StreakCounter streak={5} showLabel />)
    expect(screen.getByText("day streak")).toBeTruthy()
  })

  it("hides the label when showLabel=false (default)", () => {
    render(<StreakCounter streak={5} />)
    expect(screen.queryByText("day streak")).toBeNull()
  })

  it("renders all three size variants without crashing", () => {
    const { rerender } = render(<StreakCounter streak={10} size="sm" />)
    rerender(<StreakCounter streak={10} size="md" />)
    rerender(<StreakCounter streak={10} size="lg" />)
    // No crash = pass
    expect(screen.getByText("🔥")).toBeTruthy()
  })
})

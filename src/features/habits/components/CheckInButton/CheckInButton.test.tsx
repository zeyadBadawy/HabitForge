/**
 * Tests for CheckInButton.
 * The Reanimated mock makes animations synchronous, so we can check
 * the final visual state immediately after setting props.
 */

import React, { useState } from "react"
import { render, fireEvent, screen } from "@testing-library/react-native"
import CheckInButton from "./CheckInButton"

// Stateful wrapper so we can test the isCompleted state transition
const CheckInButtonWrapper: React.FC<{ initialCompleted?: boolean }> = ({
  initialCompleted = false,
}) => {
  const [completed, setCompleted] = useState(initialCompleted)
  return (
    <CheckInButton
      isCompleted={completed}
      onPress={() => setCompleted((prev) => !prev)}
      testID="checkin-button"
    />
  )
}

describe("CheckInButton", () => {
  it("renders with 'Check in' label when not completed", () => {
    render(<CheckInButton isCompleted={false} onPress={jest.fn()} />)
    expect(screen.getByText("Check in")).toBeTruthy()
  })

  it("renders with '✓ Done' label when completed", () => {
    render(<CheckInButton isCompleted onPress={jest.fn()} />)
    expect(screen.getByText("✓ Done")).toBeTruthy()
  })

  it("calls onPress when pressed", () => {
    const onPress = jest.fn()
    render(<CheckInButton isCompleted={false} onPress={onPress} />)
    fireEvent.press(screen.getByTestId("checkin-button"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("transitions from 'Check in' to '✓ Done' when pressed", () => {
    render(<CheckInButtonWrapper />)
    expect(screen.getByText("Check in")).toBeTruthy()
    fireEvent.press(screen.getByTestId("checkin-button"))
    expect(screen.getByText("✓ Done")).toBeTruthy()
  })

  it("transitions back to 'Check in' on second press (undo)", () => {
    render(<CheckInButtonWrapper initialCompleted />)
    expect(screen.getByText("✓ Done")).toBeTruthy()
    fireEvent.press(screen.getByTestId("checkin-button"))
    expect(screen.getByText("Check in")).toBeTruthy()
  })

  it("renders with a custom testID", () => {
    render(<CheckInButton isCompleted={false} onPress={jest.fn()} testID="my-button" />)
    expect(screen.getByTestId("my-button")).toBeTruthy()
  })
})

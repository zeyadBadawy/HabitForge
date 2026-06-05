/**
 * Tests for Button — covers rendering, press handling, and visual states.
 * CONCEPT: React Native Testing Library (RNTL) mirrors the Testing Library
 * philosophy: query by what users see, not implementation details.
 * `getByText`, `getByTestId`, and `fireEvent` are the primary APIs.
 */

import React from "react"
import { render, fireEvent, screen } from "@testing-library/react-native"
import Button from "./Button"

describe("Button", () => {
  it("renders the label text", () => {
    render(<Button label="Save" onPress={jest.fn()} />)
    expect(screen.getByText("Save")).toBeTruthy()
  })

  it("calls onPress when pressed", () => {
    const onPress = jest.fn()
    render(<Button label="Save" onPress={onPress} />)
    fireEvent.press(screen.getByText("Save"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn()
    render(<Button label="Save" onPress={onPress} disabled />)
    fireEvent.press(screen.getByText("Save"))
    expect(onPress).not.toHaveBeenCalled()
  })

  it("shows a loading spinner when loading=true", () => {
    render(<Button label="Save" onPress={jest.fn()} loading />)
    expect(screen.getByTestId("button-loading")).toBeTruthy()
    // Label should NOT appear during loading
    expect(screen.queryByText("Save")).toBeNull()
  })

  it("does not call onPress when loading", () => {
    const onPress = jest.fn()
    render(<Button label="Save" onPress={onPress} loading />)
    // The button is disabled when loading — pressing has no effect
    fireEvent.press(screen.getByTestId("button-loading"))
    expect(onPress).not.toHaveBeenCalled()
  })

  it("renders with a testID", () => {
    render(<Button label="Save" onPress={jest.fn()} testID="save-btn" />)
    expect(screen.getByTestId("save-btn")).toBeTruthy()
  })
})

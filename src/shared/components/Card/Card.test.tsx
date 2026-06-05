import React from "react"
import { Text } from "react-native"
import { render, fireEvent, screen } from "@testing-library/react-native"
import Card from "./Card"

describe("Card", () => {
  it("renders children", () => {
    render(<Card><Text>Hello</Text></Card>)
    expect(screen.getByText("Hello")).toBeTruthy()
  })

  it("calls onPress when tappable Card is pressed", () => {
    const onPress = jest.fn()
    render(<Card onPress={onPress} testID="card"><Text>Content</Text></Card>)
    fireEvent.press(screen.getByTestId("card"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("renders as a plain View (no press handler) when onPress is omitted", () => {
    // Should render without error and show children
    render(<Card testID="card"><Text>Static</Text></Card>)
    expect(screen.getByText("Static")).toBeTruthy()
  })
})

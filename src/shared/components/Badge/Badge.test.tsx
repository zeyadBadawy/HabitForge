import React from "react"
import { render, screen } from "@testing-library/react-native"
import Badge from "./Badge"

describe("Badge", () => {
  it("shows emoji and label when unlocked", () => {
    render(<Badge emoji="🔥" label="On Fire" unlocked />)
    expect(screen.getByText("🔥")).toBeTruthy()
    expect(screen.getByText("On Fire")).toBeTruthy()
  })

  it("shows lock emoji when not unlocked", () => {
    render(<Badge emoji="🔥" label="On Fire" unlocked={false} />)
    expect(screen.getByText("🔒")).toBeTruthy()
    expect(screen.queryByText("🔥")).toBeNull()
  })

  it("shows sublabel when provided", () => {
    render(<Badge emoji="🔥" label="On Fire" sublabel="Unlocked May 1" unlocked />)
    expect(screen.getByText("Unlocked May 1")).toBeTruthy()
  })

  it("renders with testID", () => {
    render(<Badge emoji="🔥" label="On Fire" unlocked testID="badge" />)
    expect(screen.getByTestId("badge")).toBeTruthy()
  })
})

/**
 * Tests for ProgressBar.
 * NOTE: Layout-dependent tests (actual pixel widths) can't be tested in
 * Jest because onLayout never fires without a native renderer. We test the
 * structure and prop-driven rendering instead.
 */

import React from "react"
import { render, screen } from "@testing-library/react-native"
import ProgressBar from "./ProgressBar"

describe("ProgressBar", () => {
  it("renders without crashing", () => {
    render(<ProgressBar progress={0.5} testID="bar" />)
    expect(screen.getByTestId("bar")).toBeTruthy()
  })

  it("renders the fill element", () => {
    render(<ProgressBar progress={0.5} />)
    expect(screen.getByTestId("progress-fill")).toBeTruthy()
  })

  it("renders at 0% without crashing", () => {
    render(<ProgressBar progress={0} testID="bar" />)
    expect(screen.getByTestId("bar")).toBeTruthy()
  })

  it("renders at 100% without crashing", () => {
    render(<ProgressBar progress={1} testID="bar" />)
    expect(screen.getByTestId("bar")).toBeTruthy()
  })
})

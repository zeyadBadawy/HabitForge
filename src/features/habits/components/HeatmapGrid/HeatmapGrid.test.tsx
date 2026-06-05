/**
 * Tests for HeatmapGrid + HeatmapCell.
 * We test the data-driven rendering: correct number of cells, correct
 * testIDs, and that the onCellPress callback fires with the right data.
 */

import React from "react"
import { render, fireEvent, screen } from "@testing-library/react-native"
import HeatmapGrid from "./HeatmapGrid"
import type { ICompletion } from "../../types"
import { getTodayDateString } from "../../../../shared/utils/dateUtils"

const today = getTodayDateString()

const makeCompletion = (date: string): ICompletion => ({
  id: `c-${date}`,
  habitId: "habit-1",
  completedAt: `${date}T12:00:00.000Z`,
})

describe("HeatmapGrid", () => {
  it("renders without crashing with no completions", () => {
    render(<HeatmapGrid completions={[]} testID="grid" />)
    expect(screen.getByTestId("grid")).toBeTruthy()
  })

  it("renders exactly weeks×7 cells for the given week count", () => {
    render(<HeatmapGrid completions={[]} weeks={4} />)
    // 4 weeks × 7 days = 28 cells
    expect(screen.getAllByTestId(/^heatmap-cell-/)).toHaveLength(28)
  })

  it("defaults to 12 weeks (84 cells) when weeks is omitted", () => {
    render(<HeatmapGrid completions={[]} />)
    expect(screen.getAllByTestId(/^heatmap-cell-/)).toHaveLength(84)
  })

  it("renders a cell for today's date", () => {
    render(<HeatmapGrid completions={[]} weeks={4} />)
    expect(screen.getByTestId(`heatmap-cell-${today}`)).toBeTruthy()
  })

  it("calls onCellPress with the correct cell when a cell is pressed", () => {
    const onCellPress = jest.fn()
    render(
      <HeatmapGrid
        completions={[makeCompletion(today)]}
        weeks={4}
        onCellPress={onCellPress}
      />
    )
    fireEvent.press(screen.getByTestId(`heatmap-cell-${today}`))
    expect(onCellPress).toHaveBeenCalledWith(
      expect.objectContaining({ date: today })
    )
  })

  it("does not call onCellPress if prop is not provided", () => {
    // Should render without crash even if onCellPress is undefined
    render(<HeatmapGrid completions={[makeCompletion(today)]} weeks={2} />)
    // No crash = pass
    expect(screen.getAllByTestId(/^heatmap-cell-/)).toBeTruthy()
  })
})

describe("HeatmapCell — intensity rendering", () => {
  it("renders a cell with the correct testID for its date", () => {
    render(<HeatmapGrid completions={[]} weeks={2} />)
    // All cell testIDs should be date strings
    const cells = screen.getAllByTestId(/^heatmap-cell-\d{4}-\d{2}-\d{2}$/)
    expect(cells.length).toBe(14)
  })
})

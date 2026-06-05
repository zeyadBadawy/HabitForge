/**
 * CONCEPT: React.memo — prevents re-render when props haven't changed.
 * A 12-week heatmap has 84 cells. Without React.memo, every cell re-renders
 * when ANY state in the parent changes (e.g. a different habit's data loads).
 * With React.memo, React does a shallow prop comparison: if `cell` and
 * `size` are the same object references, the cell skips rendering entirely.
 *
 * WHY MEMO HERE SPECIFICALLY: HeatmapGrid passes each cell as an object
 * from a memoized array. If the parent's `completions` prop hasn't changed,
 * the grid array reference is stable → no cell re-renders. This keeps
 * scrolling the heatmap at 60fps even with 52+ weeks of data.
 *
 * GOTCHA — memo only does shallow comparison: If you pass a new object
 * literal as a prop on every render, memo won't help because `{} !== {}`.
 * The cell object must come from a stable memoized source (like useMemo).
 */

import React from "react"
import { Pressable, StyleSheet, type ViewStyle } from "react-native"
import type { IHeatmapCell } from "../../types"
import { useTheme } from "../../../../theme/useTheme"
import { borderRadius } from "../../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface HeatmapCellProps {
  cell: IHeatmapCell
  size?: number                              // square size in pts — default 14
  onPress?: (cell: IHeatmapCell) => void
  style?: ViewStyle
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT — wrapped in React.memo
// ─────────────────────────────────────────────────────────────────

const HeatmapCell: React.FC<HeatmapCellProps> = React.memo(
  ({ cell, size = 14, onPress, style }) => {
    const theme = useTheme()

    // Map intensity level to the correct theme color
    const intensityColors: Record<number, string> = {
      0: theme.intensity0,
      1: theme.intensity1,
      2: theme.intensity2,
      3: theme.intensity3,
      4: theme.intensity4,
    }

    const backgroundColor = intensityColors[cell.intensity] ?? theme.intensity0

    const cellStyle: ViewStyle = {
      width: size,
      height: size,
      backgroundColor,
      borderRadius: borderRadius.sm,
    }

    if (onPress) {
      return (
        <Pressable
          onPress={() => onPress(cell)}
          style={({ pressed }) => [
            cellStyle,
            // Slightly dim on press to show interactivity
            pressed && { opacity: 0.7 },
            style,
          ]}
          accessibilityLabel={`${cell.date}: ${cell.completionCount} completion${cell.completionCount !== 1 ? "s" : ""}`}
          testID={`heatmap-cell-${cell.date}`}
        />
      )
    }

    return (
      <Pressable
        style={[cellStyle, style]}
        accessibilityLabel={`${cell.date}: ${cell.completionCount} completions`}
        testID={`heatmap-cell-${cell.date}`}
      />
    )
  },
  // Custom comparison: only re-render if intensity, date, or size changed
  // This is more precise than the default shallow-compare on the entire props
  (prev, next) =>
    prev.cell.intensity === next.cell.intensity &&
    prev.cell.date === next.cell.date &&
    prev.size === next.size
)

// Give the component a display name for React DevTools
HeatmapCell.displayName = "HeatmapCell"

export default HeatmapCell

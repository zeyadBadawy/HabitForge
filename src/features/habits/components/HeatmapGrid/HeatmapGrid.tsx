/**
 * CONCEPT: useMemo + React.memo for expensive list rendering.
 * The heatmap has two layers of optimisation:
 *
 * 1. useMemo on data transformation: `buildHeatmapData(completions, weeks)`
 *    is only recalculated when `completions` or `weeks` changes.
 *    Without useMemo, it runs on every parent re-render even when the
 *    completion data hasn't changed.
 *
 * 2. React.memo on HeatmapCell: individual squares don't re-render unless
 *    their data changes. See HeatmapCell.tsx for details.
 *
 * LAYOUT: The grid renders as a horizontal ScrollView.
 * Inside it: one column per week (oldest left → newest right).
 * Inside each column: 7 cells (Mon top → Sun bottom).
 * This matches GitHub's contribution graph orientation.
 *
 * WHY ScrollView OVER FlatList: FlatList virtualises items along ONE axis.
 * Our grid is 2D — a ScrollView with a flex row layout is simpler and
 * correct for a bounded dataset (12–52 weeks max).
 */

import React, { useMemo, useCallback } from "react"
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  type ViewStyle,
} from "react-native"
import type { ICompletion, IHeatmapCell } from "../../types"
import { buildHeatmapData } from "../../utils/heatmapTransformer"
import { useTheme } from "../../../../theme/useTheme"
import { spacing, typography } from "../../../../theme/theme"
import HeatmapCell from "./HeatmapCell"

// Day labels on the left axis (Mon–Sun)
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]
const CELL_SIZE = 14  // pixels — matches GitHub's contribution graph
const CELL_GAP = 3    // gap between cells

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface HeatmapGridProps {
  completions: ICompletion[]
  weeks?: number
  onCellPress?: (cell: IHeatmapCell) => void
  style?: ViewStyle
  testID?: string
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  completions,
  weeks = 12,
  onCellPress,
  style,
  testID,
}) => {
  const theme = useTheme()

  // useMemo: only rebuild the 2D grid when completions or week count changes.
  // buildHeatmapData is O(n×weeks) — memoising prevents expensive recalculation
  // on every parent re-render.
  const grid = useMemo(
    () => buildHeatmapData(completions, weeks),
    [completions, weeks]
  )

  // useCallback: stable reference for the press handler.
  // Without useCallback, a new function is created on every render, which
  // breaks React.memo on HeatmapCell (because the prop reference changed).
  const handleCellPress = useCallback(
    (cell: IHeatmapCell) => {
      onCellPress?.(cell)
    },
    [onCellPress]
  )

  return (
    <View testID={testID} style={[styles.container, style]}>
      {/* Day-of-week labels on the left (M T W T F S S) */}
      <View style={styles.dayLabelColumn}>
        {DAY_LABELS.map((label, i) => (
          <Text
            key={`day-${i}`}
            style={[styles.dayLabel, { color: theme.textSecondary }]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* The grid itself — scrollable horizontally */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {grid.map((weekCells, weekIndex) => (
          // Each column = one week
          <View key={`week-${weekIndex}`} style={styles.weekColumn}>
            {weekCells.map((cell) => (
              <HeatmapCell
                key={cell.date}
                cell={cell}
                size={CELL_SIZE}
                onPress={onCellPress ? handleCellPress : undefined}
                style={styles.cell}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dayLabelColumn: {
    // Left-aligned labels aligned to each cell row
    paddingTop: 0,
    marginRight: spacing.xs,
  },
  dayLabel: {
    fontSize: typography.xs - 1, // 11pt — very small to match GitHub
    height: CELL_SIZE + CELL_GAP, // aligns with each cell row
    lineHeight: CELL_SIZE + CELL_GAP,
    textAlign: "right",
    width: 10,
  },
  scrollContent: {
    flexDirection: "row",
    gap: CELL_GAP,
  },
  weekColumn: {
    flexDirection: "column",
    gap: CELL_GAP,
  },
  cell: {
    // Gap applied via `gap` in parent column — no extra margin here
  },
})

export default HeatmapGrid

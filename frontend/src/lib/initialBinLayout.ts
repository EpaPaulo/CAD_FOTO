import type { BinConfig, BinData, FingerHole, PlacedTool, Point } from '@/types'
import { createPartialBinsValues } from './binDefaults'
import { GRID_UNIT, getGridSizeError, requiredGridUnits } from './constants'

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/** Bounding box of finite points, or null when a tool carries unusable geometry. */
function bounds(points: Iterable<Point>): Bounds | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null
    if (point.x < minX) minX = point.x
    if (point.x > maxX) maxX = point.x
    if (point.y < minY) minY = point.y
    if (point.y > maxY) maxY = point.y
  }
  if (minX === Infinity) return null
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** Corners of the circle that encloses a finger hole at any rotation. */
function holeCorners(hole: FingerHole): Point[] {
  const round = !hole.shape || hole.shape === 'circle' || hole.shape === 'cylinder'
  const radius = round
    ? hole.radius
    : Math.hypot(hole.width ?? hole.radius * 2, hole.height ?? hole.radius * 2) / 2
  return [
    { x: hole.x - radius, y: hole.y - radius },
    { x: hole.x + radius, y: hole.y + radius },
  ]
}

function translateTool(tool: PlacedTool, dx: number, dy: number): PlacedTool {
  const move = <T extends Point>(point: T): T => ({ ...point, x: point.x + dx, y: point.y + dy })
  return {
    ...tool,
    points: tool.points.map(move),
    finger_holes: tool.finger_holes.map(move),
    interior_rings: tool.interior_rings.map(ring => ring.map(move)),
  }
}

/**
 * A shelf arrangement for newly created bins only; never repacks saved work.
 *
 * Tools arrive from the tracer at their positions on the photographed sheet, so
 * a bin built from them is as big as the sheet. Packing them into rows keeps
 * them clear of each other while shrinking the bin to something printable.
 *
 * Returns null when no better arrangement can be produced, in which case the
 * caller keeps the layout the backend already created.
 */
export function initialBinLayout(
  bin: BinData,
): { placed_tools: PlacedTool[]; bin_config: BinConfig } | null {
  const config = bin.bin_config
  if (bin.placed_tools.length < 2) return null

  // Cutouts grow by the clearance on every side, so this leaves a wall between
  // neighbouring pockets rather than between the raw outlines.
  const gap = 2 * config.cutout_clearance + config.wall_thickness + 1
  const margin = config.wall_thickness + config.cutout_clearance + 0.25

  const boxes = bin.placed_tools.map(tool => {
    const outline = bounds(tool.points)
    const full = bounds([...tool.points, ...tool.finger_holes.flatMap(holeCorners)])
    return outline && full ? { tool, outline, full } : null
  })
  if (boxes.some(box => box === null)) return null
  const placeable = boxes as NonNullable<(typeof boxes)[number]>[]

  // Tallest first: shelf packing wastes far less height with even rows.
  const order = placeable
    .map((_, index) => index)
    .sort((a, b) => placeable[b].full.height - placeable[a].full.height)

  // Aim for a roughly square bin, but never narrower than the widest tool.
  const padded = placeable.reduce((area, box) => area + (box.full.width + gap) * (box.full.height + gap), 0)
  const rowWidth = Math.max(...placeable.map(box => box.full.width), Math.sqrt(padded))

  const arranged: PlacedTool[] = new Array(placeable.length)
  let x = margin, y = margin, rowHeight = 0
  let placedOutline: Bounds | null = null

  for (const index of order) {
    const { tool, outline, full } = placeable[index]
    if (x > margin && x - margin + full.width > rowWidth) {
      x = margin
      y += rowHeight + gap
      rowHeight = 0
    }
    const dx = x - full.minX, dy = y - full.minY
    arranged[index] = translateTool(tool, dx, dy)
    placedOutline = placedOutline
      ? {
          minX: Math.min(placedOutline.minX, outline.minX + dx),
          minY: Math.min(placedOutline.minY, outline.minY + dy),
          maxX: Math.max(placedOutline.maxX, outline.maxX + dx),
          maxY: Math.max(placedOutline.maxY, outline.maxY + dy),
          width: 0,
          height: 0,
        }
      : { minX: outline.minX + dx, minY: outline.minY + dy, maxX: outline.maxX + dx, maxY: outline.maxY + dy, width: 0, height: 0 }
    rowHeight = Math.max(rowHeight, full.height)
    x += full.width + gap
  }
  if (!placedOutline) return null

  // Size from the outlines alone so the bin editor's auto-fit, which measures
  // the same way, leaves the saved grid alone when the bin is opened.
  const totalMargin = 2 * margin
  const grid_x = requiredGridUnits(placedOutline.maxX - placedOutline.minX, totalMargin, config.half_grid_base)
  const grid_y = requiredGridUnits(placedOutline.maxY - placedOutline.minY, totalMargin, config.half_grid_base)
  if (getGridSizeError(grid_x, grid_y)) return null

  // Centre the arrangement, matching how the backend and the editor place tools.
  const centreX = grid_x * GRID_UNIT / 2 - (placedOutline.minX + placedOutline.maxX) / 2
  const centreY = grid_y * GRID_UNIT / 2 - (placedOutline.minY + placedOutline.maxY) / 2

  return {
    placed_tools: arranged.map(tool => translateTool(tool, centreX, centreY)),
    bin_config: { ...config, grid_x, grid_y, partial_bins_values: createPartialBinsValues(grid_x, grid_y) },
  }
}

import { describe, expect, it } from 'vitest'
import { initialBinLayout } from './initialBinLayout'
import { buildBinConfig } from './binDefaults'
import { GRID_UNIT } from './constants'
import type { BinData, FingerHole, PlacedTool, Point } from '@/types'

function rect(x: number, y: number, width: number, height: number): Point[] {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ]
}

function tool(id: string, points: Point[], finger_holes: FingerHole[] = []): PlacedTool {
  return { id, tool_id: `t-${id}`, name: id, points, finger_holes, interior_rings: [], rotation: 0 }
}

function bin(tools: PlacedTool[]): BinData {
  return {
    id: 'bin-1',
    name: 'My tool bin',
    bin_config: buildBinConfig(),
    placed_tools: tools,
    text_labels: [],
  } as unknown as BinData
}

function outline(placed: PlacedTool) {
  const xs = placed.points.map(p => p.x)
  const ys = placed.points.map(p => p.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

function overlaps(a: PlacedTool, b: PlacedTool, clearance: number) {
  const boxA = outline(a)
  const boxB = outline(b)
  return (
    boxA.minX - clearance < boxB.maxX + clearance &&
    boxB.minX - clearance < boxA.maxX + clearance &&
    boxA.minY - clearance < boxB.maxY + clearance &&
    boxB.minY - clearance < boxA.maxY + clearance
  )
}

describe('initialBinLayout', () => {
  it('separates tools the tracer left overlapping on the sheet', () => {
    const clearance = buildBinConfig().cutout_clearance
    const layout = initialBinLayout(bin([
      tool('a', rect(0, 0, 60, 30)),
      tool('b', rect(10, 5, 40, 50)),
      tool('c', rect(20, 10, 25, 25)),
    ]))!
    expect(layout).not.toBeNull()
    const [a, b, c] = layout.placed_tools
    expect(overlaps(a, b, clearance)).toBe(false)
    expect(overlaps(a, c, clearance)).toBe(false)
    expect(overlaps(b, c, clearance)).toBe(false)
  })

  it('shrinks a sheet-sized bin to the packed footprint', () => {
    // Two small tools traced at opposite corners of an A4 sheet.
    const layout = initialBinLayout(bin([
      tool('a', rect(0, 0, 30, 20)),
      tool('b', rect(180, 270, 30, 20)),
    ]))!
    expect(layout.bin_config.grid_x).toBeLessThanOrEqual(2)
    expect(layout.bin_config.grid_y).toBeLessThanOrEqual(2)
    expect(layout.bin_config.partial_bins_values).toHaveLength(
      Math.ceil(layout.bin_config.grid_x) * Math.ceil(layout.bin_config.grid_y),
    )
  })

  it('keeps every tool and its finger holes inside the bin', () => {
    const layout = initialBinLayout(bin([
      tool('a', rect(0, 0, 50, 40), [{ id: 'h1', x: 25, y: 20, radius: 8 }]),
      tool('b', rect(0, 0, 30, 70), [{ id: 'h2', x: 15, y: 35, radius: 6, shape: 'rectangle', width: 12, height: 8 }]),
    ]))!
    const binW = layout.bin_config.grid_x * GRID_UNIT
    const binH = layout.bin_config.grid_y * GRID_UNIT
    for (const placed of layout.placed_tools) {
      for (const point of placed.points) {
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.x).toBeLessThanOrEqual(binW)
        expect(point.y).toBeLessThanOrEqual(binH)
      }
    }
  })

  it('moves finger holes and interior rings with their tool', () => {
    const source = tool('a', rect(100, 100, 40, 30), [{ id: 'h1', x: 120, y: 115, radius: 5, depth_override: 3 }])
    source.interior_rings = [rect(110, 110, 10, 10)]
    const layout = initialBinLayout(bin([source, tool('b', rect(0, 0, 40, 30))]))!
    const moved = layout.placed_tools[0]
    const dx = moved.points[0].x - source.points[0].x
    const dy = moved.points[0].y - source.points[0].y
    expect(moved.finger_holes[0].x).toBeCloseTo(120 + dx)
    expect(moved.finger_holes[0].y).toBeCloseTo(115 + dy)
    expect(moved.finger_holes[0].depth_override).toBe(3)
    expect(moved.interior_rings[0][0].x).toBeCloseTo(110 + dx)
    expect(moved.interior_rings[0][0].y).toBeCloseTo(110 + dy)
  })

  it('preserves the original tool order and identity', () => {
    const layout = initialBinLayout(bin([
      tool('small', rect(0, 0, 20, 10)),
      tool('tall', rect(0, 0, 20, 90)),
      tool('wide', rect(0, 0, 90, 20)),
    ]))!
    expect(layout.placed_tools.map(t => t.id)).toEqual(['small', 'tall', 'wide'])
  })

  it('does not touch the tools it was given', () => {
    const source = tool('a', rect(5, 5, 20, 20), [{ id: 'h1', x: 10, y: 10, radius: 2 }])
    initialBinLayout(bin([source, tool('b', rect(0, 0, 20, 20))]))
    expect(source.points[0]).toEqual({ x: 5, y: 5 })
    expect(source.finger_holes[0].x).toBe(10)
  })

  it('leaves single-tool bins to the centring the backend already did', () => {
    expect(initialBinLayout(bin([tool('a', rect(0, 0, 20, 20))]))).toBeNull()
  })

  it('gives up instead of proposing a bin beyond the grid limits', () => {
    const many = Array.from({ length: 30 }, (_, i) => tool(`t${i}`, rect(0, 0, 120, 120)))
    expect(initialBinLayout(bin(many))).toBeNull()
  })

  it('gives up on unusable geometry rather than writing NaN coordinates', () => {
    expect(initialBinLayout(bin([
      tool('a', rect(0, 0, 20, 20)),
      tool('b', [{ x: 0, y: 0 }, { x: NaN, y: 10 }]),
    ]))).toBeNull()
    expect(initialBinLayout(bin([tool('a', rect(0, 0, 20, 20)), tool('b', [])]))).toBeNull()
  })
})

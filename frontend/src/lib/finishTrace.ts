import { createBin, saveToolsFromSession, updatePolygons, updateBin } from './api'
import { getDefaultBinDefaults } from './binDefaults'
import type { BinData, Polygon } from '@/types'
import { initialBinLayout } from './initialBinLayout'

export interface TraceCheckpoint { snapshot?: string; toolIds?: string[]; bin?: BinData }

/** Keep a successful library save when bin creation needs to be retried. */
export async function finishTrace(sessionId: string, polygons: Polygon[], selectedIds: string[], destination: 'bin' | 'library', checkpoint: TraceCheckpoint) {
  if (!selectedIds.length) throw new Error('Select at least one tool to continue.')
  const snapshot = JSON.stringify([sessionId, polygons, [...selectedIds].sort()])
  if (checkpoint.snapshot !== snapshot || !checkpoint.toolIds) {
    await updatePolygons(sessionId, polygons)
    const toolIds = await saveToolsFromSession(sessionId, selectedIds)
    if (!toolIds.length) throw new Error('No tools could be saved. Check the outlines and try again.')
    checkpoint.snapshot = snapshot
    checkpoint.toolIds = toolIds
    checkpoint.bin = undefined
  }
  if (checkpoint.toolIds.length !== selectedIds.length) {
    throw new Error(`Saved ${checkpoint.toolIds.length} of ${selectedIds.length} tools. Some outlines could not be saved. Check your tool library before continuing.`)
  }
  if (destination === 'library') return '/#tools'
  const firstTool = polygons.find(polygon => selectedIds.includes(polygon.id))
  const bin = checkpoint.bin ?? await createBin({
    name: selectedIds.length === 1 ? `${firstTool?.label || 'Tool'} bin` : 'My tool bin',
    tool_ids: checkpoint.toolIds,
    bin_config: getDefaultBinDefaults(),
  })
  checkpoint.bin = bin
  const layout = initialBinLayout(bin)
  if (layout) await updateBin(bin.id, layout)
  return `/bins/${bin.id}`
}

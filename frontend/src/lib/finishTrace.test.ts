import { beforeEach, describe, expect, it, vi } from 'vitest'
import { finishTrace, type TraceCheckpoint } from './finishTrace'
import { createBin, saveToolsFromSession, updatePolygons, updateBin } from './api'
import { initialBinLayout } from './initialBinLayout'
import type { Polygon } from '@/types'

vi.mock('./api', () => ({ createBin: vi.fn(), saveToolsFromSession: vi.fn(), updatePolygons: vi.fn(), updateBin: vi.fn() }))
vi.mock('./binDefaults', () => ({ getDefaultBinDefaults: () => ({ bed_size: 256 }) }))
vi.mock('./initialBinLayout', () => ({ initialBinLayout: vi.fn() }))
const polygons = [{ id: 'a', label: 'Pliers', points: [] }, { id: 'b', label: 'Wrench', points: [] }] as unknown as Polygon[]

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(saveToolsFromSession).mockResolvedValue(['saved-a'])
  vi.mocked(createBin).mockResolvedValue({ id: 'new-bin', placed_tools: [] } as unknown as Awaited<ReturnType<typeof createBin>>)
  vi.mocked(initialBinLayout).mockReturnValue({ placed_tools: [], bin_config: {} } as unknown as ReturnType<typeof initialBinLayout>)
})

describe('finishTrace', () => {
  it('retries a failed initial arrangement without duplicating tools or bins', async () => {
    vi.mocked(createBin).mockResolvedValue({ id: 'new-bin', placed_tools: [{}, {}] } as Awaited<ReturnType<typeof createBin>>)
    vi.mocked(saveToolsFromSession).mockResolvedValue(['saved-a', 'saved-b'])
    vi.mocked(updateBin).mockRejectedValueOnce(new Error('Offline'))
    const checkpoint: TraceCheckpoint = {}
    await expect(finishTrace('session', polygons, ['a', 'b'], 'bin', checkpoint)).rejects.toThrow('Offline')
    expect(await finishTrace('session', polygons, ['a', 'b'], 'bin', checkpoint)).toBe('/bins/new-bin')
    expect(createBin).toHaveBeenCalledOnce()
    expect(saveToolsFromSession).toHaveBeenCalledOnce()
    expect(updateBin).toHaveBeenCalledTimes(2)
  })
  it('keeps the backend arrangement when no better one is available', async () => {
    vi.mocked(initialBinLayout).mockReturnValue(null)
    expect(await finishTrace('session', polygons, ['a'], 'bin', {})).toBe('/bins/new-bin')
    expect(updateBin).not.toHaveBeenCalled()
  })
  it('carries only selected tools and saved defaults directly into a bin', async () => {
    expect(await finishTrace('session', polygons, ['a'], 'bin', {})).toBe('/bins/new-bin')
    expect(saveToolsFromSession).toHaveBeenCalledWith('session', ['a'])
    expect(createBin).toHaveBeenCalledWith({ name: 'Pliers bin', tool_ids: ['saved-a'], bin_config: { bed_size: 256 } })
  })
  it('reuses the saved tools after bin creation fails', async () => {
    const checkpoint: TraceCheckpoint = {}
    vi.mocked(createBin).mockRejectedValueOnce(new Error('Offline'))
    await expect(finishTrace('session', polygons, ['a'], 'bin', checkpoint)).rejects.toThrow('Offline')
    expect(await finishTrace('session', polygons, ['a'], 'bin', checkpoint)).toBe('/bins/new-bin')
    expect(saveToolsFromSession).toHaveBeenCalledTimes(1)
    expect(updatePolygons).toHaveBeenCalledTimes(1)
  })
  it('keeps library-only saving available without creating a bin', async () => {
    expect(await finishTrace('session', polygons, ['a'], 'library', {})).toBe('/#tools')
    expect(createBin).not.toHaveBeenCalled()
  })
  it('does not create an empty bin when no tools were saved', async () => {
    vi.mocked(saveToolsFromSession).mockResolvedValue([])
    await expect(finishTrace('session', polygons, ['a'], 'bin', {})).rejects.toThrow('No tools could be saved')
    expect(createBin).not.toHaveBeenCalled()
  })
  it('rejects an empty selection before saving', async () => {
    await expect(finishTrace('session', polygons, [], 'bin', {})).rejects.toThrow('Select at least one')
    expect(updatePolygons).not.toHaveBeenCalled()
  })
  it('does not reuse an old selection after the user changes it', async () => {
    const checkpoint: TraceCheckpoint = {}
    await finishTrace('session', polygons, ['a'], 'library', checkpoint)
    await finishTrace('session', polygons, ['b'], 'bin', checkpoint)
    expect(saveToolsFromSession).toHaveBeenLastCalledWith('session', ['b'])
  })
})

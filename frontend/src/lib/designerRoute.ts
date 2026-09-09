/**
 * The designer keeps photo, tools, and bin on one page. Its phase lives in the
 * query string so a reload, a bookmark, or a shared link reopens the same work.
 */
export type DesignerPhase = 'upload' | 'trace' | 'design'

export interface DesignerRoute {
  phase: DesignerPhase
  sessionId?: string
  binId?: string
}

interface ReadableParams {
  get(key: string): string | null
}

export function readDesignerRoute(params: ReadableParams): DesignerRoute {
  const sessionId = params.get('session')?.trim() || undefined
  const binId = params.get('bin')?.trim() || undefined

  if (binId) return { phase: 'design', sessionId, binId }
  if (sessionId) return { phase: 'trace', sessionId }
  return { phase: 'upload' }
}

export function designerUrl(route: Omit<DesignerRoute, 'phase'>): string {
  const query = new URLSearchParams()
  if (route.sessionId) query.set('session', route.sessionId)
  if (route.binId) query.set('bin', route.binId)
  const search = query.toString()
  return search ? `/designer?${search}` : '/designer'
}

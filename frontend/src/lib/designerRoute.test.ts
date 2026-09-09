import { describe, expect, it } from 'vitest'
import { designerUrl, readDesignerRoute } from './designerRoute'

function params(search: string) {
  return new URLSearchParams(search)
}

describe('readDesignerRoute', () => {
  it('starts at the photo when nothing has been uploaded', () => {
    expect(readDesignerRoute(params(''))).toEqual({ phase: 'upload' })
  })

  it('reopens a session at the trace', () => {
    expect(readDesignerRoute(params('session=abc'))).toEqual({ phase: 'trace', sessionId: 'abc' })
  })

  it('reopens a created bin at the design phase, keeping its session', () => {
    expect(readDesignerRoute(params('session=abc&bin=def'))).toEqual({
      phase: 'design',
      sessionId: 'abc',
      binId: 'def',
    })
  })

  it('opens a bin without a session', () => {
    expect(readDesignerRoute(params('bin=def'))).toEqual({
      phase: 'design',
      sessionId: undefined,
      binId: 'def',
    })
  })

  it('ignores blank values instead of opening an empty session', () => {
    expect(readDesignerRoute(params('session=%20'))).toEqual({ phase: 'upload' })
  })
})

describe('designerUrl', () => {
  it('addresses the bare designer', () => {
    expect(designerUrl({})).toBe('/designer')
  })

  it('addresses a session', () => {
    expect(designerUrl({ sessionId: 'abc' })).toBe('/designer?session=abc')
  })

  it('addresses a bin created from a session', () => {
    expect(designerUrl({ sessionId: 'abc', binId: 'def' })).toBe('/designer?session=abc&bin=def')
  })

  it('round-trips through readDesignerRoute', () => {
    const route = { sessionId: 'abc', binId: 'def' }
    const url = designerUrl(route)
    expect(readDesignerRoute(params(url.split('?')[1]))).toEqual({ phase: 'design', ...route })
  })
})

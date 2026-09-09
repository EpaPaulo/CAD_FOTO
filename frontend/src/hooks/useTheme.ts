'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()
let observer: MutationObserver | null = null
let initialized = false

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'
}

function emit() {
  for (const listener of listeners) listener()
}

function ensureObserver() {
  if (observer || typeof document === 'undefined') return
  observer = new MutationObserver(emit)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
}

/** Resolve the theme from localStorage once on the client; light is the default. */
export function initTheme() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  const stored = localStorage.getItem('theme')
  document.documentElement.setAttribute(
    'data-theme',
    stored === 'light' || stored === 'dark' ? stored : 'light',
  )
}

function subscribe(listener: () => void) {
  initTheme()
  listeners.add(listener)
  ensureObserver()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && observer) {
      observer.disconnect()
      observer = null
    }
  }
}

function getSnapshot(): Theme {
  return readTheme()
}

function getServerSnapshot(): Theme {
  return 'light'
}

export function setTheme(next: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('theme', next)
  emit()
}

export function toggleTheme() {
  setTheme(readTheme() === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const set = useCallback((next: Theme) => setTheme(next), [])
  const toggle = useCallback(() => toggleTheme(), [])

  return { theme, setTheme: set, toggleTheme: toggle }
}

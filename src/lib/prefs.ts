import { useCallback, useState } from 'react'

/** Préférences propres à cet ordinateur (favoris, commandes récentes). Le navigateur peut les refuser : on ne plante jamais pour ça. */
function read(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}
function write(key: string, value: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* stockage indisponible */ }
}

export function useStoredList(key: string, max = 50) {
  const [list, setList] = useState<string[]>(() => read(key))
  const toggle = useCallback((item: string) => setList((l) => {
    const next = l.includes(item) ? l.filter((x) => x !== item) : [...l, item].slice(-max)
    write(key, next); return next
  }), [key, max])
  const push = useCallback((item: string) => setList((l) => {
    const next = [item, ...l.filter((x) => x !== item)].slice(0, max)
    write(key, next); return next
  }), [key, max])
  return { list, toggle, push }
}

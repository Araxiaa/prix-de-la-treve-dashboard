import { useCallback, useEffect, useState } from 'react'
import { useJobs } from './jobs'

export interface AsyncState<T> { data: T | null; error: string | null; loading: boolean; reload: () => void }

/** Charge des données et les recharge quand `deps` change, qu'on appelle `reload()` ou qu'une demande aux bots se termine. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const { refreshTick } = useJobs()
  const [bump, setBump] = useState(0)
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    loader()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((e: Error) => alive && setState({ data: null, error: e.message, loading: false }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshTick, bump])
  return { ...state, reload: useCallback(() => setBump((b) => b + 1), []) }
}

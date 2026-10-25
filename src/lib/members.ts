import { useMemo } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import { useAsync } from './hooks'
import type { Member } from './types'

/** Noms lisibles des identifiants Discord (tenus à jour par Bubulle). Sans nom connu : « Membre …1234 ». */
export function useMembers() {
  const { guild } = useAuth()
  const state = useAsync(() => (guild ? api.members(guild) : Promise.resolve([] as Member[])), [guild])
  const byId = useMemo(() => new Map((state.data ?? []).map((m) => [m.user_id, m])), [state.data])
  const name = (id: string | null | undefined) => (id ? byId.get(id)?.display_name ?? `Membre …${id.slice(-4)}` : '—')
  return { name, byId, loading: state.data === null }
}

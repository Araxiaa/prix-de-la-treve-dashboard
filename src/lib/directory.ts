import { useMemo } from 'react'
import type { ComboOption } from '../components/Combo'
import { api } from './api'
import { cached } from './cache'
import { useAuth } from './auth'
import type { SuggestKind } from './commandForm'
import { CLANS, RANKS } from './format'
import { HANDICAPS } from './handicaps'
import { useAsync } from './hooks'
import { useMembers } from './members'
import type { CommandDef } from './types'

/** Toutes les listes qui alimentent les sélecteurs des formulaires de commandes (chargées une fois, partagées, mises en cache). */
export function useDirectory(commands: CommandDef[] = []) {
  const { guild } = useAuth()
  const members = useMembers()
  const chars = useAsync(() => cached('dir:chars', 30_000, () => api.characters()), [])
  const npcs = useAsync(() => cached('dir:npcs', 30_000, () => api.npcs()), [])
  const channels = useAsync(() => (guild ? api.channels(guild) : Promise.resolve([])), [guild])
  const roles = useAsync(() => (guild ? api.roles(guild) : Promise.resolve([])), [guild])
  const factions = useAsync(() => api.factions(), [])

  return useMemo(() => {
    const char = (keep: (c: NonNullable<typeof chars.data>[number]) => boolean): ComboOption[] =>
      (chars.data ?? []).filter(keep).map((c) => ({ value: c.name, label: c.name, hint: `${c.clan} · ${c.rank}` }))
    const npcOpts: ComboOption[] = (npcs.data ?? []).map((n) => ({ value: n.name, label: n.name, hint: `PNJ · ${n.clan}` }))
    const strings = (l: readonly string[]): ComboOption[] => l.map((x) => ({ value: x, label: x }))
    const byKind = (kind: Exclude<SuggestKind, null>): ComboOption[] => {
      switch (kind) {
        case 'char': return char(() => true)
        case 'char-active': return char((c) => !c.dead && !c.archived)
        case 'char-alive': return char((c) => !c.dead && !c.missing)
        case 'char-present': return char((c) => !c.dead && !c.missing)
        case 'char-missing': return char((c) => c.missing && !c.dead)
        case 'char-dead': return char((c) => c.dead)
        case 'npc': return npcOpts
        case 'both': return [...char(() => true), ...npcOpts]
        case 'faction': return strings(factions.data?.groups ?? [])
        case 'rank': return strings([...new Set([...RANKS, ...(factions.data?.ranks ?? [])])])
        case 'handicap': return strings(Object.keys(HANDICAPS))
        case 'clan': return strings(CLANS)
        case 'command': return commands.map((c) => ({ value: c.name, label: `/${c.name}` }))
        case 'role': return (roles.data ?? []).map((r) => ({ value: r.name, label: r.name }))
      }
    }
    const memberOptions: ComboOption[] = [...members.byId.values()].sort((a, b) => a.display_name.localeCompare(b.display_name, 'fr'))
      .map((m) => ({ value: m.user_id, label: m.display_name, hint: `…${m.user_id.slice(-4)}` }))
    const roleOptions: ComboOption[] = (roles.data ?? []).map((r) => ({ value: r.role_id, label: r.name }))
    const channelOptions: ComboOption[] = (channels.data ?? []).filter((c) => c.kind !== 'category')
      .map((c) => ({ value: c.channel_id, label: `${c.kind === 'voice' ? '🔊' : '#'}${c.name}`, hint: c.category ?? undefined }))
    return { byKind, memberOptions, roleOptions, channelOptions }
  }, [chars.data, npcs.data, channels.data, roles.data, factions.data, members.byId, commands])
}

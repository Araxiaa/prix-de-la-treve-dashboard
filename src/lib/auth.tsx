import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api } from './api'
import { DEMO, supabase } from './supabase'
import type { Access, Level } from './types'

interface AuthState {
  loading: boolean
  session: Session | null
  access: Access[]
  error: string | null
  guild: string | null
  guildName: string
  level: Level | null
  isAdmin: boolean
  userName: string
  userAvatar: string | null
  discordId: string | null
  setGuild: (id: string) => void
  retry: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)
const GUILD_KEY = 'dashboard.guild'

const demoSession = { user: { id: 'demo', user_metadata: { full_name: 'Cheffe Démo' } } } as unknown as Session

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(DEMO ? demoSession : null)
  const [access, setAccess] = useState<Access[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guild, setGuildState] = useState<string | null>(() => localStorage.getItem(GUILD_KEY))
  const [attempt, setAttempt] = useState(0)

  // Session : lue au chargement (y compris le retour de Discord), puis suivie.
  useEffect(() => {
    if (DEMO) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Droits : la liste « dashboard_access » est tenue à jour par Bubulle d'après les rôles Discord. Aucun droit n'est déduit côté navigateur.
  useEffect(() => {
    if (!session) {
      setAccess([])
      if (DEMO) setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    api.access()
      .then((rows) => { if (alive) { setAccess(rows); setError(null) } })
      .catch((e: Error) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [session, attempt])

  const current = useMemo(() => access.find((a) => a.guild_id === guild) ?? access[0] ?? null, [access, guild])
  const setGuild = useCallback((id: string) => { localStorage.setItem(GUILD_KEY, id); setGuildState(id) }, [])

  const signIn = useCallback(async () => {
    // Retour sur la même page ; l'adresse doit figurer dans les « Redirect URLs » de Supabase Auth (voir README).
    const redirectTo = window.location.origin + window.location.pathname
    const { error: e } = await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo, scopes: 'identify' } })
    if (e) setError(e.message)
  }, [])
  const signOut = useCallback(async () => {
    if (DEMO) return
    await supabase.auth.signOut()
    setAccess([])
  }, [])

  const meta = (session?.user?.user_metadata ?? {}) as Record<string, string | undefined>
  const identity = session?.user?.identities?.find((i) => i.provider === 'discord')
  const value: AuthState = {
    loading, session, access, error, guild: current?.guild_id ?? null, guildName: current?.guild_name ?? 'Serveur', level: current?.level ?? null,
    isAdmin: current?.level === 'admin', setGuild,
    userName: current?.display_name ?? meta.full_name ?? meta.name ?? meta.custom_claims ?? 'Staff',
    userAvatar: current?.avatar_url ?? meta.avatar_url ?? null, signIn, signOut,
    discordId: (identity?.id as string | undefined) ?? null, retry: () => setAttempt((a) => a + 1),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth hors AuthProvider')
  return v
}

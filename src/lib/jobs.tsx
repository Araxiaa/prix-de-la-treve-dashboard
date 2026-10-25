import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import type { BotName, Job } from './types'

export interface Toast { key: number; kind: 'pending' | 'ok' | 'error' | 'warn'; title: string; text?: string }

export interface RunOptions {
  label: string
  bot: BotName
  action: string
  payload: Record<string, unknown>
}

interface JobsState {
  toasts: Toast[]
  dismiss: (key: number) => void
  /** Dépose une demande, suit son exécution par le bot et renvoie le résultat final. */
  run: (opts: RunOptions) => Promise<Job | null>
  /** Compteur incrémenté à chaque fin de demande : les pages rechargent leurs données quand il change. */
  refreshTick: number
}

const Ctx = createContext<JobsState | null>(null)
const POLL_MS = 1500
const GIVE_UP_MS = 120_000
const OFFLINE_AFTER_MS = 3 * 60_000
const BOT_LABEL: Record<BotName, string> = { bubulle: 'Bubulle', ricochet: 'Ricochet', vigie: 'Vigie' }

export function JobsProvider({ children }: { children: ReactNode }) {
  const { guild } = useAuth()
  const [toasts, setToasts] = useState<Toast[]>([])
  const [refreshTick, setTick] = useState(0)
  const seq = useRef(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])   // (re)armé aussi en StrictMode, qui monte deux fois

  const patch = useCallback((key: number, t: Partial<Toast>) => setToasts((l) => l.map((x) => (x.key === key ? { ...x, ...t } : x))), [])
  const dismiss = useCallback((key: number) => setToasts((l) => l.filter((x) => x.key !== key)), [])
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const run = useCallback(async ({ label, bot, action, payload }: RunOptions): Promise<Job | null> => {
    const key = ++seq.current
    if (!guild) return null
    setToasts((l) => [...l, { key, kind: 'pending', title: label, text: 'Envoi de la demande…' }])
    try {
      // Un bot hors ligne n'exécutera la demande qu'à son retour (elle expire au bout de 30 min) : on prévient.
      const status = (await api.botStatus()).find((s) => s.bot === bot)
      const offline = !status || Date.now() - new Date(status.last_seen).getTime() > OFFLINE_AFTER_MS
      const id = await api.enqueue(bot, action, guild, payload)
      patch(key, { text: offline ? `${BOT_LABEL[bot]} semble hors ligne : la demande attend son retour (elle expire après 30 min).` : `En attente de ${BOT_LABEL[bot]}…`, kind: offline ? 'warn' : 'pending' })
      const started = Date.now()
      while (Date.now() - started < GIVE_UP_MS) {
        await sleep(POLL_MS)
        if (!alive.current) return null
        const job = await api.job(id)
        if (!job) continue
        if (job.status === 'done') {
          patch(key, { kind: 'ok', text: job.result?.message ?? 'Fait.' })
          setTick((t) => t + 1)
          setTimeout(() => dismiss(key), 9000)
          return job
        }
        if (job.status === 'failed') {
          patch(key, { kind: 'error', text: job.error ?? 'Échec.' })
          setTick((t) => t + 1)
          return job
        }
        if (job.status === 'running') patch(key, { kind: 'pending', text: `${BOT_LABEL[bot]} s'en occupe…` })
      }
      patch(key, { kind: 'warn', text: 'Toujours en attente. Consulte l’onglet « Bots & journal » pour suivre la demande.' })
      return null
    } catch (e) {
      patch(key, { kind: 'error', text: (e as Error).message })
      return null
    }
  }, [guild, patch, dismiss])

  return <Ctx.Provider value={{ toasts, dismiss, run, refreshTick }}>{children}</Ctx.Provider>
}

export function useJobs(): JobsState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useJobs hors JobsProvider')
  return v
}

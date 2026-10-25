import { useMemo, useState } from 'react'
import { Badge, Card, Empty, Loaded, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { dateTime, relativeTime } from '../lib/format'
import { useAsync } from '../lib/hooks'
import type { JobStatus } from '../lib/types'

const BOTS = [
  { id: 'bubulle', name: 'Bubulle', role: 'Gestion : OC, PNJ, calendrier, modération, niveaux', emoji: '🫧' },
  { id: 'ricochet', name: 'Ricochet', role: 'Rôle-play : combats, chasse, fils, infirmerie', emoji: '⚡' },
  { id: 'vigie', name: 'Vigie', role: 'Salons de fiche, archives, lunes', emoji: '👁️' },
] as const
const STATUS: Record<JobStatus, { tone: 'neutral' | 'info' | 'ok' | 'bad'; label: string }> = {
  pending: { tone: 'neutral', label: '⏳ en attente' }, running: { tone: 'info', label: '⚙️ en cours' }, done: { tone: 'ok', label: '✅ fait' }, failed: { tone: 'bad', label: '❌ échec' },
}

export default function Bots() {
  const { guild } = useAuth()
  const state = useAsync(async () => {
    const [bots, jobs] = await Promise.all([api.botStatus(), guild ? api.jobs(guild) : Promise.resolve([])])
    return { bots, jobs }
  }, [guild])
  const [bot, setBot] = useState('')
  const [only, setOnly] = useState<'' | JobStatus>('')
  const filtered = useMemo(() => (state.data?.jobs ?? []).filter((j) => (!bot || j.bot === bot) && (!only || j.status === only)), [state.data, bot, only])
  return (
    <>
      <PageHeader title="Bots & journal" subtitle="État des bots et historique des demandes envoyées depuis ce site" />
      <Loaded state={state}>
        {({ bots }) => (
          <div className="stack gap-lg">
            <div className="grid three">
              {BOTS.map((b) => {
                const s = bots.find((x) => x.bot === b.id)
                const online = s && Date.now() - new Date(s.last_seen).getTime() <= 3 * 60_000
                return (
                  <Card key={b.id} title={`${b.emoji} ${b.name}`} actions={<Badge tone={online ? 'ok' : 'bad'}>{online ? 'en ligne' : 'hors ligne'}</Badge>}>
                    <p className="muted">{b.role}</p>
                    <p className="small">{s ? <>Dernier signe de vie : <strong>{relativeTime(s.last_seen)}</strong></> : 'Jamais vu : le bot doit être mis à jour et redémarré.'}</p>
                  </Card>
                )
              })}
            </div>
            <Card title="📜 Journal des demandes">
              <div className="filters">
                <select value={bot} onChange={(e) => setBot(e.target.value)}><option value="">Tous les bots</option>{BOTS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                <select value={only} onChange={(e) => setOnly(e.target.value as typeof only)}><option value="">Tous les états</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
              </div>
              {filtered.length === 0 ? <Empty>Aucune demande.</Empty> : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>#</th><th>Bot</th><th>Action</th><th>Demandée par</th><th>Quand</th><th>État</th><th>Résultat</th></tr></thead>
                    <tbody>{filtered.map((j) => (
                      <tr key={j.id}><td className="muted">{j.id}</td><td>{j.bot}</td><td><code>{j.action}</code></td><td>{j.requested_name ?? '—'}</td><td className="muted" title={dateTime(j.created_at)}>{relativeTime(j.created_at)}</td>
                        <td><Badge tone={STATUS[j.status].tone}>{STATUS[j.status].label}</Badge></td><td>{j.error ?? j.result?.message ?? '—'}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </Loaded>
    </>
  )
}

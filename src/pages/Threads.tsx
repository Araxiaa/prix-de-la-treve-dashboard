import { useMemo, useState } from 'react'
import { Badge, Card, Empty, Loaded, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { dateTime, norm, relativeTime, threadState, type ThreadState } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useJobs } from '../lib/jobs'
import { useMembers } from '../lib/members'

const STATE: Record<ThreadState, { tone: 'ok' | 'warn' | 'bad'; label: string }> = {
  active: { tone: 'ok', label: '🟢 Actif' }, quiet: { tone: 'warn', label: '🟠 Silencieux' }, closing: { tone: 'bad', label: '🔴 Bientôt clôturé' },
}

export default function Threads() {
  const { guild } = useAuth()
  const { run } = useJobs()
  const members = useMembers()
  const state = useAsync(() => (guild ? api.threads(guild) : Promise.resolve([])), [guild])
  const [filter, setFilter] = useState<'all' | ThreadState>('all')
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const needle = norm(q)
    return (state.data ?? []).filter((t) => (filter === 'all' || threadState(t.last_message_at) === filter) && (!needle || norm(`${t.title} ${t.prefixes_oc}`).includes(needle)))
  }, [state.data, filter, q])
  return (
    <>
      <PageHeader title="Fils RP" subtitle="Ricochet — suivi d'activité : rappel après 7 jours sans message, clôture à 14 jours" />
      <Card>
        <div className="filters">
          <input className="search" placeholder="Rechercher un titre ou un personnage…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">Tous les fils</option><option value="active">🟢 Actifs</option><option value="quiet">🟠 Silencieux</option><option value="closing">🔴 Bientôt clôturés</option>
          </select>
        </div>
        <Loaded state={state}>
          {() => rows.length === 0 ? <Empty>Aucun fil dans cette catégorie.</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Scène</th><th>Personnages</th><th>Créateur</th><th>Dernier message</th><th>État</th><th /></tr></thead>
                <tbody>
                  {rows.map((t) => {
                    const st = STATE[threadState(t.last_message_at)]
                    return (
                      <tr key={t.thread_id}>
                        <td><strong>{t.title ?? 'Sans titre'}</strong></td><td className="muted">{t.prefixes_oc || '—'}</td><td>{members.name(t.creator_id)}</td>
                        <td title={dateTime(t.last_message_at)}>{relativeTime(t.last_message_at)}</td>
                        <td><Badge tone={st.tone}>{st.label}</Badge>{t.relance_faite && <Badge>rappel envoyé</Badge>}</td>
                        <td><button className="btn btn-small" title="Remet la date RP, la météo et l'heure de la fiche épinglée à l'instant présent"
                          onClick={() => run({ label: `Fiche du fil « ${t.title ?? ''} »`, bot: 'ricochet', action: 'fil.refresh', payload: { thread_id: t.thread_id } })}>🔄 Fiche</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Card>
    </>
  )
}

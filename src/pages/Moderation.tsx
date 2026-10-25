import { useMemo, useState } from 'react'
import { Badge, Card, Empty, Loaded, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { dateTime, norm } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useMembers } from '../lib/members'

const TONE: Record<string, 'warn' | 'bad' | 'info' | 'neutral'> = { avertissement: 'warn', mute: 'bad', kick: 'bad', ban: 'bad', note: 'info' }

export default function Moderation() {
  const { guild } = useAuth()
  const members = useMembers()
  const state = useAsync(() => (guild ? api.sanctions(guild) : Promise.resolve([])), [guild])
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const kinds = useMemo(() => [...new Set((state.data ?? []).map((s) => s.kind))].sort(), [state.data])
  const rows = useMemo(() => {
    const needle = norm(q)
    return (state.data ?? []).filter((s) => (!kind || s.kind === kind) && (!onlyActive || s.active) &&
      (!needle || norm(`${members.name(s.user_id)} ${members.name(s.moderator_id)} ${s.reason ?? ''}`).includes(needle)))
  }, [state.data, q, kind, onlyActive, members])
  return (
    <>
      <PageHeader title="Modération" subtitle="Bubulle — historique des sanctions (lecture seule : les sanctions se prononcent sur Discord avec /mod)" />
      <Card>
        <div className="filters">
          <input className="search" placeholder="Rechercher un membre, un modérateur, une raison…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Tous les types</option>{kinds.map((k) => <option key={k}>{k}</option>)}</select>
          <label className="check"><input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> Actives seulement</label>
        </div>
        <Loaded state={state}>
          {() => rows.length === 0 ? <Empty>Aucune sanction.</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Membre</th><th>Type</th><th>Raison</th><th>Modérateur</th><th>Date</th><th>État</th></tr></thead>
                <tbody>{rows.map((s) => (
                  <tr key={s.id}><td className="muted">{s.id}</td><td><strong>{members.name(s.user_id)}</strong></td><td><Badge tone={TONE[s.kind] ?? 'neutral'}>{s.kind}</Badge></td>
                    <td>{s.reason ?? '—'}</td><td>{members.name(s.moderator_id)}</td><td className="muted">{dateTime(s.created_at)}</td><td>{s.active ? <Badge tone="warn">active</Badge> : <Badge>levée</Badge>}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Card>
    </>
  )
}

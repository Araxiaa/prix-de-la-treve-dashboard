import { useMemo, useState } from 'react'
import { Card, Empty, Loaded, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { levelFromXp, norm } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useMembers } from '../lib/members'

const fmt = (n: number) => n.toLocaleString('fr-FR')

export default function Levels() {
  const { guild } = useAuth()
  const members = useMembers()
  const state = useAsync(() => (guild ? api.xp(guild) : Promise.resolve([])), [guild])
  const [q, setQ] = useState('')
  const ranked = useMemo(() => (state.data ?? [])
    .map((r) => ({ ...r, total: r.text_xp + r.voice_xp + r.bonus_xp }))
    .sort((a, b) => b.total - a.total), [state.data])
  const rows = ranked.map((r, i) => ({ ...r, rank: i + 1 })).filter((r) => !q || norm(members.name(r.user_id)).includes(norm(q))).slice(0, 100)
  return (
    <>
      <PageHeader title="Niveaux" subtitle={`Bubulle — classement d'expérience (${ranked.length} membre(s))`} />
      <Card>
        <div className="filters"><input className="search" placeholder="Rechercher un membre…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Loaded state={state}>
          {() => rows.length === 0 ? <Empty>Aucun membre classé.</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Membre</th><th>Niveau</th><th>Progression</th><th>XP total</th><th>Texte</th><th>Vocal</th><th>Bonus</th></tr></thead>
                <tbody>{rows.map((r) => {
                  const p = levelFromXp(r.total)
                  return (
                    <tr key={r.user_id}>
                      <td>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td><td><strong>{members.name(r.user_id)}</strong></td><td>{p.level}</td>
                      <td style={{ minWidth: 140 }}><div className="progress"><span style={{ width: `${Math.min(100, (p.into / p.needed) * 100)}%` }} /></div><small className="muted">{fmt(p.into)} / {fmt(p.needed)}</small></td>
                      <td>{fmt(r.total)}</td><td className="muted">{fmt(r.text_xp)}</td><td className="muted">{fmt(r.voice_xp)}</td><td className="muted">{fmt(r.bonus_xp)}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Card>
    </>
  )
}

import { useMemo, useState } from 'react'
import { BaptemeModal, HpModal, StatusModal } from '../components/actions'
import { ArchiveModal, CharacterFormModal, DeleteModal, HandicapsModal, SkillsModal, StatsModal } from '../components/manage'
import { useAuth } from '../lib/auth'
import { Badge, Card, Empty, Loaded, Modal, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { CLANS, CLAN_EMOJI, RANKS, ageInLunes, dateTime, describeReason, norm, relativeTime } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useMembers } from '../lib/members'
import type { Character } from '../lib/types'

const PAGE = 40
type Status = 'actif' | 'disparu' | 'mort' | 'archive' | 'tous'
const statusOf = (c: Character): Status => (c.dead ? 'mort' : c.missing ? 'disparu' : c.archived ? 'archive' : 'actif')
export const StatusBadge = ({ c }: { c: { dead: boolean; missing: boolean; archived?: boolean } }) =>
  c.dead ? <Badge tone="bad">💀 Mort·e</Badge> : c.missing ? <Badge tone="warn">🌫️ Disparu·e</Badge> : c.archived ? <Badge>🗄️ Archivé</Badge> : <Badge tone="ok">🌿 Actif</Badge>

export default function Characters() {
  const state = useAsync(() => api.characters(), [])
  const members = useMembers()
  const [q, setQ] = useState('')
  const [clan, setClan] = useState('')
  const [rank, setRank] = useState('')
  const [status, setStatus] = useState<Status>('actif')
  const [page, setPage] = useState(0)
  const [openId, setOpenId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const rows = useMemo(() => {
    const needle = norm(q)
    return (state.data ?? []).filter((c) =>
      (status === 'tous' || statusOf(c) === status) && (!clan || c.clan === clan) && (!rank || c.rank === rank) &&
      (!needle || norm(c.name).includes(needle) || norm(members.name(c.user_id)).includes(needle) || norm(c.prefix ?? '').includes(needle)))
  }, [state.data, q, clan, rank, status, members])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE)
  const open = state.data?.find((c) => c.id === openId) ?? null

  return (
    <>
      <PageHeader title="Personnages (OC)" subtitle={`${rows.length} résultat(s)`} actions={<button className="btn btn-primary" onClick={() => setCreating(true)}>➕ Nouvel OC</button>} />
      <Card>
        <div className="filters">
          <input className="search" placeholder="Rechercher un nom, un joueur, un préfixe…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
          <select value={clan} onChange={(e) => { setClan(e.target.value); setPage(0) }}><option value="">Tous les clans</option>{CLANS.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={rank} onChange={(e) => { setRank(e.target.value); setPage(0) }}><option value="">Tous les rangs</option>{RANKS.map((r) => <option key={r}>{r}</option>)}</select>
          <select value={status} onChange={(e) => { setStatus(e.target.value as Status); setPage(0) }}>
            <option value="actif">🌿 Actifs</option><option value="disparu">🌫️ Disparus</option><option value="mort">💀 Morts</option><option value="archive">🗄️ Archivés</option><option value="tous">📚 Tous</option>
          </select>
        </div>
        <Loaded state={state}>
          {() => rows.length === 0 ? <Empty>Aucun personnage ne correspond à ces filtres.</Empty> : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Nom</th><th>Joueur</th><th>Clan</th><th>Rang</th><th>PV</th><th>Âge</th><th>Statut</th><th>Dernier RP</th></tr></thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id} className="clickable" onClick={() => setOpenId(c.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(c.id)}>
                        <td><strong>{c.name}</strong></td><td>{members.name(c.user_id)}</td><td>{CLAN_EMOJI[c.clan]} {c.clan}</td><td>{c.rank}</td>
                        <td><span className={c.hp_current <= c.hp_max * 0.3 ? 'text-bad' : ''}>{c.hp_current}/{c.hp_max}</span>{c.lives > 1 && <span className="muted"> · {c.lives}♥</span>}</td>
                        <td>{ageInLunes(c.initial_age_lunes, c.aging_start_date) ?? '—'} lunes</td><td><StatusBadge c={c} /></td><td className="muted">{relativeTime(c.last_activity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pages > 1 && (
                <div className="pager"><button className="btn btn-small" disabled={page === 0} onClick={() => setPage(page - 1)}>◀</button><span>Page {page + 1} / {pages}</span><button className="btn btn-small" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>▶</button></div>
              )}
            </>
          )}
        </Loaded>
      </Card>
      {creating && <CharacterFormModal onClose={() => setCreating(false)} />}
      {open && <CharacterDetail character={open} playerName={members.name(open.user_id)} staffName={members.name} onClose={() => setOpenId(null)} />}
    </>
  )
}

function CharacterDetail({ character: c, playerName, staffName, onClose }: { character: Character; playerName: string; staffName: (id: string | null) => string; onClose: () => void }) {
  const history = useAsync(() => api.hpHistory(c.id), [c.id])
  const { isAdmin } = useAuth()
  const [modal, setModal] = useState<null | 'bapteme' | 'hp' | 'statut' | 'edit' | 'stats' | 'skills' | 'handicaps' | 'archive' | 'delete'>(null)
  const age = ageInLunes(c.initial_age_lunes, c.aging_start_date)
  return (
    <Modal title={`${CLAN_EMOJI[c.clan] ?? '🐾'} ${c.name}`} onClose={onClose} wide>
      <div className="detail">
        <div className="kv">
          <div><span>Joueur</span><strong>{playerName}</strong></div><div><span>Clan</span><strong>{c.clan}</strong></div>
          <div><span>Rang</span><strong>{c.rank}</strong></div><div><span>Genre</span><strong>{c.gender ?? '—'}</strong></div>
          <div><span>Âge</span><strong>{age ?? '—'} lunes</strong></div><div><span>Préfixe</span><strong>{c.prefix ? <code>{c.prefix}</code> : '—'}</strong></div>
          <div><span>PV</span><strong>{c.hp_current} / {c.hp_max}</strong></div><div><span>Vies</span><strong>{c.lives}</strong></div>
          <div><span>Statut</span><strong><StatusBadge c={c} />{c.dead && c.afterlife && <> → {c.afterlife}</>}</strong></div><div><span>Salon de fiche</span><strong>{c.sheet_channel_id ? '✅ lié' : '❌ aucun'}</strong></div>
        </div>
        <div className="row gap wrap">
          <button className="btn btn-primary" disabled={c.dead} onClick={() => setModal('bapteme')}>🎉 Baptiser</button>
          <button className="btn" disabled={c.dead} onClick={() => setModal('hp')}>❤️ Modifier les PV</button>
          <button className="btn" onClick={() => setModal('statut')}>🕯️ Mort / disparition / retour</button>
        </div>
        <div className="row gap wrap">
          <button className="btn" onClick={() => setModal('edit')}>✏️ Modifier la fiche</button>
          <button className="btn" disabled={c.dead} onClick={() => setModal('stats')}>📊 PV max · PA · vies</button>
          <button className="btn" onClick={() => setModal('skills')}>🎯 Compétences</button>
          <button className="btn" onClick={() => setModal('handicaps')}>⚠️ Handicaps</button>
          <button className="btn" onClick={() => setModal('archive')}>{c.archived ? '↩️ Désarchiver' : '🗄️ Archiver'}</button>
          {isAdmin && <button className="btn btn-danger" onClick={() => setModal('delete')}>🗑️ Supprimer</button>}
        </div>
        <h3>Chronologie</h3>
        <Loaded state={history}>
          {(rows) => rows.length === 0 ? <p className="muted">Aucun événement enregistré.</p> : (
            <ul className="timeline">
              {rows.map((h) => {
                const { tag, text } = describeReason(h.reason)
                return (
                  <li key={h.id}>
                    <div className="row between"><span>{tag && <Badge tone="accent">{tag}</Badge>} {text}</span><span className="muted small">{dateTime(h.timestamp)}</span></div>
                    <div className="muted small">{h.change !== 0 ? `${h.change > 0 ? '+' : ''}${h.change} PV → ${h.new_hp}` : `PV ${h.new_hp}`}{h.staff_id && <> · par {staffName(h.staff_id)}</>}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </Loaded>
      </div>
      {modal === 'bapteme' && <BaptemeModal character={c} onClose={() => setModal(null)} />}
      {modal === 'hp' && <HpModal character={c} onClose={() => setModal(null)} />}
      {modal === 'statut' && <StatusModal entity={{ kind: 'OC', data: c }} onClose={() => setModal(null)} />}
      {modal === 'edit' && <CharacterFormModal character={c} onClose={() => setModal(null)} />}
      {modal === 'stats' && <StatsModal character={c} onClose={() => setModal(null)} />}
      {modal === 'skills' && <SkillsModal character={c} onClose={() => setModal(null)} />}
      {modal === 'handicaps' && <HandicapsModal character={c} onClose={() => setModal(null)} />}
      {modal === 'archive' && <ArchiveModal character={c} onClose={() => setModal(null)} />}
      {modal === 'delete' && <DeleteModal kind="OC" entity={c} onClose={() => { setModal(null); onClose() }} />}
    </Modal>
  )
}

import { useMemo, useState } from 'react'
import { StatusModal } from '../components/actions'
import { DeleteModal, NpcFormModal } from '../components/manage'
import { useAuth } from '../lib/auth'
import { Card, Empty, Loaded, Modal, PageHeader, Badge } from '../components/ui'
import { api } from '../lib/api'
import { CLANS, CLAN_EMOJI, ageInLunes, dateTime, norm } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useMembers } from '../lib/members'
import type { Npc } from '../lib/types'
import { StatusBadge } from './Characters'

export default function Npcs() {
  const state = useAsync(() => api.npcs(), [])
  const [q, setQ] = useState('')
  const [clan, setClan] = useState('')
  const [status, setStatus] = useState<'actif' | 'disparu' | 'mort' | 'tous'>('actif')
  const [openId, setOpenId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const rows = useMemo(() => {
    const needle = norm(q)
    return (state.data ?? []).filter((n) => {
      const st = n.dead ? 'mort' : n.missing ? 'disparu' : 'actif'
      return (status === 'tous' || st === status) && (!clan || n.clan === clan) && (!needle || norm(n.name).includes(needle))
    })
  }, [state.data, q, clan, status])
  const open = state.data?.find((n) => n.id === openId) ?? null
  return (
    <>
      <PageHeader title="PNJ" subtitle={`${rows.length} résultat(s)`} actions={<button className="btn btn-primary" onClick={() => setCreating(true)}>➕ Nouveau PNJ</button>} />
      <Card>
        <div className="filters">
          <input className="search" placeholder="Rechercher un PNJ…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={clan} onChange={(e) => setClan(e.target.value)}><option value="">Tous les clans</option>{CLANS.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="actif">🌿 Actifs</option><option value="disparu">🌫️ Disparus</option><option value="mort">💀 Morts</option><option value="tous">📚 Tous</option>
          </select>
        </div>
        <Loaded state={state}>
          {() => rows.length === 0 ? <Empty>Aucun PNJ ne correspond.</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Nom</th><th>Clan</th><th>Rang</th><th>Âge</th><th>Statut</th></tr></thead>
                <tbody>
                  {rows.map((n) => (
                    <tr key={n.id} className="clickable" onClick={() => setOpenId(n.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(n.id)}>
                      <td><strong>{n.name}</strong></td><td>{CLAN_EMOJI[n.clan]} {n.clan}</td><td>{n.rank}</td>
                      <td>{ageInLunes(n.initial_age_lunes, n.aging_start_date) ?? '—'} lunes</td><td><StatusBadge c={n} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Card>
      {creating && <NpcFormModal onClose={() => setCreating(false)} />}
      {open && <NpcDetail npc={open} onClose={() => setOpenId(null)} />}
    </>
  )
}

function NpcDetail({ npc, onClose }: { npc: Npc; onClose: () => void }) {
  const events = useAsync(() => api.npcEvents(npc.id), [npc.id])
  const members = useMembers()
  const { isAdmin } = useAuth()
  const [statusOpen, setStatusOpen] = useState(false)
  const [modal, setModal] = useState<null | 'edit' | 'delete'>(null)
  return (
    <Modal title={`🎭 ${npc.name}`} onClose={onClose} wide>
      <div className="detail">
        <div className="kv">
          <div><span>Clan</span><strong>{npc.clan}</strong></div><div><span>Rang</span><strong>{npc.rank}</strong></div>
          <div><span>Genre</span><strong>{npc.gender ?? '—'}</strong></div><div><span>Âge</span><strong>{ageInLunes(npc.initial_age_lunes, npc.aging_start_date) ?? '—'} lunes</strong></div>
          <div><span>Statut</span><strong><StatusBadge c={npc} />{npc.dead && npc.afterlife && <> → {npc.afterlife}</>}</strong></div><div><span>Salon de fiche</span><strong>{npc.sheet_channel_id ? '✅ lié' : '❌ aucun'}</strong></div>
        </div>
        <div className="row gap wrap">
          <button className="btn" onClick={() => setModal('edit')}>✏️ Modifier</button>
          <button className="btn" onClick={() => setStatusOpen(true)}>🕯️ Mort / disparition / retour</button>
          {isAdmin && <button className="btn btn-danger" onClick={() => setModal('delete')}>🗑️ Supprimer</button>}
        </div>
        <p className="muted small">Le baptême d'un PNJ se fait pour l'instant avec <code>/bapteme baptiser</code> sur Discord.</p>
        <h3>Historique</h3>
        <Loaded state={events}>
          {(rows) => rows.length === 0 ? <p className="muted">Aucun événement.</p> : (
            <ul className="timeline">{rows.map((e) => (
              <li key={e.id}><div className="row between"><span><Badge tone="accent">{e.kind}</Badge> {e.reason}</span><span className="muted small">{dateTime(e.created_at)}</span></div>
                {e.staff_id && <div className="muted small">par {members.name(e.staff_id)}</div>}</li>
            ))}</ul>
          )}
        </Loaded>
      </div>
      {modal === 'edit' && <NpcFormModal npc={npc} onClose={() => setModal(null)} />}
      {modal === 'delete' && <DeleteModal kind="PNJ" entity={npc} onClose={() => { setModal(null); onClose() }} />}
      {statusOpen && <StatusModal entity={{ kind: 'PNJ', data: npc }} onClose={() => setStatusOpen(false)} />}
    </Modal>
  )
}

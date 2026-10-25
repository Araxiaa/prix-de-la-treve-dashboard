import { useMemo, useState, type FormEvent } from 'react'
import { Badge, Card, Empty, Field, Loaded, Modal, PageHeader, Stat } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CLANS, CLAN_EMOJI, norm, relativeTime } from '../lib/format'
import { clanStock, effectLabel, isSoon, type PlantStock } from '../lib/herbier'
import { useAsync } from '../lib/hooks'
import { useJobs } from '../lib/jobs'
import { useMembers } from '../lib/members'
import { PLANTS, PLANT_LIMIT, SEASONS, type PlantCategory } from '../lib/plants'

const CATS: { key: PlantCategory; label: string }[] = [{ key: 'soin', label: '💚 Soin' }, { key: 'miel', label: '🍯 Miel' }, { key: 'neutre', label: '🌾 Neutre' }, { key: 'toxique', label: '☠️ Toxique' }]
const today = () => new Date().toISOString().slice(0, 10)

export default function Herbier() {
  const { guild } = useAuth()
  const members = useMembers()
  const [clan, setClan] = useState<string>(CLANS[0])
  const [q, setQ] = useState('')
  const [onlyStock, setOnlyStock] = useState(false)
  const [modal, setModal] = useState<null | { mode: 'add' | 'remove'; plant: string }>(null)
  const state = useAsync(async () => {
    const [lots, history] = await Promise.all([api.herbariumAll(), api.herbariumHistory()])
    return { lots, history }
  }, [])
  const { run } = useJobs()

  return (
    <>
      <PageHeader title="Herbier" subtitle="Ricochet — toutes les plantes de chaque clan : stock, péremption, historique" />
      <div className="row gap wrap" role="tablist">
        {CLANS.map((c) => <button key={c} role="tab" aria-selected={c === clan} className={`btn ${c === clan ? 'btn-primary' : ''}`} onClick={() => setClan(c)}>{CLAN_EMOJI[c]} {c}</button>)}
      </div>
      <Loaded state={state}>
        {({ lots, history }) => <ClanView clan={clan} lots={lots} history={history} q={q} setQ={setQ} onlyStock={onlyStock} setOnlyStock={setOnlyStock} setModal={setModal} members={members.name}
          purge={() => run({ label: `Purge de l'herbier (${clan})`, bot: 'ricochet', action: 'herbier.purge', payload: { clan } })} disabled={!guild} />}
      </Loaded>
      {modal && <PlantModal clan={clan} mode={modal.mode} plant={modal.plant} onClose={() => setModal(null)} />}
    </>
  )
}

function ClanView({ clan, lots, history, q, setQ, onlyStock, setOnlyStock, setModal, members, purge, disabled }: {
  clan: string; lots: Parameters<typeof clanStock>[0]; history: Awaited<ReturnType<typeof api.herbariumHistory>>; q: string; setQ: (v: string) => void
  onlyStock: boolean; setOnlyStock: (v: boolean) => void; setModal: (m: { mode: 'add' | 'remove'; plant: string }) => void; members: (id: string) => string
  purge: () => void; disabled: boolean
}) {
  const view = useMemo(() => clanStock(lots, clan, today()), [lots, clan])
  const soinHave = view.stock.filter((s) => s.plant?.category === 'soin' && s.qty > 0).length
  const soinAll = view.stock.filter((s) => s.plant?.category === 'soin').length
  const soon = view.stock.filter(isSoon)
  const expiredUnits = view.expired.reduce((n, e) => n + e.qty, 0)
  const mine = history.filter((h) => h.inventory_owner === `clan:${clan}` || h.inventory_owner === clan).slice(0, 30)
  const match = (s: PlantStock) => (!q || norm(s.name).includes(norm(q))) && (!onlyStock || s.qty > 0)

  return (
    <div className="stack gap-lg" style={{ marginTop: 16 }}>
      <div className="grid three">
        <Stat label="unités en stock" value={view.units} tone={view.units === 0 ? 'bad' : 'ok'} />
        <Stat label="plantes de soin disponibles" value={`${soinHave} / ${soinAll}`} tone={soinHave === 0 ? 'bad' : soinHave < 5 ? 'warn' : 'ok'} />
        <Stat label="périmées à jeter" value={expiredUnits} tone={expiredUnits ? 'warn' : 'neutral'} />
      </div>
      {(soon.length > 0 || view.expired.length > 0) && (
        <div className="alert alert-warn">
          {soon.length > 0 && <p style={{ margin: 0 }}>🟠 <strong>Bientôt périmées :</strong> {soon.map((s) => `${s.name} ×${s.lots.filter((l) => (Date.parse(l.expires) - Date.parse(today())) / 86_400_000 <= 3).reduce((n, l) => n + l.qty, 0)} (${s.nextDays === 0 ? 'aujourd’hui' : `dans ${s.nextDays} j`})`).join(' · ')}</p>}
          {view.expired.length > 0 && (
            <p style={{ margin: '6px 0 0' }}>⚠️ <strong>Périmées :</strong> {view.expired.map((e) => `${e.name} ×${e.qty} (depuis le ${e.since.slice(8)}/${e.since.slice(5, 7)})`).join(' · ')}{' '}
              <button className="btn btn-small" disabled={disabled} onClick={purge}>🧹 Jeter les périmées</button></p>
          )}
        </div>
      )}
      <Card title="Plantes du codex" actions={<>
        <input className="search" placeholder="Rechercher une plante…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="row gap"><input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} /> En stock seulement</label>
      </>}>
        {CATS.map(({ key, label }) => {
          const rows = view.stock.filter((s) => s.plant?.category === key && match(s))
          if (!rows.length) return null
          return (
            <section key={key} className="stack" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{label}</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Plante</th><th>Effet</th><th>Saison</th><th>Stock</th><th>Péremption</th><th /></tr></thead>
                  <tbody>{rows.map((s) => (
                    <tr key={s.name} style={s.qty === 0 ? { opacity: 0.65 } : undefined}>
                      <td><strong>{s.name}</strong><div className="muted small">{s.plant?.description}</div></td>
                      <td>{effectLabel(s.plant)}</td>
                      <td className="muted small">{s.plant?.seasons ? s.plant.seasons.map((i) => SEASONS[i]).join(', ') : 'toute l’année'}</td>
                      <td><strong>{s.qty}</strong> <span className="muted">/ {PLANT_LIMIT}</span></td>
                      <td className="small">{s.lots.length === 0 ? <span className="muted">—</span> : s.lots.map((l) => <div key={l.expires}>{l.qty} × {l.expires.slice(8)}/{l.expires.slice(5, 7)}{isSoon(s) && l === s.lots[0] ? ' 🟠' : ''}</div>)}</td>
                      <td className="row gap end">
                        <button className="btn btn-small btn-primary" disabled={disabled || s.qty >= PLANT_LIMIT} onClick={() => setModal({ mode: 'add', plant: s.name })}>＋</button>
                        <button className="btn btn-small" disabled={disabled || s.qty === 0} onClick={() => setModal({ mode: 'remove', plant: s.name })}>−</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          )
        })}
        {view.unknown.length > 0 && (
          <section className="stack"><h3 style={{ margin: 0 }}>❓ Hors codex</h3>
            <p className="muted">Ces plantes sont en base mais absentes du codex : à vérifier avec le staff technique.</p>
            <div className="row gap wrap">{view.unknown.map((u) => <Badge key={u.name} tone="warn">{u.name} ×{u.qty}</Badge>)}</div>
          </section>
        )}
      </Card>
      <Card title="Derniers mouvements">
        {mine.length === 0 ? <Empty>Aucun mouvement enregistré pour ce clan.</Empty> : (
          <ul className="plain">{mine.map((h) => (
            <li key={h.id}>{h.action === 'add' ? '➕' : h.action === 'remove' ? '➖' : '🍂'} <strong>{h.plant_name}</strong> ×{h.quantity} <span className="muted">· {members(h.actor_id)} · {relativeTime(h.created_at)}{h.reason ? ` · ${h.reason}` : ''}</span></li>
          ))}</ul>
        )}
      </Card>
    </div>
  )
}

function PlantModal({ clan, mode, plant, onClose }: { clan: string; mode: 'add' | 'remove'; plant: string; onClose: () => void }) {
  const { run } = useJobs()
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState('')
  const add = mode === 'add'
  const valid = Number.isInteger(qty) && qty >= 1 && qty <= 20
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    run({ label: `${add ? '+' : '−'}${qty} ${plant} (${clan})`, bot: 'ricochet', action: add ? 'herbier.add' : 'herbier.remove', payload: { clan, plant_name: plant, quantity: qty, ...(reason.trim() ? { reason: reason.trim() } : {}) } })
    onClose()
  }
  return (
    <Modal title={`🌿 ${add ? 'Ajouter' : 'Retirer'} · ${plant} · ${clan}`} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <Field label="Quantité (1 à 20)" hint={add ? `La réserve ne peut pas dépasser ${PLANT_LIMIT} unités par plante. Ce lot périmera dans ${PLANTS.find((p) => p.name === plant)?.shelfDays ?? 30} jours.` : 'Retrait par ordre de péremption (les plus anciennes d’abord).'}>
          <input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Number(e.target.value))} autoFocus />
        </Field>
        <Field label="Raison (facultatif)"><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder={add ? 'Cueillette, trouvaille…' : 'Correction, événement RP…'} /></Field>
        <div className="row gap end">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="submit" className={`btn ${add ? 'btn-primary' : 'btn-danger'}`} disabled={!valid}>{add ? 'Ajouter' : 'Retirer'}</button>
        </div>
      </form>
    </Modal>
  )
}

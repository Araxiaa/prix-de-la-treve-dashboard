import { useState, type FormEvent, type ReactNode } from 'react'
import { DESTINATIONS, RANKS } from '../lib/format'
import { useJobs } from '../lib/jobs'
import type { Character, Npc } from '../lib/types'
import { Badge, Field, Modal } from './ui'

/** Boîte de dialogue d'action : envoie la demande au bot, referme, et le suivi s'affiche en bas de l'écran (toast). */
function ActionForm({ title, submitLabel, danger = false, canSubmit = true, onClose, onSubmit, children }: {
  title: string; submitLabel: string; danger?: boolean; canSubmit?: boolean; onClose: () => void; onSubmit: () => void; children: ReactNode
}) {
  const submit = (e: FormEvent) => { e.preventDefault(); if (canSubmit) { onSubmit(); onClose() } }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        {children}
        <div className="row gap end">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="submit" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={!canSubmit}>{submitLabel}</button>
        </div>
      </form>
    </Modal>
  )
}

export function BaptemeModal({ character, onClose }: { character: Character; onClose: () => void }) {
  const { run } = useJobs()
  const [name, setName] = useState('')
  const [rank, setRank] = useState(character.rank)
  const [reason, setReason] = useState('')
  const nameChanged = name.trim() !== '' && name.trim() !== character.name
  const rankChanged = rank !== character.rank
  return (
    <ActionForm title={`🎉 Baptême · ${character.name}`} submitLabel="Baptiser" canSubmit={nameChanged || rankChanged} onClose={onClose}
      onSubmit={() => run({
        label: `Baptême de ${character.name}`, bot: 'bubulle', action: 'character.bapteme',
        payload: { character_id: character.id, ...(nameChanged ? { new_name: name.trim() } : {}), ...(rankChanged ? { new_rank: rank } : {}), reason: reason.trim() || 'Via le site' },
      })}>
      <p className="muted">Bubulle applique le baptême avec ses règles habituelles (PV et PA du nouveau rang, chronologie, log Discord).</p>
      <Field label="Nouveau nom" hint="Vide = le nom ne change pas"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={character.name} maxLength={60} /></Field>
      <Field label="Nouveau rang">
        <select value={rank} onChange={(e) => setRank(e.target.value)}>{RANKS.map((r) => <option key={r}>{r}</option>)}</select>
      </Field>
      <Field label="Raison (facultatif)"><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Cérémonie, promotion…" /></Field>
    </ActionForm>
  )
}

export function HpModal({ character, onClose }: { character: Character; onClose: () => void }) {
  const { run } = useJobs()
  const [change, setChange] = useState(-5)
  const [reason, setReason] = useState('')
  const next = Math.max(0, character.hp_current + change)
  const lethal = next <= 0
  return (
    <ActionForm title={`❤️ PV · ${character.name}`} submitLabel="Appliquer" danger={lethal} canSubmit={change !== 0 && Math.abs(change) <= 500} onClose={onClose}
      onSubmit={() => run({ label: `PV de ${character.name} (${change > 0 ? '+' : ''}${change})`, bot: 'bubulle', action: 'character.hp', payload: { character_id: character.id, change, reason: reason.trim() || 'Via le site' } })}>
      <div className="row gap wrap">{[-10, -5, -1, 1, 5, 10].map((v) => <button type="button" key={v} className="btn btn-small" onClick={() => setChange(v)}>{v > 0 ? `+${v}` : v}</button>)}</div>
      <Field label="Variation de PV"><input type="number" value={change} onChange={(e) => setChange(Number(e.target.value))} min={-500} max={500} /></Field>
      <p>PV : <strong>{character.hp_current}</strong> / {character.hp_max} → <strong>{next}</strong> {lethal && <Badge tone="bad">à 0 PV : perte d'une vie, ou mort si c'est la dernière ({character.lives} vie{character.lives > 1 ? 's' : ''})</Badge>}</p>
      <Field label="Raison"><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Combat, soin, événement…" /></Field>
    </ActionForm>
  )
}

type Entity = { kind: 'OC'; data: Character } | { kind: 'PNJ'; data: Npc }
export function StatusModal({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const { run } = useJobs()
  const e = entity.data
  const options = e.dead ? [] : e.missing ? [['retour', '🌟 Retour']] : [['disparition', '🌫️ Disparition'], ['mort', '💀 Mort']]
  const [status, setStatus] = useState(options[0]?.[0] ?? '')
  const [destination, setDestination] = useState<string>(DESTINATIONS[0])
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(false)
  const needsConfirm = status === 'mort'
  const ok = options.length > 0 && reason.trim().length >= 3 && (!needsConfirm || confirm)
  return (
    <ActionForm title={`🕯️ Statut · ${e.name}`} submitLabel="Valider" danger={needsConfirm} canSubmit={ok} onClose={onClose}
      onSubmit={() => run({
        label: `${e.name} : ${status}`, bot: 'bubulle', action: entity.kind === 'OC' ? 'character.status' : 'npc.status',
        payload: { [entity.kind === 'OC' ? 'character_id' : 'npc_id']: e.id, status, reason: reason.trim(), ...(status === 'mort' ? { destination } : {}) },
      })}>
      {options.length === 0 ? <p className="alert alert-warn">{e.name} est mort·e : seul un admin peut le ranimer, depuis Discord (<code>/statut ranimer</code>).</p> : (
        <>
          <div className="seg">{options.map(([v, label]) => <button type="button" key={v} className={`seg-item ${status === v ? 'on' : ''}`} onClick={() => setStatus(v)}>{label}</button>)}</div>
          {status === 'mort' && <Field label="Destination"><select value={destination} onChange={(ev) => setDestination(ev.target.value)}>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select></Field>}
          <Field label="Raison" hint="Obligatoire, consignée dans l'historique"><textarea value={reason} onChange={(ev) => setReason(ev.target.value)} rows={3} maxLength={300} /></Field>
          {needsConfirm && <label className="check"><input type="checkbox" checked={confirm} onChange={(ev) => setConfirm(ev.target.checked)} /> Je confirme le décès (annulable seulement par un admin)</label>}
        </>
      )}
    </ActionForm>
  )
}

export function GibierModal({ mode, clan, onClose }: { mode: 'add' | 'remove'; clan: string; onClose: () => void }) {
  const { run } = useJobs()
  const [prey, setPrey] = useState('')
  const [portions, setPortions] = useState(4)
  const ok = prey.trim().length >= 2 && portions >= 1 && portions <= 200
  const add = mode === 'add'
  return (
    <ActionForm title={`🍖 ${add ? 'Ajouter du' : 'Retirer du'} gibier · ${clan}`} submitLabel={add ? 'Ajouter' : 'Retirer'} danger={!add} canSubmit={ok} onClose={onClose}
      onSubmit={() => run({ label: `${add ? '+' : '−'}${portions} ${prey.trim()} (${clan})`, bot: 'ricochet', action: add ? 'gibier.add' : 'gibier.remove', payload: { clan, prey_name: prey.trim(), portions } })}>
      <Field label="Proie" hint={add ? undefined : 'Nom exact tel qu’il apparaît dans la pile'}><input value={prey} onChange={(e) => setPrey(e.target.value)} maxLength={60} placeholder="Campagnol, mulot…" autoFocus /></Field>
      <Field label="Portions (1 à 200)"><input type="number" value={portions} onChange={(e) => setPortions(Number(e.target.value))} min={1} max={200} /></Field>
    </ActionForm>
  )
}

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { api } from '../lib/api'
import { CLANS, RANKS, ageInLunes } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { HANDICAPS, SKILLS } from '../lib/handicaps'
import { useJobs } from '../lib/jobs'
import { useMembers } from '../lib/members'
import type { Character, Npc } from '../lib/types'
import { Badge, Field, Loaded, Modal } from './ui'

const GENDERS = ['Mâle', 'Femelle', 'Non-binaire', 'Autre']

function Form({ title, submit, danger = false, ok = true, onClose, onSubmit, children, wide = false }: {
  title: string; submit: string; danger?: boolean; ok?: boolean; onClose: () => void; onSubmit: () => void; children: ReactNode; wide?: boolean
}) {
  const go = (e: FormEvent) => { e.preventDefault(); if (ok) { onSubmit(); onClose() } }
  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form onSubmit={go} className="stack">
        {children}
        <div className="row gap end">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="submit" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={!ok}>{submit}</button>
        </div>
      </form>
    </Modal>
  )
}

/** Joueur : liste des membres connus du serveur, ou identifiant Discord saisi à la main (clic droit sur le profil → Copier l'identifiant). */
function PlayerPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { byId } = useMembers()
  const known = useMemo(() => [...byId.values()].sort((a, b) => a.display_name.localeCompare(b.display_name, 'fr')), [byId])
  return (
    <Field label="Joueur" hint="Choisis dans la liste, ou colle l'identifiant Discord (18-19 chiffres). La personne doit être membre du serveur.">
      <div className="row gap">
        <select value={known.some((m) => m.user_id === value) ? value : ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">— membre connu —</option>{known.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
        </select>
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} placeholder="Identifiant Discord" inputMode="numeric" maxLength={20} />
      </div>
    </Field>
  )
}

const select = (list: readonly string[], value: string, set: (v: string) => void, blank?: string) => (
  <select value={value} onChange={(e) => set(e.target.value)}>{blank !== undefined && <option value="">{blank}</option>}{list.map((x) => <option key={x}>{x}</option>)}</select>
)

// ── Création / modification d'un OC ──────────────────────────────────────────
export function CharacterFormModal({ character, onClose }: { character?: Character; onClose: () => void }) {
  const { run } = useJobs()
  const edit = !!character
  const [user, setUser] = useState(character?.user_id ?? '')
  const [name, setName] = useState(character?.name ?? '')
  const [clan, setClan] = useState(character?.clan ?? CLANS[1])
  const [rank, setRank] = useState(character?.rank ?? 'Apprenti')
  const [gender, setGender] = useState(character?.gender ?? 'Femelle')
  const [prefix, setPrefix] = useState(character?.prefix ?? '')
  const [age, setAge] = useState(edit ? '' : '0')
  const [avatar, setAvatar] = useState('')
  const [handicap, setHandicap] = useState('')
  const [origin, setOrigin] = useState('Naissance')
  const currentAge = character ? ageInLunes(character.initial_age_lunes, character.aging_start_date) : null
  const ok = edit ? true : name.trim().length >= 2 && user.length >= 15 && prefix.trim().length >= 1 && (!handicap || !!origin)

  const submit = () => {
    if (!edit) {
      return run({ label: `Création de ${name.trim()}`, bot: 'bubulle', action: 'character.create',
        payload: { user_id: user, name: name.trim(), clan, rank, gender, prefix: prefix.trim(), age_lunes: Number(age) || 0, ...(handicap ? { handicap, origin } : {}) } })
    }
    const c = character!
    const payload: Record<string, unknown> = { character_id: c.id }
    if (name.trim() && name.trim() !== c.name) payload.name = name.trim()
    if (clan !== c.clan) payload.clan = clan
    if (rank !== c.rank) payload.rank = rank
    if (gender !== (c.gender ?? 'Femelle')) payload.gender = gender
    if (prefix.trim() && prefix.trim() !== (c.prefix ?? '')) payload.prefix = prefix.trim()
    if (user && user !== c.user_id) payload.owner_id = user
    if (age !== '') payload.age_lunes = Number(age)
    if (avatar.trim()) payload.avatar_url = avatar.trim()
    return run({ label: `Modification de ${c.name}`, bot: 'bubulle', action: 'character.edit', payload })
  }
  return (
    <Form title={edit ? `✏️ Modifier · ${character!.name}` : '➕ Nouvel OC'} submit={edit ? 'Enregistrer' : 'Créer le personnage'} ok={ok} onClose={onClose} onSubmit={submit} wide>
      <div className="grid two">
        <PlayerPicker value={user} onChange={setUser} />
        <Field label="Nom"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required={!edit} /></Field>
        <Field label="Clan">{select(CLANS, clan, setClan)}</Field>
        <Field label="Rang" hint={edit ? 'Recalcule les PV et PA max du rang' : 'Détermine les PV, PA et vies de départ'}>{select(RANKS, rank, setRank)}</Field>
        <Field label="Genre">{select(GENDERS, gender, setGender)}</Field>
        <Field label="Préfixe" hint="Unique pour ce joueur (ex. « eto »)"><input value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={20} /></Field>
        <Field label={edit ? `Âge en lunes (actuel : ${currentAge ?? '—'})` : 'Âge de départ (lunes)'} hint={edit ? 'Vide = inchangé. Relance le décompte et resynchronise la fratrie.' : undefined}>
          <input type="number" min={0} max={999} value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
        {edit && <Field label="Avatar (lien)" hint="Vide = inchangé"><input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" /></Field>}
        {!edit && (
          <Field label="Handicap de départ (facultatif)">
            <div className="row gap">{select(Object.keys(HANDICAPS), handicap, setHandicap, '— aucun —')}{handicap && select(['Naissance', 'Accident'], origin, setOrigin)}</div>
          </Field>
        )}
      </div>
      <p className="muted small">Bubulle applique ses règles habituelles : quota de personnages par joueur, unicité du nom et du préfixe, journal de chronologie et log Discord.</p>
    </Form>
  )
}

// ── Statistiques ─────────────────────────────────────────────────────────────
export function StatsModal({ character: c, onClose }: { character: Character; onClose: () => void }) {
  const { run } = useJobs()
  const [hpMax, setHpMax] = useState(String(c.hp_max))
  const [hp, setHp] = useState(String(c.hp_current))
  const [paMax, setPaMax] = useState('')
  const [pa, setPa] = useState('')
  const [lives, setLives] = useState(String(c.lives))
  const [reason, setReason] = useState('')
  const diff = (v: string, cur: number | null) => v !== '' && Number(v) !== cur
  const payload: Record<string, unknown> = { character_id: c.id, reason: reason.trim() || 'Correction via le site' }
  if (diff(hpMax, c.hp_max)) payload.hp_max = Number(hpMax)
  if (diff(hp, c.hp_current)) payload.hp_current = Number(hp)
  if (paMax !== '') payload.pa_max = Number(paMax)
  if (pa !== '') payload.pa_current = Number(pa)
  if (diff(lives, c.lives)) payload.lives = Number(lives)
  const changed = Object.keys(payload).length > 2
  return (
    <Form title={`📊 Statistiques · ${c.name}`} submit="Appliquer" ok={changed && !c.dead} onClose={onClose}
      onSubmit={() => run({ label: `Statistiques de ${c.name}`, bot: 'bubulle', action: 'character.stats', payload })}>
      <p className="muted">Correction directe (hors combat). Pour infliger ou soigner des PV avec la règle des vies, utilise « Modifier les PV ».</p>
      <div className="grid two">
        <Field label="PV max"><input type="number" min={1} max={999} value={hpMax} onChange={(e) => setHpMax(e.target.value)} /></Field>
        <Field label="PV actuels (1 minimum)"><input type="number" min={1} max={999} value={hp} onChange={(e) => setHp(e.target.value)} /></Field>
        <Field label="PA max" hint="Vide = inchangé"><input type="number" min={0} max={99} value={paMax} onChange={(e) => setPaMax(e.target.value)} placeholder="inchangé" /></Field>
        <Field label="PA actuels" hint="Vide = inchangé"><input type="number" min={0} max={99} value={pa} onChange={(e) => setPa(e.target.value)} placeholder="inchangé" /></Field>
        <Field label="Vies"><input type="number" min={1} max={99} value={lives} onChange={(e) => setLives(e.target.value)} /></Field>
      </div>
      <Field label="Raison"><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Équilibrage, erreur de saisie…" /></Field>
    </Form>
  )
}

// ── Compétences ──────────────────────────────────────────────────────────────
export function SkillsModal({ character: c, onClose }: { character: Character; onClose: () => void }) {
  const { run } = useJobs()
  const state = useAsync(() => api.skills(c.id), [c.id])
  const [vals, setVals] = useState<Record<string, string>>({})
  return (
    <Modal title={`🎯 Compétences · ${c.name}`} onClose={onClose}>
      <Loaded state={state}>
        {(current) => {
          const changed = Object.fromEntries(Object.entries(vals).filter(([k, v]) => v !== '' && Number(v) !== (current[k] ?? 0)).map(([k, v]) => [k, Number(v)]))
          return (
            <form className="stack" onSubmit={(e) => { e.preventDefault(); if (Object.keys(changed).length) { run({ label: `Compétences de ${c.name}`, bot: 'bubulle', action: 'character.skills', payload: { character_id: c.id, skills: changed } }); onClose() } }}>
              {SKILLS.map((s) => (
                <div key={s} className="row gap between">
                  <span style={{ width: 110 }}>{s}</span>
                  <input type="range" min={0} max={100} value={vals[s] ?? String(current[s] ?? 0)} onChange={(e) => setVals({ ...vals, [s]: e.target.value })} style={{ flex: 1 }} />
                  <strong style={{ width: 52, textAlign: 'right' }}>{vals[s] ?? current[s] ?? 0} %</strong>
                </div>
              ))}
              <div className="row gap end"><button type="button" className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" disabled={!Object.keys(changed).length}>Enregistrer</button></div>
            </form>
          )
        }}
      </Loaded>
    </Modal>
  )
}

// ── Handicaps ────────────────────────────────────────────────────────────────
export function HandicapsModal({ character: c, onClose }: { character: Character; onClose: () => void }) {
  const { run } = useJobs()
  const state = useAsync(() => api.handicaps(c.id), [c.id])
  const [handicap, setHandicap] = useState(Object.keys(HANDICAPS)[0])
  const [origin, setOrigin] = useState<'Naissance' | 'Accident'>('Naissance')
  const send = (op: 'add' | 'remove', name: string, org?: string) =>
    run({ label: `${op === 'add' ? '+' : '−'} ${name} (${c.name})`, bot: 'bubulle', action: 'character.handicap', payload: { character_id: c.id, op, handicap: name, ...(org ? { origin: org } : {}) } })
  return (
    <Modal title={`⚠️ Handicaps · ${c.name}`} onClose={onClose}>
      <Loaded state={state}>
        {(list) => (
          <div className="stack">
            {list.length === 0 ? <p className="muted">Aucun handicap.</p> : (
              <ul className="plain">{list.map((h) => (
                <li key={h.handicap_name} className="row between"><span><strong>{h.handicap_name}</strong> <Badge tone="warn">{h.origin} · −{HANDICAPS[h.handicap_name]?.[h.origin as 'Naissance'] ?? '?'} %</Badge></span>
                  <button className="btn btn-small" onClick={() => { send('remove', h.handicap_name); onClose() }}>Retirer</button></li>
              ))}</ul>
            )}
            <h3>Ajouter</h3>
            <div className="row gap wrap">
              {select(Object.keys(HANDICAPS), handicap, setHandicap)}{select(['Naissance', 'Accident'], origin, (v) => setOrigin(v as typeof origin))}
              <Badge tone="warn">−{HANDICAPS[handicap][origin]} % sur ses jets</Badge>
              <button className="btn btn-primary" onClick={() => { send('add', handicap, origin); onClose() }}>Ajouter</button>
            </div>
          </div>
        )}
      </Loaded>
    </Modal>
  )
}

// ── Archivage et suppression ─────────────────────────────────────────────────
export function ArchiveModal({ character: c, onClose }: { character: Character; onClose: () => void }) {
  const { run } = useJobs()
  const to = !c.archived
  return (
    <Form title={`${to ? '🗄️ Archiver' : '↩️ Désarchiver'} · ${c.name}`} submit={to ? 'Archiver' : 'Désarchiver'} onClose={onClose}
      onSubmit={() => run({ label: `${to ? 'Archivage' : 'Désarchivage'} de ${c.name}`, bot: 'bubulle', action: 'character.archive', payload: { character_id: c.id, archived: to } })}>
      <p>{to ? "Le personnage quitte les listes actives (autocomplétions, rapports). Rien n'est supprimé." : 'Le personnage redevient actif.'}</p>
      {to && <p className="muted small">Le salon d'archive se crée avec Vigie sur Discord (<code>/fiche creer_archive</code>).</p>}
    </Form>
  )
}

export function DeleteModal({ kind, entity, onClose }: { kind: 'OC' | 'PNJ'; entity: Character | Npc; onClose: () => void }) {
  const { run } = useJobs()
  const [typed, setTyped] = useState('')
  return (
    <Form title={`🗑️ Supprimer définitivement · ${entity.name}`} submit="Supprimer pour toujours" danger ok={typed.trim() === entity.name} onClose={onClose}
      onSubmit={() => run(kind === 'OC'
        ? { label: `Suppression de ${entity.name}`, bot: 'bubulle', action: 'character.delete', payload: { character_id: entity.id, confirm_name: typed.trim() } }
        : { label: `Suppression de ${entity.name}`, bot: 'bubulle', action: 'npc.delete', payload: { npc_id: entity.id, confirm_name: typed.trim() } })}>
      <div className="alert alert-error">⚠️ <strong>Irréversible.</strong> {kind === 'OC' ? "La fiche, l'historique, les compétences et les handicaps sont effacés." : 'Le PNJ et ses liens de fratrie sont effacés.'} Pour un décès RP, utilise plutôt « Mort / disparition ».</div>
      <Field label={`Tape le nom exact pour confirmer : ${entity.name}`}><input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" /></Field>
    </Form>
  )
}

// ── PNJ ──────────────────────────────────────────────────────────────────────
export function NpcFormModal({ npc, onClose }: { npc?: Npc; onClose: () => void }) {
  const { run } = useJobs()
  const edit = !!npc
  const [name, setName] = useState(npc?.name ?? '')
  const [clan, setClan] = useState(npc?.clan ?? CLANS[1])
  const [rank, setRank] = useState(npc?.rank ?? 'Guerrier')
  const [gender, setGender] = useState(npc?.gender ?? 'Mâle')
  const [prefix, setPrefix] = useState(npc?.prefix ?? '')
  const [age, setAge] = useState(edit ? '' : '0')
  const [avatar, setAvatar] = useState('')
  const ok = edit || name.trim().length >= 2
  const submit = () => {
    if (!edit) {
      return run({ label: `Création du PNJ ${name.trim()}`, bot: 'bubulle', action: 'npc.create',
        payload: { name: name.trim(), clan, rank, gender, age_lunes: Number(age) || 0, ...(prefix.trim() ? { prefix: prefix.trim() } : {}), ...(avatar.trim() ? { avatar_url: avatar.trim() } : {}) } })
    }
    const payload: Record<string, unknown> = { npc_id: npc!.id }
    if (name.trim() && name.trim() !== npc!.name) payload.name = name.trim()
    if (clan !== npc!.clan) payload.clan = clan
    if (rank !== npc!.rank) payload.rank = rank
    if (gender !== (npc!.gender ?? 'Mâle')) payload.gender = gender
    if (prefix.trim() && prefix.trim() !== (npc!.prefix ?? '')) payload.prefix = prefix.trim()
    if (age !== '') payload.age_lunes = Number(age)
    if (avatar.trim()) payload.avatar_url = avatar.trim()
    return run({ label: `Modification de ${npc!.name}`, bot: 'bubulle', action: 'npc.edit', payload })
  }
  const current = npc ? ageInLunes(npc.initial_age_lunes, npc.aging_start_date) : null
  return (
    <Form title={edit ? `✏️ Modifier · ${npc!.name}` : '➕ Nouveau PNJ'} submit={edit ? 'Enregistrer' : 'Créer le PNJ'} ok={ok} onClose={onClose} onSubmit={submit} wide>
      <div className="grid two">
        <Field label="Nom"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
        <Field label="Clan">{select(CLANS, clan, setClan)}</Field>
        <Field label="Rang">{select(RANKS, rank, setRank)}</Field>
        <Field label="Genre">{select(GENDERS, gender, setGender)}</Field>
        <Field label="Préfixe (facultatif)" hint="Unique parmi les PNJ"><input value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={20} /></Field>
        <Field label={edit ? `Âge en lunes (actuel : ${current ?? '—'})` : 'Âge (lunes)'} hint={edit ? 'Vide = inchangé' : undefined}><input type="number" min={0} max={999} value={age} onChange={(e) => setAge(e.target.value)} /></Field>
        <Field label="Avatar (lien, facultatif)"><input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" /></Field>
      </div>
    </Form>
  )
}

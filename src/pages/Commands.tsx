import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Combo from '../components/Combo'
import { Badge, Card, Empty, Field, Loaded, Modal, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { buildArgs, formErrors, missingRequired, suggestionKind, valuesFromArgs } from '../lib/commandForm'
import { useDirectory } from '../lib/directory'
import { norm, relativeTime } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useJobs } from '../lib/jobs'
import { useStoredList } from '../lib/prefs'
import type { BotName, BotStatus, CommandDef, CommandParam, Job } from '../lib/types'

const BOTS: Record<string, { bot: BotName; title: string }> = { bubulle: { bot: 'bubulle', title: 'Bubulle · gestion' } }
const GROUPS: Record<string, string> = {
  mod: 'Modération', calendar: 'Calendrier', weather: 'Météo', perms: 'Permissions', staff: 'Outils staff', site: 'Site', character: 'Personnages',
  npc: 'PNJ', bapteme: 'Baptêmes', statut: 'Statuts', groupe: 'Groupes & rangs', mentor: 'Mentorat', info: 'Informations', niveau: 'Niveaux',
}
const clean = (d: string) => d.replace(/^\[(ADMIN|STAFF)\]\s*/i, '')
const OFFLINE_AFTER_MS = 3 * 60_000

interface Prefill { values: Record<string, string>; channel: string }

/** Une commande Discord = un formulaire généré d'après ses paramètres (le bot publie la liste, le site ne code rien en dur). */
export default function Commands({ botKey = 'bubulle' }: { botKey?: string }) {
  const { guild, isAdmin } = useAuth()
  const { bot, title } = BOTS[botKey]
  const state = useAsync(() => api.commands(bot), [bot])
  const runs = useAsync(() => (guild ? api.commandRuns(guild, bot) : Promise.resolve([] as Job[])), [guild, bot])
  const status = useAsync(() => api.botStatus(), [])
  const favorites = useStoredList(`fav-commands:${bot}`)
  const recents = useStoredList(`recent-commands:${bot}`, 8)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<{ command: CommandDef; prefill?: Prefill } | null>(null)
  const [result, setResult] = useState<{ name: string; job: Job } | null>(null)
  const search = useRef<HTMLInputElement>(null)

  // Ctrl+K (ou /) : va directement à la recherche.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (!typing && e.key === '/')) { e.preventDefault(); search.current?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const byName = useMemo(() => new Map((state.data ?? []).map((c) => [c.name, c])), [state.data])
  const mine = status.data?.find((s: BotStatus) => s.bot === bot)
  const offline = status.data && (!mine || Date.now() - new Date(mine.last_seen).getTime() > OFFLINE_AFTER_MS)
  const launch = (command: CommandDef, prefill?: Prefill) => setOpen({ command, prefill })
  const allowed = (c: CommandDef) => !(c.level === 'admin' && !isAdmin)

  const card = (c: CommandDef) => {
    const locked = !allowed(c)
    const fav = favorites.list.includes(c.name)
    return (
      <div key={c.name} className="cmd-card-wrap">
        <button className="cmd-card" disabled={locked || !guild} onClick={() => launch(c)} title={locked ? 'Réservé aux admins' : undefined}>
          <strong>/{c.name}</strong> {c.level === 'admin' && <Badge tone="bad">admin</Badge>}
          <span className="muted">{clean(c.description)}</span>
        </button>
        <button className={`cmd-star ${fav ? 'on' : ''}`} aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => favorites.toggle(c.name)}>{fav ? '★' : '☆'}</button>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Commandes" subtitle={`${title} — les mêmes commandes que sur Discord, avec les mêmes vérifications et les mêmes logs`} />
      {offline && <p className="alert alert-warn">Bubulle semble hors ligne : tes demandes attendront son retour (elles expirent au bout de 30 minutes).</p>}
      <Card>
        <div className="filters">
          <input ref={search} className="search" placeholder="Rechercher une commande…  (Ctrl+K ou /)" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              const first = (state.data ?? []).filter((c) => allowed(c) && norm(`${c.name} ${c.description}`).includes(norm(q)))
              if (first.length >= 1 && q.trim()) launch(first.find((c) => norm(c.name) === norm(q.replace(/^\//, ''))) ?? first[0])
            }} />
        </div>
        <Loaded state={state}>
          {(all) => {
            if (all.length === 0) return <Empty>Aucune commande publiée : Bubulle doit être redémarré avec la dernière version (le catalogue arrive à son démarrage).</Empty>
            const list = all.filter((c) => !q || norm(`${c.name} ${c.description}`).includes(norm(q.replace(/^\//, ''))))
            if (list.length === 0) return <Empty>Aucune commande ne correspond.</Empty>
            const favs = list.filter((c) => favorites.list.includes(c.name))
            const recent = recents.list.map((n) => byName.get(n)).filter((c): c is CommandDef => !!c && list.includes(c) && allowed(c))
            return (
              <>
                {!q && favs.length > 0 && <section className="stack" style={{ marginTop: 16 }}><h3 style={{ margin: 0 }}>⭐ Favoris</h3><div className="cmd-grid">{favs.map(card)}</div></section>}
                {!q && recent.length > 0 && (
                  <section className="stack" style={{ marginTop: 16 }}><h3 style={{ margin: 0 }}>🕘 Récentes</h3>
                    <div className="row gap wrap">{recent.map((c) => <button key={c.name} className="btn btn-small" onClick={() => launch(c)}>/{c.name}</button>)}</div>
                  </section>
                )}
                {[...new Set(list.map((c) => c.grp))].map((g) => (
                  <section key={g} className="stack" style={{ marginTop: 16 }}>
                    <h3 style={{ margin: 0 }}>{GROUPS[g] ?? g}</h3>
                    <div className="cmd-grid">{list.filter((c) => c.grp === g).map(card)}</div>
                  </section>
                ))}
              </>
            )
          }}
        </Loaded>
      </Card>

      <Card title="Dernières commandes lancées depuis le site">
        <Loaded state={runs}>
          {(rows) => rows.length === 0 ? <Empty>Aucune commande lancée pour le moment.</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Quand</th><th>Qui</th><th>Commande</th><th>État</th><th /></tr></thead>
                <tbody>{rows.slice(0, 15).map((j) => {
                  const name = String(j.payload.command ?? '')
                  const def = byName.get(name)
                  return (
                    <tr key={j.id}>
                      <td className="muted">{relativeTime(j.created_at)}</td><td>{j.requested_name ?? '—'}</td>
                      <td><strong>/{name}</strong> <small className="muted">{summarize(j.payload.args)}</small></td>
                      <td>{j.status === 'done' ? <Badge tone="ok">fait</Badge> : j.status === 'failed' ? <Badge tone="bad">échec</Badge> : <Badge>{j.status === 'running' ? 'en cours' : 'en attente'}</Badge>}</td>
                      <td className="row gap end">
                        {(j.status === 'done' || j.status === 'failed') && <button className="btn btn-small" onClick={() => setResult({ name, job: j })}>Résultat</button>}
                        {def && allowed(def) && <button className="btn btn-small" onClick={() => launch(def, { values: valuesFromArgs(j.payload.args as Record<string, unknown>), channel: String(j.payload.channel_id ?? '') })}>Relancer</button>}
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Card>

      {open && (
        <CommandForm command={open.command} prefill={open.prefill} commands={state.data ?? []} onClose={() => setOpen(null)}
          onDone={(job) => { recents.push(open.command.name); setResult({ name: open.command.name, job }); runs.reload() }} />
      )}
      {result && <ResultModal name={result.name} job={result.job} onClose={() => setResult(null)} />}
    </>
  )
}

const summarize = (args: unknown): string => {
  const e = Object.entries((args ?? {}) as Record<string, unknown>).slice(0, 3).map(([k, v]) => `${k}: ${String(v).slice(0, 24)}`).join(' · ')
  return e
}

function ResultModal({ name, job, onClose }: { name: string; job: Job; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const text = job.result?.details ?? ''
  return (
    <Modal title={`Résultat · /${name}`} onClose={onClose} wide>
      <p>{job.status === 'done' ? '✅ ' + (job.result?.message ?? 'Fait.') : '❌ ' + (job.error ?? 'Échec.')}</p>
      {text && (<>
        <pre className="cmd-result">{text}</pre>
        <div className="row gap end">
          <button className="btn btn-small" onClick={() => { navigator.clipboard?.writeText(text).then(() => setCopied(true), () => undefined) }}>{copied ? 'Copié ✓' : 'Copier'}</button>
        </div>
      </>)}
    </Modal>
  )
}

function CommandForm({ command, prefill, commands, onClose, onDone }: {
  command: CommandDef; prefill?: Prefill; commands: CommandDef[]; onClose: () => void; onDone: (job: Job) => void
}) {
  const { run } = useJobs()
  const dir = useDirectory(commands)
  const [values, setValues] = useState<Record<string, string>>(prefill?.values ?? {})
  const [channel, setChannel] = useState(prefill?.channel ?? '')
  const [sure, setSure] = useState(false)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const danger = command.level === 'admin'
  const errors = formErrors(command, values)
  const missing = missingRequired(command, values, channel)
  const blocked = missing || Object.keys(errors).length > 0 || busy || (danger && !sure)
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (blocked) return
    setBusy(true)
    const job = await run({
      label: `/${command.name}`, bot: command.bot, action: 'command.run',
      payload: { command: command.name, args: buildArgs(command, values), ...(channel ? { channel_id: channel } : {}) },
    })
    setBusy(false)
    if (job && (job.status === 'done' || job.status === 'failed')) { onClose(); onDone(job) }
  }

  const field = (p: CommandParam) => {
    const v = values[p.name] ?? ''
    const bad = !!errors[p.name]
    if (p.choices.length) return <select value={v} onChange={(e) => set(p.name, e.target.value)}><option value="">—</option>{p.choices.map((c) => <option key={String(c.value)} value={String(c.value)}>{c.name}</option>)}</select>
    if (p.type === 'boolean') return <select value={v} onChange={(e) => set(p.name, e.target.value)}><option value="">—</option><option value="true">Oui</option><option value="false">Non</option></select>
    if (p.type === 'user') return <Combo options={dir.memberOptions} value={v} onChange={(x) => set(p.name, x)} placeholder="Chercher un membre…" />
    if (p.type === 'mentionable') return <Combo options={[...dir.memberOptions, ...dir.roleOptions.map((r) => ({ ...r, label: '@' + r.label }))]} value={v} onChange={(x) => set(p.name, x)} placeholder="Membre ou rôle…" />
    if (p.type === 'role') return <Combo options={dir.roleOptions} value={v} onChange={(x) => set(p.name, x)} placeholder="Chercher un rôle…" />
    if (p.type === 'channel') return <Combo options={dir.channelOptions} value={v} onChange={(x) => set(p.name, x)} placeholder="Chercher un salon…" />
    if (p.type === 'integer' || p.type === 'number') return <input type="number" inputMode="decimal" step={p.type === 'integer' ? 1 : 'any'} min={p.min ?? undefined} max={p.max ?? undefined} value={v} aria-invalid={bad || undefined} onChange={(e) => set(p.name, e.target.value)} />
    const kind = suggestionKind(p.autocomplete)
    if (kind) return <Combo free options={dir.byKind(kind)} value={v} onChange={(x) => set(p.name, x)} placeholder="Taper ou choisir…" invalid={bad} />
    return <input value={v} maxLength={p.max_length ?? 1000} aria-invalid={bad || undefined} onChange={(e) => set(p.name, e.target.value)} />
  }

  return (
    <Modal title={`/${command.name}`} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <p className="muted">{clean(command.description)}</p>
        {command.note && <p className="alert alert-info">{command.note}</p>}
        {command.needs_channel && <Field label="Salon concerné *"><Combo options={dir.channelOptions} value={channel} onChange={setChannel} placeholder="Chercher un salon…" /></Field>}
        {command.params.map((p) => (
          <Field key={p.name} label={`${p.name}${p.required ? ' *' : ''}`} hint={errors[p.name] ?? p.description}>{field(p)}</Field>
        ))}
        {danger && <label className="row gap"><input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} /> Je confirme cette action réservée aux admins.</label>}
        {touched && missing && <p className="alert alert-error">Complète les champs marqués d'une étoile (*).</p>}
        <div className="row gap end">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="submit" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy || (danger && !sure) || Object.keys(errors).length > 0}>{busy ? 'En cours…' : 'Lancer'}</button>
        </div>
      </form>
    </Modal>
  )
}

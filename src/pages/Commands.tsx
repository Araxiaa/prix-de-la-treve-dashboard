import { useMemo, useState, type FormEvent } from 'react'
import { Badge, Card, Empty, Field, Loaded, Modal, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { norm } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useJobs } from '../lib/jobs'
import { useMembers } from '../lib/members'
import type { BotName, ChannelRow, CommandDef, CommandParam, Job, RoleRow } from '../lib/types'

const BOTS: Record<string, { bot: BotName; title: string }> = { bubulle: { bot: 'bubulle', title: 'Bubulle · gestion' } }
const GROUPS: Record<string, string> = {
  mod: 'Modération', calendar: 'Calendrier', weather: 'Météo', perms: 'Permissions', staff: 'Outils staff', site: 'Site', character: 'Personnages',
  statut: 'Statuts', groupe: 'Groupes & rangs', mentor: 'Mentorat', info: 'Informations', niveau: 'Niveaux',
}
const clean = (d: string) => d.replace(/^\[(ADMIN|STAFF)\]\s*/i, '')

/** Une commande Discord = un formulaire généré d'après ses paramètres (le bot publie la liste, le site ne code rien en dur). */
export default function Commands({ botKey = 'bubulle' }: { botKey?: string }) {
  const { guild, isAdmin } = useAuth()
  const { bot, title } = BOTS[botKey]
  const state = useAsync(() => api.commands(bot), [bot])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<CommandDef | null>(null)
  const [last, setLast] = useState<{ name: string; job: Job } | null>(null)

  return (
    <>
      <PageHeader title="Commandes" subtitle={`${title} — les mêmes commandes que sur Discord, avec les mêmes vérifications et les mêmes logs`} />
      <Card>
        <div className="filters"><input className="search" placeholder="Rechercher une commande…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Loaded state={state}>
          {(all) => {
            if (all.length === 0) return <Empty>Aucune commande publiée : Bubulle doit être redémarré avec la dernière version (le catalogue arrive à son démarrage).</Empty>
            const list = all.filter((c) => !q || norm(`${c.name} ${c.description}`).includes(norm(q)))
            if (list.length === 0) return <Empty>Aucune commande ne correspond.</Empty>
            return [...new Set(list.map((c) => c.grp))].map((g) => (
              <section key={g} className="stack" style={{ marginTop: 16 }}>
                <h3 style={{ margin: 0 }}>{GROUPS[g] ?? g}</h3>
                <div className="cmd-grid">
                  {list.filter((c) => c.grp === g).map((c) => {
                    const locked = c.level === 'admin' && !isAdmin
                    return (
                      <button key={c.name} className="cmd-card" disabled={locked || !guild} onClick={() => setOpen(c)} title={locked ? 'Réservé aux admins' : undefined}>
                        <strong>/{c.name}</strong> {c.level === 'admin' && <Badge tone="bad">admin</Badge>}
                        <span className="muted">{clean(c.description)}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))
          }}
        </Loaded>
      </Card>
      {open && <CommandForm command={open} onClose={() => setOpen(null)} onDone={(job) => setLast({ name: open.name, job })} />}
      {last && (
        <Modal title={`Résultat · /${last.name}`} onClose={() => setLast(null)} wide>
          <p>{last.job.status === 'done' ? '✅ ' + (last.job.result?.message ?? 'Fait.') : '❌ ' + (last.job.error ?? 'Échec.')}</p>
          {last.job.result?.details && <pre className="cmd-result">{last.job.result.details}</pre>}
        </Modal>
      )}
    </>
  )
}

function CommandForm({ command, onClose, onDone }: { command: CommandDef; onClose: () => void; onDone: (job: Job) => void }) {
  const { run } = useJobs()
  const { guild } = useAuth()
  const [values, setValues] = useState<Record<string, string>>({})
  const [channel, setChannel] = useState('')
  const [sure, setSure] = useState(false)
  const [busy, setBusy] = useState(false)
  const channels = useAsync(() => (guild ? api.channels(guild) : Promise.resolve([] as ChannelRow[])), [guild])
  const roles = useAsync(() => (guild ? api.roles(guild) : Promise.resolve([] as RoleRow[])), [guild])
  const members = useMembers()
  const names = useAsync(async () => [...(await api.characters()).map((c) => c.name), ...(await api.npcs()).map((n) => n.name)], [])
  const memberList = useMemo(() => [...members.byId.values()].sort((a, b) => a.display_name.localeCompare(b.display_name)), [members.byId])
  const danger = command.level === 'admin'
  const missing = command.params.some((p) => p.required && !(values[p.name] ?? '').trim()) || (command.needs_channel && !channel)
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (missing || busy || (danger && !sure)) return
    const args: Record<string, string | number | boolean> = {}
    for (const p of command.params) {
      const raw = (values[p.name] ?? '').trim()
      if (raw === '') continue
      args[p.name] = p.type === 'integer' || p.type === 'number' ? Number(raw) : p.type === 'boolean' ? raw === 'true' : raw
    }
    setBusy(true)
    const job = await run({ label: `/${command.name}`, bot: command.bot, action: 'command.run', payload: { command: command.name, args, ...(channel ? { channel_id: channel } : {}) } })
    setBusy(false)
    if (job && (job.status === 'done' || job.status === 'failed')) { onClose(); onDone(job) }
  }

  const field = (p: CommandParam) => {
    const v = values[p.name] ?? ''
    if (p.choices.length) return <select value={v} onChange={(e) => set(p.name, e.target.value)}><option value="">—</option>{p.choices.map((c) => <option key={String(c.value)} value={String(c.value)}>{c.name}</option>)}</select>
    if (p.type === 'boolean') return <select value={v} onChange={(e) => set(p.name, e.target.value)}><option value="">—</option><option value="true">Oui</option><option value="false">Non</option></select>
    if (p.type === 'user' || p.type === 'mentionable') return (
      <select value={v} onChange={(e) => set(p.name, e.target.value)}><option value="">— choisir un membre —</option>
        {memberList.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
        {p.type === 'mentionable' && (roles.data ?? []).map((r) => <option key={r.role_id} value={r.role_id}>@{r.name}</option>)}
      </select>)
    if (p.type === 'role') return <select value={v} onChange={(e) => set(p.name, e.target.value)}><option value="">— choisir un rôle —</option>{(roles.data ?? []).map((r) => <option key={r.role_id} value={r.role_id}>{r.name}</option>)}</select>
    if (p.type === 'channel') return <ChannelSelect channels={channels.data ?? []} value={v} onChange={(x) => set(p.name, x)} />
    if (p.type === 'integer' || p.type === 'number') return <input type="number" step={p.type === 'integer' ? 1 : 'any'} min={p.min ?? undefined} max={p.max ?? undefined} value={v} onChange={(e) => set(p.name, e.target.value)} />
    const list = p.autocomplete ? `dl-${command.name}-${p.name}`.replace(/\s/g, '-') : undefined
    return (<>
      <input value={v} list={list} minLength={p.min_length ?? undefined} maxLength={p.max_length ?? 500} onChange={(e) => set(p.name, e.target.value)} />
      {list && <datalist id={list}>{(names.data ?? []).map((n) => <option key={n} value={n} />)}</datalist>}
    </>)
  }

  return (
    <Modal title={`/${command.name}`} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <p className="muted">{clean(command.description)}</p>
        {command.note && <p className="alert alert-info">{command.note}</p>}
        {command.needs_channel && <Field label="Salon concerné *"><ChannelSelect channels={channels.data ?? []} value={channel} onChange={setChannel} /></Field>}
        {command.params.map((p) => (
          <Field key={p.name} label={`${p.name}${p.required ? ' *' : ''}`} hint={p.description}>{field(p)}</Field>
        ))}
        {danger && <label className="row gap"><input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} /> Je confirme cette action réservée aux admins.</label>}
        <div className="row gap end">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="submit" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={missing || busy || (danger && !sure)}>{busy ? 'Envoi…' : 'Lancer'}</button>
        </div>
      </form>
    </Modal>
  )
}

function ChannelSelect({ channels, value, onChange }: { channels: ChannelRow[]; value: string; onChange: (v: string) => void }) {
  const usable = channels.filter((c) => c.kind !== 'category')
  const cats = [...new Set(usable.map((c) => c.category ?? ''))]
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— choisir un salon —</option>
      {cats.map((cat) => <optgroup key={cat} label={cat || 'Sans catégorie'}>{usable.filter((c) => (c.category ?? '') === cat).map((c) => <option key={c.channel_id} value={c.channel_id}>#{c.name}</option>)}</optgroup>)}
    </select>
  )
}

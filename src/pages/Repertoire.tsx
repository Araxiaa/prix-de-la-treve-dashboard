import { Badge, Card, Empty, Loaded, PageHeader, Stat } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CLAN_EMOJI, relativeTime } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { useJobs } from '../lib/jobs'
import { useMembers } from '../lib/members'

export default function Repertoire() {
  const { guild, isAdmin } = useAuth()
  const { run } = useJobs()
  const members = useMembers()
  const state = useAsync(async () => {
    const [characters, lifecycle] = await Promise.all([api.characters(), guild ? api.lifecycle(guild) : Promise.resolve([])])
    return { characters, lifecycle }
  }, [guild])
  return (
    <>
      <PageHeader title="Répertoire Fiche" subtitle="Vigie — salons de fiche des OC vivants"
        actions={<>
          <button className="btn" onClick={() => run({ label: 'Annonces de lunes', bot: 'vigie', action: 'lunes.announce', payload: {} })}>🌙 Annoncer les lunes en retard</button>
          {isAdmin && <button className="btn" onClick={() => run({ label: "Rôle d'accès aux fiches", bot: 'vigie', action: 'access.apply', payload: {} })}>🔒 Appliquer le rôle d'accès</button>}
        </>} />
      <Loaded state={state}>
        {({ characters, lifecycle }) => {
          const missing = characters.filter((c) => !c.dead && !c.archived && !c.sheet_channel_id)
          const count = (s: string) => lifecycle.filter((l) => l.status === s).length
          return (
            <div className="stack gap-lg">
              <div className="grid stats">
                <Stat label="Salons actifs" value={count('active')} tone="ok" />
                <Stat label="En salle d'attente" value={count('waiting_archive')} tone="warn" />
                <Stat label="Archivés" value={count('archived')} />
                <Stat label="OC sans salon" value={missing.length} tone={missing.length ? 'bad' : 'ok'} />
              </div>
              <Card title={`➕ OC sans salon de fiche (${missing.length})`}>
                {missing.length === 0 ? <Empty>✅ Tous les OC vivants ont leur salon.</Empty> : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>OC</th><th>Joueur</th><th>Clan</th><th>Rang</th><th>Créé</th><th /></tr></thead>
                      <tbody>
                        {missing.map((c) => (
                          <tr key={c.id}>
                            <td><strong>{c.name}</strong></td><td>{members.name(c.user_id)}</td><td>{CLAN_EMOJI[c.clan]} {c.clan}</td><td>{c.rank}</td><td className="muted">{relativeTime(c.created_at)}</td>
                            <td><button className="btn btn-small btn-primary" title="Vigie choisit la catégorie d'après le clan et le rang"
                              onClick={() => run({ label: `Salon de ${c.name}`, bot: 'vigie', action: 'fiche.create_sheet', payload: { entity_type: 'OC', entity_id: c.id } })}>Créer le salon</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="muted small">Si Vigie ne trouve pas la catégorie du clan et du rang, elle le dit ici : utilise alors <code>/fiche creer_salon</code> sur Discord en précisant la catégorie.</p>
              </Card>
              {lifecycle.some((l) => l.status === 'waiting_archive') && (
                <Card title="⏳ En salle d'attente">
                  <ul className="plain">{lifecycle.filter((l) => l.status === 'waiting_archive').map((l) => {
                    const c = characters.find((x) => x.id === l.entity_id)
                    return <li key={l.entity_id} className="row between"><strong>{c?.name ?? `OC #${l.entity_id}`}</strong><Badge tone="warn">depuis {relativeTime(l.waiting_since)}</Badge></li>
                  })}</ul>
                </Card>
              )}
            </div>
          )
        }}
      </Loaded>
    </>
  )
}

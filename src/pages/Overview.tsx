import { Link } from 'react-router-dom'
import { Badge, Card, Loaded, PageHeader, Stat } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CLANS, CLAN_EMOJI, relativeTime, rpDate, threadState } from '../lib/format'
import { useAsync } from '../lib/hooks'

const BOT_LABEL = { bubulle: 'Bubulle', ricochet: 'Ricochet', vigie: 'Vigie' } as const

export default function Overview() {
  const { guild, guildName } = useAuth()
  const state = useAsync(async () => {
    const [characters, npcs, threads, bots, calendar, jobs] = await Promise.all([
      api.characters(), api.npcs(), guild ? api.threads(guild) : Promise.resolve([]), api.botStatus(), api.calendar(), guild ? api.jobs(guild) : Promise.resolve([]),
    ])
    return { characters, npcs, threads, bots, calendar, jobs }
  }, [guild])

  return (
    <>
      <PageHeader title="Vue d'ensemble" subtitle={guildName} />
      <Loaded state={state}>
        {({ characters, npcs, threads, bots, calendar, jobs }) => {
          const alive = characters.filter((c) => !c.dead && !c.archived)
          const rp = rpDate(calendar)
          const noSheet = alive.filter((c) => !c.sheet_channel_id)
          const quiet = threads.filter((t) => threadState(t.last_message_at) !== 'active')
          const closing = threads.filter((t) => threadState(t.last_message_at) === 'closing')
          const failed = jobs.filter((j) => j.status === 'failed').slice(0, 3)
          const offline = bots.filter((b) => Date.now() - new Date(b.last_seen).getTime() > 3 * 60_000)
          const perClan = CLANS.map((c) => ({ clan: c, n: alive.filter((x) => x.clan === c).length }))
          const max = Math.max(1, ...perClan.map((p) => p.n))
          return (
            <div className="stack gap-lg">
              {(offline.length > 0 || closing.length > 0 || noSheet.length > 0) && (
                <div className="stack">
                  {offline.map((b) => <div key={b.bot} className="alert alert-warn">⚠️ <strong>{BOT_LABEL[b.bot]}</strong> ne donne plus signe de vie (vu {relativeTime(b.last_seen)}). Les demandes du site attendront son retour.</div>)}
                  {closing.length > 0 && <div className="alert alert-warn">🧵 <strong>{closing.length}</strong> fil(s) RP seront clôturés dans moins de 24 h. <Link to="/fils">Voir les fils</Link></div>}
                  {noSheet.length > 0 && <div className="alert alert-info">📂 <strong>{noSheet.length}</strong> OC vivant(s) sans salon de fiche. <Link to="/repertoire">Ouvrir le Répertoire</Link></div>}
                </div>
              )}
              <div className="grid stats">
                <Stat label="OC vivants" value={alive.length} tone="ok" />
                <Stat label="Disparus" value={alive.filter((c) => c.missing).length} tone="warn" />
                <Stat label="Morts" value={characters.filter((c) => c.dead).length} />
                <Stat label="PNJ" value={npcs.filter((n) => !n.dead).length} />
                <Stat label="Fils RP suivis" value={threads.length} hint={quiet.length ? `${quiet.length} silencieux` : 'tous actifs'} tone={quiet.length ? 'warn' : 'ok'} />
                <Stat label="Demandes en cours" value={jobs.filter((j) => j.status === 'pending' || j.status === 'running').length} />
              </div>
              <div className="grid two">
                <Card title="📅 Calendrier RP">
                  {rp ? (
                    <div className="rp-date">
                      <div className="rp-month">{rp.seasonEmoji} {rp.monthName}</div>
                      <div className="muted">{rp.seasonName} · An {rp.year}</div>
                      <div className="rp-week">Semaine <strong>{rp.week}/2</strong> · jour <strong>{rp.day}/14</strong></div>
                      <div className="progress"><span style={{ width: `${(rp.day / 14) * 100}%` }} /></div>
                    </div>
                  ) : <p className="muted">Le calendrier n'est pas démarré (ou en pause avant son départ).</p>}
                </Card>
                <Card title="🤖 Bots">
                  <div className="stack">
                    {(['bubulle', 'ricochet', 'vigie'] as const).map((b) => {
                      const s = bots.find((x) => x.bot === b)
                      const online = s && Date.now() - new Date(s.last_seen).getTime() <= 3 * 60_000
                      return <div key={b} className="row between"><span>{BOT_LABEL[b]}</span><Badge tone={online ? 'ok' : 'bad'}>{online ? 'en ligne' : s ? `hors ligne · ${relativeTime(s.last_seen)}` : 'jamais vu'}</Badge></div>
                    })}
                  </div>
                </Card>
              </div>
              <div className="grid two">
                <Card title="🐾 OC vivants par clan">
                  <div className="stack">
                    {perClan.map((p) => (
                      <div key={p.clan} className="bar-row"><span className="bar-label">{CLAN_EMOJI[p.clan]} {p.clan}</span><div className="progress"><span style={{ width: `${(p.n / max) * 100}%` }} /></div><strong>{p.n}</strong></div>
                    ))}
                  </div>
                </Card>
                <Card title="⚠️ Dernières demandes échouées" actions={<Link to="/bots" className="btn btn-small">Journal</Link>}>
                  {failed.length === 0 ? <p className="muted">Aucun échec récent. 🎉</p> : (
                    <div className="stack">{failed.map((j) => <div key={j.id}><strong>{j.action}</strong> <span className="muted">· {relativeTime(j.created_at)}</span><div className="muted small">{j.error}</div></div>)}</div>
                  )}
                </Card>
              </div>
            </div>
          )
        }}
      </Loaded>
    </>
  )
}

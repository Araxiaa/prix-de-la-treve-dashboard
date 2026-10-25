import { useState } from 'react'
import { GibierModal } from '../components/actions'
import { Badge, Card, Empty, Loaded, PageHeader, Stat } from '../components/ui'
import { api } from '../lib/api'
import { CLANS, CLAN_EMOJI, dateTime } from '../lib/format'
import { useAsync } from '../lib/hooks'

const MAIN = CLANS.slice(0, 3)

export default function Resources() {
  const state = useAsync(async () => {
    const [prey, herbarium, convalescences] = await Promise.all([api.prey(), api.herbarium(), api.convalescences()])
    return { prey, herbarium, convalescences }
  }, [])
  const [modal, setModal] = useState<null | { mode: 'add' | 'remove'; clan: string }>(null)
  return (
    <>
      <PageHeader title="Gibier & herbier" subtitle="Ricochet — réserves des clans et infirmerie" />
      <Loaded state={state}>
        {({ prey, herbarium, convalescences }) => (
          <div className="stack gap-lg">
            <div className="grid three">
              {MAIN.map((clan) => {
                const lots = prey.filter((p) => p.clan === clan)
                const total = lots.reduce((s, p) => s + p.portions, 0)
                const byName = new Map<string, number>()
                lots.forEach((p) => byName.set(p.prey_name, (byName.get(p.prey_name) ?? 0) + p.portions))
                return (
                  <Card key={clan} title={`${CLAN_EMOJI[clan]} ${clan}`}>
                    <Stat label="portions en réserve" value={total} tone={total === 0 ? 'bad' : 'ok'} />
                    <ul className="plain">{[...byName].map(([name, n]) => <li key={name} className="row between"><span>{name}</span><strong>×{n}</strong></li>)}</ul>
                    {byName.size === 0 && <p className="muted">La pile est vide.</p>}
                    <div className="row gap">
                      <button className="btn btn-small btn-primary" onClick={() => setModal({ mode: 'add', clan })}>＋ Ajouter</button>
                      <button className="btn btn-small" disabled={total === 0} onClick={() => setModal({ mode: 'remove', clan })}>− Retirer</button>
                    </div>
                  </Card>
                )
              })}
            </div>
            <div className="grid two">
              <Card title="🌿 Herbier">
                {herbarium.length === 0 ? <Empty>Aucune plante en réserve.</Empty> : MAIN.map((clan) => {
                  const lots = herbarium.filter((h) => h.inventory_owner === `clan:${clan}`)
                  if (!lots.length) return null
                  const byName = new Map<string, number>()
                  lots.forEach((h) => byName.set(h.plant_name, (byName.get(h.plant_name) ?? 0) + h.quantity))
                  return <div key={clan} className="stack-sm"><strong>{CLAN_EMOJI[clan]} {clan}</strong><div className="row gap wrap">{[...byName].map(([n, q]) => <Badge key={n} tone="info">{n} ×{q}</Badge>)}</div></div>
                })}
              </Card>
              <Card title="🏥 Infirmerie">
                {convalescences.length === 0 ? <Empty>L'infirmerie est vide.</Empty> : (
                  <ul className="plain">{convalescences.map((c) => (
                    <li key={c.character_id}><strong>{c.character_name}</strong> <span className="muted">· {c.clan}</span>
                      <div className="muted small">{c.reason} — soigné·e par {c.healer_name ?? '—'} · retour {dateTime(c.end_date)}</div></li>
                  ))}</ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </Loaded>
      {modal && <GibierModal mode={modal.mode} clan={modal.clan} onClose={() => setModal(null)} />}
    </>
  )
}

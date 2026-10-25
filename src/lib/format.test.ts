import { describe, expect, it } from 'vitest'
import { ageInLunes, describeReason, norm, rpDate, threadState } from './format'

const DAY = 86_400_000
const start = new Date('2026-01-02T20:00:00Z')
const cfg = { start_date: start.toISOString(), start_season_index: 0, start_month_in_season: 1, paused_at: null, paused_seconds: 0 }

describe('rpDate (mêmes résultats que les bots)', () => {
  it('20 jours après le départ : 2e lune de la mauvaise saison, jour 7, semaine 1', () => {
    const d = rpDate(cfg, new Date(start.getTime() + 20 * DAY))!
    expect(d.monthName).toBe('Lune Calme')
    expect(d.seasonName).toBe('Mauvaise saison')
    expect(d.day).toBe(7)
    expect(d.week).toBe(1)
    expect(d.year).toBe(1)
  })
  it('jour 8 = semaine 2 ; 14 jours = nouvelle lune', () => {
    expect(rpDate(cfg, new Date(start.getTime() + 7 * DAY))!.week).toBe(2)
    const d = rpDate(cfg, new Date(start.getTime() + 14 * DAY))!
    expect([d.day, d.monthName]).toEqual([1, 'Lune Calme'])
  })
  it("passe à l'année suivante après 12 lunes", () => {
    const d = rpDate(cfg, new Date(start.getTime() + 12 * 14 * DAY))!
    expect([d.year, d.monthName]).toEqual([2, 'Lune des Longues Nuits'])
  })
  it('la pause fige le calendrier', () => {
    const paused = { ...cfg, paused_at: new Date(start.getTime() + 20 * DAY).toISOString() }
    const later = rpDate(paused, new Date(start.getTime() + 200 * DAY))!
    expect([later.monthName, later.day]).toEqual(['Lune Calme', 7])
  })
  it('null avant le départ ou sans calendrier', () => {
    expect(rpDate(cfg, new Date(start.getTime() - DAY))).toBeNull()
    expect(rpDate(null)).toBeNull()
  })
})

describe('âges et fils', () => {
  it('âge = départ + jours // 14', () => {
    expect(ageInLunes(5, start.toISOString(), new Date(start.getTime() + 30 * DAY))).toBe(7)
    expect(ageInLunes(5, start.toISOString(), new Date(start.getTime() - DAY))).toBeNull()
  })
  it('états de fil : 7 j rappel, 13 j bientôt clôturé', () => {
    const now = new Date('2026-06-01T12:00:00Z')
    const ago = (d: number) => new Date(now.getTime() - d * DAY).toISOString()
    expect([threadState(ago(1), now), threadState(ago(8), now), threadState(ago(13.5), now)]).toEqual(['active', 'quiet', 'closing'])
  })
})

describe('texte', () => {
  it("découpe les raisons balisées de l'historique", () => {
    expect(describeReason('[Baptême : A → B] Cérémonie')).toEqual({ tag: 'Baptême : A → B', text: 'Cérémonie' })
    expect(describeReason('Combat')).toEqual({ tag: '', text: 'Combat' })
    expect(describeReason(null)).toEqual({ tag: '', text: '' })
  })
  it('recherche insensible aux accents et à la casse', () => {
    expect(norm('Étoile')).toBe('etoile')
  })
})

import { cumulativeXp, levelFromXp } from './format'
describe('niveaux (même courbe que Bubulle)', () => {
  it('seuils connus', () => {
    expect(cumulativeXp(5)).toBe(1150)
    expect(cumulativeXp(10)).toBe(4675)
    expect(cumulativeXp(0)).toBe(0)
  })
  it('niveau et progression', () => {
    expect(levelFromXp(0)).toEqual({ level: 0, into: 0, needed: 100 })
    expect(levelFromXp(1150).level).toBe(5)
    expect(levelFromXp(1149).level).toBe(4)
    const p = levelFromXp(1200)
    expect([p.level, p.into]).toEqual([5, 50])
  })
})

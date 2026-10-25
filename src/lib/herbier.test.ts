import { describe, expect, it } from 'vitest'
import { clanStock, effectLabel, isSoon } from './herbier'
import { PLANTS } from './plants'
import type { HerbLot } from './types'

const lot = (owner: string, plant: string, quantity: number, expires_at: string, id = 1): HerbLot => ({ id, inventory_owner: owner, plant_name: plant, quantity, expires_at })

describe('clanStock', () => {
  const today = '2026-10-25'
  const lots = [
    lot('clan:Clan du Vent', 'Bardane', 3, '2026-10-27'), lot('clan:Clan du Vent', 'Bardane', 4, '2026-11-14'),
    lot('Clan du Vent', 'Prêle', 8, '2026-10-15'),                       // ancienne clé + périmée
    lot('clan:Clan du Vent', 'Plante Mystère', 2, '2026-11-01'),
    lot('clan:Solitaires', 'Cataire', 5, '2026-11-20'),
  ]
  const r = clanStock(lots, 'Clan du Vent', today)
  it('liste TOUTES les plantes du codex, même à 0', () => {
    expect(r.stock).toHaveLength(PLANTS.length)
    expect(r.stock.find((s) => s.name === 'Cataire')?.qty).toBe(0)
  })
  it('additionne les lots non périmés et repère le plus proche', () => {
    const b = r.stock.find((s) => s.name === 'Bardane')!
    expect(b.qty).toBe(7); expect(b.lots).toHaveLength(2); expect(b.nextDays).toBe(2); expect(isSoon(b)).toBe(true)
  })
  it('nomme les périmées (y compris sous l\'ancienne clé)', () => expect(r.expired).toEqual([{ name: 'Prêle', qty: 8, since: '2026-10-15' }]))
  it('montre les plantes hors codex et ne mélange pas les clans', () => {
    expect(r.unknown.map((u) => u.name)).toEqual(['Plante Mystère'])
    expect(r.units).toBe(7 + 2)
  })
})

describe('effectLabel', () => {
  it('décrit soin, poison et absence d\'effet', () => {
    expect(effectLabel(PLANTS.find((p) => p.name === 'Cataire')!)).toBe('+4 PV')
    expect(effectLabel(PLANTS.find((p) => p.name === 'Aconit')!)).toMatch(/poison/)
    expect(effectLabel(PLANTS.find((p) => p.name === 'Mousse')!)).toBe('sans effet')
  })
})

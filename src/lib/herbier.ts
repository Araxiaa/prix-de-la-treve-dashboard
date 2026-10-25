import { PLANTS, type Plant } from './plants'
import type { HerbLot } from './types'

export const SOON_DAYS = 3

export interface PlantStock { plant: Plant | null; name: string; qty: number; lots: { qty: number; expires: string }[]; nextDays: number | null }
export interface ExpiredStock { name: string; qty: number; since: string }

const daysBetween = (iso: string, today: string) => Math.round((Date.parse(iso.slice(0, 10)) - Date.parse(today)) / 86_400_000)

/** Stock d'un clan : chaque plante du codex (même à 0), plantes inconnues du codex, et lots périmés nommés. Rien n'est caché. */
export function clanStock(lots: HerbLot[], clan: string, today: string): { stock: PlantStock[]; unknown: PlantStock[]; expired: ExpiredStock[]; units: number } {
  const mine = lots.filter((l) => l.inventory_owner === `clan:${clan}` || l.inventory_owner === clan)   // anciennes clés sans « clan: » incluses
  const live = new Map<string, PlantStock>()
  const dead = new Map<string, ExpiredStock>()
  for (const l of [...mine].sort((a, b) => a.expires_at.localeCompare(b.expires_at))) {
    const days = daysBetween(l.expires_at, today)
    if (days < 0) {
      const e = dead.get(l.plant_name) ?? { name: l.plant_name, qty: 0, since: l.expires_at.slice(0, 10) }
      e.qty += l.quantity; dead.set(l.plant_name, e)
    } else {
      const s = live.get(l.plant_name) ?? { plant: PLANTS.find((p) => p.name === l.plant_name) ?? null, name: l.plant_name, qty: 0, lots: [], nextDays: days }
      s.qty += l.quantity; s.lots.push({ qty: l.quantity, expires: l.expires_at.slice(0, 10) }); live.set(l.plant_name, s)
    }
  }
  const stock = PLANTS.map((p) => live.get(p.name) ?? { plant: p, name: p.name, qty: 0, lots: [], nextDays: null })
  const unknown = [...live.values()].filter((s) => !s.plant)
  return { stock, unknown, expired: [...dead.values()], units: [...live.values()].reduce((n, s) => n + s.qty, 0) }
}

export const isSoon = (s: PlantStock) => s.nextDays !== null && s.nextDays <= SOON_DAYS && s.plant?.category !== 'toxique'

export function effectLabel(p: Plant | null): string {
  if (!p || p.effect === null) return 'sans effet'
  return p.effect > 0 ? `+${p.effect} PV` : `${p.effect} PV (poison)`
}

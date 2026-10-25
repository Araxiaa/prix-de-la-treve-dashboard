import type { CalendarConfig } from './types'

export const DAYS_PER_LUNE = 14
export const CLANS = ['Clan du Tonnerre', 'Clan du Vent', "Clan de l'Ombre", 'Solitaires', 'Domestiques'] as const
export const RANKS = ['Chef', 'Lieutenant', 'Guerrier', 'Reine', 'Guérisseur', 'Ancien', 'Apprenti', 'Chaton'] as const
export const DESTINATIONS = ['Clan des Étoiles', 'Forêt Sombre', 'Purgatoire'] as const
export const CLAN_EMOJI: Record<string, string> = { 'Clan du Tonnerre': '⚡', 'Clan du Vent': '💨', "Clan de l'Ombre": '🌑', Solitaires: '🐈', Domestiques: '🏠' }

const SEASONS = [
  { name: 'Mauvaise saison', emoji: '❄️', months: ['Lune des Longues Nuits', 'Lune Calme', 'Lune des Neiges'] },
  { name: 'Saison des feuilles nouvelles', emoji: '🌱', months: ['Lune des Tempêtes', 'Lune des Grenouilles', 'Lune des Fleurs'] },
  { name: 'Saison des feuilles vertes', emoji: '☀️', months: ['Lune Rose', 'Lune du Tonnerre', 'Lune des Herbes'] },
  { name: 'Saison des feuilles mortes', emoji: '🍂', months: ['Lune de la Cueillette', 'Lune de la Chasse', 'Lune des Foyers'] },
]

export interface RpDate { year: number; seasonName: string; seasonEmoji: string; monthName: string; monthInSeason: number; week: 1 | 2; day: number }

/** Date RP — même calcul que le calendrier des bots (1 lune = 14 jours, tient compte de la pause). */
export function rpDate(cfg: CalendarConfig | null, now: Date = new Date()): RpDate | null {
  if (!cfg) return null
  const start = new Date(cfg.start_date).getTime()
  let effective = cfg.paused_at ? new Date(cfg.paused_at).getTime() : now.getTime()
  effective -= (cfg.paused_seconds || 0) * 1000
  if (effective < start) return null
  const delta = Math.floor((effective - start) / 86_400_000)
  const monthsPassed = Math.floor(delta / DAYS_PER_LUNE)
  const day = (delta % DAYS_PER_LUNE) + 1
  const current = cfg.start_season_index * 3 + (cfg.start_month_in_season - 1) + monthsPassed
  const monthInYear = current % 12
  const season = SEASONS[Math.floor(monthInYear / 3)]
  const monthInSeason = (monthInYear % 3) + 1
  return {
    year: Math.floor(current / 12) + 1, seasonName: season.name, seasonEmoji: season.emoji,
    monthName: season.months[monthInSeason - 1], monthInSeason, week: day <= 7 ? 1 : 2, day,
  }
}

/** Âge en lunes (âge de départ + jours écoulés // 14), null si le suivi n'a pas commencé. */
export function ageInLunes(initial: number, agingStart: string, now: Date = new Date()): number | null {
  const start = new Date(agingStart).getTime()
  if (now.getTime() < start) return null
  return (initial || 0) + Math.floor((now.getTime() - start) / 86_400_000 / DAYS_PER_LUNE)
}

export type ThreadState = 'active' | 'quiet' | 'closing'
/** Même seuils que Ricochet : rappel à 7 jours, clôture à 14 jours (« bientôt clôturé » dès 13). */
export function threadState(lastIso: string, now: Date = new Date()): ThreadState {
  const days = (now.getTime() - new Date(lastIso).getTime()) / 86_400_000
  return days >= 13 ? 'closing' : days >= 7 ? 'quiet' : 'active'
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
export function relativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '—'
  const diff = (new Date(iso).getTime() - now.getTime()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return "à l'instant"
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86_400 * 60) return rtf.format(Math.round(diff / 86_400), 'day')
  return rtf.format(Math.round(diff / (86_400 * 30)), 'month')
}

export const dateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export const initials = (name: string) => name.trim().slice(0, 2).toUpperCase()

/** Texte lisible pour une raison d'historique balisée « [Baptême : A → B] raison ». */
export function describeReason(reason: string | null): { tag: string; text: string } {
  const m = /^\[([^\]]+)\]\s*(.*)$/s.exec(reason ?? '')
  return m ? { tag: m[1].trim(), text: m[2].trim() } : { tag: '', text: reason ?? '' }
}

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── Niveaux : même courbe que Bubulle (cogs/levels.py) ──
export const xpToNext = (n: number) => 5 * n * n + 50 * n + 100
/** XP total nécessaire pour ATTEINDRE un niveau (niv. 5 = 1 150, niv. 10 = 4 675). */
export const cumulativeXp = (level: number) => {
  const n = Math.max(0, level)
  return Math.floor((5 * (n - 1) * n * (2 * n - 1)) / 6) + (50 * n * (n - 1)) / 2 + 100 * n
}
export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 0
  while (level < 1000 && cumulativeXp(level + 1) <= xp) level++
  return { level, into: Math.max(0, xp) - cumulativeXp(level), needed: xpToNext(level) }
}

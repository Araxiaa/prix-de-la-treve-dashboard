import type { CommandDef, CommandParam } from './types'

export type SuggestKind =
  | 'char' | 'char-active' | 'char-alive' | 'char-present' | 'char-missing' | 'char-dead'
  | 'npc' | 'both' | 'faction' | 'rank' | 'handicap' | 'clan' | 'command' | 'role' | null

/** Quelle liste proposer pour un paramètre texte à saisie semi-automatique (le nom de la fonction vient du bot). */
export function suggestionKind(autocomplete: string | null): SuggestKind {
  switch (autocomplete) {
    case 'char_autocomplete': case 'perso_autocomplete': case 'sibling_autocomplete': return 'char'
    case 'active_char_autocomplete': return 'char-active'
    case 'ac_vivant': return 'char-alive'
    case 'ac_present': return 'char-present'
    case 'ac_disparu': return 'char-missing'
    case 'ac_mort': return 'char-dead'
    case 'npc_autocomplete': return 'npc'
    case 'universal_autocomplete': return 'both'
    case 'faction_autocomplete': return 'faction'
    case 'faction_rank_autocomplete': case 'edit_rank_autocomplete': return 'rank'
    case 'handicap_autocomplete': case 'owned_handicap_autocomplete': return 'handicap'
    case 'clan_name_autocomplete': return 'clan'
    case 'command_autocomplete': return 'command'
    case 'role_autocomplete': return 'role'
    default: return null
  }
}

/** Message d'erreur pour une valeur saisie, ou null si elle convient. Vide = ok (l'obligation est vérifiée à part). */
export function validateParam(p: CommandParam, raw: string): string | null {
  const v = raw.trim()
  if (v === '') return null
  if (p.type === 'integer' || p.type === 'number') {
    const n = Number(v.replace(',', '.'))
    if (!Number.isFinite(n)) return 'Nombre attendu.'
    if (p.type === 'integer' && !Number.isInteger(n)) return 'Nombre entier attendu.'
    if (p.min !== null && n < p.min) return `Minimum : ${p.min}.`
    if (p.max !== null && n > p.max) return `Maximum : ${p.max}.`
    return null
  }
  if (p.type === 'string') {
    if (p.min_length !== null && v.length < p.min_length) return `Au moins ${p.min_length} caractère(s).`
    if (p.max_length !== null && v.length > p.max_length) return `Au plus ${p.max_length} caractères.`
    if (p.name === 'duree' && !/^\d+\s*(m|min|h|j|d)$/i.test(v)) return 'Durée du type 30m, 2h ou 1j.'
  }
  return null
}

export function missingRequired(command: CommandDef, values: Record<string, string>, channel: string): boolean {
  return command.params.some((p) => p.required && !(values[p.name] ?? '').trim()) || (command.needs_channel && !channel)
}

export function formErrors(command: CommandDef, values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of command.params) {
    const e = validateParam(p, values[p.name] ?? '')
    if (e) out[p.name] = e
  }
  return out
}

/** Valeurs prêtes à envoyer au bot : les champs vides sont omis, les nombres et booléens convertis. */
export function buildArgs(command: CommandDef, values: Record<string, string>): Record<string, string | number | boolean> {
  const args: Record<string, string | number | boolean> = {}
  for (const p of command.params) {
    const raw = (values[p.name] ?? '').trim()
    if (raw === '') continue
    args[p.name] = p.type === 'integer' || p.type === 'number' ? Number(raw.replace(',', '.')) : p.type === 'boolean' ? raw === 'true' : raw
  }
  return args
}

/** Rend les valeurs d'une exécution passée (nombres, booléens) en texte, pour préremplir le formulaire. */
export function valuesFromArgs(args: Record<string, unknown> | undefined): Record<string, string> {
  return Object.fromEntries(Object.entries(args ?? {}).map(([k, v]) => [k, String(v)]))
}

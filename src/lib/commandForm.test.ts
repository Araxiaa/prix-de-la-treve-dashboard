import { describe, expect, it } from 'vitest'
import { buildArgs, formErrors, missingRequired, suggestionKind, validateParam, valuesFromArgs } from './commandForm'
import type { CommandDef, CommandParam } from './types'

const P = (o: Partial<CommandParam>): CommandParam => ({
  name: 'x', type: 'string', required: false, description: '', min: null, max: null, min_length: null, max_length: null, choices: [], autocomplete: null, ...o,
})
const cmd = (params: CommandParam[], needs_channel = false): CommandDef =>
  ({ bot: 'bubulle', name: 't', description: '', level: 'staff', grp: 't', params, needs_channel, note: null })

describe('validateParam', () => {
  it('accepte le vide (l\'obligation est contrôlée ailleurs)', () => expect(validateParam(P({ type: 'integer', min: 1 }), '  ')).toBeNull())
  it('contrôle entier, bornes et nombre', () => {
    const p = P({ type: 'integer', min: 1, max: 100 })
    expect(validateParam(p, 'abc')).toMatch(/Nombre/)
    expect(validateParam(p, '1.5')).toMatch(/entier/)
    expect(validateParam(p, '0')).toMatch(/Minimum/)
    expect(validateParam(p, '101')).toMatch(/Maximum/)
    expect(validateParam(p, '50')).toBeNull()
  })
  it('contrôle la longueur du texte', () => {
    expect(validateParam(P({ max_length: 3 }), 'abcd')).toMatch(/Au plus/)
    expect(validateParam(P({ min_length: 3 }), 'ab')).toMatch(/Au moins/)
  })
  it('contrôle le format d\'une durée', () => {
    const p = P({ name: 'duree' })
    expect(validateParam(p, '30m')).toBeNull()
    expect(validateParam(p, '2 h')).toBeNull()
    expect(validateParam(p, '1h 30m')).toMatch(/Durée/)
    expect(validateParam(p, 'beaucoup')).toMatch(/Durée/)
  })
})

describe('formulaire', () => {
  const c = cmd([P({ name: 'perso', required: true }), P({ name: 'montant', type: 'integer', required: true }), P({ name: 'ok', type: 'boolean' }), P({ name: 'raison' })], true)
  it('détecte les champs obligatoires manquants (et le salon)', () => {
    expect(missingRequired(c, { perso: 'A', montant: '5' }, '')).toBe(true)
    expect(missingRequired(c, { perso: 'A', montant: '5' }, '42')).toBe(false)
    expect(missingRequired(c, { perso: 'A' }, '42')).toBe(true)
  })
  it('construit les arguments typés, sans les champs vides', () => {
    expect(buildArgs(c, { perso: ' Nuage ', montant: '5', ok: 'true', raison: '' })).toEqual({ perso: 'Nuage', montant: 5, ok: true })
  })
  it('liste les erreurs par champ', () => expect(formErrors(c, { montant: 'x' })).toHaveProperty('montant'))
  it('réaffiche des arguments passés', () => expect(valuesFromArgs({ montant: 5, ok: false })).toEqual({ montant: '5', ok: 'false' }))
})

describe('suggestionKind', () => {
  it('associe les saisies semi-automatiques du bot aux listes du site', () => {
    expect(suggestionKind('char_autocomplete')).toBe('char')
    expect(suggestionKind('ac_mort')).toBe('char-dead')
    expect(suggestionKind('npc_autocomplete')).toBe('npc')
    expect(suggestionKind('inconnue')).toBeNull()
    expect(suggestionKind(null)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { quoteBigInts } from './bigint'

describe('quoteBigInts', () => {
  it('conserve exactement un identifiant Discord (sans arrondi)', () => {
    const raw = '[{"user_id":626101487185166347,"hp":50}]'
    const parsed = JSON.parse(quoteBigInts(raw))
    expect(parsed[0].user_id).toBe('626101487185166347')   // JSON.parse brut donnerait 626101487185166300
    expect(parsed[0].hp).toBe(50)
    expect(String(JSON.parse(raw)[0].user_id)).not.toBe('626101487185166347')   // l'analyse brute arrondit
  })
  it('ne touche pas aux petits nombres, décimaux et exposants', () => {
    const parsed = JSON.parse(quoteBigInts('{"a":1,"b":-12,"c":3.14,"d":1e5,"e":123456789012345}'))
    expect(parsed).toEqual({ a: 1, b: -12, c: 3.14, d: 1e5, e: 123456789012345 })
  })
  it('ne modifie jamais un nombre situé DANS un texte', () => {
    const text = 'Voir le salon 1234567890123456789, puis "1234567890123456789"'
    const raw = `{"reason":${JSON.stringify(text)},"id":1234567890123456789}`   // JSON écrit à la main : JS arrondirait déjà le nombre
    const parsed = JSON.parse(quoteBigInts(raw))
    expect(parsed.reason).toBe(text)
    expect(parsed.id).toBe('1234567890123456789')
  })
  it('gère les guillemets échappés dans les textes', () => {
    const payload = `{"s":${JSON.stringify('il a dit "123456789012345678" et \\ fin')},"n":987654321098765432}`
    const parsed = JSON.parse(quoteBigInts(payload))
    expect(parsed.s).toBe('il a dit "123456789012345678" et \\ fin')
    expect(parsed.n).toBe('987654321098765432')
  })
  it('gère les identifiants négatifs, les tableaux et les null', () => {
    const parsed = JSON.parse(quoteBigInts('{"ids":[1111111111111111111,2222222222222222222],"x":null,"y":-3333333333333333333}'))
    expect(parsed).toEqual({ ids: ['1111111111111111111', '2222222222222222222'], x: null, y: '-3333333333333333333' })
  })
})

/**
 * Les identifiants Discord (18-19 chiffres) dépassent la précision des nombres JavaScript (2^53) :
 * `JSON.parse` les arrondirait silencieusement et le site agirait sur le MAUVAIS serveur ou joueur.
 * Cette fonction met entre guillemets tout entier de 16 chiffres ou plus AVANT l'analyse du JSON, en
 * respectant les chaînes de caractères (un nombre à l'intérieur d'un texte n'est jamais modifié).
 * Tous les identifiants sont donc manipulés comme du texte dans l'application.
 */
export function quoteBigInts(json: string): string {
  let out = ''
  let i = 0
  const n = json.length
  while (i < n) {
    const c = json[i]
    if (c === '"') {                       // chaîne : on la recopie telle quelle
      let j = i + 1
      while (j < n && json[j] !== '"') j += json[j] === '\\' ? 2 : 1
      out += json.slice(i, j + 1)
      i = j + 1
    } else if (c === '-' || (c >= '0' && c <= '9')) {   // nombre
      let j = i + 1
      while (j < n && /[0-9.eE+\-]/.test(json[j])) j++
      const token = json.slice(i, j)
      out += /^-?\d{16,}$/.test(token) ? `"${token}"` : token
      i = j
    } else {
      out += c
      i++
    }
  }
  return out
}

/** `fetch` qui renvoie les entiers géants comme du texte (à donner au client Supabase). */
export const safeFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init)
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('json')) return res
  const body = quoteBigInts(await res.text())
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers })
}

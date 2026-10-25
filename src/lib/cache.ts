/** Mémorise le résultat d'un chargement pendant `ttlMs` (et partage les chargements simultanés).
 * Sert aux listes qui changent peu (membres, salons, rôles, commandes) : on ne les retélécharge pas à chaque demande terminée. */
const store = new Map<string, { at: number; value: Promise<unknown> }>()

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>
  const value = load()
  store.set(key, { at: Date.now(), value })
  value.catch(() => store.delete(key))   // un échec n'est jamais mémorisé
  return value
}

export function clearCache(prefix = ''): void {
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k)
}

import { createClient } from '@supabase/supabase-js'
import { safeFetch } from './bigint'

/** Mode « démo » (`npm run demo`) : fausses données, aucune connexion — pour prévisualiser l'interface. Jamais activé en production. */
export const DEMO = import.meta.env.MODE === 'demo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
if (!DEMO && (!url || !key)) {
  throw new Error('Configuration manquante : copie .env.example vers .env et renseigne VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.')
}

// Clé PUBLIQUE uniquement. Toute la sécurité repose sur les règles RLS de la base (voir README).
export const supabase = createClient(url ?? 'http://localhost', key ?? 'demo', {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  global: { fetch: safeFetch },     // identifiants Discord lus comme du texte (sinon arrondis par JavaScript)
})

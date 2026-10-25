// Données fictives pour `npm run demo` (prévisualisation de l'interface sans connexion). Jamais incluses dans le site publié.
import type {
  Access, ActionDef, BotName, ChannelRow, CommandDef, RoleRow, BotStatus, CalendarConfig, Character, Convalescence, HerbLot, HpEntry, Job, Lifecycle, Member, Npc, NpcEvent,
  PreyLot, Sanction, Thread, XpRow,
} from './types'

const G1 = '111111111111111111'
const G2 = '222222222222222222'
const ago = (days: number, hours = 0) => new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString()
const ahead = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

const access: Access[] = [
  { discord_id: '1', guild_id: G1, guild_name: 'Le Prix de la Trêve', level: 'admin', display_name: 'Cheffe Démo', avatar_url: null },
  { discord_id: '1', guild_id: G2, guild_name: 'Répertoire Fiche', level: 'staff', display_name: 'Cheffe Démo', avatar_url: null },
]

const names = ['Etoile', 'Nuage', 'Brume', 'Cendre', 'Faucon', 'Aube', 'Ronce', 'Pluie', 'Orage', 'Lierre', 'Mousse', 'Sorbier']
const clans = ['Clan du Vent', 'Clan du Tonnerre', "Clan de l'Ombre", 'Solitaires']
const ranks = ['Chef', 'Guerrier', 'Guérisseur', 'Apprenti', 'Chaton', 'Reine', 'Ancien', 'Lieutenant']
const characters: Character[] = names.map((name, i) => ({
  id: i + 1, user_id: String(100000000000000000n + BigInt(i * 7)), name, clan: clans[i % clans.length], rank: ranks[i % ranks.length],
  gender: i % 2 ? 'Mâle' : 'Femelle', prefix: name.slice(0, 3).toLowerCase(), hp_current: i === 3 ? 12 : 50, hp_max: i % 8 === 4 ? 10 : 50,
  lives: i === 0 ? 9 : 1, initial_age_lunes: 6 + i * 4, aging_start_date: ago(10 + i * 3), sheet_channel_id: i % 3 === 2 ? null : String(900000000000000000n + BigInt(i)),
  sheet_guild_id: i % 3 === 2 ? null : G2, last_activity: ago(i % 5 === 0 ? 40 : i), dead: i === 9, missing: i === 7, archived: false,
  afterlife: i === 9 ? 'Clan des Étoiles' : null, created_at: ago(120 - i * 5),
}))
const npcs: Npc[] = ['Vieux Tilleul', 'Jeune Pousse', 'Veilleur', 'Grande Branche', 'Petite Feuille'].map((name, i) => ({
  id: i + 1, name, clan: clans[i % 3], rank: ['Ancien', 'Apprenti', 'Guerrier', 'Chef', 'Chaton'][i], gender: i % 2 ? 'Mâle' : 'Femelle', prefix: null,
  initial_age_lunes: 4 + i * 20, aging_start_date: ago(30), sheet_channel_id: null, sheet_guild_id: null, dead: i === 3, missing: false, afterlife: null, created_at: ago(200),
}))
const members: Member[] = [...characters.map((c) => c.user_id), String(555555555555555555n)].map((id, i) => ({
  guild_id: G1, user_id: id, display_name: ['Mélodie', 'Thomas', 'Léa', 'Karim', 'Sasha', 'Inès', 'Yanis', 'Camille', 'Noé', 'Lou', 'Eliott', 'Maëlys', 'Modo Démo'][i % 13], avatar_url: null,
}))
const skills = { Combat: 60, Chasse: 40, Soin: 20, Discrétion: 50, Pistage: 45, Agilité: 55 }
const handicaps = [{ handicap_name: 'Myope', origin: 'Naissance' }]
const hpHistory: HpEntry[] = [
  { id: 1, change: -8, new_hp: 42, reason: '[Combat] Attaque de Nuage', staff_id: null, timestamp: ago(1) },
  { id: 2, change: 0, new_hp: 50, reason: '[Baptême : Petitnuage → Nuage] Cérémonie', staff_id: '1', timestamp: ago(5) },
  { id: 3, change: 5, new_hp: 50, reason: '[Soin] Soin : Cataire par Brume', staff_id: null, timestamp: ago(6) },
  { id: 4, change: 0, new_hp: 25, reason: '[Rang : Apprenti → Guerrier] Baptême', staff_id: '1', timestamp: ago(5) },
]
const npcEvents: NpcEvent[] = [{ id: 1, kind: 'Baptême', reason: 'Jeune → Jeunepatte', staff_id: '1', created_at: ago(9) }, { id: 2, kind: 'Rang', reason: 'Chaton → Apprenti', staff_id: '1', created_at: ago(9) }]
const threads: Thread[] = [
  ['Une nuit agitée — Etoile & Nuage', 'Etoile, Nuage', 0.2], ['Chasse au crépuscule', 'Brume', 3], ['Rassemblement', 'Cendre, Faucon, Aube', 8], ['Messager perdu', 'Ronce', 13.5], ['Veillée des anciens', 'Vieux Tilleul', 1],
].map(([title, names, days], i) => ({
  thread_id: String(700000000000000000n + BigInt(i)), channel_id: '800000000000000001', creator_id: characters[i].user_id, title: `🎬 ${title}`,
  prefixes_oc: String(names), last_message_at: ago(Number(days)), relance_faite: Number(days) > 7, guild_id: G1, created_at: ago(Number(days) + 4),
}))
const prey: PreyLot[] = clans.slice(0, 3).flatMap((clan, i) => [
  { id: i * 2 + 1, clan, prey_name: 'Campagnol', portions: 6 + i, expires_at: ahead(3) }, { id: i * 2 + 2, clan, prey_name: 'Mulot', portions: 4, expires_at: ahead(1) },
])
const herbarium: HerbLot[] = [
  { id: 1, inventory_owner: 'clan:Clan du Vent', plant_name: 'Cataire', quantity: 6, expires_at: ahead(5) },
  { id: 2, inventory_owner: 'clan:Clan du Vent', plant_name: 'Bardane', quantity: 3, expires_at: ahead(2) },
  { id: 3, inventory_owner: 'clan:Clan du Tonnerre', plant_name: 'Souci', quantity: 9, expires_at: ahead(7) },
]
const convalescences: Convalescence[] = [{ character_id: 4, character_name: 'Cendre', clan: "Clan de l'Ombre", reason: 'Griffure profonde', healer_name: 'Brume', end_date: new Date(Date.now() + 5 * 86_400_000).toISOString() }]
const sanctions: Sanction[] = [
  { id: 12, guild_id: G1, user_id: members[3].user_id, moderator_id: members[12].user_id, kind: 'avertissement', reason: 'Spam dans #général', active: true, created_at: ago(3) },
  { id: 11, guild_id: G1, user_id: members[5].user_id, moderator_id: members[12].user_id, kind: 'mute', reason: 'Insultes', active: false, created_at: ago(30) },
]
const xp: XpRow[] = members.slice(0, 10).map((m, i) => ({ user_id: m.user_id, guild_id: G1, text_xp: 9000 - i * 700, voice_xp: 1200 - i * 90, bonus_xp: i === 0 ? 500 : 0 }))
const lifecycle: Lifecycle[] = [
  { entity_type: 'character', entity_id: 1, status: 'active', repertoire_channel_id: '1', waiting_since: null, archive_channel_id: null },
  { entity_type: 'character', entity_id: 10, status: 'waiting_archive', repertoire_channel_id: '2', waiting_since: ago(16), archive_channel_id: null },
  { entity_type: 'character', entity_id: 5, status: 'archived', repertoire_channel_id: null, waiting_since: null, archive_channel_id: '3' },
]
const calendar: CalendarConfig = { start_date: ago(34), start_season_index: 0, start_month_in_season: 1, paused_at: null, paused_seconds: 0 }
const botStatus: BotStatus[] = [
  { bot: 'bubulle', last_seen: ago(0, 0.01), info: { guilds: 2 } }, { bot: 'ricochet', last_seen: ago(0, 0.02), info: { guilds: 2 } }, { bot: 'vigie', last_seen: ago(0, 2), info: { guilds: 1 } },
]
const actions: ActionDef[] = [
  { bot: 'bubulle', action: 'character.bapteme', label: 'Baptiser un OC', min_level: 'staff' },
  { bot: 'vigie', action: 'access.apply', label: "Appliquer le rôle d'accès aux salons de fiche", min_level: 'admin' },
]
const jobs: Job[] = [
  { id: 3, bot: 'bubulle', action: 'character.bapteme', guild_id: G1, payload: { character_id: 2 }, status: 'done', result: { message: 'Baptême effectué : Nuage.' }, error: null, requested_by: '1', requested_name: 'Cheffe Démo', created_at: ago(1), started_at: ago(1), finished_at: ago(1) },
  { id: 2, bot: 'ricochet', action: 'gibier.add', guild_id: G1, payload: {}, status: 'failed', result: null, error: 'Stock insuffisant.', requested_by: '1', requested_name: 'Cheffe Démo', created_at: ago(2), started_at: ago(2), finished_at: ago(2) },
]

let nextId = 100
const pending = new Map<number, Job>()

const P = (name: string, type: string, required: boolean, description: string, extra: Record<string, unknown> = {}) =>
  ({ name, type, required, description, min: null, max: null, min_length: null, max_length: null, choices: [], autocomplete: null, ...extra }) as CommandDef['params'][number]
const commands: CommandDef[] = [
  { bot: 'bubulle', name: 'mod avertir', description: 'Avertir un membre', level: 'staff', grp: 'mod', needs_channel: false, note: null, params: [P('membre', 'user', true, 'Le membre'), P('raison', 'string', false, 'Motif')] },
  { bot: 'bubulle', name: 'mod mute', description: 'Rendre muet un membre', level: 'staff', grp: 'mod', needs_channel: false, note: null, params: [P('membre', 'user', true, 'Le membre'), P('duree', 'string', true, 'Ex. 30m, 2h, 1j'), P('raison', 'string', false, 'Motif')] },
  { bot: 'bubulle', name: 'mod bannir', description: '[ADMIN] Bannir un membre', level: 'admin', grp: 'mod', needs_channel: false, note: null, params: [P('membre', 'user', true, 'Le membre'), P('raison', 'string', false, 'Motif')] },
  { bot: 'bubulle', name: 'mod purger', description: 'Supprimer des messages dans un salon', level: 'staff', grp: 'mod', needs_channel: true, note: null, params: [P('nombre', 'integer', true, 'Nombre de messages', { min: 1, max: 100 })] },
  { bot: 'bubulle', name: 'character soigner', description: 'Soigner un personnage', level: 'staff', grp: 'character', needs_channel: false, note: null, params: [P('perso', 'string', true, 'Personnage', { autocomplete: 'perso' }), P('montant', 'integer', true, 'PV rendus', { min: 1, max: 100 }), P('raison', 'string', false, 'Motif')] },
  { bot: 'bubulle', name: 'calendar demarrer', description: '[ADMIN] Démarrer le calendrier', level: 'admin', grp: 'calendar', needs_channel: false, note: null, params: [P('saison', 'string', true, 'Saison', { choices: [{ name: 'Printemps', value: 'printemps' }, { name: 'Été', value: 'ete' }] })] },
]
const channels: ChannelRow[] = [{ channel_id: '1', name: 'général', kind: 'text', category: 'Hors-RP', position: 1 }, { channel_id: '2', name: 'annonces', kind: 'text', category: 'Hors-RP', position: 2 }]
const roles: RoleRow[] = [{ role_id: '10', name: 'Staff', color: 0x3498db, position: 10 }, { role_id: '11', name: 'Membre', color: 0, position: 1 }]
export default {
  commands, channels, roles, skills, handicaps, access, actions, members, characters, npcs, hpHistory, npcEvents, threads, prey, herbarium, convalescences, sanctions, xp, lifecycle, calendar, botStatus, jobs,
  async enqueue(bot: BotName, action: string, guild: string, payload: Record<string, unknown>): Promise<number> {
    const id = nextId++
    pending.set(id, { id, bot, action, guild_id: guild, payload, status: 'pending', result: null, error: null, requested_by: '1', requested_name: 'Cheffe Démo', created_at: new Date().toISOString(), started_at: null, finished_at: null })
    return id
  },
  async finishJob(id: number): Promise<Job | null> {
    const job = pending.get(id)
    if (!job) return null
    if (job.status === 'pending') return (job.status = 'running'), { ...job }
    job.status = 'done'
    job.result = { message: `Démo : « ${job.action} » aurait été exécutée par ${job.bot}.` }
    job.finished_at = new Date().toISOString()
    return { ...job }
  },
}

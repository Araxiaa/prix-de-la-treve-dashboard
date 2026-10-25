import { cached } from './cache'
import { DEMO, supabase } from './supabase'
import type {
  Access, ActionDef, ChannelRow, CommandDef, RoleRow, BotName, CharHandicap, Skills, BotStatus, CalendarConfig, Character, Convalescence, HerbLot, HpEntry, Job, Lifecycle, Member,
  Npc, NpcEvent, PreyLot, Sanction, Thread, XpRow,
} from './types'

const demo = () => import('./demo').then((m) => m.default)

/** Les identifiants de serveur ne contiennent que des chiffres : on refuse tout le reste avant de bâtir un filtre. */
const gid = (g: string) => { if (!/^\d{5,25}$/.test(g)) throw new Error('Identifiant de serveur invalide'); return g }

async function run<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as T
}

const CHARACTER_COLUMNS =
  'id,user_id,name,clan,rank,gender,prefix,hp_current,hp_max,lives,initial_age_lunes,aging_start_date,sheet_channel_id,sheet_guild_id,last_activity,dead,missing,archived,afterlife,created_at'
const NPC_COLUMNS = 'id,name,clan,rank,gender,prefix,initial_age_lunes,aging_start_date,sheet_channel_id,sheet_guild_id,dead,missing,afterlife,created_at'

/** Toutes les lectures du site. Aucune écriture directe : les actions passent par `enqueue` (voir README). */
export const api = {
  access: async (): Promise<Access[]> => (DEMO ? (await demo()).access : run(supabase.from('dashboard_access').select('*'))),
  actions: async (): Promise<ActionDef[]> => (DEMO ? (await demo()).actions : run(supabase.from('dashboard_actions').select('*'))),
  members: async (guild: string): Promise<Member[]> =>
    DEMO ? (await demo()).members : cached(`members:${guild}`, 5 * 60_000, () => run(supabase.from('dashboard_members').select('*').eq('guild_id', gid(guild)).limit(5000))),
  commands: async (bot: BotName): Promise<CommandDef[]> =>
    DEMO ? (await demo()).commands.filter((c) => c.bot === bot) : cached(`commands:${bot}`, 5 * 60_000, () => run(supabase.from('dashboard_commands').select('*').eq('bot', bot).order('name').limit(500))),
  channels: async (guild: string): Promise<ChannelRow[]> =>
    DEMO ? (await demo()).channels : cached(`channels:${guild}`, 5 * 60_000, () => run(supabase.from('dashboard_channels').select('channel_id,name,kind,category,position').eq('guild_id', gid(guild)).order('position').limit(2000))),
  roles: async (guild: string): Promise<RoleRow[]> =>
    DEMO ? (await demo()).roles : cached(`roles:${guild}`, 5 * 60_000, () => run(supabase.from('dashboard_roles').select('role_id,name,color,position').eq('guild_id', gid(guild)).order('position', { ascending: false }).limit(1000))),
  /** Noms de groupes et de rangs (suggestions des formulaires de commandes). */
  factions: async (): Promise<{ groups: string[]; ranks: string[] }> => {
    if (DEMO) return { groups: ['Dynastie Démo'], ranks: ['Fondateur'] }
    return cached('factions', 5 * 60_000, async () => {
      const [f, r] = await Promise.all([run<{ name: string }[]>(supabase.from('factions').select('name').order('name').limit(500)), run<{ rank_name: string }[]>(supabase.from('faction_ranks').select('rank_name').limit(2000))])
      return { groups: f.map((x) => x.name), ranks: [...new Set(r.map((x) => x.rank_name))].sort() }
    })
  },
  characters: async (): Promise<Character[]> =>
    DEMO ? (await demo()).characters : run(supabase.from('characters').select(CHARACTER_COLUMNS).order('name').limit(5000)),
  npcs: async (): Promise<Npc[]> => (DEMO ? (await demo()).npcs : run(supabase.from('npcs').select(NPC_COLUMNS).order('name').limit(5000))),
  skills: async (id: number): Promise<Skills> => {
    if (DEMO) return (await demo()).skills
    const rows = await run<{ skill_name: string; skill_value: number }[]>(supabase.from('character_skills').select('skill_name,skill_value').eq('character_id', id))
    return Object.fromEntries(rows.map((r) => [r.skill_name, r.skill_value]))
  },
  handicaps: async (id: number): Promise<CharHandicap[]> =>
    DEMO ? (await demo()).handicaps : run(supabase.from('character_handicaps').select('handicap_name,origin').eq('character_id', id)),
  hpHistory: async (id: number): Promise<HpEntry[]> =>
    DEMO ? (await demo()).hpHistory : run(supabase.from('hp_history').select('id,change,new_hp,reason,staff_id,timestamp').eq('character_id', id).order('timestamp', { ascending: false }).limit(60)),
  npcEvents: async (id: number): Promise<NpcEvent[]> =>
    DEMO ? (await demo()).npcEvents : run(supabase.from('npc_events').select('id,kind,reason,staff_id,created_at').eq('npc_id', id).order('created_at', { ascending: false }).limit(60)),
  threads: async (guild: string): Promise<Thread[]> =>
    DEMO ? (await demo()).threads : run(supabase.from('rp_threads').select('*').or(`guild_id.eq.${gid(guild)},guild_id.is.null`).order('last_message_at').limit(2000)),
  prey: async (): Promise<PreyLot[]> =>
    DEMO ? (await demo()).prey : run(supabase.from('prey_stock').select('id,clan,prey_name,portions,expires_at').gte('expires_at', new Date().toISOString().slice(0, 10)).limit(5000)),
  herbarium: async (): Promise<HerbLot[]> =>
    DEMO ? (await demo()).herbarium : run(supabase.from('herbarium').select('id,inventory_owner,plant_name,quantity,expires_at').gte('expires_at', new Date().toISOString().slice(0, 10)).limit(5000)),
  convalescences: async (): Promise<Convalescence[]> =>
    DEMO ? (await demo()).convalescences : run(supabase.from('convalescences').select('*').order('end_date').limit(500)),
  sanctions: async (guild: string): Promise<Sanction[]> =>
    DEMO ? (await demo()).sanctions : run(supabase.from('mod_sanctions').select('*').eq('guild_id', guild).order('created_at', { ascending: false }).limit(1000)),
  xp: async (guild: string): Promise<XpRow[]> =>
    DEMO ? (await demo()).xp : run(supabase.from('xp_members').select('user_id,guild_id,text_xp,voice_xp,bonus_xp').eq('guild_id', guild).limit(5000)),
  lifecycle: async (guild: string): Promise<Lifecycle[]> =>
    DEMO ? (await demo()).lifecycle : run(supabase.from('sheet_lifecycle').select('entity_type,entity_id,status,repertoire_channel_id,waiting_since,archive_channel_id').or(`repertoire_guild_id.eq.${gid(guild)},archive_guild_id.eq.${gid(guild)}`).limit(5000)),
  calendar: async (): Promise<CalendarConfig | null> =>
    DEMO ? (await demo()).calendar : (await run<CalendarConfig[]>(supabase.from('calendar_config').select('*').limit(1)))[0] ?? null,
  botStatus: async (): Promise<BotStatus[]> => (DEMO ? (await demo()).botStatus : run(supabase.from('bot_status').select('*'))),
  jobs: async (guild: string): Promise<Job[]> =>
    DEMO ? (await demo()).jobs : run(supabase.from('bot_jobs').select('*').eq('guild_id', guild).order('id', { ascending: false }).limit(80)),
  /** Dernières commandes lancées depuis le site pour un bot. */
  commandRuns: async (guild: string, bot: BotName): Promise<Job[]> =>
    DEMO ? (await demo()).jobs.filter((j) => j.action === 'command.run' && j.bot === bot)
         : run(supabase.from('bot_jobs').select('*').eq('guild_id', gid(guild)).eq('bot', bot).eq('action', 'command.run').order('id', { ascending: false }).limit(30)),
  job: async (id: number): Promise<Job | null> => {
    if (DEMO) return (await demo()).finishJob(id)
    return (await run<Job[]>(supabase.from('bot_jobs').select('*').eq('id', id).limit(1)))[0] ?? null
  },

  /** Dépose une demande pour un bot (la base vérifie les droits de la personne connectée). Renvoie l'identifiant de la demande. */
  enqueue: async (bot: BotName, action: string, guild: string, payload: Record<string, unknown>): Promise<number> => {
    if (DEMO) return (await demo()).enqueue(bot, action, guild, payload)
    const { data, error } = await supabase.rpc('dashboard_enqueue', { p_bot: bot, p_action: action, p_guild: guild, p_payload: payload })
    if (error) throw new Error(error.message)
    return Number(data)
  },
}

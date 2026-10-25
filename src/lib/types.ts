// Tous les identifiants Discord sont des TEXTES (voir bigint.ts).
export type Level = 'apprenti' | 'staff' | 'admin'
export type BotName = 'bubulle' | 'ricochet' | 'vigie'

export interface Access { discord_id: string; guild_id: string; guild_name: string | null; level: Level; display_name: string | null; avatar_url: string | null }
export interface Member { guild_id: string; user_id: string; display_name: string; avatar_url: string | null }

export interface Character {
  id: number; user_id: string; name: string; clan: string; rank: string; gender: string | null; prefix: string | null
  hp_current: number; hp_max: number; lives: number; initial_age_lunes: number; aging_start_date: string
  sheet_channel_id: string | null; sheet_guild_id: string | null; last_activity: string | null
  dead: boolean; missing: boolean; archived: boolean; afterlife: string | null; created_at: string
}
export interface Npc {
  id: number; name: string; clan: string; rank: string; gender: string | null; prefix: string | null
  initial_age_lunes: number; aging_start_date: string; sheet_channel_id: string | null; sheet_guild_id: string | null
  dead: boolean; missing: boolean; afterlife: string | null; created_at: string
}
export interface CharHandicap { handicap_name: string; origin: string }
export type Skills = Record<string, number>
export interface HpEntry { id: number; change: number; new_hp: number; reason: string | null; staff_id: string | null; timestamp: string }
export interface NpcEvent { id: number; kind: string; reason: string | null; staff_id: string | null; created_at: string }
export interface Thread { thread_id: string; channel_id: string; creator_id: string; title: string | null; prefixes_oc: string | null; last_message_at: string; relance_faite: boolean; guild_id: string | null; created_at: string }
export interface PreyLot { id: number; clan: string; prey_name: string; portions: number; expires_at: string }
export interface HerbLot { id: number; inventory_owner: string; plant_name: string; quantity: number; expires_at: string }
export interface Convalescence { character_id: number; character_name: string; clan: string | null; reason: string | null; healer_name: string | null; end_date: string; user_id?: string | null }
export interface Sanction { id: number; guild_id: string; user_id: string; moderator_id: string; kind: string; reason: string | null; active: boolean; created_at: string }
export interface XpRow { user_id: string; guild_id: string; text_xp: number; voice_xp: number; bonus_xp: number }
export interface Lifecycle { entity_type: string; entity_id: number; status: string; repertoire_channel_id: string | null; waiting_since: string | null; archive_channel_id: string | null }
export interface BotStatus { bot: BotName; last_seen: string; info: Record<string, unknown> }
export interface CalendarConfig { start_date: string; start_season_index: number; start_month_in_season: number; paused_at: string | null; paused_seconds: number }

export type JobStatus = 'pending' | 'running' | 'done' | 'failed'
export interface Job {
  id: number; bot: BotName; action: string; guild_id: string; payload: Record<string, unknown>; status: JobStatus
  result: { message?: string; details?: string } | null; error: string | null; requested_by: string; requested_name: string | null
  created_at: string; started_at: string | null; finished_at: string | null
}
export interface CommandParam {
  name: string; type: 'string' | 'integer' | 'number' | 'boolean' | 'user' | 'channel' | 'role' | 'mentionable'; required: boolean; description: string
  min: number | null; max: number | null; min_length: number | null; max_length: number | null
  choices: { name: string; value: string | number }[]; autocomplete: string | null
}
export interface CommandDef { bot: BotName; name: string; description: string; level: 'staff' | 'admin'; grp: string; params: CommandParam[]; needs_channel: boolean; note: string | null }
export interface ChannelRow { channel_id: string; name: string; kind: string; category: string | null; position: number }
export interface RoleRow { role_id: string; name: string; color: number; position: number }
export interface ActionDef { bot: BotName; action: string; label: string; min_level: 'staff' | 'admin' }

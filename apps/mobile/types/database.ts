export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Onboarding enums — Onboarding Spec §B1. Stored on profiles.
export type AgeRange = 'under_16' | '16_18' | '18_22' | '22_26' | '26_plus'
export type LifeStage = 'college_student' | 'final_year' | 'fresh_graduate' | 'working'
export type Intent = 'quit' | 'figuring_out'
export type SmokingReason = 'stress' | 'boredom' | 'social' | 'habit' | 'focus' | 'post_meal'
export type TriggerTime =
  | 'morning' | 'post_meal' | 'break' | 'study_work'
  | 'friends' | 'stress' | 'boredom' | 'late_night'

export type VoiceStyle = 'steady_and_direct' | 'emotional_and_understanding' | 'real_and_practical'
export type RelatableCategory =
  | 'food_delivery' | 'movies_ott' | 'music_podcasts' | 'travel' | 'gaming' | 'clothes_shopping'
export type TimeToFirstCigarette = 'within_5' | 'within_30' | 'within_60' | 'later' | 'not_daily'
export type CravingIntensity = 'low' | 'medium' | 'high' | 'overwhelming'
export type QuitHistory = 'never' | 'one_two' | 'three_five' | 'five_plus' | 'lost_count'
export type QuitStruggle = 'social' | 'stress' | 'withdrawal' | 'weak_moments' | 'no_plan'
export type Motivation =
  | 'health' | 'money' | 'others' | 'independence'
  | 'fitness' | 'wake_up_call' | 'no_reason'

// Derived classification — Architecture Guide §7.6 (maps to FREEZE_MATRIX keys & DB).
export type DependencyLevel = 'light' | 'moderate' | 'heavy'

// streak_record / notification_state enums (Data Schema §4, §10).
export type StreakStatus = 'active' | 'paused' | 'reset'
export type ConfirmationSource = 'sos' | 'log'
export type NotificationTier = 'app_decides' | 'few_daily' | 'on_demand'

// log enums (Data Schema §3 / Logging Spec §B1).
export type LogType = 'craving' | 'overcome' | 'slip' | 'note' | 'sos'
export type EntryMethod = 'daily_card' | 'fab' | 'sos' | 'notification'
export type SlipType = 'one_off' | 'few_days' | 'return_to_smoking'
export type SlipSource = 'flow_c' | 'return_modal'
export type PostToolState = 'better' | 'same' | 'smoked'

// coping_tools enums (Data Schema §6).
export type ToolFamily = 'breathing' | 'physical' | 'mini_games'
export type ToolCategory =
  | 'physical_reset' | 'cognitive_reframe' | 'distraction'
  | 'social_coping' | 'reflective' | 'breathing'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          username: string | null
          target_quit_date: string | null
          current_stage: number
          daily_baseline_cigarettes: number
          cost_per_pack: number
          onboarding_complete: boolean
          // Onboarding profile (written once at OB-23 — Data Schema §1)
          // NOTE: quit_date is NOT on profiles — it lives on quit_attempts (Data Schema A3).
          first_name: string | null
          display_name: string | null
          age_range: AgeRange | null
          life_stage: LifeStage | null
          intent: Intent | null
          cigarettes_per_day: number | null
          price_per_cigarette: number | null
          smoking_reasons: SmokingReason[] | null
          trigger_times: TriggerTime[] | null
          time_to_first_cigarette: TimeToFirstCigarette | null
          craving_intensity: CravingIntensity | null
          previous_quit_attempts: QuitHistory | null
          quit_struggles: QuitStruggle[] | null
          motivation: Motivation | null
          commitment_reason: string | null
          commitment_identity: string | null
          relatable_category: RelatableCategory | null
          voice_style: VoiceStyle | null
          push_token: string | null
          timezone: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          username?: string | null
          target_quit_date?: string | null
          current_stage?: number
          daily_baseline_cigarettes?: number
          cost_per_pack?: number
          onboarding_complete?: boolean
          first_name?: string | null
          display_name?: string | null
          age_range?: AgeRange | null
          life_stage?: LifeStage | null
          intent?: Intent | null
          cigarettes_per_day?: number | null
          price_per_cigarette?: number | null
          smoking_reasons?: SmokingReason[] | null
          trigger_times?: TriggerTime[] | null
          time_to_first_cigarette?: TimeToFirstCigarette | null
          craving_intensity?: CravingIntensity | null
          previous_quit_attempts?: QuitHistory | null
          quit_struggles?: QuitStruggle[] | null
          motivation?: Motivation | null
          commitment_reason?: string | null
          commitment_identity?: string | null
          relatable_category?: RelatableCategory | null
          voice_style?: VoiceStyle | null
          push_token?: string | null
          timezone?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          username?: string | null
          target_quit_date?: string | null
          current_stage?: number
          daily_baseline_cigarettes?: number
          cost_per_pack?: number
          onboarding_complete?: boolean
          first_name?: string | null
          display_name?: string | null
          age_range?: AgeRange | null
          life_stage?: LifeStage | null
          intent?: Intent | null
          cigarettes_per_day?: number | null
          price_per_cigarette?: number | null
          smoking_reasons?: SmokingReason[] | null
          trigger_times?: TriggerTime[] | null
          time_to_first_cigarette?: TimeToFirstCigarette | null
          craving_intensity?: CravingIntensity | null
          previous_quit_attempts?: QuitHistory | null
          quit_struggles?: QuitStruggle[] | null
          motivation?: Motivation | null
          commitment_reason?: string | null
          commitment_identity?: string | null
          relatable_category?: RelatableCategory | null
          voice_style?: VoiceStyle | null
          push_token?: string | null
          timezone?: string
        }
        Relationships: []
      }
      // log — every user-initiated log entry (Data Schema §3 / Logging Spec §B1).
      // cigarette_count: 1–4 exact, 99 = sentinel for '5+' (never shown as 99).
      log: {
        Row: {
          log_id: string
          user_id: string
          attempt_id: number | null
          log_type: LogType
          timestamp: string
          quit_day_number: number
          current_stage: number
          entry_method: EntryMethod
          routed_to_sos: boolean
          other_text: string | null
          intensity: number | null
          triggers: string[] | null
          location: string[] | null
          social_context: string[] | null
          mood: number | null
          what_helped: string[] | null
          slip_type: SlipType | null
          cigarette_count: number | null
          slip_triggers: string[] | null
          source: SlipSource | null
          tool_selected: string | null
          tool_duration_seconds: number | null
          tool_helpful: boolean | null
          post_tool_state: PostToolState | null
          note_text: string | null
          has_photo: boolean | null
          created_at: string
        }
        Insert: {
          log_id?: string
          user_id: string
          attempt_id?: number | null
          log_type: LogType
          timestamp?: string
          quit_day_number: number
          current_stage: number
          entry_method: EntryMethod
          routed_to_sos?: boolean
          other_text?: string | null
          intensity?: number | null
          triggers?: string[] | null
          location?: string[] | null
          social_context?: string[] | null
          mood?: number | null
          what_helped?: string[] | null
          slip_type?: SlipType | null
          cigarette_count?: number | null
          slip_triggers?: string[] | null
          source?: SlipSource | null
          tool_selected?: string | null
          tool_duration_seconds?: number | null
          tool_helpful?: boolean | null
          post_tool_state?: PostToolState | null
          note_text?: string | null
          has_photo?: boolean | null
          created_at?: string
        }
        Update: {
          log_id?: string
          user_id?: string
          attempt_id?: number | null
          log_type?: LogType
          timestamp?: string
          quit_day_number?: number
          current_stage?: number
          entry_method?: EntryMethod
          routed_to_sos?: boolean
          other_text?: string | null
          intensity?: number | null
          triggers?: string[] | null
          location?: string[] | null
          social_context?: string[] | null
          mood?: number | null
          what_helped?: string[] | null
          slip_type?: SlipType | null
          cigarette_count?: number | null
          slip_triggers?: string[] | null
          source?: SlipSource | null
          tool_selected?: string | null
          tool_duration_seconds?: number | null
          tool_helpful?: boolean | null
          post_tool_state?: PostToolState | null
          note_text?: string | null
          has_photo?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      // coping_tools — read-only catalog (Data Schema §6).
      coping_tools: {
        Row: {
          tool_id: string
          data_model_id: string
          family: ToolFamily
          name: string
          category: ToolCategory
          intensity_min: number
          intensity_max: number
          context: string[] | null
          duration_seconds: number
          sos_eligible: boolean
          library_only: boolean
          requires_buddy: boolean
          stage_min: number | null
          emotional_tags: string[] | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      // user_tool_scores — per-user tool rating (Data Schema §7).
      user_tool_scores: {
        Row: {
          user_id: string
          tool_id: string
          tool_score: number
          total_uses: number
          is_weighted: boolean
          last_used_at: string | null
          post_tool_state: PostToolState | null
          removed_from_sos: boolean
        }
        Insert: {
          user_id: string
          tool_id: string
          tool_score?: number
          total_uses?: number
          is_weighted?: boolean
          last_used_at?: string | null
          post_tool_state?: PostToolState | null
          removed_from_sos?: boolean
        }
        Update: {
          user_id?: string
          tool_id?: string
          tool_score?: number
          total_uses?: number
          is_weighted?: boolean
          last_used_at?: string | null
          post_tool_state?: PostToolState | null
          removed_from_sos?: boolean
        }
        Relationships: []
      }
      // user_sos_state — SOS escalation counters (Data Schema §8).
      user_sos_state: {
        Row: {
          user_id: string
          failed_sos_count: number
          consecutive_sos_successes: number
          window_started_at: string | null
        }
        Insert: {
          user_id: string
          failed_sos_count?: number
          consecutive_sos_successes?: number
          window_started_at?: string | null
        }
        Update: {
          user_id?: string
          failed_sos_count?: number
          consecutive_sos_successes?: number
          window_started_at?: string | null
        }
        Relationships: []
      }
      // quit_attempts — source of truth for quit_date + dependency_level (Data Schema §2).
      quit_attempts: {
        Row: {
          attempt_id: number
          user_id: string
          quit_date: string | null
          started_at: string
          ended_at: string | null
          dependency_level: DependencyLevel
        }
        Insert: {
          attempt_id?: number
          user_id: string
          quit_date?: string | null
          started_at?: string
          ended_at?: string | null
          dependency_level: DependencyLevel
        }
        Update: {
          attempt_id?: number
          user_id?: string
          quit_date?: string | null
          started_at?: string
          ended_at?: string | null
          dependency_level?: DependencyLevel
        }
        Relationships: []
      }
      // streak_record — one per user (Data Schema §4). All counters required.
      streak_record: {
        Row: {
          user_id: string
          current_streak_days: number
          lifetime_smoke_free_days: number
          longest_streak_ever: number
          consistency_rate: number
          smoke_free_days_in_attempt: number
          active_days_in_attempt: number
          freeze_stock: number
          freeze_period: number
          freeze_max_current_period: number
          dependency_level: DependencyLevel
          dependency_level_pending: DependencyLevel | null
          current_stage: number
          streak_status: StreakStatus
          last_confirmed_date: string
          streak_start_date: string
          confirmation_source: ConfirmationSource
          paused_at: string | null
        }
        Insert: {
          user_id: string
          current_streak_days: number
          lifetime_smoke_free_days: number
          longest_streak_ever: number
          consistency_rate: number
          smoke_free_days_in_attempt: number
          active_days_in_attempt: number
          freeze_stock: number
          freeze_period: number
          freeze_max_current_period: number
          dependency_level: DependencyLevel
          dependency_level_pending?: DependencyLevel | null
          current_stage: number
          streak_status: StreakStatus
          last_confirmed_date: string
          streak_start_date: string
          confirmation_source: ConfirmationSource
          paused_at?: string | null
        }
        Update: {
          user_id?: string
          current_streak_days?: number
          lifetime_smoke_free_days?: number
          longest_streak_ever?: number
          consistency_rate?: number
          smoke_free_days_in_attempt?: number
          active_days_in_attempt?: number
          freeze_stock?: number
          freeze_period?: number
          freeze_max_current_period?: number
          dependency_level?: DependencyLevel
          dependency_level_pending?: DependencyLevel | null
          current_stage?: number
          streak_status?: StreakStatus
          last_confirmed_date?: string
          streak_start_date?: string
          confirmation_source?: ConfirmationSource
          paused_at?: string | null
        }
        Relationships: []
      }
      // slip_state — one per user (Data Schema §5).
      slip_state: {
        Row: {
          user_id: string
          red_flag_count: number
          last_slip_date: string | null
          pattern_window_open: boolean
        }
        Insert: {
          user_id: string
          red_flag_count?: number
          last_slip_date?: string | null
          pattern_window_open?: boolean
        }
        Update: {
          user_id?: string
          red_flag_count?: number
          last_slip_date?: string | null
          pattern_window_open?: boolean
        }
        Relationships: []
      }
      // notification_state — one per user (Data Schema §10).
      notification_state: {
        Row: {
          user_id: string
          consecutive_ignored: number
          auto_reduce_active_until: string | null
          effective_tier: NotificationTier
        }
        Insert: {
          user_id: string
          consecutive_ignored?: number
          auto_reduce_active_until?: string | null
          effective_tier: NotificationTier
        }
        Update: {
          user_id?: string
          consecutive_ignored?: number
          auto_reduce_active_until?: string | null
          effective_tier?: NotificationTier
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Atomic upsert of a tool score (+1 / -1) on user_tool_scores. Deployed
      // separately as a Postgres function — see supabase/migrations (Step 9 DB).
      increment_tool_score: {
        Args: {
          p_user_id: string
          p_tool_id: string
          p_delta: number
          p_post_tool_state: PostToolState | null
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

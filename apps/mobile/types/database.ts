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
        }
        Relationships: []
      }
      craving_logs: {
        Row: {
          id: string
          user_id: string
          created_at: string
          intensity: number
          context: string
          triggers: string[] | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          intensity: number
          context: string
          triggers?: string[] | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          intensity?: number
          context?: string
          triggers?: string[] | null
          notes?: string | null
        }
        Relationships: []
      }
      slips: {
        Row: {
          id: string
          user_id: string
          created_at: string
          intensity: number
          context: string
          cigarettes_smoked: number
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          intensity: number
          context: string
          cigarettes_smoked: number
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          intensity?: number
          context?: string
          cigarettes_smoked?: number
          notes?: string | null
        }
        Relationships: []
      }
      coping_usages: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          created_at: string
          craving_intensity: number | null
          craving_context: string | null
          user_stage: number | null
          tool_surface: string
          post_tool_state: string
          time_since_last_use: number | null
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          created_at?: string
          craving_intensity?: number | null
          craving_context?: string | null
          user_stage?: number | null
          tool_surface: string
          post_tool_state: string
          time_since_last_use?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          tool_id?: string
          created_at?: string
          craving_intensity?: number | null
          craving_context?: string | null
          user_stage?: number | null
          tool_surface?: string
          post_tool_state?: string
          time_since_last_use?: number | null
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

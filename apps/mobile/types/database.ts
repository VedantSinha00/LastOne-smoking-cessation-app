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

// notification_log enums (Notifications Spec §B1 / Registry §5).
// notification_type is the closed set of N-codes; status is the delivery lifecycle.
export type NotificationType =
  | 'N-OB-00' | 'N-OB-01' | 'N-OB-02' | 'N-OB-03' | 'N-OB-04' | 'N-OB-05'
  | 'N-STK-01' | 'N-STK-02' | 'N-STK-03'
  | 'N-CON-01' | 'N-CON-02' | 'N-CON-03' | 'N-CON-04' | 'N-CON-05' | 'N-CON-06'
  | 'N-CON-07' | 'N-CON-08' | 'N-CON-09' | 'N-CON-10' | 'N-CON-11' | 'N-CON-12'
  | 'N-INS-01' | 'N-INS-02' | 'N-INS-03'
  | 'N-GOAL-01' | 'N-GOAL-02'
  | 'N-PROF-01'
  | 'N-PAU-01' | 'N-PAU-02' | 'N-PAU-03' | 'N-PAU-04'
export type NotificationLogStatus =
  | 'queued' | 'delivered' | 'opened' | 'ignored' | 'expired' | 'discarded'

// risk_windows — nested array on profiles (Insights Spec §B1, written by Insights).
// Only high-confidence active windows raise alert_level to 2 (Insights §B2.8).
export interface RiskWindow {
  start_hour: number // 0–23 local
  end_hour: number // 0–23 local
  confidence: 'high' | 'medium'
  active: boolean
}

// insight_card enums (Insights Spec §B1.1). insight_key is the idempotency key:
// {user_id}_{insight_type}_{attempt_id}. The card row holds STATE + metadata only —
// display copy + detected values are derived client-side from insight_type + logs.
export type InsightType =
  | 'peak_risk_window' | 'top_trigger' | 'resistance_rate' | 'tool_effectiveness'
  | 'slip_pattern' | 'craving_drop' | 'cross_attempt_comparison' | 'trigger_shift'
  | 'profile_peak_windows' | 'profile_social_context' | 'profile_trigger_category'
  | 'first_craving_match'
export type CardState = 'collapsed' | 'expanded' | 'read'
export type ToneSensitivity = 'high' | 'low'
// Derived from current_stage at render (Insights §B2.1) — not stored.
export type InsightScreenState =
  | 'profile_building' | 'profile_led' | 'transitional' | 'feed_led' | 'feed_continues'
// insight_notification enum (Insights §B1.1) — server-delivered (Step 21).
export type InsightNotificationType =
  | 'new_pattern_detected' | 'progress_threshold' | 'slip_pattern_emerging'

// log enums (Data Schema §3 / Logging Spec §B1).
export type LogType = 'craving' | 'overcome' | 'slip' | 'note' | 'sos'
export type EntryMethod = 'daily_card' | 'fab' | 'sos' | 'notification'
export type SlipType = 'one_off' | 'few_days' | 'return_to_smoking'
export type SlipSource = 'flow_c' | 'return_modal'
export type PostToolState = 'better' | 'same' | 'smoked'

// content_cards enums (Content Cards §B1). sensitivity has a CHECK on remote;
// trigger_type is unconstrained text (cigarette_milestone is the Milestone-Spec value).
export type ContentSensitivity = 'low' | 'high'

// Personal Goals enums (Personal Goals Spec §B1 / Data Schema §15–17).
export type GoalSource = 'link' | 'manual'
export type GoalStatus = 'active' | 'completed' | 'retired'
export type NgoId = 'CFI' | 'CPAA' | 'CanSupport'

// Giving Up Support enums (GU Spec §B1 / Data Schema §20).
export type GuTriggerCondition = 'slip_threshold' | 'return_to_smoking' | 'passive_disengagement'
export type GuOutcome = 'kept_going' | 'routed_to_support' | 'dismissed_mid_flow'
export type GuSupportAction = 'called_person' | 'whatsapped_person' | 'viewed_resources' | 'dismissed'
export type GuCallOutcome = 'helped_a_lot' | 'helped_a_little' | 'didnt_help' | 'not_logged'

// Mini-Games enums (MiniGames Spec §B1 / Data Schema §21–23).
export type GameType = 'memory_1p' | 'echo_tap' | 'memory_2p'
export type GameSessionType = 'craving_linked' | 'casual'
export type GameGridSize = '3x4' | '4x4'
export type GameCardSkin = 'generic' | 'themed'
export type GameWinner = 'player1' | 'player2' | 'draw'
export type GameReflection = 'passed' | 'partial' | 'ongoing'

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
          // Notification controls (Notifications Spec §2.4 / Settings PROF-10/11).
          // Server defaults apply; onboarding does not write these.
          notification_preference: NotificationTier
          notifications_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_start: string | null // 'HH:MM:SS' local
          quiet_hours_end: string | null // 'HH:MM:SS' local
          // risk_windows — written by Insights (Step 16); read for alert_level.
          risk_windows: RiskWindow[] | null
          // Giving Up Support state (GU Spec §B1). NOTE: live column is
          // last_giving_up_trigger_at (not …_timestamp as the spec doc writes).
          // support_person name/number are SecureStore-only — never here.
          last_giving_up_trigger_at: string | null
          giving_up_card_dismissed_count: number
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
          notification_preference?: NotificationTier
          notifications_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          risk_windows?: RiskWindow[] | null
          last_giving_up_trigger_at?: string | null
          giving_up_card_dismissed_count?: number
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
          notification_preference?: NotificationTier
          notifications_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          risk_windows?: RiskWindow[] | null
          last_giving_up_trigger_at?: string | null
          giving_up_card_dismissed_count?: number
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
      // notification_log — one row per notification that enters the delivery
      // pipeline (Notifications Spec §B1). status tracks the lifecycle; expires_at
      // is set only for insight notifications (N-INS-01/02/03).
      notification_log: {
        Row: {
          id: string
          user_id: string
          notification_type: NotificationType
          status: NotificationLogStatus
          scheduled_for: string
          delivered_at: string | null
          opened_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: NotificationType
          status: NotificationLogStatus
          scheduled_for: string
          delivered_at?: string | null
          opened_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: NotificationType
          status?: NotificationLogStatus
          scheduled_for?: string
          delivered_at?: string | null
          opened_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      // insight_card — per-user/attempt insight state + metadata (Insights §B1.1).
      // insight_key is the PK + idempotency key. No copy/value columns: presentation
      // is derived client-side from insight_type + the underlying log data.
      insight_card: {
        Row: {
          insight_key: string
          user_id: string
          attempt_id: number
          insight_type: InsightType
          card_state: CardState
          has_app_action: boolean
          tone_sensitivity: ToneSensitivity
          generated_at: string
          last_seen_at: string | null
          engagement_score: number
          archived: boolean
        }
        Insert: {
          insight_key: string
          user_id: string
          attempt_id: number
          insight_type: InsightType
          card_state?: CardState
          has_app_action?: boolean
          tone_sensitivity?: ToneSensitivity
          generated_at?: string
          last_seen_at?: string | null
          engagement_score?: number
          archived?: boolean
        }
        Update: {
          insight_key?: string
          user_id?: string
          attempt_id?: number
          insight_type?: InsightType
          card_state?: CardState
          has_app_action?: boolean
          tone_sensitivity?: ToneSensitivity
          generated_at?: string
          last_seen_at?: string | null
          engagement_score?: number
          archived?: boolean
        }
        Relationships: []
      }
      // insight_notification — queued insight pushes (Insights §B1.1). Created +
      // delivered server-side (Edge Function, Step 21); typed here for completeness.
      insight_notification: {
        Row: {
          notification_id: string
          user_id: string
          insight_key: string
          notification_type: InsightNotificationType
          scheduled_for: string
          expires_at: string
          status: 'queued' | 'delivered' | 'expired' | 'discarded'
          content_id: string
        }
        Insert: {
          notification_id?: string
          user_id: string
          insight_key: string
          notification_type: InsightNotificationType
          scheduled_for: string
          expires_at: string
          status?: 'queued' | 'delivered' | 'expired' | 'discarded'
          content_id: string
        }
        Update: {
          notification_id?: string
          user_id?: string
          insight_key?: string
          notification_type?: InsightNotificationType
          scheduled_for?: string
          expires_at?: string
          status?: 'queued' | 'delivered' | 'expired' | 'discarded'
          content_id?: string
        }
        Relationships: []
      }
      // content_cards — read-only card catalog (Content Cards §B1, Milestone Spec §4).
      // Holds the daily content cards (Step 14) AND the DASH-2 milestone reference
      // cards CM-01–08 (trigger_type='cigarette_milestone'). High-sensitivity cards
      // use the body_copy_* variant columns; low-sensitivity cards use body_copy.
      // card_id is UNIQUE (seeds upsert on it). trigger_type is unconstrained text.
      content_cards: {
        Row: {
          id: string
          card_id: string
          pill_tag: string
          title: string
          body_copy: string | null
          body_copy_steady: string | null
          body_copy_warm: string | null
          body_copy_practical: string | null
          trigger_type: string
          trigger_value: string
          sensitivity: ContentSensitivity
          stage_min: number | null
          stage_max: number | null
          active: boolean
        }
        Insert: {
          id?: string
          card_id: string
          pill_tag: string
          title: string
          body_copy?: string | null
          body_copy_steady?: string | null
          body_copy_warm?: string | null
          body_copy_practical?: string | null
          trigger_type: string
          trigger_value: string
          sensitivity: ContentSensitivity
          stage_min?: number | null
          stage_max?: number | null
          active?: boolean
        }
        Update: {
          id?: string
          card_id?: string
          pill_tag?: string
          title?: string
          body_copy?: string | null
          body_copy_steady?: string | null
          body_copy_warm?: string | null
          body_copy_practical?: string | null
          trigger_type?: string
          trigger_value?: string
          sensitivity?: ContentSensitivity
          stage_min?: number | null
          stage_max?: number | null
          active?: boolean
        }
        Relationships: []
      }
      // user_card_history — per-user impression log for cooldown selection (Content
      // Cards §3). UNIQUE(user_id, card_id) — cooldown upserts on the pair. NOT written
      // for cigarette_milestone cards (their unlock state is derived; Milestone Spec §4.2).
      user_card_history: {
        Row: {
          id: string
          user_id: string
          card_id: string
          last_shown_at: string
          show_count: number
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          last_shown_at?: string
          show_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          last_shown_at?: string
          show_count?: number
        }
        Relationships: []
      }
      // goal — user savings goals (Data Schema §15). current_amount is ALWAYS
      // derived client-side as SUM(top_up_log.amount) — the column itself is never
      // written after insert (stays at its default 0); see lib/goals.ts.
      goal: {
        Row: {
          goal_id: string
          user_id: string
          goal_name: string
          target_amount: number
          current_amount: number
          allocated_amount: number
          source: GoalSource
          product_url: string | null
          product_image_url: string | null
          emoji: string | null
          why: string | null
          status: GoalStatus
          created_at: string
          completed_at: string | null
        }
        Insert: {
          goal_id?: string
          user_id: string
          goal_name: string
          target_amount: number
          allocated_amount?: number
          source: GoalSource
          product_url?: string | null
          product_image_url?: string | null
          emoji?: string | null
          why?: string | null
          status?: GoalStatus
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          goal_name?: string
          target_amount?: number
          allocated_amount?: number
          product_url?: string | null
          product_image_url?: string | null
          emoji?: string | null
          why?: string | null
          status?: GoalStatus
          completed_at?: string | null
        }
        Relationships: []
      }
      // top_up_log — manual savings top-ups (Data Schema §16). Source of truth
      // for a goal's committed amount.
      top_up_log: {
        Row: {
          topup_id: string
          goal_id: string
          user_id: string
          amount: number
          created_at: string
        }
        Insert: {
          topup_id?: string
          goal_id: string
          user_id: string
          amount: number
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      // giving_up_event — one row per GU activation (Data Schema §20). Created
      // at GU-1 tap with outcome='dismissed_mid_flow' (the mid-flow exit value),
      // PATCHed forward as beats complete. Live column is triggered_at.
      giving_up_event: {
        Row: {
          event_id: string
          user_id: string
          triggered_at: string
          current_stage: number
          trigger_condition: GuTriggerCondition
          beat_1_completed: boolean
          beat_2_completed: boolean
          resistance_count_shown: number | null
          outcome: GuOutcome
          support_action: GuSupportAction | null
          support_call_outcome: GuCallOutcome | null
        }
        Insert: {
          event_id?: string
          user_id: string
          triggered_at?: string
          current_stage: number
          trigger_condition: GuTriggerCondition
          beat_1_completed?: boolean
          beat_2_completed?: boolean
          resistance_count_shown?: number | null
          outcome: GuOutcome
          support_action?: GuSupportAction | null
          support_call_outcome?: GuCallOutcome | null
        }
        Update: {
          beat_1_completed?: boolean
          beat_2_completed?: boolean
          resistance_count_shown?: number | null
          outcome?: GuOutcome
          support_action?: GuSupportAction | null
          support_call_outcome?: GuCallOutcome | null
        }
        Relationships: []
      }
      // game_session — one row per mini-game session (Data Schema §21). Sparse
      // columns by game_type; reflection_response only on craving_linked.
      game_session: {
        Row: {
          session_id: string
          user_id: string
          game_type: GameType
          session_type: GameSessionType
          started_at: string
          ended_at: string
          duration_seconds: number
          stage_at_session: number
          grid_size: GameGridSize | null
          card_skin: GameCardSkin | null
          pairs_matched: number | null
          time_taken_seconds: number | null
          sequences_completed: number | null
          longest_streak: number | null
          player1_score: number | null
          player2_score: number | null
          winner: GameWinner | null
          reflection_response: GameReflection | null
        }
        Insert: {
          session_id?: string
          user_id: string
          game_type: GameType
          session_type: GameSessionType
          started_at: string
          ended_at: string
          duration_seconds: number
          stage_at_session: number
          grid_size?: GameGridSize | null
          card_skin?: GameCardSkin | null
          pairs_matched?: number | null
          time_taken_seconds?: number | null
          sequences_completed?: number | null
          longest_streak?: number | null
          player1_score?: number | null
          player2_score?: number | null
          winner?: GameWinner | null
          reflection_response?: GameReflection | null
        }
        Update: {
          reflection_response?: GameReflection | null
        }
        Relationships: []
      }
      // game_streak — one row per user (Data Schema §22). Consecutive-day streak
      // of craving-linked sessions; longest_streak_ever never decreases.
      game_streak: {
        Row: {
          user_id: string
          current_streak: number
          longest_streak_ever: number
          sessions_this_week: number
          last_craving_session_date: string
        }
        Insert: {
          user_id: string
          current_streak?: number
          longest_streak_ever?: number
          sessions_this_week?: number
          last_craving_session_date: string
        }
        Update: {
          current_streak?: number
          longest_streak_ever?: number
          sessions_this_week?: number
          last_craving_session_date?: string
        }
        Relationships: []
      }
      // streak_nudge_log — one row per user (Data Schema §23). Stage-4 in-app
      // nudge cap: times_shown ≤ 2, then permanently_suppressed.
      streak_nudge_log: {
        Row: {
          user_id: string
          times_shown: number
          last_shown_at: string
          permanently_suppressed: boolean
        }
        Insert: {
          user_id: string
          times_shown?: number
          last_shown_at: string
          permanently_suppressed?: boolean
        }
        Update: {
          times_shown?: number
          last_shown_at?: string
          permanently_suppressed?: boolean
        }
        Relationships: []
      }
      // causes_card_log — Causes Card impressions (Data Schema §17). 14-day
      // eligibility from MAX(shown_at); NGO rotation = COUNT(rows) % 3.
      causes_card_log: {
        Row: {
          log_id: string
          user_id: string
          ngo_id: NgoId
          shown_at: string
          dismissed_at: string | null
          tapped_learn_more: boolean
        }
        Insert: {
          log_id?: string
          user_id: string
          ngo_id: NgoId
          shown_at?: string
          dismissed_at?: string | null
          tapped_learn_more?: boolean
        }
        Update: {
          // shown_at writable for DevPanel interval-backdating only.
          shown_at?: string
          dismissed_at?: string | null
          tapped_learn_more?: boolean
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

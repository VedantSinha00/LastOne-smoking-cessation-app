import { supabase } from './supabase'
import { queryClient } from './queryClient'
import { queryKeys } from './queryKeys'
import type {
  AgeRange,
  CravingIntensity,
  DependencyLevel,
  Intent,
  LifeStage,
  Motivation,
  QuitHistory,
  QuitStruggle,
  RelatableCategory,
  SmokingReason,
  TimeToFirstCigarette,
  TriggerTime,
} from '../types/database'

// ── Session state ──────────────────────────────────────────────────────────
// Every answer lives here in memory until OB-23. Nothing is written to the DB
// mid-flow (Onboarding Spec §5 — mid-flow exit writes nothing).

export type OnboardingState = {
  currentStep: number
  userId: string | null
  firstName: string
  ageRange: AgeRange | null
  lifeStage: LifeStage | null
  intent: Intent | null
  cigarettesPerDay: number // default 5
  pricePerCigarette: number // default 15 (INR)
  relatableCategory: string // Step 12 pre-build; default 'food_delivery'
  smokingReasons: SmokingReason[]
  triggerTimes: TriggerTime[]
  timeToFirstCigarette: TimeToFirstCigarette | null
  cravingIntensity: CravingIntensity | null
  previousQuitAttempts: QuitHistory | null
  quitStruggles: QuitStruggle[] | null
  motivation: Motivation | null
  quitDate: Date | null
  commitmentReason: string | null
  commitmentIdentity: string | null
}

export const initialOnboardingState: OnboardingState = {
  currentStep: 0,
  userId: null,
  firstName: '',
  ageRange: null,
  lifeStage: null,
  intent: null,
  cigarettesPerDay: 5,
  pricePerCigarette: 15,
  relatableCategory: 'food_delivery',
  smokingReasons: [],
  triggerTimes: [],
  timeToFirstCigarette: null,
  cravingIntensity: null,
  previousQuitAttempts: null,
  quitStruggles: null,
  motivation: null,
  quitDate: null,
  commitmentReason: null,
  commitmentIdentity: null,
}

// ── Derived classification (Onboarding Spec §B2.1 / §B2.2) ───────────────────

const CRAVING_WEIGHTS: Record<CravingIntensity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  overwhelming: 4,
}

const FIRST_CIG_WEIGHTS: Record<TimeToFirstCigarette, number> = {
  within_5: 4,
  within_30: 3,
  within_60: 2,
  later: 1,
  not_daily: 1,
}

/** dependence_score = craving_weight + first_cig_weight. Range 2–8 (§B2.1). */
export function calcDependenceScore(
  cravingIntensity: CravingIntensity,
  timeToFirstCig: TimeToFirstCigarette,
): number {
  return CRAVING_WEIGHTS[cravingIntensity] + FIRST_CIG_WEIGHTS[timeToFirstCig]
}

/** Maps the 2–8 score to the DB dependency_level (Architecture Guide §7.6). */
export function calcDependencyLevel(
  cravingIntensity: CravingIntensity,
  timeToFirstCig: TimeToFirstCigarette,
): DependencyLevel {
  const score = calcDependenceScore(cravingIntensity, timeToFirstCig)
  if (score <= 3) return 'light'
  if (score <= 5) return 'moderate'
  return 'heavy'
}

/** smoker_profile classification (§B2.2). Derived at query time, not stored. */
export function calcSmokerProfile(
  cigarettesPerDay: number,
  dependenceScore: number,
): 'social_occasional' | 'regular_light' | 'regular_moderate_heavy' {
  if (cigarettesPerDay <= 5 && dependenceScore <= 4) return 'social_occasional'
  if (cigarettesPerDay <= 10 && dependenceScore <= 6) return 'regular_light'
  return 'regular_moderate_heavy'
}

// ── Freeze initialisation (Architecture Guide §7.6) ──────────────────────────

export const FREEZE_MATRIX: Record<DependencyLevel, number[]> = {
  light: [2, 1, 1, 0],
  moderate: [3, 2, 1, 1],
  heavy: [4, 3, 2, 1],
}

export function initialFreezeStock(level: DependencyLevel): number {
  return FREEZE_MATRIX[level][0]
}

// ── OB-23 write sequence (Architecture Guide §7.7) ───────────────────────────

/** Local calendar date as 'YYYY-MM-DD' — avoids the UTC shift toISOString() causes. */
function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Writes the full onboarding profile in one sequence, fired once on the OB-23
 * CTA. Steps 3–5 upsert on user_id and the quit_attempts insert checks for an
 * open row first, so a retry after a partial failure is safe. onboarding_complete
 * is flipped last; the root layout re-routes to the tabs when it sees the change.
 */
export async function completeOnboarding(state: OnboardingState): Promise<void> {
  const userId = state.userId
  if (!userId) throw new Error('completeOnboarding called without a userId')
  if (!state.cravingIntensity || !state.timeToFirstCigarette) {
    throw new Error('Cannot complete onboarding: craving intensity and first-cigarette timing are required')
  }

  const dependencyLevel = calcDependencyLevel(state.cravingIntensity, state.timeToFirstCigarette)
  const quitDate = state.quitDate ? toDateString(state.quitDate) : null
  const today = toDateString(new Date())

  // 1. PATCH profiles — row already exists from the OB-05 signup. quit_date and
  //    dependency_level deliberately NOT written here: they live on quit_attempts
  //    (Onboarding Spec B1 / Data Schema A3). voice_style + display_name are left
  //    to the trigger/Settings (voice_style is deferred — Onboarding Spec B7).
  await supabase
    .from('profiles')
    .update({
      first_name: state.firstName,
      age_range: state.ageRange,
      life_stage: state.lifeStage,
      intent: state.intent,
      cigarettes_per_day: state.cigarettesPerDay,
      price_per_cigarette: state.pricePerCigarette,
      smoking_reasons: state.smokingReasons,
      trigger_times: state.triggerTimes,
      time_to_first_cigarette: state.timeToFirstCigarette,
      craving_intensity: state.cravingIntensity,
      previous_quit_attempts: state.previousQuitAttempts,
      quit_struggles: state.quitStruggles,
      motivation: state.motivation,
      commitment_reason: state.commitmentReason,
      commitment_identity: state.commitmentIdentity,
      relatable_category: state.relatableCategory as RelatableCategory,
    })
    .eq('id', userId)
    .throwOnError()

  // 2. INSERT quit_attempts — the open row (ended_at IS NULL) holding quit_date +
  //    dependency_level. Reuse an existing open attempt if a prior run half-completed.
  const { data: openAttempt } = await supabase
    .from('quit_attempts')
    .select('attempt_id')
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle()

  if (!openAttempt) {
    await supabase
      .from('quit_attempts')
      .insert({
        user_id: userId,
        quit_date: quitDate,
        dependency_level: dependencyLevel,
        started_at: new Date().toISOString(),
        ended_at: null,
      })
      .throwOnError()
  }

  // Steps 3–5 bootstrap the three single-row-per-user tables. OB-23 is the SOLE
  // creator (no DB trigger). All three use `ignoreDuplicates: true` → INSERT … ON
  // CONFLICT DO NOTHING, NOT a plain upsert: a re-run must never overwrite an
  // existing row (a plain upsert would reset lifetime_smoke_free_days to 0).
  // Rows are created DORMANT — freeze_stock = 0, counters zeroed. Streak allocates
  // freeze_stock from FREEZE_MATRIX at Day-1 activation, not here.

  // 3. streak_record (Data Schema §4). confirmation_source = 'log' is a placeholder
  //    until the first real confirmation (the enum has no "none" value).
  await supabase
    .from('streak_record')
    .upsert(
      {
        user_id: userId,
        current_streak_days: 0,
        lifetime_smoke_free_days: 0,
        longest_streak_ever: 0,
        consistency_rate: 0,
        smoke_free_days_in_attempt: 0,
        active_days_in_attempt: 0,
        freeze_stock: 0,
        freeze_period: 0,
        freeze_max_current_period: 0,
        dependency_level: dependencyLevel,
        current_stage: 0,
        streak_status: 'active',
        last_confirmed_date: today,
        streak_start_date: today,
        confirmation_source: 'log',
      },
      { onConflict: 'user_id', ignoreDuplicates: true },
    )
    .throwOnError()

  // 4. slip_state — fresh pattern-tracking row (Data Schema §5).
  await supabase
    .from('slip_state')
    .upsert(
      { user_id: userId, red_flag_count: 0, pattern_window_open: false },
      { onConflict: 'user_id', ignoreDuplicates: true },
    )
    .throwOnError()

  // 5. notification_state — pre-preference default tier (Data Schema §10).
  await supabase
    .from('notification_state')
    .upsert(
      { user_id: userId, effective_tier: 'app_decides' },
      { onConflict: 'user_id', ignoreDuplicates: true },
    )
    .throwOnError()

  // 6. onboarding_complete last — a partial failure above never strands a "complete" flag.
  await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', userId)
    .throwOnError()

  // 7. Refresh caches. Awaiting the profile invalidation lets the root layout
  //    observe onboarding_complete = true and route to the tabs.
  await queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
  // Prefix so the dashboard's allAttempts read picks up the new quit_date too.
  queryClient.invalidateQueries({ queryKey: ['quit_attempt'] })
  queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(userId) })
}

import { differenceInCalendarDays, parseISO } from 'date-fns'
import { supabase } from './supabase'
import { todayKey } from './dateKey'
import type { ConfirmationSource, DependencyLevel, Database } from '../types/database'

/**
 * All streak DB writes (Architecture Guide §10 / Streak Spec §B2). Each function
 * reads the streak_record row, applies the spec's rules, and writes back. Date
 * comparisons use the user's stored timezone.
 *
 * FREEZE_MATRIX[dependency_level][freeze_period] — Streak Spec §2 / migration 004:
 *   Period 0 (Days 1–14):  light 2, moderate 3, heavy 4
 *   Period 1 (Days 15–28): light 1, moderate 2, heavy 3
 *   Period 2 (Days 29–90): light 1, moderate 1, heavy 2
 *   Period 3 (Days 91+):   light 0, moderate 1, heavy 1
 */
export const FREEZE_MATRIX: Record<DependencyLevel, [number, number, number, number]> = {
  light: [2, 1, 1, 0],
  moderate: [3, 2, 1, 1],
  heavy: [4, 3, 2, 1],
}

type StreakRow = Database['public']['Tables']['streak_record']['Row']
type StreakUpdate = Database['public']['Tables']['streak_record']['Update']

async function getTimezone(userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('timezone').eq('id', userId).maybeSingle()
  return data?.timezone ?? 'Asia/Kolkata'
}

async function getStreak(userId: string): Promise<StreakRow | null> {
  const { data } = await supabase.from('streak_record').select('*').eq('user_id', userId).maybeSingle()
  return data ?? null
}

async function patch(userId: string, fields: StreakUpdate): Promise<void> {
  await supabase.from('streak_record').update(fields).eq('user_id', userId).throwOnError()
}

function consistency(smokeFree: number, active: number): number {
  if (active <= 0) return 0
  return Math.round((smokeFree / active) * 1000) / 10
}

/**
 * Confirm a smoke-free day (Flow B, daily check-in, or SOS 'Better').
 * Idempotent per day: a second confirmation the same day is a no-op (it only
 * updates confirmation_source if escalating log→sos is irrelevant; we keep the
 * earliest). Streak Spec §B2 "On daily confirmation" / "On SOS 'Better'".
 */
export async function confirmSmokeFreeDay(userId: string, source: ConfirmationSource): Promise<void> {
  const s = await getStreak(userId)
  if (!s || s.streak_status === 'paused') return
  const tz = await getTimezone(userId)
  const today = todayKey(tz)

  // Already confirmed today → don't double-count.
  if (s.last_confirmed_date === today) return

  const current = s.current_streak_days + 1
  const smokeFree = s.smoke_free_days_in_attempt + 1
  const active = s.active_days_in_attempt + 1

  await patch(userId, {
    current_streak_days: current,
    lifetime_smoke_free_days: s.lifetime_smoke_free_days + 1,
    smoke_free_days_in_attempt: smokeFree,
    active_days_in_attempt: active,
    consistency_rate: consistency(smokeFree, active),
    longest_streak_ever: Math.max(s.longest_streak_ever, current),
    last_confirmed_date: today,
    confirmation_source: source,
  })
}

/**
 * one_off slip WITH a freeze available: consume 1 freeze, streak unchanged, but
 * the day still counts as smoke-free for lifetime/consistency. Streak Spec §B2.
 */
export async function consumeFreeze(userId: string): Promise<void> {
  const s = await getStreak(userId)
  if (!s) return
  const tz = await getTimezone(userId)
  const today = todayKey(tz)
  const smokeFree = s.smoke_free_days_in_attempt + 1
  const active = s.active_days_in_attempt + 1
  await patch(userId, {
    freeze_stock: Math.max(0, s.freeze_stock - 1),
    lifetime_smoke_free_days: s.lifetime_smoke_free_days + 1,
    smoke_free_days_in_attempt: smokeFree,
    active_days_in_attempt: active,
    consistency_rate: consistency(smokeFree, active),
    last_confirmed_date: today,
  })
}

/** Slip with no freeze: reset current streak to 0, start a new streak today. */
export async function breakStreak(userId: string): Promise<void> {
  const s = await getStreak(userId)
  if (!s) return
  const tz = await getTimezone(userId)
  const today = todayKey(tz)
  const active = s.active_days_in_attempt + 1
  await patch(userId, {
    current_streak_days: 0,
    streak_start_date: today,
    active_days_in_attempt: active,
    consistency_rate: consistency(s.smoke_free_days_in_attempt, active),
    last_confirmed_date: today,
  })
}

/** few_days slip: burn ALL freezes and reset the streak. Streak Spec §B2. */
export async function consumeAllFreezes(userId: string): Promise<void> {
  const s = await getStreak(userId)
  if (!s) return
  const tz = await getTimezone(userId)
  const today = todayKey(tz)
  const active = s.active_days_in_attempt + 1
  await patch(userId, {
    freeze_stock: 0,
    current_streak_days: 0,
    streak_start_date: today,
    active_days_in_attempt: active,
    consistency_rate: consistency(s.smoke_free_days_in_attempt, active),
    last_confirmed_date: today,
  })
}

/**
 * return_to_smoking: close the current quit_attempts row and zero the
 * attempt-scoped counters. A new attempt (and freeze re-allocation) is created by
 * the restart flow, not here. Streak Spec §B2 "On return to smoking".
 */
export async function fullRelapse(userId: string): Promise<void> {
  await supabase
    .from('quit_attempts')
    .update({ ended_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('ended_at', null)
    .throwOnError()

  await patch(userId, {
    current_streak_days: 0,
    smoke_free_days_in_attempt: 0,
    active_days_in_attempt: 0,
    consistency_rate: 0,
    streak_status: 'active',
  })
}

/**
 * Restart the quit journey from C3 Restart Nudge / return modal (Slip Threshold
 * §B5, Architecture Guide §11). Closes the current attempt, opens a fresh one
 * (quit_date = today), resets the attempt-scoped streak counters + freeze
 * allocation for period 0, and clears the slip pattern state.
 *
 * Note: the richer restart re-engagement flow (dependency re-assessment, trigger
 * pre-fill — T-A Decision 2) is deferred; this performs the data-model restart
 * the spec requires. dependency_level carries forward from the prior attempt.
 */
export async function restartAttempt(userId: string): Promise<void> {
  const s = await getStreak(userId)
  const tz = await getTimezone(userId)
  const today = todayKey(tz)
  const dependency: DependencyLevel = s?.dependency_level ?? 'moderate'
  const freezeMax = FREEZE_MATRIX[dependency][0]

  // Close any open attempt, then open a new one dated today.
  await supabase
    .from('quit_attempts')
    .update({ ended_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('ended_at', null)
    .throwOnError()

  await supabase
    .from('quit_attempts')
    .insert({ user_id: userId, quit_date: today, dependency_level: dependency, ended_at: null })
    .throwOnError()

  await patch(userId, {
    current_streak_days: 0,
    smoke_free_days_in_attempt: 0,
    active_days_in_attempt: 0,
    consistency_rate: 0,
    freeze_period: 0,
    freeze_max_current_period: freezeMax,
    freeze_stock: freezeMax,
    streak_status: 'active',
    streak_start_date: today,
    last_confirmed_date: today,
  })

  await supabase
    .from('slip_state')
    .update({ red_flag_count: 0, pattern_window_open: false, last_slip_date: null })
    .eq('user_id', userId)
    .throwOnError()
}

export async function pauseStreak(userId: string): Promise<void> {
  await patch(userId, { streak_status: 'paused', paused_at: new Date().toISOString() })
}

/**
 * Resume from pause: streak restarts at Day 1, freezes re-allocated for the
 * current period, consistency continues from the frozen value. Streak Spec §B2.
 */
export async function resumeStreak(userId: string): Promise<void> {
  const s = await getStreak(userId)
  if (!s) return
  const tz = await getTimezone(userId)
  const today = todayKey(tz)
  const freezeMax = FREEZE_MATRIX[s.dependency_level][s.freeze_period as 0 | 1 | 2 | 3]
  await patch(userId, {
    streak_status: 'active',
    current_streak_days: 0,
    streak_start_date: today,
    freeze_stock: freezeMax,
    freeze_max_current_period: freezeMax,
    last_confirmed_date: today,
    paused_at: null,
  })
}

/**
 * Undo an optimistic SOS 'Better' confirmation when a slip is logged the same
 * day (Streak Spec §8). Only fires when confirmation_source = 'sos' AND today is
 * the confirmed date. Reverses the +1s; the caller then applies slip logic.
 */
export async function reverseSosConfirmation(userId: string): Promise<boolean> {
  const s = await getStreak(userId)
  if (!s) return false
  const tz = await getTimezone(userId)
  const today = todayKey(tz)
  if (s.confirmation_source !== 'sos' || s.last_confirmed_date !== today) return false

  await patch(userId, {
    current_streak_days: Math.max(0, s.current_streak_days - 1),
    lifetime_smoke_free_days: Math.max(0, s.lifetime_smoke_free_days - 1),
    smoke_free_days_in_attempt: Math.max(0, s.smoke_free_days_in_attempt - 1),
    active_days_in_attempt: Math.max(0, s.active_days_in_attempt - 1),
    confirmation_source: 'log',
  })
  return true
}

/**
 * Advance freeze_period when days_since_quit crosses a boundary (Day 15/29/91 →
 * period 1/2/3). On advance: re-allocate freeze_stock, apply any pending
 * dependency upgrade, reset the slip pattern window. Runs on app open when a quit
 * date is set. Streak Spec §B2 "Stage Transition Behaviour". Returns true if it advanced.
 */
export async function checkFreezePeriodAdvance(userId: string, quitDate: string | null): Promise<boolean> {
  if (!quitDate) return false
  const s = await getStreak(userId)
  if (!s || s.streak_status === 'paused') return false

  const days = differenceInCalendarDays(new Date(), parseISO(quitDate))
  const targetPeriod = days >= 91 ? 3 : days >= 29 ? 2 : days >= 15 ? 1 : 0
  if (targetPeriod <= s.freeze_period) return false

  const dependency = s.dependency_level_pending ?? s.dependency_level
  const freezeMax = FREEZE_MATRIX[dependency][targetPeriod as 0 | 1 | 2 | 3]

  await patch(userId, {
    freeze_period: targetPeriod,
    freeze_max_current_period: freezeMax,
    freeze_stock: freezeMax,
    dependency_level: dependency,
    dependency_level_pending: null,
  })
  // Pattern window resets at a period boundary (Slip Threshold §B2.3).
  await supabase
    .from('slip_state')
    .update({ red_flag_count: 0, pattern_window_open: false })
    .eq('user_id', userId)
    .throwOnError()
  return true
}

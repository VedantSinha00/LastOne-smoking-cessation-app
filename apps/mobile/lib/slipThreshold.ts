import { differenceInCalendarDays, parseISO } from 'date-fns'
import { supabase } from './supabase'
import { todayKey } from './dateKey'
import { consumeFreeze, breakStreak, consumeAllFreezes, reverseSosConfirmation } from './streak'

export type SlipType = 'one_off' | 'few_days' | 'return_to_smoking'

/** What the post-slip screen (C3) shows (Slip Threshold Spec §4). */
export type SlipRoute = 'warm' | 'restart_nudge'

async function getTimezone(userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('timezone').eq('id', userId).maybeSingle()
  return data?.timezone ?? 'Asia/Kolkata'
}

/**
 * Decides the C3 outcome for a slip and applies the freeze/streak side effects
 * (Slip Threshold Spec §B2.1 / Architecture Guide §11).
 *
 * Runs the SOS-reversal check first: if today's smoke-free day was confirmed via
 * SOS 'Better' and a slip is now logged, undo that confirmation before applying
 * slip logic (Streak Spec §8) — net effect of "SOS Better then same-day slip" is
 * a slip.
 *
 * one_off routing (freeze_stock / red_flag_count / days_since_last_slip):
 *   freeze > 0                      → consume 1 freeze, red_flag = 0      → 'warm'
 *   freeze 0, ≥6d since last slip   → break, red_flag = 0                → 'warm'
 *   freeze 0, <6d, red_flag < 2     → break, red_flag++                  → 'warm'
 *   freeze 0, <6d, red_flag ≥ 2     → (streak already broken on a prior   → 'restart_nudge'
 *                                       slip) show the nudge
 *
 * few_days → consume ALL freezes, red_flag unchanged → 'warm' (handled here too
 * so the caller has one entry point; Streak Spec §B2).
 */
export async function routeAfterSlip(userId: string, slipType: SlipType): Promise<SlipRoute> {
  // Reverse an optimistic same-day SOS confirmation before applying slip logic.
  await reverseSosConfirmation(userId)

  const tz = await getTimezone(userId)
  const today = todayKey(tz)

  if (slipType === 'few_days') {
    await consumeAllFreezes(userId)
    // red_flag_count unchanged; just stamp the slip date.
    await supabase.from('slip_state').update({ last_slip_date: today }).eq('user_id', userId).throwOnError()
    return 'warm'
  }

  // one_off — read freeze_stock + slip_state.
  const [{ data: streak }, { data: slip }] = await Promise.all([
    supabase.from('streak_record').select('freeze_stock').eq('user_id', userId).maybeSingle(),
    supabase.from('slip_state').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const freezeStock = streak?.freeze_stock ?? 0
  const redFlag = slip?.red_flag_count ?? 0
  const lastSlip = slip?.last_slip_date ?? null
  const daysSinceLastSlip = lastSlip
    ? differenceInCalendarDays(parseISO(today), parseISO(lastSlip))
    : Infinity

  // Phase 1 — freeze available.
  if (freezeStock > 0) {
    await consumeFreeze(userId)
    await setSlipState(userId, { red_flag_count: 0, last_slip_date: today, pattern_window_open: false })
    return 'warm'
  }

  // Phase 3 — pattern already confirmed: nudge, no further streak change.
  if (daysSinceLastSlip < 6 && redFlag >= 2) {
    await setSlipState(userId, { last_slip_date: today, pattern_window_open: true })
    return 'restart_nudge'
  }

  // Freeze 0 → the streak breaks in all remaining cases.
  await breakStreak(userId)

  // Clean window → reset the pattern.
  if (daysSinceLastSlip >= 6) {
    await setSlipState(userId, { red_flag_count: 0, last_slip_date: today, pattern_window_open: false })
    return 'warm'
  }

  // Within window, under threshold → raise a flag.
  await setSlipState(userId, {
    red_flag_count: redFlag + 1,
    last_slip_date: today,
    pattern_window_open: true,
  })
  return 'warm'
}

async function setSlipState(
  userId: string,
  fields: { red_flag_count?: number; last_slip_date?: string; pattern_window_open?: boolean },
): Promise<void> {
  await supabase.from('slip_state').update(fields).eq('user_id', userId).throwOnError()
}

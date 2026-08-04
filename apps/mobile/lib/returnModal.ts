import { supabase } from './supabase'
import { todayKey, yesterdayKey } from './dateKey'
import type { Stk2Choice } from '../components/home/ReturnModalShort'
import type { Stk3Choice } from '../components/home/ReturnModalLong'

/**
 * Return-modal resolution writes (Streak Spec §5 / §B2). Detection lives in
 * useReturnModal (Step 8); these apply the streak side effects when the user
 * picks an option. All date math uses the user's stored timezone.
 */

async function ctx(userId: string) {
  // These selects previously swallowed their errors, so a failed/empty read fell
  // through to `if (!streak) return` — a no-op that resolved successfully while
  // writing nothing, lifting the gate with the streak still unreconciled. Fail
  // loudly instead; the caller surfaces it and leaves the options retryable.
  const { data: profile, error: profileErr } = await supabase
    .from('profiles').select('timezone').eq('id', userId).maybeSingle()
  if (profileErr) throw profileErr
  const tz = profile?.timezone ?? 'Asia/Kolkata'

  const { data: streak, error: streakErr } = await supabase
    .from('streak_record').select('*').eq('user_id', userId).maybeSingle()
  if (streakErr) throw streakErr
  if (!streak) {
    throw new Error('No streak_record row for user — cannot resolve return modal')
  }
  return { tz, streak }
}

/**
 * STK-2 (1–4 days absent). Streak Spec §5 table:
 *  - didnt_smoke:       +days_missed to streak & lifetime, last_confirmed = yesterday
 *  - one_or_two w/freeze: streak frozen, lifetime credit (1–2d: +0; 3–4d: +days−1), last_confirmed = yesterday
 *  - one_or_two no freeze: streak = 0, start = today, last_confirmed = yesterday
 *  - smoked_regularly:  streak = 0, last_confirmed = today → STK-5
 */
export async function resolveStk2(userId: string, choice: Stk2Choice, daysMissed: number): Promise<void> {
  const { tz, streak } = await ctx(userId)
  const yesterday = yesterdayKey(tz)
  const today = todayKey(tz)

  if (choice === 'didnt_smoke') {
    const current = streak.current_streak_days + daysMissed
    await supabase.from('streak_record').update({
      current_streak_days: current,
      lifetime_smoke_free_days: streak.lifetime_smoke_free_days + daysMissed,
      longest_streak_ever: Math.max(streak.longest_streak_ever, current),
      last_confirmed_date: yesterday,
    }).eq('user_id', userId).throwOnError()
    return
  }

  if (choice === 'one_or_two') {
    if (streak.freeze_stock > 0) {
      const lifetimeCredit = daysMissed >= 3 ? daysMissed - 1 : 0
      await supabase.from('streak_record').update({
        freeze_stock: streak.freeze_stock - 1,
        lifetime_smoke_free_days: streak.lifetime_smoke_free_days + lifetimeCredit,
        last_confirmed_date: yesterday,
      }).eq('user_id', userId).throwOnError()
    } else {
      await supabase.from('streak_record').update({
        current_streak_days: 0,
        streak_start_date: today,
        last_confirmed_date: yesterday,
      }).eq('user_id', userId).throwOnError()
    }
    return
  }

  // smoked_regularly → reset, routes to STK-5
  await supabase.from('streak_record').update({
    current_streak_days: 0,
    last_confirmed_date: today,
  }).eq('user_id', userId).throwOnError()
}

/**
 * STK-3 (5+ days absent; streak already auto-paused). Streak Spec §5 table:
 *  - didnt_smoke:    +days_missed, status active, lifetime += days, last_confirmed = yesterday
 *  - treat_as_break: streak = 0, start = today, status active, last_confirmed = today
 *  - did_smoke:      identical to treat_as_break
 */
export async function resolveStk3(userId: string, choice: Stk3Choice, daysMissed: number): Promise<void> {
  const { tz, streak } = await ctx(userId)
  const yesterday = yesterdayKey(tz)
  const today = todayKey(tz)

  if (choice === 'didnt_smoke') {
    const current = streak.current_streak_days + daysMissed
    await supabase.from('streak_record').update({
      current_streak_days: current,
      lifetime_smoke_free_days: streak.lifetime_smoke_free_days + daysMissed,
      longest_streak_ever: Math.max(streak.longest_streak_ever, current),
      streak_status: 'active',
      last_confirmed_date: yesterday,
      paused_at: null,
    }).eq('user_id', userId).throwOnError()
    return
  }

  // treat_as_break / did_smoke → reset and resume active from today
  await supabase.from('streak_record').update({
    current_streak_days: 0,
    streak_start_date: today,
    streak_status: 'active',
    last_confirmed_date: today,
    paused_at: null,
  }).eq('user_id', userId).throwOnError()
}

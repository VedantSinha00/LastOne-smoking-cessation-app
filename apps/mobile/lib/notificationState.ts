import { supabase } from './supabase'
import type { NotificationTier } from '../types/database'

/**
 * Auto-reduce rule (Notifications Spec §B2.4). When a user ignores 3 consecutive
 * notifications, their EFFECTIVE tier steps down one level for 7 days, then reverts
 * to their stored preference. Opening any notification resets the counter.
 *
 * notification_state holds: consecutive_ignored, auto_reduce_active_until,
 * effective_tier. The user's STORED preference lives on profiles.notification_preference;
 * effective_tier is what the scheduler actually obeys.
 *
 * Wiring note (local-only build): recordOpened fires on tap (handler) and
 * revertExpiredAutoReduce on app open (reconcile). recordIgnored has NO caller yet
 * — marking a notification 'ignored' requires the server delivery pipeline to
 * detect a non-open, which arrives with push delivery at Step 21. The rule is
 * implemented and correct; it simply has no trigger until then.
 */

const STEP_DOWN: Record<NotificationTier, NotificationTier | null> = {
  app_decides: 'few_daily',
  few_daily: 'on_demand',
  on_demand: null, // already at the floor — no further reduction
}

const SEVEN_DAYS_MS = 7 * 86_400_000

/**
 * Record that a notification was ignored. Increments consecutive_ignored; on the
 * 3rd consecutive ignore, steps the effective tier down one level for 7 days and
 * resets the counter. No-op at the on_demand floor. Best-effort — never throws.
 */
export async function recordIgnored(userId: string): Promise<void> {
  try {
    const { data: state } = await supabase
      .from('notification_state')
      .select('consecutive_ignored, effective_tier')
      .eq('user_id', userId)
      .maybeSingle()
    if (!state) return

    const next = (state.consecutive_ignored ?? 0) + 1
    if (next < 3) {
      await supabase
        .from('notification_state')
        .update({ consecutive_ignored: next })
        .eq('user_id', userId)
        .throwOnError()
      return
    }

    // 3rd consecutive ignore → step down (if possible) and reset the counter.
    const reduced = STEP_DOWN[state.effective_tier]
    if (reduced === null) {
      // At floor: keep counter capped at 3 so we don't grow unbounded.
      await supabase
        .from('notification_state')
        .update({ consecutive_ignored: 3 })
        .eq('user_id', userId)
        .throwOnError()
      return
    }
    await supabase
      .from('notification_state')
      .update({
        effective_tier: reduced,
        auto_reduce_active_until: new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
        consecutive_ignored: 0,
      })
      .eq('user_id', userId)
      .throwOnError()
  } catch (err) {
    console.warn('recordIgnored skipped:', err)
  }
}

/** Reset the consecutive-ignored counter on any notification opened (§B2.4). */
export async function recordOpened(userId: string): Promise<void> {
  try {
    await supabase
      .from('notification_state')
      .update({ consecutive_ignored: 0 })
      .eq('user_id', userId)
      .throwOnError()
  } catch (err) {
    console.warn('recordOpened skipped:', err)
  }
}

/**
 * On app open: if an auto-reduce window has expired, restore the effective tier to
 * the user's stored preference and clear the window (§B2.4). Returns true if a
 * revert happened (caller may want to reschedule under the restored tier).
 */
export async function revertExpiredAutoReduce(userId: string): Promise<boolean> {
  try {
    const [{ data: state }, { data: profile }] = await Promise.all([
      supabase
        .from('notification_state')
        .select('auto_reduce_active_until')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('notification_preference')
        .eq('id', userId)
        .maybeSingle(),
    ])
    if (!state?.auto_reduce_active_until) return false
    if (new Date(state.auto_reduce_active_until).getTime() > Date.now()) return false

    await supabase
      .from('notification_state')
      .update({
        effective_tier: profile?.notification_preference ?? 'app_decides',
        auto_reduce_active_until: null,
      })
      .eq('user_id', userId)
      .throwOnError()
    return true
  } catch (err) {
    console.warn('revertExpiredAutoReduce skipped:', err)
    return false
  }
}

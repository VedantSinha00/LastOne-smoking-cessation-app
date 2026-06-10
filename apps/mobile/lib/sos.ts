import { supabase } from './supabase'
import type { PostToolState } from '../types/database'

/**
 * SOS helpers (Architecture Guide §9.8 / Logging Spec §6, §B5).
 * Tool scoring is an atomic upsert via the increment_tool_score Postgres RPC.
 */

/**
 * Adjust a tool's score (+1 'Better' / -1 'Same'). Atomic server-side upsert on
 * user_tool_scores. Requires the increment_tool_score RPC to be deployed
 * (Step 9 DB task). Failures are swallowed — a missing/failed score update must
 * never block the SOS flow.
 */
export async function updateToolScore(
  userId: string,
  toolId: string,
  delta: number,
  postToolState: PostToolState | null,
): Promise<void> {
  try {
    await supabase.rpc('increment_tool_score', {
      p_user_id: userId,
      p_tool_id: toolId,
      p_delta: delta,
      p_post_tool_state: postToolState,
    })
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[sos] increment_tool_score failed (RPC deployed?)', e)
    }
  }
}

/**
 * Whether SOS-3 should restrict to escalation-only options. Per guide §9.8:
 * failed_sos_count >= 2 in the 24h window → show only Call a Friend + Quit
 * Specialist Line. Reads user_sos_state. Best-effort; defaults to false.
 */
export async function checkSosEscalation(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_sos_state')
      .select('failed_sos_count')
      .eq('user_id', userId)
      .maybeSingle()
    return (data?.failed_sos_count ?? 0) >= 2
  } catch {
    return false
  }
}

const WINDOW_MS = 24 * 60 * 60 * 1000 // 24h failed-SOS window (§8.5)

/**
 * Escalation level for the CURRENT SOS surface (Coping Tools §8.1 ladder):
 *   0 — normal waterfall (failed_sos_count 0–1)
 *   1 — Call a Friend pinned to slot 1, slots 2–3 fill normally (count == 2)
 *   2 — only Call a Friend + Quit Specialist Line, waterfall suspended (count >= 3)
 * Applies the 24h window expiry (§8.5) on read, so a stale window reports level 0.
 */
export type SosEscalationLevel = 0 | 1 | 2

export async function getSosEscalationLevel(userId: string): Promise<SosEscalationLevel> {
  try {
    const { data } = await supabase
      .from('user_sos_state')
      .select('failed_sos_count, window_started_at')
      .eq('user_id', userId)
      .maybeSingle()
    if (!data) return 0
    // Window expiry: a first-failure older than 24h resets the count (§8.5).
    if (
      data.window_started_at &&
      Date.now() - new Date(data.window_started_at).getTime() > WINDOW_MS
    ) {
      await resetSosWindow(userId)
      return 0
    }
    const count = data.failed_sos_count ?? 0
    if (count >= 3) return 2
    if (count === 2) return 1
    return 0
  } catch {
    return 0
  }
}

/** Reset the failed-SOS window to a clean state (§8.5). Best-effort. */
export async function resetSosWindow(userId: string): Promise<void> {
  try {
    await supabase
      .from('user_sos_state')
      .upsert(
        { user_id: userId, failed_sos_count: 0, consecutive_sos_successes: 0, window_started_at: null },
        { onConflict: 'user_id' },
      )
  } catch {
    /* non-fatal */
  }
}

/**
 * Record the outcome of an SOS session into user_sos_state (§B2 failed_sos_count
 * logic). Library sessions must NOT call this — only real SOS sessions count.
 *   - 'same' | 'smoked' → failed_sos_count += 1, start window if absent, reset successes.
 *   - 'better'          → consecutive_sos_successes += 1; at 2, reset the window.
 * Best-effort; a failure here must never block the SOS flow.
 */
export async function recordSosOutcome(
  userId: string,
  outcome: PostToolState,
): Promise<void> {
  try {
    const { data } = await supabase
      .from('user_sos_state')
      .select('failed_sos_count, consecutive_sos_successes, window_started_at')
      .eq('user_id', userId)
      .maybeSingle()
    const failed = data?.failed_sos_count ?? 0
    const successes = data?.consecutive_sos_successes ?? 0
    const windowStart = data?.window_started_at ?? null

    if (outcome === 'better') {
      const next = successes + 1
      const reset = next >= 2 // 2 consecutive successes clears the window (§8.5)
      await supabase.from('user_sos_state').upsert(
        {
          user_id: userId,
          failed_sos_count: reset ? 0 : failed,
          consecutive_sos_successes: reset ? 0 : next,
          window_started_at: reset ? null : windowStart,
        },
        { onConflict: 'user_id' },
      )
    } else {
      // 'same' or 'smoked' → a failed session.
      await supabase.from('user_sos_state').upsert(
        {
          user_id: userId,
          failed_sos_count: failed + 1,
          consecutive_sos_successes: 0,
          window_started_at: windowStart ?? new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
    }
  } catch {
    /* non-fatal */
  }
}

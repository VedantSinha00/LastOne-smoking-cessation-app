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

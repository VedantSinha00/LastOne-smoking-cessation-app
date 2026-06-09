export type SlipType = 'one_off' | 'few_days' | 'return_to_smoking'

/** What C3 shows after a slip is logged (Architecture Guide §11). */
export type SlipRoute = 'warm' | 'restart_nudge'

/**
 * Decides what the post-slip screen (C3) shows and applies the freeze/streak
 * side effects (Architecture Guide §11 / Slip Threshold Spec).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * STEP 9 STATUS: STUB. Final signature so Flow C and the SOS 'I smoked' path
 * compile and route NOW. Returns 'warm' (the non-escalating default) so the slip
 * flow always lands on the gentle C3 response during Step 9. The real
 * red_flag_count / freeze / restart-nudge logic lands in Step 11.
 * ──────────────────────────────────────────────────────────────────────────
 */
export async function routeAfterSlip(
  userId: string,
  slipType: SlipType,
): Promise<SlipRoute> {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[slipThreshold stub] routeAfterSlip', { userId, slipType })
  }
  return 'warm'
}

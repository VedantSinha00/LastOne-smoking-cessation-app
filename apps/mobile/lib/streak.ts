import type { ConfirmationSource } from '../types/database'

/**
 * All streak DB writes live here (Architecture Guide §10). Functions:
 * confirmSmokeFreeDay, consumeFreeze, breakStreak, consumeAllFreezes,
 * fullRelapse, pauseStreak, resumeStreak, reverseSosConfirmation.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * STEP 9 STATUS: STUBS. These have the final signatures so the logging flows
 * (Flow B, Flow C, SOS) compile and route correctly NOW, but the streak math is
 * deferred to Step 10. Each stub logs in __DEV__ and is a safe no-op against the
 * DB — it never corrupts streak_record. Fill in the real logic in Step 10
 * (Streak Spec §B, esp. §8 SOS reversal).
 * ──────────────────────────────────────────────────────────────────────────
 */

function stub(name: string, args: Record<string, unknown>) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[streak stub] ${name}`, args)
  }
}

/** Flow B / SOS 'Better' commit a smoke-free day. source = 'log' | 'sos'. */
export async function confirmSmokeFreeDay(
  userId: string,
  source: ConfirmationSource,
): Promise<void> {
  stub('confirmSmokeFreeDay', { userId, source })
}

/** one_off slip with a freeze available — decrement freeze_stock, streak unchanged. */
export async function consumeFreeze(userId: string): Promise<void> {
  stub('consumeFreeze', { userId })
}

/** Reset current_streak_days to 0 (slip with no freeze). */
export async function breakStreak(userId: string): Promise<void> {
  stub('breakStreak', { userId })
}

/** few_days slip — burn all remaining freezes. */
export async function consumeAllFreezes(userId: string): Promise<void> {
  stub('consumeAllFreezes', { userId })
}

/** return_to_smoking — close the current quit_attempts row, reset streak. */
export async function fullRelapse(userId: string): Promise<void> {
  stub('fullRelapse', { userId })
}

export async function pauseStreak(userId: string): Promise<void> {
  stub('pauseStreak', { userId })
}

export async function resumeStreak(userId: string): Promise<void> {
  stub('resumeStreak', { userId })
}

/**
 * If a smoke-free day was confirmed via SOS ('Better') and a slip is logged the
 * same day, undo the optimistic SOS confirmation before applying slip logic
 * (Streak Spec §8). Called from slip flows.
 */
export async function reverseSosConfirmation(userId: string): Promise<void> {
  stub('reverseSosConfirmation', { userId })
}

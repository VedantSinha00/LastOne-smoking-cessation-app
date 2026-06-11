import type { NotificationType, NotificationTier } from '../types/database'

/**
 * Notification gating — pure logic from LastOne_Notifications_Spec_V1_2 §B2.
 *
 * These functions decide, for a given notification, WHETHER and WHEN it may fire
 * given the user's preference tier, quiet hours, and the on_demand type filter.
 * They are pure (no I/O) so they can be unit-reasoned and reused by both the
 * local scheduler (Step 15) and the server delivery pipeline (Step 21).
 */

// ── on_demand eligibility (§6 "on_demand Eligible Notifications") ─────────────
// The on_demand user has opted out of being pushed to; only this defined set of
// high-importance events reaches them. Everything else waits for an app open.
const ON_DEMAND_ELIGIBLE: ReadonlySet<NotificationType> = new Set<NotificationType>([
  'N-OB-01', 'N-OB-02', 'N-OB-03', 'N-OB-04', 'N-OB-05',
  'N-CON-01', 'N-CON-02', 'N-CON-03', 'N-CON-04', 'N-CON-05', 'N-CON-06',
  'N-INS-01', 'N-INS-03',
  'N-PROF-01',
  // N-PAU-01…04 fire for ALL tiers including on_demand (Decision 10), so they are
  // eligible regardless — included here so isEligibleForTier short-circuits true.
  'N-PAU-01', 'N-PAU-02', 'N-PAU-03', 'N-PAU-04',
])

/**
 * Whether a notification type may fire under the given EFFECTIVE tier.
 * - on_demand: only the eligible set above fires; everything else is suppressed.
 * - few_daily / app_decides: all types eligible (quantity is capped separately by
 *   stage cadence + priority ordering, not by this filter).
 */
export function isEligibleForTier(
  type: NotificationType,
  effectiveTier: NotificationTier,
): boolean {
  if (effectiveTier === 'on_demand') return ON_DEMAND_ELIGIBLE.has(type)
  return true
}

// ── Quiet hours (§B2.2) ──────────────────────────────────────────────────────

/** Parse an 'HH:MM[:SS]' local time string to minutes-since-midnight. */
function toMinutes(hhmmss: string): number {
  const [h, m] = hhmmss.split(':').map((n) => parseInt(n, 10))
  return (h % 24) * 60 + (m || 0)
}

export interface QuietHours {
  enabled: boolean
  start: string | null // 'HH:MM:SS'
  end: string | null // 'HH:MM:SS'
}

/**
 * True if `at` falls inside the quiet-hours window. Handles overnight ranges
 * (start > end spans midnight, e.g. 22:00 → 07:00).
 */
export function isWithinQuietHours(at: Date, qh: QuietHours): boolean {
  if (!qh.enabled || !qh.start || !qh.end) return false
  const now = at.getHours() * 60 + at.getMinutes()
  const start = toMinutes(qh.start)
  const end = toMinutes(qh.end)
  if (start === end) return false // zero-width window = no quiet hours
  if (start < end) return now >= start && now < end // same-day window
  return now >= start || now < end // overnight window
}

/**
 * Given a desired fire time, return the time the notification should actually be
 * delivered. Notifications scheduled during quiet hours defer to quiet_hours_end;
 * N-STK-01 (daily check-in) is the sole exception — it bypasses quiet hours
 * (Decision 3). Returns the input unchanged when no shift is needed.
 */
export function applyQuietHours(
  type: NotificationType,
  desired: Date,
  qh: QuietHours,
): Date {
  if (type === 'N-STK-01') return desired // bypasses quiet hours (Decision 3)
  if (!isWithinQuietHours(desired, qh) || !qh.end) return desired

  // Shift forward to quiet_hours_end on the appropriate calendar day.
  const endMin = toMinutes(qh.end)
  const shifted = new Date(desired)
  shifted.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0)
  // Overnight window whose end is "tomorrow morning": if the desired time is at or
  // after start (late evening), quiet_hours_end lands on the next calendar day.
  if (qh.start && toMinutes(qh.start) > endMin) {
    const desiredMin = desired.getHours() * 60 + desired.getMinutes()
    if (desiredMin >= toMinutes(qh.start)) shifted.setDate(shifted.getDate() + 1)
  }
  return shifted
}

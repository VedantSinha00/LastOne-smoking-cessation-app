import { differenceInCalendarDays, parseISO } from 'date-fns'

/**
 * Recovery stage derived from how long the user has been quit.
 * Architecture Guide §8.1 / Foundation 1 (Stage System).
 *
 *   0 — Learning Week / pre-quit (no quit date, or day 0)
 *   1 — First 72 hours      (days 1–3)
 *   2 — Days 4–7
 *   3 — Weeks 2–3           (days 8–21)
 *   4 — Weeks 4–8           (days 22–56)
 *   5 — Months 3+           (days 57+)
 */
export type Stage = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Derive the current stage from a quit date (ISO `yyyy-MM-dd` or null).
 *
 * Day 0 stays in Stage 0; Stage 1 begins once `days >= 1`. Uses calendar-day
 * differences (not 24h windows) so a quit set yesterday reads as Day 1
 * regardless of the time of day.
 */
export function deriveStage(quitDate: string | null | undefined): Stage {
  if (!quitDate) return 0
  const days = differenceInCalendarDays(new Date(), parseISO(quitDate))
  if (days < 1) return 0
  if (days <= 3) return 1
  if (days <= 7) return 2
  if (days <= 21) return 3
  if (days <= 56) return 4
  return 5
}

/** Whole calendar days since the quit date. Negative/0 before quit day. */
export function daysSinceQuit(quitDate: string | null | undefined): number {
  if (!quitDate) return 0
  return differenceInCalendarDays(new Date(), parseISO(quitDate))
}

/** Short stage label for display (StreakBar, focus copy). */
export const STAGE_NAMES: Record<Stage, string> = {
  0: 'Learning Week',
  1: 'First 72 Hours',
  2: 'Days 4–7',
  3: 'Weeks 2–3',
  4: 'Weeks 4–8',
  5: 'Long-term',
}

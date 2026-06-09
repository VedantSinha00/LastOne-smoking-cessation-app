import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useStreakRecord } from './useStreakRecord'

export type ReturnModalType = 'none' | 'stk2' | 'stk3'

export interface ReturnModalState {
  type: ReturnModalType
  /** Whole days the user was absent (today and last_confirmed excluded). */
  daysMissed: number
  isLoading: boolean
}

/**
 * Decides which return modal (if any) must gate the home screen on app open
 * (Architecture Guide §8.4 / Streak Spec §5).
 *
 *   daysMissed = calendarDays(today, last_confirmed_date) − 1
 *     <= 0   → 'none'  (confirmed today or yesterday — nothing missed)
 *     1–4    → 'stk2'  (Short Absence return modal)
 *     >= 5   → 'stk3'  (Long Absence return flow; streak already auto-paused)
 *
 * The modal gates home entirely — no dismiss, no skip (Architecture Guide §8.5).
 * Detection only; the write logic for each option lands in lib/streak.ts (Step 10).
 */
export function useReturnModal(): ReturnModalState {
  const { data: streak, isLoading } = useStreakRecord()

  if (isLoading || !streak?.last_confirmed_date) {
    return { type: 'none', daysMissed: 0, isLoading }
  }

  const daysMissed =
    differenceInCalendarDays(new Date(), parseISO(streak.last_confirmed_date)) - 1

  let type: ReturnModalType = 'none'
  if (daysMissed >= 5) type = 'stk3'
  else if (daysMissed >= 1) type = 'stk2'

  return { type, daysMissed, isLoading: false }
}

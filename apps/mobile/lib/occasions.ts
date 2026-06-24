/**
 * Occasion nudge — V1 hardcoded calendar (Personal Goals Spec §B2, §3).
 *
 * Calendar-based only in V1 (no trend/social listening). Checked on every app
 * open; the nudge is eligible when an occasion is 3–5 days out (inclusive),
 * not already dismissed this calendar year, and the user is past Stage 0.
 * A missed window is skipped for the year — never fires retroactively.
 *
 * ⚠ MAINTENANCE: movable dates (Diwali, Raksha Bandhan, Mother's/Father's Day…)
 * are listed per-year below and must be extended annually (Architecture Guide
 * Step 17). Currently covers 2026–2027.
 *
 * Push notifications for occasions (N-GOAL-01/02) are server-sent and deferred
 * to Step 21 with the other Edge-Function notifications — V1 tonight renders
 * the in-app card on GOAL-01 only. Birthday nudge: profiles has no
 * date_of_birth column in V1 onboarding, so per spec §8.7 it is silently
 * skipped (the hook passes null).
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { differenceInCalendarDays, parseISO } from 'date-fns'

export interface OccasionDef {
  id: string
  name: string
  /** Concrete dates, one per covered year, ISO yyyy-MM-dd. */
  dates: string[]
}

export const OCCASION_CALENDAR: OccasionDef[] = [
  { id: 'new_year', name: 'New Year', dates: ['2027-01-01'] },
  { id: 'valentines_day', name: "Valentine's Day", dates: ['2026-02-14', '2027-02-14'] },
  { id: 'mothers_day', name: "Mother's Day", dates: ['2026-05-10', '2027-05-09'] },
  { id: 'fathers_day', name: "Father's Day", dates: ['2026-06-21', '2027-06-20'] },
  { id: 'friendship_day', name: 'Friendship Day', dates: ['2026-08-02', '2027-08-01'] },
  { id: 'raksha_bandhan', name: 'Raksha Bandhan', dates: ['2026-08-28', '2027-08-17'] },
  { id: 'diwali', name: 'Diwali', dates: ['2026-11-08', '2027-10-29'] },
]

/** Fire window: 3–5 days before the occasion, inclusive (Spec §B2). */
const WINDOW_MIN = 3
const WINDOW_MAX = 5

const dismissKey = (occasionId: string, year: number) =>
  `occasion_dismissed_${occasionId}_${year}`

export interface ActiveOccasion {
  id: string
  name: string
  date: string
  daysUntil: number
}

/**
 * First occasion (calendar order) whose window is open and which hasn't been
 * dismissed this calendar year. Returns null in Stage 0 (silent conditional —
 * Spec §8.3). Birthday handled by the same window when dateOfBirth is provided;
 * null skips it silently (§8.7).
 */
export async function findActiveOccasion(
  stage: number,
  dateOfBirth: string | null,
  now: Date = new Date(),
): Promise<ActiveOccasion | null> {
  if (stage < 1) return null

  const candidates: ActiveOccasion[] = []

  for (const occ of OCCASION_CALENDAR) {
    for (const date of occ.dates) {
      const days = differenceInCalendarDays(parseISO(date), now)
      if (days >= WINDOW_MIN && days <= WINDOW_MAX) {
        candidates.push({ id: occ.id, name: occ.name, date, daysUntil: days })
      }
    }
  }

  if (dateOfBirth) {
    // Birthday in the current year (or next, when it already passed).
    const dob = parseISO(dateOfBirth)
    for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
      const bday = new Date(year, dob.getMonth(), dob.getDate())
      const days = differenceInCalendarDays(bday, now)
      if (days >= WINDOW_MIN && days <= WINDOW_MAX) {
        candidates.push({
          id: 'birthday',
          name: 'Your birthday',
          date: bday.toISOString().slice(0, 10),
          daysUntil: days,
        })
      }
    }
  }

  for (const c of candidates) {
    if (!(c.daysUntil >= WINDOW_MIN && c.daysUntil <= WINDOW_MAX)) continue
    const year = parseISO(c.date).getFullYear()
    const dismissed = await AsyncStorage.getItem(dismissKey(c.id, year))
    if (!dismissed) return c
  }
  return null
}

/** One nudge per occasion per calendar year — dismissal is final for the year. */
export async function dismissOccasion(occasion: ActiveOccasion): Promise<void> {
  const year = parseISO(occasion.date).getFullYear()
  await AsyncStorage.setItem(dismissKey(occasion.id, year), '1')
}

/**
 * Card copy (Spec §B2): goal-contextual when the user has active goals
 * (references the nearest goal by name), generic otherwise.
 */
export function occasionCopy(
  occasion: ActiveOccasion,
  savedLabel: string,
  nearestGoalName: string | null,
): string {
  if (nearestGoalName) {
    return `${occasion.name} is coming up. You've saved ${savedLabel} — "${nearestGoalName}" is within reach.`
  }
  return `${occasion.name} is coming up. You've saved ${savedLabel}. Thinking of a gift? Set a goal.`
}

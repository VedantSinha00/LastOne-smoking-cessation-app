/**
 * Timezone-aware calendar-date helpers shared across streak/logging logic.
 * All streak date comparisons run against the user's stored IANA timezone so
 * "today" and midnight resets match what the user experiences (Streak Spec §B3).
 */

/** Today's calendar date as `yyyy-MM-dd` in the given IANA timezone. */
export function todayKey(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA').format(new Date())
  }
}

/** Yesterday's calendar date as `yyyy-MM-dd` in the given IANA timezone. */
export function yesterdayKey(timezone: string): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(d)
  } catch {
    return new Intl.DateTimeFormat('en-CA').format(d)
  }
}

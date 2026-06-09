import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

/**
 * Daily check-in satisfaction — Logging Spec §8 / §B3. Device-local boolean (NOT
 * a server table). Satisfied by any log commit (A/B/C/D). Resets at midnight in
 * the user's stored timezone.
 *
 * Implementation: store the date-key (yyyy-MM-dd in the user's tz) on which the
 * check-in was last satisfied. The card is satisfied iff that stored key equals
 * today's key. Crossing midnight changes today's key → card reappears, no timer.
 */

const STORAGE_PREFIX = 'daily_checkin_satisfied:'

/** Today's calendar date (yyyy-MM-dd) in the given IANA timezone, via Intl. */
function todayKey(timezone: string): string {
  // en-CA formats as yyyy-MM-dd, which is exactly the key shape we want.
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  } catch {
    // Bad/unknown tz → fall back to device-local date.
    return new Intl.DateTimeFormat('en-CA').format(new Date())
  }
}

export interface DailyCheckIn {
  satisfied: boolean
  isLoading: boolean
  markSatisfied: () => Promise<void>
}

export function useDailyCheckIn(): DailyCheckIn {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const timezone = profile?.timezone ?? 'Asia/Kolkata'

  const [satisfied, setSatisfied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null

  useEffect(() => {
    let cancelled = false
    if (!storageKey) {
      setIsLoading(false)
      return
    }
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (cancelled) return
      setSatisfied(stored === todayKey(timezone))
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [storageKey, timezone])

  const markSatisfied = useCallback(async () => {
    if (!storageKey) return
    await AsyncStorage.setItem(storageKey, todayKey(timezone))
    setSatisfied(true)
  }, [storageKey, timezone])

  return { satisfied, isLoading, markSatisfied }
}

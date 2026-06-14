import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { differenceInCalendarDays, parseISO, startOfWeek } from 'date-fns'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import {
  gameVoice,
  isStreakMilestone,
  STREAK_MILESTONE_COPY,
  type StreakMilestone,
} from '../lib/games'
import type { Database } from '../types/database'

type StreakRow = Database['public']['Tables']['game_streak']['Row']

/** IST day key (UTC+5:30) — the spec pins streak-day boundaries to IST (§B2). */
function istDateKey(d: Date = new Date()): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

/** Monday-start ISO week key in IST, for the sessions_this_week reset. */
function istWeekKey(d: Date = new Date()): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  return startOfWeek(ist, { weekStartsOn: 1 }).toISOString().slice(0, 10)
}

export interface GameStreakData {
  current: number
  longest: number
  sessionsThisWeek: number
  lastSessionDate: string | null
  isLoading: boolean
}

/**
 * Game streak read + the craving-linked-session update (MiniGames §B2, Data
 * Schema §22). Streak day = a calendar day (IST) with ≥1 craving-linked
 * session; misses a day → resets to 0; longest_streak_ever never decreases;
 * sessions_this_week resets Monday. recordCravingSession is the client-side
 * stand-in for the spec's server PATCH (no Edge Function in V1).
 */
export function useGameStreak() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.gameStreak(user?.id ?? ''),
    queryFn: async (): Promise<StreakRow | null> => {
      const { data } = await supabase
        .from('game_streak')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
        .throwOnError()
      return (data as StreakRow) ?? null
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  const row = query.data ?? null

  // Effective values: a streak whose last session was >1 day ago is stale → 0.
  let current = row?.current_streak ?? 0
  let sessionsThisWeek = row?.sessions_this_week ?? 0
  if (row) {
    const gap = differenceInCalendarDays(
      parseISO(istDateKey()),
      parseISO(istDateKey(parseISO(row.last_craving_session_date + 'T00:00:00Z'))),
    )
    if (gap >= 2) current = 0
    if (istWeekKey() !== istWeekKey(parseISO(row.last_craving_session_date + 'T00:00:00Z'))) {
      sessionsThisWeek = 0
    }
  }

  /**
   * Apply one craving-linked session to the streak. Returns the milestone hit
   * (3/7/14/30) so the caller can fire the local notification, or null.
   */
  const recordCravingSession = async (): Promise<StreakMilestone | null> => {
    if (!user) return null
    const today = istDateKey()
    const todayWeek = istWeekKey()

    let nextStreak = 1
    let nextLongest = 1
    let nextWeek = 1
    let alreadyToday = false

    if (row) {
      const last = row.last_craving_session_date
      const lastDay = istDateKey(parseISO(last + 'T00:00:00Z'))
      const gap = differenceInCalendarDays(parseISO(today), parseISO(lastDay))

      if (gap === 0) {
        // Already counted today — streak unchanged, no extra week increment.
        alreadyToday = true
        nextStreak = row.current_streak
      } else if (gap === 1) {
        nextStreak = row.current_streak + 1
      } else {
        nextStreak = 1 // missed a day → reset
      }
      nextLongest = Math.max(row.longest_streak_ever, nextStreak)
      const sameWeek = istWeekKey(parseISO(last + 'T00:00:00Z')) === todayWeek
      nextWeek = (sameWeek ? row.sessions_this_week : 0) + 1
    }

    await supabase
      .from('game_streak')
      .upsert({
        user_id: user.id,
        current_streak: nextStreak,
        longest_streak_ever: nextLongest,
        sessions_this_week: nextWeek,
        last_craving_session_date: today,
      })
      .throwOnError()
    qc.invalidateQueries({ queryKey: queryKeys.gameStreak(user.id) })

    // Milestone fires only when the streak first reaches the value today.
    if (!alreadyToday && isStreakMilestone(nextStreak)) {
      await fireMilestoneNotification(nextStreak, profile?.voice_style ?? null)
      return nextStreak
    }
    return null
  }

  return {
    current,
    longest: row?.longest_streak_ever ?? 0,
    sessionsThisWeek,
    lastSessionDate: row?.last_craving_session_date ?? null,
    isLoading: query.isLoading,
    recordCravingSession,
  }
}

/** Local notification fired immediately after a milestone session (§B3). */
async function fireMilestoneNotification(
  milestone: StreakMilestone,
  voiceStyle: Database['public']['Tables']['profiles']['Row']['voice_style'],
): Promise<void> {
  try {
    const body = STREAK_MILESTONE_COPY[milestone][gameVoice(voiceStyle)]
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Game streak', body, data: { type: 'game_streak_milestone' } },
      trigger: null, // fire now
    })
  } catch {
    // best-effort — never block the game flow on a notification
  }
}

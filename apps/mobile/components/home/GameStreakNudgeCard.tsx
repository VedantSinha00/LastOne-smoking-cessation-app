import React, { useEffect, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useStage } from '../../hooks/useStage'
import { useGameStreak } from '../../hooks/useGameStreak'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryKeys'
import { gameVoice, GAME_COPY } from '../../lib/games'
import type { Database } from '../../types/database'

type NudgeRow = Database['public']['Tables']['streak_nudge_log']['Row']

/**
 * Stage-4 streak re-engagement nudge (MiniGames §B2). In-app card only (no
 * push). Fires when a Stage-4 user has had no craving-linked game session for
 * 4+ days. Lifetime cap of 2; 7-day cooldown between appearances; once
 * times_shown hits 2 → permanently_suppressed. Reads streak_nudge_log to
 * enforce the cap, increments it when shown.
 */
export const GameStreakNudgeCard: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { stage } = useStage()
  const { lastSessionDate, isLoading } = useGameStreak()
  const qc = useQueryClient()
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    const evaluate = async () => {
      if (!user || stage !== 4 || isLoading) return
      // 4+ days since the last craving-linked session (or never, but only if
      // they've engaged before — last_craving_session_date present).
      if (!lastSessionDate) return
      const gap = differenceInCalendarDays(new Date(), parseISO(lastSessionDate + 'T00:00:00Z'))
      if (gap < 4) return

      const { data } = await supabase
        .from('streak_nudge_log')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      const log = (data as NudgeRow) ?? null

      if (log?.permanently_suppressed) return
      if (log && log.times_shown >= 2) return
      // 7-day cooldown since last appearance.
      if (log && differenceInCalendarDays(new Date(), parseISO(log.last_shown_at)) < 7) return

      if (!cancelled) {
        setShow(true)
        const nextCount = (log?.times_shown ?? 0) + 1
        try {
          await supabase
            .from('streak_nudge_log')
            .upsert({
              user_id: user.id,
              times_shown: nextCount,
              last_shown_at: new Date().toISOString(),
              permanently_suppressed: nextCount >= 2,
            })
            .throwOnError()
        } catch {
          // nudge-log write best-effort
        }
        qc.invalidateQueries({ queryKey: queryKeys.streakNudge(user.id) })
      }
    }
    void evaluate()
    return () => {
      cancelled = true
    }
  }, [user, stage, lastSessionDate, isLoading])

  if (!show) return null
  const voice = gameVoice(profile?.voice_style ?? null)

  return (
    <View className="bg-card border border-border rounded-3xl p-5">
      <View className="flex-row items-start justify-between">
        <Text className="text-foreground text-sm leading-relaxed flex-1 pr-3">
          {GAME_COPY.reengageNudge[voice]}
        </Text>
        <Pressable onPress={() => setShow(false)} hitSlop={12}>
          <Text className="text-muted-foreground text-base">✕</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/games')} className="mt-3 self-start" hitSlop={8}>
        <Text className="text-primary font-sans-bold text-sm">Open games →</Text>
      </Pressable>
    </View>
  )
}

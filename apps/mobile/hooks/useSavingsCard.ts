import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { nextSavingsCard, type ResolvedCard } from '../lib/cardEngine'
import { computeSavings, type AttemptRow, type SlipRow } from '../lib/savings'
import type { Database } from '../types/database'

type ContentCard = Database['public']['Tables']['content_cards']['Row']
type CardHistory = Database['public']['Tables']['user_card_history']['Row']

/**
 * Savings-milestone card (Content Cards §2.2). Surfaces the highest not-yet-fired SW
 * threshold the user has crossed. Each threshold fires once — "already fired" = a
 * user_card_history row exists for that SW card (no separate table).
 *
 * Self-contained: it fetches attempts/slips/profile and computes money_saved INSIDE
 * the query (the same canonical computeSavings the dashboard uses), rather than
 * reading a separately-computed value and gating `enabled` on it. That gate caused the
 * card to only appear after another screen warmed the dashboard cache — here the query
 * always runs for a signed-in user and recomputes when its inputs are invalidated.
 */
export function useSavingsCard(): { card: ResolvedCard | null; markShown: () => void } {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const voice = profile?.voice_style ?? null

  const query = useQuery({
    queryKey: [...queryKeys.contentCards(), 'savings', user?.id ?? ''],
    queryFn: async (): Promise<ResolvedCard | null> => {
      const [{ data: attempts }, { data: slips }, { data: cards }, { data: history }] =
        await Promise.all([
          supabase.from('quit_attempts').select('quit_date, ended_at').eq('user_id', user!.id).throwOnError(),
          supabase.from('log').select('timestamp, cigarette_count').eq('user_id', user!.id).eq('log_type', 'slip').throwOnError(),
          supabase.from('content_cards').select('*').eq('trigger_type', 'savings_milestone').eq('active', true).throwOnError(),
          supabase.from('user_card_history').select('*').eq('user_id', user!.id).throwOnError(),
        ])

      const { moneySavedPaise } = computeSavings({
        attempts: (attempts ?? []) as AttemptRow[],
        slips: (slips ?? []) as SlipRow[],
        cigarettesPerDay: profile?.cigarettes_per_day ?? null,
        pricePerCigarette: profile?.price_per_cigarette ?? null,
      })

      const historyMap = new Map<string, CardHistory>(
        (history ?? []).map((h) => [h.card_id, h as CardHistory]),
      )
      return nextSavingsCard({
        cards: (cards ?? []) as ContentCard[],
        history: historyMap,
        moneySavedPaise,
        voice,
      })
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  // Re-evaluate whenever Home regains focus, so the card appears after a stage/quit_date
  // change without needing another screen to warm the cache first.
  useFocusEffect(
    useCallback(() => {
      query.refetch()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]),
  )

  // Record the impression so this threshold never re-fires (§2.2 — once each).
  const markShown = () => {
    const card = query.data
    if (!user || !card) return
    supabase
      .from('user_card_history')
      .upsert(
        { user_id: user.id, card_id: card.card.card_id, last_shown_at: new Date().toISOString(), show_count: 1 },
        { onConflict: 'user_id,card_id' },
      )
      .then(() => query.refetch())
  }

  return { card: query.data ?? null, markShown }
}

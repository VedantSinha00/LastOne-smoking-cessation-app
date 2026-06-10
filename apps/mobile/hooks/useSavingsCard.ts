import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { useDashboard } from './useDashboard'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { nextSavingsCard, type ResolvedCard } from '../lib/cardEngine'
import type { Database } from '../types/database'

type ContentCard = Database['public']['Tables']['content_cards']['Row']
type CardHistory = Database['public']['Tables']['user_card_history']['Row']

/**
 * Savings-milestone card (Content Cards §2.2). Reads the canonical money_saved from the
 * Progress Dashboard and surfaces the highest not-yet-fired SW threshold card the user
 * has crossed. Each threshold fires once — "already fired" is tracked by the presence
 * of a user_card_history row for that SW card (no separate table needed). Suppressed
 * when price_per_cigarette is unset (§4) — then money_saved is 0 and nothing fires.
 */
export function useSavingsCard(): { card: ResolvedCard | null; markShown: () => void } {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const dashboard = useDashboard()
  const voice = profile?.voice_style ?? null
  const moneySavedPaise = dashboard.moneySavedPaise

  const query = useQuery({
    queryKey: [...queryKeys.contentCards(), 'savings', user?.id ?? '', moneySavedPaise],
    queryFn: async (): Promise<ResolvedCard | null> => {
      const [{ data: cards }, { data: history }] = await Promise.all([
        supabase
          .from('content_cards')
          .select('*')
          .eq('trigger_type', 'savings_milestone')
          .eq('active', true)
          .throwOnError(),
        supabase.from('user_card_history').select('*').eq('user_id', user!.id).throwOnError(),
      ])
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
    enabled: !!user && moneySavedPaise > 0,
    staleTime: 60 * 1000,
  })

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

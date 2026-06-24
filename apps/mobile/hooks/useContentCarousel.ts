import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { useStage } from './useStage'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { selectCarousel, type ResolvedCard } from '../lib/cardEngine'
import type { Database } from '../types/database'

type ContentCard = Database['public']['Tables']['content_cards']['Row']
type CardHistory = Database['public']['Tables']['user_card_history']['Row']

/** Today's date key (yyyy-MM-dd) in the user's tz — busts the carousel cache at midnight. */
function todayKey(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA').format(new Date())
  }
}

/**
 * Home carousel of `scheduled` content cards (Content Cards §3.1). Picks 3–5
 * cards (≤2 per category, least-recently-shown, 14-day cooldown relaxing to 7) and
 * records their impressions.
 *
 * Rotation: the selected set is cached for the session and refreshed once per day
 * (the date is in the query key). We deliberately do NOT refetch on every mount:
 * selection records impressions (last_shown_at) and the engine applies a 14-day
 * cooldown, so re-running on every re-render — e.g. each time the content reader
 * modal closes — quickly puts the whole small card pool on cooldown and empties
 * the carousel. A long staleTime keeps the set stable within the session; React
 * Query still refetches on a genuine cold app open, which is enough rotation.
 */
export function useContentCarousel(): { cards: ResolvedCard[]; isLoading: boolean } {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { stage } = useStage()
  const timezone = profile?.timezone ?? 'Asia/Kolkata'
  const voice = profile?.voice_style ?? null

  const query = useQuery({
    queryKey: [...queryKeys.contentCards(), 'carousel', user?.id ?? '', stage, todayKey(timezone)],
    queryFn: async (): Promise<ResolvedCard[]> => {
      const [{ data: cards }, { data: history }] = await Promise.all([
        supabase.from('content_cards').select('*').eq('active', true).throwOnError(),
        supabase.from('user_card_history').select('*').eq('user_id', user!.id).throwOnError(),
      ])

      const historyMap = new Map<string, CardHistory>(
        (history ?? []).map((h) => [h.card_id, h as CardHistory]),
      )
      const selected = selectCarousel({
        cards: (cards ?? []) as ContentCard[],
        history: historyMap,
        stage,
        voice,
      })

      // Record impressions for the chosen set (§3 Step 6) — upsert last_shown_at + bump
      // show_count. Best-effort; a failed write must not break the carousel render.
      if (selected.length) {
        await Promise.all(
          selected.map((r) =>
            supabase.from('user_card_history').upsert(
              {
                user_id: user!.id,
                card_id: r.card.card_id,
                last_shown_at: new Date().toISOString(),
                show_count: (historyMap.get(r.card.card_id)?.show_count ?? 0) + 1,
              },
              { onConflict: 'user_id,card_id' },
            ),
          ),
        ).catch(() => {})
      }
      return selected
    },
    enabled: !!user,
    // Stable within the session; the date in the query key busts it daily, and a
    // cold app open refetches anyway. NOT refetchOnMount — see the note above
    // (re-selecting on every render starves the carousel via the cooldown).
    staleTime: 12 * 60 * 60 * 1000,
    refetchOnMount: false,
  })

  return { cards: query.data ?? [], isLoading: query.isLoading }
}

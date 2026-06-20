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
 * Rotation: re-selects on every app open (user preference — fresh cards each
 * visit, not the spec's once-per-day stable set). Because `selectCarousel` sorts
 * by least-recently-shown and each impression bumps last_shown_at/show_count, a
 * reopen naturally surfaces different cards. The date stays in the query key (so
 * separate days are distinct cache entries), but staleTime: 0 + refetchOnMount
 * make each mount re-run the selection.
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
    staleTime: 0, // re-select on every app open (rotation — user preference)
    refetchOnMount: 'always',
  })

  return { cards: query.data ?? [], isLoading: query.isLoading }
}

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import type { VoiceStyle } from '../types/database'

export interface MilestoneCard {
  cardId: string
  pillTag: string
  title: string
  /** Resolved body copy for the user's voice style (with steady fallback). */
  body: string
  threshold: number
}

/** Raw shape selected from content_cards for milestone cards. */
interface MilestoneRow {
  card_id: string
  pill_tag: string
  title: string
  body_copy: string | null
  body_copy_steady: string | null
  body_copy_warm: string | null
  body_copy_practical: string | null
  trigger_value: string
}

/**
 * Resolve the body copy for the user's voice style (Content Cards §1.3). High-sensitivity
 * milestone cards carry variants; Real & Practical is deferred and falls back to Steady.
 * Low-sensitivity fallback to body_copy is also covered for safety.
 */
function resolveBody(row: MilestoneRow, voice: VoiceStyle | null): string {
  const steady = row.body_copy_steady ?? row.body_copy ?? ''
  switch (voice) {
    case 'emotional_and_understanding':
      return row.body_copy_warm ?? steady
    case 'real_and_practical':
      return row.body_copy_practical ?? steady
    case 'steady_and_direct':
    default:
      return steady
  }
}

/**
 * The full DASH-2 milestone reference set (CM-01–08), ordered by threshold.
 * Source: LastOne_Milestone_System_Spec §4.3. Always the complete set — active/inactive
 * state is computed client-side by the caller against cigarettes_not_smoked (the cards
 * render as a persistent gallery, not a cooldown carousel; Milestone Spec §3 decision).
 */
export function useMilestoneCards(voiceStyle: VoiceStyle | null) {
  return useQuery({
    queryKey: [...queryKeys.contentCards(), 'milestones', voiceStyle ?? 'steady_and_direct'],
    queryFn: async (): Promise<MilestoneCard[]> => {
      const { data } = await supabase
        .from('content_cards')
        .select(
          'card_id, pill_tag, title, body_copy, body_copy_steady, body_copy_warm, body_copy_practical, trigger_value',
        )
        .eq('trigger_type', 'cigarette_milestone')
        .eq('active', true)
        .throwOnError()

      const rows = (data ?? []) as MilestoneRow[]
      return rows
        .map((row) => ({
          cardId: row.card_id,
          pillTag: row.pill_tag,
          title: row.title,
          body: resolveBody(row, voiceStyle),
          threshold: parseInt(row.trigger_value, 10),
        }))
        .sort((a, b) => a.threshold - b.threshold)
    },
    staleTime: 60 * 60 * 1000, // catalog rarely changes
  })
}

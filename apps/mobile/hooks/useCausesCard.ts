import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { useStage } from './useStage'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import {
  causesCardContent,
  causesCardEligible,
  causesVoice,
  ngoForImpressionCount,
  type CausesCardContent,
} from '../lib/causesCard'

interface CausesLogRow {
  log_id: string
  ngo_id: 'CFI' | 'CPAA' | 'CanSupport'
  shown_at: string
}

export interface CausesCardState {
  /** Non-null while the card should render on GOAL-01 this session. */
  card: CausesCardContent | null
  /** Dismiss: stamps dismissed_at and hides. Rotation already advanced at impression. */
  dismiss: () => void
  /** Stamps tapped_learn_more; the component opens the URL. Card stays visible (§5). */
  markLearnMore: () => void
}

/**
 * Causes Card session driver (GOAL-11, Spec §B2).
 *
 * Eligibility (stage ≥ 3, total_saved > 0, ≥14d since MAX(shown_at)) is
 * evaluated against the log; the moment it passes, ONE impression row is
 * inserted (rotation NGO = COUNT % 3) and the card renders for the rest of
 * the session — the insert itself makes eligibility false on the next app
 * open, which is exactly the spec's "visible until dismissed or next open".
 */
export function useCausesCard(totalSavedPaise: number, savedLabel: string): CausesCardState {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { stage, isLoading: stageLoading } = useStage()
  const qc = useQueryClient()

  const [session, setSession] = useState<{ logId: string; content: CausesCardContent } | null>(null)
  const inserting = useRef(false)

  const logQuery = useQuery({
    queryKey: queryKeys.causesLog(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('causes_card_log')
        .select('log_id, ngo_id, shown_at')
        .eq('user_id', user!.id)
        .throwOnError()
      return (data ?? []) as CausesLogRow[]
    },
    enabled: !!user,
  })

  const rows = logQuery.data
  const voice = causesVoice(profile?.voice_style ?? null)

  useEffect(() => {
    if (!user || !rows || stageLoading || session || inserting.current) return

    const sortedShownAt = rows.map((r) => r.shown_at).sort()
    const lastShownAt = sortedShownAt.length > 0 ? sortedShownAt[sortedShownAt.length - 1] : null
    if (!causesCardEligible(stage, totalSavedPaise, lastShownAt)) return

    const ngo = ngoForImpressionCount(rows.length)
    const perNgoCount = rows.filter((r) => r.ngo_id === ngo).length
    const content = causesCardContent(ngo, voice, savedLabel, perNgoCount)

    inserting.current = true
    const recordImpression = async () => {
      try {
        const { data } = await supabase
          .from('causes_card_log')
          .insert({ user_id: user.id, ngo_id: ngo })
          .select('log_id')
          .single()
          .throwOnError()
        setSession({ logId: (data as { log_id: string }).log_id, content })
        qc.invalidateQueries({ queryKey: queryKeys.causesLog(user.id) })
      } catch {
        // Best-effort: no card this session; eligibility re-checks next open.
      } finally {
        inserting.current = false
      }
    }
    recordImpression()
  }, [user, rows, stage, stageLoading, totalSavedPaise, savedLabel, voice, session, qc])

  const dismissMutation = useMutation({
    mutationFn: async (logId: string) => {
      await supabase
        .from('causes_card_log')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('log_id', logId)
        .throwOnError()
    },
  })

  const learnMoreMutation = useMutation({
    mutationFn: async (logId: string) => {
      await supabase
        .from('causes_card_log')
        .update({ tapped_learn_more: true })
        .eq('log_id', logId)
        .throwOnError()
    },
  })

  return {
    card: session?.content ?? null,
    dismiss: () => {
      if (!session) return
      dismissMutation.mutate(session.logId)
      setSession(null)
    },
    markLearnMore: () => {
      if (!session) return
      learnMoreMutation.mutate(session.logId)
    },
  }
}

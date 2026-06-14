import { useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, parseISO, subDays } from 'date-fns'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { useStage } from './useStage'
import { useStreakRecord } from './useStreakRecord'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { evaluateGuTrigger, guVoice, GU_COPY, isWithinHours } from '../lib/givingUp'
import type { GuTriggerCondition } from '../types/database'

interface SlipRow {
  timestamp: string
  slip_type: string | null
}

// Once-per-JS-session guard for the dismissed-count increment. A "session" in
// the spec sense ends when the app process dies; a fresh JS context resets this.
let dismissalCountedThisSession = false
/** DEV only — DevPanel resets the session guard between tests. */
export function resetGuSessionGuard() {
  dismissalCountedThisSession = false
}

export interface GivingUpTriggerState {
  /** GU-1 card should render on Home this session. */
  showCard: boolean
  condition: GuTriggerCondition | null
  cardCopy: string
  /** Card was rendered without a tap — counts toward the 3-session cap (§B2).
   *  Called once from the card's mount effect. */
  registerShown: () => void
  /** GU-1 tapped: writes the giving_up_event row + suppression timestamp,
   *  resets the dismissal counter, returns event_id for the experience modal. */
  begin: () => Promise<string | null>
}

/**
 * Tier 1 trigger evaluation (GU Spec §B2), run client-side from Home using
 * data already cached for the home render plus one slim slip-log query.
 * Conditions: A rolling-14d slip threshold (3, or 4 at Stage 5) · B
 * return_to_smoking within 48h · C passive disengagement (last_confirmed_date
 * 3+ days ago, Stage 3+). 7-day suppression + 3-dismissal cap on top.
 */
export function useGivingUpTrigger(): GivingUpTriggerState {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { stage } = useStage()
  const { data: streak } = useStreakRecord()
  const qc = useQueryClient()
  const begunRef = useRef(false)

  const slipsQuery = useQuery({
    queryKey: queryKeys.logsByType(user?.id ?? '', 'slip-14d'),
    queryFn: async () => {
      const { data } = await supabase
        .from('log')
        .select('timestamp, slip_type')
        .eq('user_id', user!.id)
        .eq('log_type', 'slip')
        .gte('timestamp', subDays(new Date(), 14).toISOString())
        .throwOnError()
      return (data ?? []) as SlipRow[]
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  const slips = slipsQuery.data ?? []
  const daysSinceLastConfirmed = streak?.last_confirmed_date
    ? differenceInCalendarDays(new Date(), parseISO(streak.last_confirmed_date))
    : 0

  const result =
    profile && slipsQuery.data
      ? evaluateGuTrigger({
          stage,
          slipsLast14d: slips.length,
          returnToSmokingWithin48h: slips.some(
            (s) => s.slip_type === 'return_to_smoking' && isWithinHours(s.timestamp, 48),
          ),
          daysSinceLastConfirmed,
          lastTriggerAt: profile.last_giving_up_trigger_at ?? null,
          dismissedCount: profile.giving_up_card_dismissed_count ?? 0,
        })
      : { show: false, condition: null as GuTriggerCondition | null }

  const voice = guVoice(profile?.voice_style ?? null)

  const registerShown = () => {
    if (!user || !profile || dismissalCountedThisSession) return
    dismissalCountedThisSession = true
    // Pre-count this session as a no-tap session; any tap resets to 0 in
    // begin(). Net behaviour = the spec's "max 3 consecutive sessions".
    supabase
      .from('profiles')
      .update({
        giving_up_card_dismissed_count: (profile.giving_up_card_dismissed_count ?? 0) + 1,
      })
      .eq('id', user.id)
      .then(() => {
        // No profile-cache invalidation: the card must stay visible THIS session.
      })
  }

  const begin = async (): Promise<string | null> => {
    if (!user || !result.condition || begunRef.current) return null
    begunRef.current = true
    try {
      const { data } = await supabase
        .from('giving_up_event')
        .insert({
          user_id: user.id,
          current_stage: stage,
          trigger_condition: result.condition,
          // Initial value; PATCHed to kept_going / routed_to_support at GU-4.
          // A mid-flow exit leaves it as-is, which is exactly the spec's value.
          outcome: 'dismissed_mid_flow',
        })
        .select('event_id')
        .single()
        .throwOnError()

      await supabase
        .from('profiles')
        .update({
          last_giving_up_trigger_at: new Date().toISOString(),
          giving_up_card_dismissed_count: 0,
        })
        .eq('id', user.id)
        .throwOnError()
      qc.invalidateQueries({ queryKey: queryKeys.profile(user.id) })

      return (data as { event_id: string }).event_id
    } catch {
      begunRef.current = false
      return null
    }
  }

  return {
    showCard: result.show,
    condition: result.condition,
    cardCopy: GU_COPY.triggerCard[voice],
    registerShown,
    begin,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { useStage } from './useStage'
import { useCurrentAttempt } from './useCurrentAttempt'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queryKeys'
import {
  computeMetrics,
  deriveInsightScreenState,
  generateInsights,
  type LogRow,
  type InsightMetrics,
} from '../lib/insights'
import { rankFeed } from '../lib/feedRanking'
import { insightCardContent, type InsightCardContent } from '../lib/insightContent'
import type { Database, InsightScreenState, RiskWindow } from '../types/database'

type InsightCard = Database['public']['Tables']['insight_card']['Row']

export interface FeedItem {
  card: InsightCard
  content: InsightCardContent
}

export interface InsightsData {
  screenState: InsightScreenState
  metrics: InsightMetrics
  feed: FeedItem[]
  hasAnyLog: boolean
  isLoading: boolean
  /** Re-rank the feed order. Call on screen focus so 'read' cards settle lower on
   *  the NEXT visit, not the instant they're tapped (§5.2 — ranks on screen open). */
  resnapshotOrder: () => void
}

/**
 * Insights feed data (Insights Spec §5.2). Loads the current attempt's logs +
 * insight_card rows, runs interim generation once per mount (idempotent), computes
 * metrics, ranks the feed, and pairs each card with its derived display content.
 */
export function useInsights(): InsightsData {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { stage } = useStage()
  const { data: attempt } = useCurrentAttempt()
  const attemptId = attempt?.attempt_id ?? null

  const logsQuery = useQuery({
    queryKey: queryKeys.logs(user?.id ?? '', attemptId ?? -1),
    queryFn: async () => {
      const { data } = await supabase
        .from('log')
        .select('log_type, timestamp, triggers, attempt_id')
        .eq('user_id', user!.id)
        .eq('attempt_id', attemptId!)
        .throwOnError()
      return (data ?? []) as LogRow[]
    },
    enabled: !!user && attemptId != null,
    staleTime: 60 * 1000,
  })

  const cardsQuery = useQuery({
    queryKey: queryKeys.insights(user?.id ?? '', attemptId ?? -1),
    queryFn: async () => {
      const { data } = await supabase
        .from('insight_card')
        .select('*')
        .eq('user_id', user!.id)
        .eq('attempt_id', attemptId!)
        .throwOnError()
      return (data ?? []) as InsightCard[]
    },
    enabled: !!user && attemptId != null,
    staleTime: 30 * 1000,
  })

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data])
  const metrics = useMemo(() => computeMetrics(logs), [logs])
  const screenState = deriveInsightScreenState(stage)

  // Interim generation: once logs have loaded, evaluate thresholds + upsert cards.
  // Idempotent on insight_key; invalidates the card query when new cards appear.
  useEffect(() => {
    if (!user || attemptId == null || logsQuery.isLoading) return
    generateInsights(user.id, attemptId, logs).then(({ cardsCreated, riskWindowsChanged }) => {
      if (cardsCreated) {
        queryClient.invalidateQueries({ queryKey: queryKeys.insights(user.id, attemptId) })
      }
      if (riskWindowsChanged) {
        // alert level + risk-window cards read profiles.risk_windows.
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, attemptId, logsQuery.isLoading, logs.length])

  // Feed ORDER is snapshotted (§5.2/DD-05: ranking "runs on screen open"). The order
  // re-ranks only when the card SET changes (new card generated) or when the screen
  // re-focuses (resnapshotOrder) — NOT when a card's state flips to 'read'. Otherwise
  // a tapped card would re-rank and visibly drop while the user is still reading it.
  // Card DATA stays live (the tapped card renders expanded + read in place); only its
  // POSITION holds until the next screen open re-snapshots it.
  const cards = cardsQuery.data
  const cardSetKey = useMemo(
    () => (cards ?? []).map((c) => c.insight_key).sort().join('|'),
    [cards],
  )
  const [orderEpoch, setOrderEpoch] = useState(0)
  const orderRef = useRef<{ key: string; epoch: number; order: string[] }>({
    key: '',
    epoch: -1,
    order: [],
  })
  // Recompute the snapshot when the card set changes OR a re-focus bumps the epoch.
  if (orderRef.current.key !== cardSetKey || orderRef.current.epoch !== orderEpoch) {
    orderRef.current = {
      key: cardSetKey,
      epoch: orderEpoch,
      order: rankFeed(cards ?? [], screenState).map((c) => c.insight_key),
    }
  }
  const resnapshotOrder = useCallback(() => setOrderEpoch((e) => e + 1), [])

  const feed = useMemo<FeedItem[]>(() => {
    const byKey = new Map((cards ?? []).map((c) => [c.insight_key, c]))
    const items: FeedItem[] = []
    for (const key of orderRef.current.order) {
      const card = byKey.get(key)
      if (!card) continue
      const content = insightCardContent(card.insight_type, metrics, profile?.voice_style)
      if (content) items.push({ card, content })
    }
    return items
    // orderRef is recomputed synchronously above before this memo runs; cardSetKey +
    // orderEpoch capture every order change, and `cards` captures state/content updates.
  }, [cards, cardSetKey, orderEpoch, screenState, metrics, profile?.voice_style])

  return {
    screenState,
    metrics,
    feed,
    hasAnyLog: logs.length > 0,
    isLoading: logsQuery.isLoading || cardsQuery.isLoading,
    resnapshotOrder,
  }
}

/** Mutations for card state + risk-window toggle (Insights §5.2, §B4.3). */
export function useInsightActions() {
  const { user } = useAuth()
  const { data: attempt } = useCurrentAttempt()
  const attemptId = attempt?.attempt_id ?? null

  const invalidateCards = () => {
    if (user && attemptId != null) {
      queryClient.invalidateQueries({ queryKey: queryKeys.insights(user.id, attemptId) })
    }
  }

  /** First expansion: card_state → read, set last_seen_at, engagement +2 (§5.3). */
  const expandCard = useMutation({
    mutationFn: async (card: InsightCard) => {
      const firstTime = card.card_state !== 'read'
      await supabase
        .from('insight_card')
        .update({
          card_state: 'read',
          last_seen_at: card.last_seen_at ?? new Date().toISOString(),
          engagement_score: card.engagement_score + (firstTime ? 2 : 0),
        })
        .eq('insight_key', card.insight_key)
        .throwOnError()
    },
    onSuccess: invalidateCards,
  })

  /** Scroll-past without tapping: engagement −0.5 (DD-02 / §5.2). */
  const scrollPast = useMutation({
    mutationFn: async (card: InsightCard) => {
      await supabase
        .from('insight_card')
        .update({ engagement_score: card.engagement_score - 0.5 })
        .eq('insight_key', card.insight_key)
        .throwOnError()
    },
    onSuccess: invalidateCards,
  })

  /** Risk-window toggle: set active on the matching profiles.risk_windows entry. */
  const toggleRiskWindow = useMutation({
    mutationFn: async (startHour: number) => {
      const { data } = await supabase
        .from('profiles')
        .select('risk_windows')
        .eq('id', user!.id)
        .maybeSingle()
      const windows: RiskWindow[] = (data?.risk_windows ?? []).map((w) =>
        w.start_hour === startHour ? { ...w, active: !w.active } : w,
      )
      await supabase
        .from('profiles')
        .update({ risk_windows: windows })
        .eq('id', user!.id)
        .throwOnError()
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
    },
  })

  return { expandCard, scrollPast, toggleRiskWindow }
}

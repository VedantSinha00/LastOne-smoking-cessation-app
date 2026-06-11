import { parseISO } from 'date-fns'
import type { Database, InsightScreenState } from '../types/database'

type InsightCard = Database['public']['Tables']['insight_card']['Row']

/**
 * Feed ranking (Insights Spec §B2.2). Runs on screen open; returns non-archived
 * cards ordered by score, descending. Pure — no I/O.
 *
 *   base = recency + actionBoost(0.3) + engagement×0.1 + readPenalty(−0.5)
 *   + Learning-Week profile cards get +1.0 in profile_building / profile_led,
 *     which floats them above all live-data cards (§2.2 boost).
 */

function recencyScore(generatedAt: string): number {
  const days = (Date.now() - parseISO(generatedAt).getTime()) / 86_400_000
  return Math.max(0, 1 - days / 30) // normalised over a 30-day window, floor 0
}

export function scoreCard(card: InsightCard, screenState: InsightScreenState): number {
  const recency = recencyScore(card.generated_at)
  const actionBoost = card.has_app_action ? 0.3 : 0
  const engagement = (card.engagement_score ?? 0) * 0.1
  const readPenalty = card.card_state === 'read' ? -0.5 : 0
  let score = recency + actionBoost + engagement + readPenalty

  if (
    (screenState === 'profile_building' || screenState === 'profile_led') &&
    card.insight_type.startsWith('profile_')
  ) {
    score += 1.0 // Learning Week boost — overrides live-data cards in early stages
  }
  return score
}

/** Return non-archived cards ranked highest-first for the given screen state. */
export function rankFeed(cards: InsightCard[], screenState: InsightScreenState): InsightCard[] {
  return cards
    .filter((c) => !c.archived)
    .map((c) => ({ c, s: scoreCard(c, screenState) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c)
}

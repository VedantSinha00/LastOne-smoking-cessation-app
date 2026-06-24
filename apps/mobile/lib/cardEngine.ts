/**
 * Content card selection engine — Content Cards V1, Part B §3.
 *
 * selectCard() runs the six-step waterfall (trigger filter → stage filter → 14-day
 * cooldown → least-recently-shown → resolve voice copy → record impression) and
 * returns the resolved card to display, or null when nothing is eligible (§4: skip
 * silently, never show an empty card). Carousel population (§3.1) layers on top of
 * this for `scheduled` cards.
 *
 * Pure selection helpers are exported for testing; the DB read/write wrappers live in
 * the hooks. This keeps the filtering/ranking logic verifiable without Supabase.
 */

import type { Database, VoiceStyle } from '../types/database'

type ContentCard = Database['public']['Tables']['content_cards']['Row']
type CardHistory = Database['public']['Tables']['user_card_history']['Row']

export interface ResolvedCard {
  card: ContentCard
  /** Body copy resolved for the user's voice style (with steady fallback). */
  body: string
}

const COOLDOWN_DAYS = 14
const RELAX_COOLDOWN_DAYS = 7 // §3.1 — relax to 7d if <3 eligible (carousel only)
const MS_PER_DAY = 24 * 60 * 60 * 1000

/** §3 Step 5 / §1.3 — resolve the body copy for the user's voice style. */
export function resolveCardBody(card: ContentCard, voice: VoiceStyle | null): string {
  if (card.sensitivity === 'low') return card.body_copy ?? card.body_copy_steady ?? ''
  const steady = card.body_copy_steady ?? card.body_copy ?? ''
  switch (voice) {
    case 'emotional_and_understanding':
      return card.body_copy_warm ?? steady
    case 'real_and_practical':
      return card.body_copy_practical ?? steady
    case 'steady_and_direct':
    default:
      return steady // §4 default when voice_style is null
  }
}

/** §3 Step 1 — trigger filter. A card matches if type matches and value matches or is 'any'. */
export function filterByTrigger(
  cards: ContentCard[],
  triggerType: string,
  triggerValue: string,
): ContentCard[] {
  return cards.filter(
    (c) =>
      c.active &&
      c.trigger_type === triggerType &&
      (c.trigger_value === triggerValue || c.trigger_value === 'any'),
  )
}

/** §3 Step 2 — stage filter. null bounds pass for all stages. */
export function filterByStage(cards: ContentCard[], stage: number): ContentCard[] {
  return cards.filter(
    (c) => (c.stage_min == null || stage >= c.stage_min) && (c.stage_max == null || stage <= c.stage_max),
  )
}

/** §4 — time_milestone cards are suppressed in Stage 0 (no active quit). */
export function suppressStage0Milestones(
  cards: ContentCard[],
  stage: number,
): ContentCard[] {
  if (stage > 0) return cards
  return cards.filter((c) => c.trigger_type !== 'time_milestone')
}

/**
 * §3 Step 3 — cooldown filter. Excludes cards shown within `days`. A card with no
 * history row has never been shown and always passes.
 */
export function filterByCooldown(
  cards: ContentCard[],
  history: Map<string, CardHistory>,
  days: number,
  now: number = Date.now(),
): ContentCard[] {
  return cards.filter((c) => {
    const h = history.get(c.card_id)
    if (!h) return true
    return now - new Date(h.last_shown_at).getTime() >= days * MS_PER_DAY
  })
}

/**
 * §3 Step 4 — select the least-recently-shown card (never-shown first; ties broken
 * randomly). Returns null for an empty list.
 */
export function pickLeastRecentlyShown(
  cards: ContentCard[],
  history: Map<string, CardHistory>,
): ContentCard | null {
  if (cards.length === 0) return null
  let best: ContentCard[] = []
  let bestTime = Infinity
  for (const c of cards) {
    const h = history.get(c.card_id)
    const t = h ? new Date(h.last_shown_at).getTime() : -1 // never-shown sorts first
    if (t < bestTime) {
      bestTime = t
      best = [c]
    } else if (t === bestTime) {
      best.push(c)
    }
  }
  return best[Math.floor(Math.random() * best.length)]
}

/**
 * Run the selection waterfall for a single trigger (steps 1–4 + body resolve). Does
 * NOT record the impression — callers do that after committing to display (§3 Step 6),
 * so a card that's selected-but-not-shown doesn't burn its cooldown.
 */
export function selectCard(opts: {
  cards: ContentCard[]
  history: Map<string, CardHistory>
  triggerType: string
  triggerValue: string
  stage: number
  voice: VoiceStyle | null
  now?: number
}): ResolvedCard | null {
  const now = opts.now ?? Date.now()
  let pool = filterByTrigger(opts.cards, opts.triggerType, opts.triggerValue)
  pool = filterByStage(pool, opts.stage)
  pool = suppressStage0Milestones(pool, opts.stage)

  // Cooldown; §4 — if everything in the matched set is in cooldown, fall back to the
  // least-recently-shown of the matched set rather than showing nothing.
  const afterCooldown = filterByCooldown(pool, opts.history, COOLDOWN_DAYS, now)
  const eligible = afterCooldown.length > 0 ? afterCooldown : pool

  const card = pickLeastRecentlyShown(eligible, opts.history)
  if (!card) return null
  return { card, body: resolveCardBody(card, opts.voice) }
}

/**
 * §3.1 — carousel population for `scheduled` cards. Pulls up to `max` cards, capped at
 * 2 per category (by card_id prefix), least-recently-shown. Relaxes the 14-day cooldown
 * to 7 days if fewer than `min` cards remain. Records nothing — caller records the
 * chosen set's impressions.
 */
export function selectCarousel(opts: {
  cards: ContentCard[]
  history: Map<string, CardHistory>
  stage: number
  voice: VoiceStyle | null
  min?: number
  max?: number
  now?: number
}): ResolvedCard[] {
  const now = opts.now ?? Date.now()
  const min = opts.min ?? 3
  const max = opts.max ?? 5

  let pool = filterByTrigger(opts.cards, 'scheduled', 'any')
  pool = filterByStage(pool, opts.stage)
  pool = suppressStage0Milestones(pool, opts.stage)

  const build = (cooldownDays: number): ContentCard[] => {
    const available = filterByCooldown(pool, opts.history, cooldownDays, now)
    // least-recently-shown order
    const ordered = [...available].sort((a, b) => {
      const ta = opts.history.get(a.card_id)?.last_shown_at
      const tb = opts.history.get(b.card_id)?.last_shown_at
      return (ta ? new Date(ta).getTime() : -1) - (tb ? new Date(tb).getTime() : -1)
    })
    const picked: ContentCard[] = []
    const perCategory = new Map<string, number>()
    for (const c of ordered) {
      if (picked.length === max) break
      const cat = c.card_id.split('-')[0] // MB / YB / PT / SW
      const count = perCategory.get(cat) ?? 0
      if (count >= 2) continue // §3.1 — max 2 per category per refresh
      picked.push(c)
      perCategory.set(cat, count + 1)
    }
    return picked
  }

  let picked = build(COOLDOWN_DAYS)
  if (picked.length < min) picked = build(RELAX_COOLDOWN_DAYS) // §3.1 relax 14d → 7d
  // §4 — never show an empty carousel when cards exist: if even the relaxed
  // cooldown leaves nothing (e.g. all scheduled cards were shown very recently),
  // fall back to the least-recently-shown of the whole eligible pool, ignoring
  // cooldown entirely (days = 0 passes every card). Mirrors selectCard's
  // "rather than showing nothing" rule.
  if (picked.length === 0) picked = build(0)
  return picked.map((card) => ({ card, body: resolveCardBody(card, opts.voice) }))
}

/**
 * Savings-milestone firing (§2.2). Given money_saved (in paise) and which SW cards
 * have already fired (present in history), return the highest not-yet-fired threshold
 * card the user has crossed, or null. Each threshold fires once.
 */
const SAVINGS_THRESHOLDS_RUPEES = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000]

export function nextSavingsCard(opts: {
  cards: ContentCard[]
  history: Map<string, CardHistory>
  moneySavedPaise: number
  voice: VoiceStyle | null
}): ResolvedCard | null {
  const rupees = Math.floor(opts.moneySavedPaise / 100)
  const savingsCards = opts.cards.filter((c) => c.trigger_type === 'savings_milestone' && c.active)
  // Highest crossed threshold that hasn't fired yet (§2.2 — each fires once).
  for (const threshold of [...SAVINGS_THRESHOLDS_RUPEES].reverse()) {
    if (rupees < threshold) continue
    const card = savingsCards.find((c) => parseInt(c.trigger_value, 10) === threshold)
    if (card && !opts.history.has(card.card_id)) {
      return { card, body: resolveCardBody(card, opts.voice) }
    }
  }
  return null
}

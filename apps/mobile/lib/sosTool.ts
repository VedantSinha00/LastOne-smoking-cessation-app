/**
 * SOS tool selection waterfall — Coping Tools Suite §06 (authoritative source).
 *
 * selectSOSTools() is pure: given the tool catalogue, the user's scores, the craving
 * context, stage, and smoker profile, it returns exactly three tools for the SOS
 * surface. Steps run in order; the first that produces three valid tools wins. The
 * escalation ladder (failed_sos_count) is applied OUTSIDE this function by the modal
 * (Step 13 logic / Step 18 surfacing) — this file owns ranking, not escalation.
 */

import type { Database, ToolFamily } from '../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']
type ToolScore = Database['public']['Tables']['user_tool_scores']['Row']

/** Derived smoker profile (Architecture Guide N7 / dependency_level). */
export type SmokerProfile = 'social_occasional' | 'regular_light' | 'regular_moderate_heavy'

export type CravingContext = 'public' | 'private' | 'unknown'

export interface CravingInput {
  /** 1–5; undefined when SOS is triggered without an intensity log. */
  intensity?: number
  context: CravingContext
}

export interface SelectionInput {
  tools: CopingTool[]
  scores: Map<string, ToolScore>
  craving: CravingInput
  stage: number
  profile: SmokerProfile
  /** MIN-03 (Find Match 2P) only surfaces with an active Quit Buddy. */
  hasBuddy: boolean
  /**
   * Tool IDs to drop from the candidate pool before ranking. Used by the SOS-1
   * "Show me other things that worked" shuffle to surface a DIFFERENT valid trio
   * (the next-best set, still respecting every composition/stage/context rule).
   * The caller clears this once the pool would be exhausted (wrap-around).
   */
  exclude?: string[]
}

const MIN_USES_FOR_WEIGHT = 5 // §B2 — below 5 uses, tool_score treated as 0

// §6.2 Cold-start intensity → slot-1 tool map, by context.
const COLD_START_PRIMARY: Record<number, Record<CravingContext, string>> = {
  1: { public: 'MIN-01', private: 'MIN-02A', unknown: 'BRE-01' },
  2: { public: 'MIN-01', private: 'MIN-02A', unknown: 'BRE-01' },
  3: { public: 'BRE-01', private: 'BRE-02', unknown: 'BRE-02' },
  4: { public: 'PHY-01', private: 'PHY-03', unknown: 'BRE-02' },
  5: { public: 'BRE-03', private: 'BRE-03', unknown: 'BRE-03' },
}

/** A tool's sub-family for the "no two from the same sub-family" composition rule. */
function subFamily(t: CopingTool): string {
  // breathing tools collide as a group; physical/mini split by category already.
  if (t.family === 'breathing') return 'breathing'
  return t.category // physical_reset / distraction / social_coping / reflective
}

function scoreOf(scores: Map<string, ToolScore>, toolId: string): number {
  const s = scores.get(toolId)
  if (!s) return 0
  // Below the weighting threshold, score is neutral (§B2 / §6.1 Step 1).
  return s.total_uses >= MIN_USES_FOR_WEIGHT ? s.tool_score : 0
}

/** Stage pre-filter (§07): constrain the candidate pool before the waterfall ranks. */
function applyStageFilter(pool: CopingTool[], stage: number): CopingTool[] {
  // stage_min gate (null = from Stage 0). Stage 0 keeps the full catalogue.
  return pool.filter((t) => t.stage_min == null || stage >= t.stage_min)
}

/**
 * Compose a final three from an ordered candidate list, enforcing §6.3:
 *  - never two tools from the same sub-family,
 *  - BRE-04 never slot 1 unless personally scored high (handled by caller ordering),
 *  - MIN-03 only if hasBuddy (filtered earlier),
 *  - intensity 4–5 → at least one physical; intensity 1–2 → at least one mini-game.
 * `ordered` is assumed already ranked best-first. Returns up to 3 tools.
 */
function applyCompositionRules(
  ordered: CopingTool[],
  craving: CravingInput,
): CopingTool[] {
  const picked: CopingTool[] = []
  const usedSubFamilies = new Set<string>()

  for (const tool of ordered) {
    if (picked.length === 3) break
    const sf = subFamily(tool)
    if (usedSubFamilies.has(sf)) continue // no two from same sub-family
    picked.push(tool)
    usedSubFamilies.add(sf)
  }

  // Required-family guarantees. If missing, swap the weakest slot for a candidate.
  const ensureFamily = (needed: ToolFamily, eligible: (t: CopingTool) => boolean) => {
    if (picked.some((t) => t.family === needed)) return
    const candidate = ordered.find((t) => t.family === needed && eligible(t) && !picked.includes(t))
    if (candidate && picked.length > 0) {
      picked[picked.length - 1] = candidate // replace backup slot
    }
  }

  const intensity = craving.intensity ?? 0
  if (intensity >= 4) ensureFamily('physical', () => true)
  if (intensity >= 1 && intensity <= 2) ensureFamily('mini_games', () => true)

  return picked.slice(0, 3)
}

/** The user's top tools across all families, by weighted score (desc), score>0 only. */
function getUserTopTools(
  pool: CopingTool[],
  scores: Map<string, ToolScore>,
  opts: { exclude?: string[]; limit: number; requirePositive?: boolean },
): CopingTool[] {
  const exclude = new Set(opts.exclude ?? [])
  return pool
    .filter((t) => !exclude.has(t.tool_id))
    .map((t) => ({ t, s: scoreOf(scores, t.tool_id) }))
    .filter(({ s }) => (opts.requirePositive ? s > 0 : true))
    .sort((a, b) => b.s - a.s)
    .slice(0, opts.limit)
    .map(({ t }) => t)
}

const byId = (pool: CopingTool[], id: string) => pool.find((t) => t.tool_id === id)

/**
 * Select exactly three SOS tools via the §6.1 waterfall.
 * Returns fewer than 3 only if the catalogue itself can't supply them (shouldn't
 * happen with the 12-tool seed); callers pad from the full pool as a last resort.
 */
export function selectSOSTools(input: SelectionInput): CopingTool[] {
  const { tools, scores, craving, stage, profile, hasBuddy, exclude } = input
  const excludeSet = new Set(exclude ?? [])

  // Base pool: SOS-eligible, not removed_from_sos, buddy gate, stage pre-filter,
  // and minus any shuffle-excluded tools (so a re-roll surfaces a different trio).
  let pool = tools
    .filter((t) => t.sos_eligible)
    .filter((t) => !scores.get(t.tool_id)?.removed_from_sos)
    .filter((t) => !t.requires_buddy || hasBuddy)
    .filter((t) => !excludeSet.has(t.tool_id))
  pool = applyStageFilter(pool, stage)

  // ── Step 0 — Intensity 5 override (BRE-03 slot 1, then top 2 any family) ──────
  if (craving.intensity === 5) {
    const bre03 = byId(pool, 'BRE-03')
    const top2 = getUserTopTools(pool, scores, { exclude: ['BRE-03'], limit: 2 })
    const out = [bre03, ...top2].filter(Boolean) as CopingTool[]
    if (out.length >= 3) return out.slice(0, 3)
    // pad from cold-start / remaining pool if user has <2 scored tools
    for (const t of pool) {
      if (out.length === 3) break
      if (!out.includes(t)) out.push(t)
    }
    return out.slice(0, 3)
  }

  // ── Step 1 — Personal effectiveness (5+ uses on any tool, ≥1 positive) ────────
  const hasEnoughData =
    [...scores.values()].some((s) => s.total_uses >= MIN_USES_FOR_WEIGHT) &&
    [...scores.values()].some((s) => s.total_uses >= MIN_USES_FOR_WEIGHT && s.tool_score > 0)
  if (hasEnoughData) {
    const top = getUserTopTools(pool, scores, { limit: 8, requirePositive: true })
    const composed = applyCompositionRules(top, craving)
    if (composed.length >= 3) return composed
  }

  // ── Step 2 — Context gate (restrict physical tools by context) ────────────────
  if (craving.context === 'public') {
    pool = pool.filter((t) => t.family !== 'physical' || ['PHY-01', 'PHY-02'].includes(t.tool_id))
  } else if (craving.context === 'private') {
    pool = pool.filter((t) => t.family !== 'physical' || ['PHY-03', 'PHY-04'].includes(t.tool_id))
  }

  // ── Step 3 — Stage weighting (cold-start defaults) ────────────────────────────
  // Order families per stage, seed slot 1 from the cold-start map, then compose.
  const familyOrder: ToolFamily[] =
    stage >= 3 ? ['mini_games', 'breathing', 'physical'] : ['breathing', 'physical', 'mini_games']

  // Build an ordered candidate list: cold-start primary first (if eligible), then
  // tools grouped by the stage family order. library_only tools (BRE-04) are pushed
  // down so they never land in slot 1 without a personal score (§6.3).
  const ordered: CopingTool[] = []
  const pushUnique = (t: CopingTool | undefined) => {
    if (t && !ordered.includes(t)) ordered.push(t)
  }

  const intensity = craving.intensity ?? 3
  pushUnique(byId(pool, COLD_START_PRIMARY[intensity]?.[craving.context]))

  for (const fam of familyOrder) {
    const inFam = pool
      .filter((t) => t.family === fam)
      .sort((a, b) => Number(a.library_only) - Number(b.library_only)) // non-library first
    inFam.forEach(pushUnique)
  }

  const composed = applyCompositionRules(ordered, craving)
  if (composed.length >= 3) return composed

  // ── Step 4 — Profile fallback (no data at all) ────────────────────────────────
  const profileFirstFamily: Record<SmokerProfile, ToolFamily> = {
    social_occasional: 'mini_games',
    regular_light: 'breathing',
    regular_moderate_heavy: 'physical',
  }
  const first = profileFirstFamily[profile]
  const profileOrdered = [...pool].sort((a, b) => {
    if (a.family === first && b.family !== first) return -1
    if (b.family === first && a.family !== first) return 1
    return Number(a.library_only) - Number(b.library_only)
  })
  return applyCompositionRules(profileOrdered, craving)
}

import { parseISO } from 'date-fns'
import { supabase } from './supabase'
import type {
  InsightType,
  InsightScreenState,
  RiskWindow,
  ToneSensitivity,
} from '../types/database'
import type { Stage } from './stage'

/**
 * Insights engine (Insights Spec §B2). Client-side INTERIM generation: evaluates
 * the spec's thresholds against the user's logs and idempotently upserts
 * insight_card rows (keyed by insight_key). Designed to lift cleanly into the
 * `generate-insights` Edge Function at Step 21 — the threshold logic, insight_key
 * format, and idempotency rule are identical to §B2.4.
 *
 * The screen derives display copy + detected VALUES from these rows + the live log
 * data (see lib/insightContent.ts) — the insight_card table stores no copy/value.
 */

// ── insight_screen_state (§B2.1) ─────────────────────────────────────────────
export function deriveInsightScreenState(stage: Stage): InsightScreenState {
  if (stage === 0) return 'profile_building'
  if (stage === 1) return 'profile_led'
  if (stage === 2) return 'transitional'
  if (stage === 3) return 'feed_led'
  return 'feed_continues' // 4–5
}

/** insight_key format — {user_id}_{insight_type}_{attempt_id} (§B1.1). */
export function insightKey(userId: string, type: InsightType, attemptId: number): string {
  return `${userId}_${type}_${attemptId}`
}

// ── Log shape (unified `log` table — Logging Spec §B1) ───────────────────────
export interface LogRow {
  log_type: string
  timestamp: string
  triggers: string[] | null
  attempt_id: number | null
  // Optional context fields — captured by the log modals (A: social_context,
  // D: mood) and the tool picker (tool_selected). Used by the Explore breakdowns
  // (Triggers / People / Top tools). computeMetrics doesn't depend on these.
  social_context?: string[] | null
  location?: string[] | null
  mood?: number | null
  tool_selected?: string | null
  tool_helpful?: boolean | null
  what_helped?: string[] | null
}

/** trigger_tag (singular) = MODE of triggers[] for a row; first element fallback. */
function rowTopTrigger(triggers: string[] | null): string | null {
  if (!triggers || triggers.length === 0) return null
  const counts: Record<string, number> = {}
  let best = triggers[0]
  for (const t of triggers) {
    counts[t] = (counts[t] ?? 0) + 1
    if (counts[t] > (counts[best] ?? 0)) best = t
  }
  return best
}

// ── Derived metrics (§B2.6) ──────────────────────────────────────────────────

export interface InsightMetrics {
  cravingCount: number
  /** Outcome-bearing count = craving + overcome + slip (resistance denominator). */
  outcomeCount: number
  overcomeCount: number
  slipCount: number
  resistanceRate: number | null // 0–100, null when denominator 0
  topTrigger: string | null
  topTriggerPct: number | null
  /** Full ranked trigger distribution (token + share), for the card infographics. */
  triggerDistribution: BreakdownRow[]
  /** Ranked social-context distribution (token + share), for the card infographics. */
  socialDistribution: BreakdownRow[]
  /** Rolling 7-day vs prior 7-day craving averages (per day). */
  cravingPerDayCurrent: number
  cravingPerDayPrior: number
  riskWindows: RiskWindow[]
  /** Cravings logged on each of the last 7 days (oldest→newest), for the
   *  "Cravings This Week" bar chart on the Insights hub. `dayLabel` is the
   *  single-letter axis label; `dayFull` is the full weekday name for the
   *  hardest-day callout (the letter alone is ambiguous — T=Tue/Thu, S=Sat/Sun). */
  weeklyCravings: { dayLabel: string; dayFull: string; count: number }[]
}

/** Per-day craving counts for the last 7 days (oldest→newest). */
function weeklyCravingBuckets(
  cravings: LogRow[],
): { dayLabel: string; dayFull: string; count: number }[] {
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const day = 86_400_000
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const buckets: { dayLabel: string; dayFull: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfToday.getTime() - i * day
    const dayEnd = dayStart + day
    const count = cravings.filter((c) => {
      const t = new Date(c.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    }).length
    const weekday = new Date(dayStart).getDay()
    buckets.push({ dayLabel: DAY_LABELS[weekday], dayFull: DAY_NAMES[weekday], count })
  }
  return buckets
}

/** MODE of all triggers[] across craving logs (current attempt). */
function topTrigger(cravings: LogRow[]): { tag: string | null; pct: number | null } {
  const counts: Record<string, number> = {}
  let total = 0
  for (const c of cravings) {
    const tag = rowTopTrigger(c.triggers)
    if (!tag) continue
    counts[tag] = (counts[tag] ?? 0) + 1
    total++
  }
  if (total === 0) return { tag: null, pct: null }
  let best: string | null = null
  for (const tag of Object.keys(counts)) {
    if (best === null || counts[tag] > counts[best]) best = tag
  }
  return { tag: best, pct: best ? Math.round((counts[best] / total) * 100) : null }
}

/**
 * Bucket craving timestamps into 2-hour windows; a window with 3+ cravings across
 * 3+ unique days is a risk window (§B2.5). 5+ days = high confidence, else medium.
 */
export function calculateRiskWindows(cravings: LogRow[]): RiskWindow[] {
  const buckets: Record<number, { count: number; days: Set<string> }> = {}
  for (const c of cravings) {
    const d = parseISO(c.timestamp)
    const start = Math.floor(d.getHours() / 2) * 2 // 17 → 16
    const b = (buckets[start] ??= { count: 0, days: new Set() })
    b.count++
    b.days.add(c.timestamp.slice(0, 10)) // yyyy-MM-dd
  }
  const out: RiskWindow[] = []
  for (const startStr of Object.keys(buckets)) {
    const start = Number(startStr)
    const b = buckets[start]
    if (b.days.size >= 3 && b.count >= 3) {
      out.push({
        start_hour: start,
        end_hour: start + 2,
        confidence: b.days.size >= 5 ? 'high' : 'medium',
        active: true,
      })
    }
  }
  return out.sort((a, b) => a.start_hour - b.start_hour)
}

/** Per-day craving average over the [from, to) window. */
function perDayRate(cravings: LogRow[], fromMs: number, toMs: number): number {
  const n = cravings.filter((c) => {
    const t = parseISO(c.timestamp).getTime()
    return t >= fromMs && t < toMs
  }).length
  return n / 7
}

/** Compute all metrics for the current attempt from its logs (§B2.6). */
export function computeMetrics(logs: LogRow[]): InsightMetrics {
  const cravings = logs.filter((l) => l.log_type === 'craving')
  const overcomes = logs.filter((l) => l.log_type === 'overcome')
  const slips = logs.filter((l) => l.log_type === 'slip')

  const outcomeCount = cravings.length + overcomes.length + slips.length
  const resistanceRate =
    outcomeCount === 0 ? null : Math.round((overcomes.length / outcomeCount) * 1000) / 10

  const { tag, pct } = topTrigger(cravings)

  const now = Date.now()
  const day = 86_400_000
  const cravingPerDayCurrent = perDayRate(cravings, now - 7 * day, now)
  const cravingPerDayPrior = perDayRate(cravings, now - 14 * day, now - 7 * day)

  return {
    cravingCount: cravings.length,
    outcomeCount,
    overcomeCount: overcomes.length,
    slipCount: slips.length,
    resistanceRate,
    topTrigger: tag,
    topTriggerPct: pct,
    triggerDistribution: triggerBreakdown(logs).rows,
    socialDistribution: socialBreakdown(logs).rows,
    cravingPerDayCurrent,
    cravingPerDayPrior,
    riskWindows: calculateRiskWindows(cravings),
    weeklyCravings: weeklyCravingBuckets(cravings),
  }
}

// ── Explore breakdowns (spec INS-4 profile sections + tool_effectiveness card) ──
// Each returns a ranked distribution + total, so the view can render bars and an
// empty state when nothing's been logged yet.

export interface BreakdownRow {
  key: string
  count: number
  /** share of total, 0–1 */
  pct: number
}

/** Triggers breakdown — every element of triggers[] across cravings, ranked.
 *  Backs the spec's top_trigger card / INS-4 trigger categories. */
export function triggerBreakdown(logs: LogRow[]): { rows: BreakdownRow[]; total: number } {
  const cravings = logs.filter((l) => l.log_type === 'craving')
  const counts: Record<string, number> = {}
  let total = 0
  for (const c of cravings) {
    for (const t of c.triggers ?? []) {
      counts[t] = (counts[t] ?? 0) + 1
      total++
    }
  }
  return { rows: rankCounts(counts, total), total }
}

/** Social-context breakdown — every element of social_context[] across cravings,
 *  ranked. Backs the spec's INS-4 "social context breakdown" (People). */
export function socialBreakdown(logs: LogRow[]): { rows: BreakdownRow[]; total: number } {
  const cravings = logs.filter((l) => l.log_type === 'craving')
  const counts: Record<string, number> = {}
  let total = 0
  for (const c of cravings) {
    for (const s of c.social_context ?? []) {
      counts[s] = (counts[s] ?? 0) + 1
      total++
    }
  }
  return { rows: rankCounts(counts, total), total }
}

/** Location breakdown — every element of location[] across cravings, ranked.
 *  Backs the Explore "Places" view (where cravings hit). */
export function locationBreakdown(logs: LogRow[]): { rows: BreakdownRow[]; total: number } {
  const cravings = logs.filter((l) => l.log_type === 'craving')
  const counts: Record<string, number> = {}
  let total = 0
  for (const c of cravings) {
    for (const loc of c.location ?? []) {
      counts[loc] = (counts[loc] ?? 0) + 1
      total++
    }
  }
  return { rows: rankCounts(counts, total), total }
}

/** Per-tool usage + helpful-rate, ranked by uses. `helpfulRate` is the share of
 *  uses the user marked tool_helpful=true (the design's "thumbs up" metric);
 *  null when no helpful signal was recorded for that tool. */
export interface ToolUsageRow {
  tool: string
  uses: number
  helpfulCount: number
  /** rated = uses where tool_helpful is non-null (the helpfulRate denominator) */
  rated: number
  helpfulRate: number | null
}

/** Everything the Top Tools screen needs, mirroring the design's 5 sections.
 *  Built from real logs (tool_selected, tool_helpful, triggers). `totalToolCount`
 *  is the size of the coping_tools catalog, used for the "N of total tried" line. */
export interface ToolStats {
  triedCount: number
  totalToolCount: number
  totalUses: number
  /** ranked by uses (the "Most used" section) */
  mostUsed: ToolUsageRow[]
  /** tools with a helpful signal, ranked by helpfulRate (the "Effectiveness" section) */
  effectiveness: ToolUsageRow[]
  /** triggers that most often preceded a tool use (the "Used most after" chips) */
  topTriggers: string[]
  /** the single best tool by helpfulRate with enough uses, or null */
  bestTool: ToolUsageRow | null
}

export function toolStats(logs: LogRow[], totalToolCount: number): ToolStats {
  const byTool: Record<string, { uses: number; helpfulCount: number; rated: number }> = {}
  const triggerCounts: Record<string, number> = {}

  for (const l of logs) {
    const tool = l.tool_selected
    if (!tool) continue
    const b = (byTool[tool] ??= { uses: 0, helpfulCount: 0, rated: 0 })
    b.uses++
    if (l.tool_helpful != null) {
      b.rated++
      if (l.tool_helpful) b.helpfulCount++
    }
    // triggers preceding any tool use feed the "used most after" chips
    for (const t of l.triggers ?? []) triggerCounts[t] = (triggerCounts[t] ?? 0) + 1
  }

  const rows: ToolUsageRow[] = Object.entries(byTool).map(([tool, b]) => ({
    tool,
    uses: b.uses,
    helpfulCount: b.helpfulCount,
    rated: b.rated,
    helpfulRate: b.rated > 0 ? b.helpfulCount / b.rated : null,
  }))

  const mostUsed = [...rows].sort((a, b) => b.uses - a.uses)
  const effectiveness = rows
    .filter((r) => r.helpfulRate != null)
    .sort((a, b) => (b.helpfulRate ?? 0) - (a.helpfulRate ?? 0))
  // best tool = highest helpful rate among tools used at least twice
  const bestTool = effectiveness.filter((r) => r.uses >= 2)[0] ?? effectiveness[0] ?? null
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t)

  return {
    triedCount: rows.length,
    totalToolCount,
    totalUses: rows.reduce((sum, r) => sum + r.uses, 0),
    mostUsed,
    effectiveness,
    topTriggers,
    bestTool,
  }
}

/** Sort a count map into ranked BreakdownRows (desc by count). */
function rankCounts(counts: Record<string, number>, total: number): BreakdownRow[] {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count, pct: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count)
}

// ── Threshold gate (§B2.3) — which insight types have enough data to surface ──

const HIGH_SENSITIVITY: ReadonlySet<InsightType> = new Set<InsightType>([
  'peak_risk_window', 'top_trigger', 'resistance_rate', 'slip_pattern',
  'craving_drop', 'cross_attempt_comparison', 'first_craving_match',
])
const APP_ACTION_TYPES: ReadonlySet<InsightType> = new Set<InsightType>(['peak_risk_window'])

/** The insight types whose thresholds are met by the current metrics (§B2.3). */
export function eligibleInsightTypes(m: InsightMetrics, hasAnyLog: boolean): InsightType[] {
  const types: InsightType[] = []
  // Learning Week profile cards — any log, no minimum (populate in real time).
  if (hasAnyLog) {
    types.push('profile_peak_windows', 'profile_social_context', 'profile_trigger_category')
  }
  if (m.cravingCount >= 5 && m.topTrigger) types.push('top_trigger')
  if (m.outcomeCount >= 10 && m.resistanceRate !== null) types.push('resistance_rate')
  if (m.riskWindows.length > 0) types.push('peak_risk_window')
  // slip_pattern: 2+ slips sharing trigger_tag or 2h window (current attempt).
  if (m.slipCount >= 2) types.push('slip_pattern')
  // craving_drop: current 7d avg < prior 7d avg, 5+ logs in each window.
  if (
    m.cravingPerDayCurrent * 7 >= 5 &&
    m.cravingPerDayPrior * 7 >= 5 &&
    m.cravingPerDayCurrent < m.cravingPerDayPrior
  ) {
    types.push('craving_drop')
  }
  return types
}

export function toneFor(type: InsightType): ToneSensitivity {
  return HIGH_SENSITIVITY.has(type) ? 'high' : 'low'
}
export function hasAppActionFor(type: InsightType): boolean {
  return APP_ACTION_TYPES.has(type)
}

/**
 * Client-side interim generation (mirrors §B2.4 Edge Function). For each eligible
 * insight type with no existing card (idempotent on insight_key), insert a new
 * insight_card row. Also refreshes profiles.risk_windows for the alert-level
 * system. Best-effort — never throws into the app-open path. Returns true if any
 * new card was created (caller may invalidate the feed query).
 */
export interface GenerationResult {
  /** A new insight_card was inserted → invalidate the feed query. */
  cardsCreated: boolean
  /** profiles.risk_windows changed → invalidate the profile query (alert level). */
  riskWindowsChanged: boolean
}

export async function generateInsights(
  userId: string,
  attemptId: number,
  logs: LogRow[],
): Promise<GenerationResult> {
  const result: GenerationResult = { cardsCreated: false, riskWindowsChanged: false }
  try {
    const metrics = computeMetrics(logs)
    // Keep risk_windows fresh for useAlertLevel (§B2.8). Preserve any existing
    // `active:false` toggles the user set by merging on start_hour.
    result.riskWindowsChanged = await refreshRiskWindows(userId, metrics.riskWindows)

    const eligible = eligibleInsightTypes(metrics, logs.length > 0)
    if (eligible.length === 0) return result

    const keys = eligible.map((t) => insightKey(userId, t, attemptId))
    const { data: existing } = await supabase
      .from('insight_card')
      .select('insight_key')
      .in('insight_key', keys)
    const existingKeys = new Set((existing ?? []).map((r) => r.insight_key))

    const toInsert = eligible
      .filter((t) => !existingKeys.has(insightKey(userId, t, attemptId)))
      .map((t) => ({
        insight_key: insightKey(userId, t, attemptId),
        user_id: userId,
        attempt_id: attemptId,
        insight_type: t,
        card_state: 'collapsed' as const,
        has_app_action: hasAppActionFor(t),
        tone_sensitivity: toneFor(t),
        engagement_score: 0,
        archived: false,
      }))
    if (toInsert.length === 0) return result

    // upsert + ignoreDuplicates (INSERT … ON CONFLICT DO NOTHING) so a concurrent
    // generation pass (Home's InsightsPreview + the Insights screen both mount
    // useInsights) can't trip a unique-violation on insight_key.
    await supabase
      .from('insight_card')
      .upsert(toInsert, { onConflict: 'insight_key', ignoreDuplicates: true })
      .throwOnError()
    result.cardsCreated = true
    return result
  } catch (err) {
    console.warn('generateInsights skipped:', err)
    return result
  }
}

/**
 * Write the freshly-computed risk windows to profiles.risk_windows, preserving the
 * user's `active=false` toggles (§5.2 "Turn off app alertness for this window").
 * Matches on start_hour.
 */
async function refreshRiskWindows(userId: string, computed: RiskWindow[]): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('risk_windows')
    .eq('id', userId)
    .maybeSingle()
  const prior = data?.risk_windows ?? []
  const inactive = new Set(prior.filter((w) => !w.active).map((w) => w.start_hour))
  const merged = computed.map((w) => ({ ...w, active: !inactive.has(w.start_hour) }))
  // Skip the write (and the profile-cache churn) when nothing actually changed —
  // this runs on every app open via the generation pass.
  if (JSON.stringify(prior) === JSON.stringify(merged)) return false
  await supabase.from('profiles').update({ risk_windows: merged }).eq('id', userId)
  return true
}


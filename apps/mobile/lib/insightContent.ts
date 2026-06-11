import type { InsightType, VoiceStyle } from '../types/database'
import type { InsightMetrics } from './insights'

/**
 * Insight card display copy (Insights Spec §7.3 reference copy). The insight_card
 * table stores no copy/values — presentation is derived here from insight_type +
 * the computed metrics at render time.
 *
 * Spec §7 copy is "PENDING CARD LIST LOCK"; this uses the reference copy as V1.
 * Voice variants: real_and_practical is deferred → falls back to steady_and_direct
 * (Insights §7.1). null voice_style also falls back to steady_and_direct.
 */

export interface InsightCardContent {
  categoryLabel: string // uppercase label above the headline
  headline: string
  body: string
  /** Present only on cards with a linked app action (risk window toggle). */
  transparencyLine?: string
  /** The risk window's start hour — drives the toggle on peak_risk_window cards. */
  riskWindowStartHour?: number
}

const FALLBACK_VOICE: VoiceStyle = 'steady_and_direct'

const TRIGGER_LABELS: Record<string, string> = {
  stress: 'stress', boredom: 'boredom', social: 'social situations', habit: 'habit',
  post_meal: 'after meals', post_chai: 'chai time', anxiety: 'anxiety',
  celebration: 'celebration', focus: 'focus', other: 'other moments',
}

function triggerLabel(tag: string | null): string {
  if (!tag) return 'certain moments'
  return TRIGGER_LABELS[tag] ?? tag
}

function fmtHour(h: number): string {
  const period = h < 12 ? 'am' : 'pm'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}${period}`
}

/**
 * Resolve display content for a card. Returns null when the type has no V1 copy
 * (e.g. cross_attempt types not surfaced in this interim build) so the caller can
 * skip rendering it.
 */
export function insightCardContent(
  type: InsightType,
  m: InsightMetrics,
  voice: VoiceStyle | null | undefined,
): InsightCardContent | null {
  const v = voice ?? FALLBACK_VOICE

  switch (type) {
    case 'top_trigger': {
      const t = triggerLabel(m.topTrigger)
      const pct = m.topTriggerPct ?? 0
      return {
        categoryLabel: 'PATTERN',
        headline: `${capitalize(t)} is your real trigger`,
        body:
          v === 'emotional_and_understanding'
            ? `${pct}% of your cravings show up around ${t}. Most people guess stress — your data tells a kinder, clearer story.`
            : `${pct}% of your cravings happen around ${t}. Most people guess stress. Your data says otherwise.`,
      }
    }
    case 'resistance_rate': {
      const rate = Math.round(m.resistanceRate ?? 0)
      return {
        categoryLabel: "WHAT'S WORKING",
        headline: `You're resisting ${rate}% of your cravings`,
        body: `Across ${m.outcomeCount} logged moments, you've ridden out ${rate}% without smoking. That's the rewiring happening.`,
      }
    }
    case 'peak_risk_window': {
      const w = m.riskWindows.find((x) => x.confidence === 'high') ?? m.riskWindows[0]
      if (!w) return null
      const label = `${fmtHour(w.start_hour)}–${fmtHour(w.end_hour)}`
      return {
        categoryLabel: 'MOST IMPORTANT RIGHT NOW',
        headline: `${fmtHour(w.start_hour)} is still your hardest window`,
        body: `Cravings cluster here more than the rest of your day. The app stays a little more alert during ${label}.`,
        transparencyLine: w.active
          ? `App stays alert ${label}.`
          : `Alertness is off for ${label}.`,
        riskWindowStartHour: w.start_hour,
      }
    }
    case 'craving_drop': {
      const prev = Math.round(m.cravingPerDayPrior)
      const curr = Math.round(m.cravingPerDayCurrent)
      return {
        categoryLabel: 'PROGRESS',
        headline: `Your cravings dropped from ${prev} a day to ${curr}`,
        body: `Last week you were logging about ${prev} cravings a day. This week it's ${curr}. That's not willpower — that's your brain rewiring.`,
      }
    }
    case 'slip_pattern': {
      return {
        categoryLabel: 'PATTERN',
        headline: 'Your recent slips have something in common',
        body: "There's a thread running through your last couple of slips. No judgment — just worth seeing so the next one's easier to catch.",
      }
    }
    case 'profile_peak_windows': {
      const top = [...m.riskWindows]
        .sort((a, b) => a.start_hour - b.start_hour)
        .slice(0, 3)
        .map((w) => fmtHour(w.start_hour))
      return {
        categoryLabel: 'WHEN YOU SMOKED',
        headline:
          top.length > 0
            ? `Your peak windows were ${top.join(', ')}`
            : 'Your smoking windows are taking shape',
        body: 'These are the moments your brain still expects something. Knowing them is half the work.',
      }
    }
    case 'profile_social_context': {
      return {
        categoryLabel: 'WHO YOU SMOKED WITH',
        headline: 'Most of your cigarettes were with other people',
        body: 'Friends and group situations are a strong cue for you — not just solo stress.',
      }
    }
    case 'profile_trigger_category': {
      const t = triggerLabel(m.topTrigger)
      return {
        categoryLabel: 'YOUR TOP TRIGGER',
        headline: `${capitalize(t)} led your smoking`,
        body: 'This was the feeling most often behind a cigarette during your Learning Week.',
      }
    }
    // first_craving_match, tool_effectiveness, cross_attempt_comparison,
    // trigger_shift: deferred to the full card-list lock — not surfaced in V1.
    default:
      return null
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

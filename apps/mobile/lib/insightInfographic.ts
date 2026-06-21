import type { InsightType } from '../types/database'
import type { InsightMetrics } from './insights'

/**
 * Generic infographic layer for insight cards.
 *
 * `insightInfographic(type, metrics)` maps an insight type + the live metrics to
 * an optional InfographicSpec — a small, finite visual vocabulary. Cards never
 * know about specific graphics: they call this resolver, and if it returns a spec
 * the card renders <InfographicRenderer spec=...> inline when expanded.
 *
 * Adding a graphic to another card = add one `case` here (+ a renderer branch if
 * it needs a new `kind`). No per-card wiring.
 */

export interface InfographicBarRow {
  label: string
  /** 0–1, share of total (drives bar width) */
  value: number
  /** display string shown at the row's end, e.g. "42%" */
  display: string
  /** optional bar colour override (else the renderer's default) */
  color?: string
}

export interface InfographicWindowRow {
  /** e.g. "8–10pm" or "Morning" */
  label: string
  /** e.g. "Peak window" */
  caption: string
  /** intensity tone — drives the row's colour band */
  tone: 'high' | 'medium' | 'low'
}

export interface InfographicSplitSide {
  value: number
  label: string
  color: string
}

/** Discriminated union — extend with new `kind`s as more graphics are added. */
export type InfographicSpec =
  | { kind: 'bars'; title: string; rows: InfographicBarRow[] }
  | { kind: 'windows'; title: string; rows: InfographicWindowRow[] }
  | { kind: 'split'; title: string; left: InfographicSplitSide; right: InfographicSplitSide }

function fmtHour(h: number): string {
  const period = h < 12 ? 'am' : 'pm'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}${period}`
}

/** Resolve the infographic for a card type, or null if it has none. */
export function insightInfographic(
  type: InsightType,
  metrics: InsightMetrics,
): InfographicSpec | null {
  switch (type) {
    // NOTE: trigger / social / resistance infographics were intentionally removed
    // here — they duplicated the hub stat grid (Outcomes) and the Explore inline
    // breakdowns (Triggers, People). Cards keep their narrative headline+body; the
    // distributions live in one place (Explore/hub). Only card-UNIQUE graphics
    // remain below (peak time windows, craving-drop trend).

    // ── peak time windows (unique to cards) ───────────────────────────────────
    case 'peak_risk_window':
    case 'profile_peak_windows': {
      const wins = metrics.riskWindows
      if (wins.length === 0) return null
      const tones: InfographicWindowRow['tone'][] = ['high', 'medium', 'low']
      const rows: InfographicWindowRow[] = wins.slice(0, 3).map((w, i) => ({
        label: `${fmtHour(w.start_hour)}–${fmtHour(w.end_hour)}`,
        caption: i === 0 ? 'Peak window' : i === 1 ? 'Second peak' : 'Also watch',
        tone: tones[i] ?? 'low',
      }))
      return { kind: 'windows', title: 'When cravings hit', rows }
    }

    // ── craving drop: prior week vs this week (unique to cards) ───────────────
    case 'craving_drop': {
      const prior = metrics.cravingPerDayPrior
      const current = metrics.cravingPerDayCurrent
      if (prior === 0 && current === 0) return null
      const max = Math.max(prior, current) || 1
      const fmt = (n: number) => `${n.toFixed(1)}/day`
      return {
        kind: 'bars',
        title: 'Cravings per day',
        rows: [
          { label: 'Two weeks ago', value: prior / max, display: fmt(prior), color: '#C8E59A' },
          { label: 'This week', value: current / max, display: fmt(current), color: '#7FC200' },
        ],
      }
    }

    default:
      return null
  }
}

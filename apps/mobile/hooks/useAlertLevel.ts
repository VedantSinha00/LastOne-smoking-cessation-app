import { useProfile } from './useProfile'
import type { RiskWindow } from '../types/database'

/**
 * Alert level (Insights Spec §B2.8 / DD-03 "Position B"). Returns 1 normally, 2
 * when the current local hour falls inside an ACTIVE, HIGH-confidence risk window.
 * Alert level 2 surfaces the quiet CopingSurfaceCard on Home — no notification, no
 * mention of the window (naming it would turn it into a smoking cue).
 *
 * Medium-confidence windows are info-only and never raise the alert level.
 */
export function evaluateAlertLevel(
  riskWindows: RiskWindow[] | null | undefined,
  hour: number = new Date().getHours(),
): 1 | 2 {
  for (const w of riskWindows ?? []) {
    if (!w.active || w.confidence !== 'high') continue
    if (hour >= w.start_hour && hour < w.end_hour) return 2
  }
  return 1
}

/** Hook form — reads profiles.risk_windows and evaluates against the current hour. */
export function useAlertLevel(): 1 | 2 {
  const { data: profile } = useProfile()
  return evaluateAlertLevel(profile?.risk_windows)
}

/**
 * Personal Goals — pure derivations (Personal Goals Spec §B2).
 *
 * Three savings states (Spec §3):
 *   total_saved      — auto-calculated cigarette savings (Progress Dashboard's
 *                      money_saved, in PAISE). Display-only pool; never user-written.
 *   allocated_amount — intent. Set on GOAL-10, reversible, informational only.
 *   current_amount   — committed. ALWAYS SUM(top_up_log.amount) for the goal —
 *                      derived here, never written to the goal row directly.
 *
 * Goal amounts are stored in RUPEES (numeric 12,2 on remote), unlike the savings
 * counters which compute in paise. Conversion happens once, at the GOAL-10 boundary.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Database } from '../types/database'

export type GoalRow = Database['public']['Tables']['goal']['Row']
export type TopUpRow = Database['public']['Tables']['top_up_log']['Row']

/** Shape returned by the nested select in useGoals: goal + its top-up amounts. */
export interface GoalQueryRow extends GoalRow {
  top_up_log: { amount: number }[]
}

export interface GoalWithProgress extends GoalRow {
  /** SUM(top_up_log.amount), rupees — the committed amount driving the bar. */
  derivedCurrentAmount: number
  /** Raw percentage (uncapped) — completion checks compare this to 100. */
  progressPct: number
  /** Display label, capped at 999% (Spec §8.4 layout-breakage guard). */
  progressLabel: string
  /** Bar fill ratio 0–1 (caps at full). */
  barRatio: number
  /** Allocated-intent ratio 0–1 — the bar's faint second segment. Intent only;
   *  never drives progressPct/completion (Spec §3 three-state rule). */
  allocatedRatio: number
}

/** Spec §3 — max 3 active goals; the Add button disables at the cap. */
export const MAX_ACTIVE_GOALS = 3

/**
 * Parse a rupee text input to a whole-rupee amount. Rounds to the nearest
 * rupee (".908" → 1) and enforces the ₹1 floor — sub-rupee goals/top-ups
 * render as "₹0 of ₹0" and break percentage math. Null = invalid.
 */
export function parseRupees(text: string): number | null {
  const raw = parseFloat(text)
  if (!Number.isFinite(raw)) return null
  const rupees = Math.round(raw)
  return rupees >= 1 ? rupees : null
}

export function deriveGoal(row: GoalQueryRow): GoalWithProgress {
  const { top_up_log, ...goal } = row
  const current = top_up_log.reduce((sum, t) => sum + Number(t.amount), 0)
  const target = Number(goal.target_amount)
  const pct = target > 0 ? (current / target) * 100 : 0
  return {
    ...goal,
    derivedCurrentAmount: current,
    progressPct: pct,
    progressLabel: `${Math.min(999, Math.floor(pct))}%`,
    barRatio: Math.min(1, pct / 100),
    allocatedRatio: target > 0 ? Math.min(1, Number(goal.allocated_amount) / target) : 0,
  }
}

/**
 * Reduce free-text input to ONE emoji (GOAL-05 emoji field is a single emoji
 * per spec §B1) — the LAST emoji in the string, so typing a new one replaces
 * the previous instead of being swallowed. Handles ZWJ sequences (👨‍👩‍👧),
 * skin tones, and flag pairs; non-emoji characters are dropped entirely.
 */
export function singleEmoji(text: string): string {
  const base = '(?:\\p{Regional_Indicator}\\p{Regional_Indicator}|\\p{Extended_Pictographic})'
  // base emoji, then any run of: ZWJ-joined emoji, variation selector, or skin tone.
  const re = new RegExp(`${base}(?:\\u200d${base}|\\ufe0f|\\p{Emoji_Modifier})*`, 'gu')
  const matches = text.match(re)
  return matches ? matches[matches.length - 1] : ''
}

// Keyword → emoji for goal thumbnails when no product image survives the parse
// (Amazon/Flipkart usually bot-wall og:image). First match wins; order matters
// where keywords overlap (e.g. "earbuds" before "bud").
const EMOJI_KEYWORDS: [string[], string][] = [
  [['headphone', 'earbud', 'earphone', 'airpod', 'boat', 'airdope'], '🎧'],
  [['iphone', 'phone', 'redmi', 'oneplus', 'pixel', 'galaxy'], '📱'],
  [['laptop', 'macbook', 'thinkpad'], '💻'],
  [['watch'], '⌚'],
  [['shoe', 'sneaker', 'nike', 'adidas', 'puma'], '👟'],
  [['game', 'gaming', 'ps5', 'playstation', 'xbox', 'console'], '🎮'],
  [['camera', 'gopro'], '📷'],
  [['tv', 'television', 'monitor'], '📺'],
  [['book', 'novel'], '📚'],
  [['cycle', 'bicycle', 'bike'], '🚲'],
  [['scooter', 'scooty'], '🛵'],
  [['guitar'], '🎸'],
  [['speaker', 'soundbar'], '🔊'],
  [['bag', 'backpack'], '🎒'],
  [['perfume', 'fragrance', 'deo'], '🧴'],
  [['lipstick', 'makeup', 'nykaa'], '💄'],
  [['shirt', 'jeans', 'jacket', 'hoodie', 'dress', 'kurta'], '👕'],
  [['trip', 'travel', 'flight', 'goa'], '✈️'],
  [['gift'], '🎁'],
]

/** Best-guess emoji for a goal from its name; 🎯 when nothing matches. */
export function suggestEmoji(goalName: string): string {
  const name = goalName.toLowerCase()
  for (const [keywords, emoji] of EMOJI_KEYWORDS) {
    if (keywords.some((k) => name.includes(k))) return emoji
  }
  return '🎯'
}

/** ₹ from a rupee amount (goal fields). Compact above ₹9,999 like formatRupees. */
export function formatGoalRupees(rupees: number): string {
  const whole = Math.floor(rupees)
  if (whole > 9999) return `₹${(whole / 1000).toFixed(1)}K`
  return `₹${whole.toLocaleString('en-IN')}`
}

/**
 * GOAL-10 validation (Spec §B2 Allocation Logic). All amounts in rupees.
 * Over-allocation never blocks typing — it disables Confirm with the inline error.
 */
export interface AllocationState {
  totalAllocated: number
  remainder: number
  overAllocated: boolean
}

export function allocationState(
  inputs: Record<string, number>,
  totalSavedRupees: number,
): AllocationState {
  const totalAllocated = Object.values(inputs).reduce((s, v) => s + (v > 0 ? v : 0), 0)
  return {
    totalAllocated,
    remainder: totalSavedRupees - totalAllocated,
    overAllocated: totalAllocated > totalSavedRupees,
  }
}

/** Percentage mode: rupee_equivalent = (pct / 100) × total_saved (Spec §B2). */
export function pctToRupees(pct: number, totalSavedRupees: number): number {
  return Math.floor((pct / 100) * totalSavedRupees)
}

// ── Home "set a personal goal" prompt dismissal (device-side) ─────────────────
// The Home prompt that nudges goalless users to create their first goal. Dismiss
// behaviour: each dismiss hides it for the session and snoozes it for a cooldown;
// it reappears on the next app open AFTER the cooldown. The SECOND dismiss
// suppresses it permanently. Only relevant while the user has no active goal —
// once a goal exists the real goal card takes over regardless of this state.

const GOAL_PROMPT_COOLDOWN_DAYS = 4
const goalPromptKey = (userId: string) => `goal_prompt_dismiss:${userId}`

interface GoalPromptDismissState {
  count: number
  /** ISO timestamp of the most recent dismiss. */
  lastDismissedAt: string
}

export async function getGoalPromptDismiss(userId: string): Promise<GoalPromptDismissState | null> {
  const raw = await AsyncStorage.getItem(goalPromptKey(userId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as GoalPromptDismissState
  } catch {
    return null
  }
}

/** Record a dismiss (called on cross tap). Returns the new state. */
export async function dismissGoalPrompt(
  userId: string,
  now: Date = new Date(),
): Promise<GoalPromptDismissState> {
  const prev = await getGoalPromptDismiss(userId)
  const next: GoalPromptDismissState = {
    count: (prev?.count ?? 0) + 1,
    lastDismissedAt: now.toISOString(),
  }
  await AsyncStorage.setItem(goalPromptKey(userId), JSON.stringify(next))
  return next
}

/**
 * Whether the prompt may show right now, given its dismiss state. Permanently
 * hidden after 2 dismisses; otherwise hidden until the cooldown elapses.
 */
export function goalPromptVisible(
  state: GoalPromptDismissState | null,
  now: Date = new Date(),
): boolean {
  if (!state) return true
  if (state.count >= 2) return false
  return differenceInCalendarDays(now, parseISO(state.lastDismissedAt)) >= GOAL_PROMPT_COOLDOWN_DAYS
}

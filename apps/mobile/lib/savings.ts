/**
 * Progress Dashboard — pure savings/counter calculations.
 * Source of truth: LastOne_ProgressDashboard_Spec §B2 (formulas), §B7 (equivalents).
 *
 * All three counters accumulate across ALL quit attempts (lifetime), not just the
 * current one. Money is computed in PAISE (integer) to avoid float drift, per §B8 —
 * display divides by 100. Every counter floors at 0 (§B2). The dashboard writes
 * nothing; these are read-only derivations over quit_attempts + slip logs + profile.
 */

import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { RelatableCategory } from '../types/database'

const MINUTES_PER_CIGARETTE = 7 // §2.2 — walk out + smoke + return, conservative

/** Minimal shapes the calc needs — a subset of the real table rows. */
export interface AttemptRow {
  quit_date: string | null
  /** null = current (open) attempt; non-null = completed. */
  ended_at: string | null
}

export interface SlipRow {
  /** ISO timestamp of the slip log. */
  timestamp: string
  /** 1–4 exact, 99 = sentinel for "5+" (normalised to 5 here, per Architecture Guide §12). */
  cigarette_count: number | null
}

export interface SavingsInputs {
  attempts: AttemptRow[]
  slips: SlipRow[]
  cigarettesPerDay: number | null
  /** Rupees per loose cigarette (₹10–20). Converted to paise internally. */
  pricePerCigarette: number | null
}

export interface SavingsResult {
  /** True when cigarettes_per_day / price / quit_date are all set (counters are live). */
  ready: boolean
  moneySavedPaise: number
  timeReclaimedMinutes: number
  cigarettesNotSmoked: number
  lifetimeSmokeFreeDays: number
  /** Cigarettes the user logged as actually smoked (slip rows), lifetime. */
  cigarettesSmoked: number
}

/** 99 sentinel ("5+") counts as 5 actual cigarettes; otherwise the exact count. */
function normaliseCount(c: number | null): number {
  if (c == null) return 0
  return c === 99 ? 5 : c
}

/**
 * lifetime_smoke_free_days (§B2 shared variable).
 *
 * For each attempt, days = calendar days from quit_date to its end (ended_at for a
 * completed attempt, today for the open one), minus the distinct calendar days the
 * user smoked during that attempt's window. Each attempt's contribution floors at 0.
 *
 * Note on slip accounting: the spec's day-deduction uses slip_type='return_to_smoking'
 * for whole-day removal. We compute distinct slip calendar days within each attempt
 * window from the slip rows passed in. Callers that already filter to lifetime slips
 * can pass them all; attribution to the right window is done here by timestamp.
 */
export function calcLifetimeSmokeFreeDays(
  attempts: AttemptRow[],
  slips: SlipRow[],
  now: Date = new Date(),
): number {
  let total = 0
  for (const a of attempts) {
    if (!a.quit_date) continue
    const start = parseISO(a.quit_date)
    const end = a.ended_at ? parseISO(a.ended_at) : now
    const spanDays = differenceInCalendarDays(end, start)
    if (spanDays <= 0) continue

    // Distinct calendar days with a slip inside [quit_date, end).
    const slipDays = new Set<number>()
    for (const s of slips) {
      const t = parseISO(s.timestamp)
      if (t >= start && t < end) {
        slipDays.add(differenceInCalendarDays(t, start))
      }
    }
    total += Math.max(0, spanDays - slipDays.size)
  }
  return total
}

/** Total cigarettes logged as actually smoked (slip rows), lifetime. */
export function calcCigarettesSmoked(slips: SlipRow[]): number {
  return slips.reduce((sum, s) => sum + normaliseCount(s.cigarette_count), 0)
}

/** money_saved in paise = gross − slip deductions, floored at 0 (§B2 Money Saved). */
export function calcMoneySaved(
  lifetimeSmokeFreeDays: number,
  cigarettesPerDay: number,
  pricePerCigaretteRupees: number,
  cigarettesSmoked: number,
): number {
  const pricePaise = Math.round(pricePerCigaretteRupees * 100)
  const gross = lifetimeSmokeFreeDays * cigarettesPerDay * pricePaise
  const deductions = cigarettesSmoked * pricePaise
  return Math.max(0, gross - deductions)
}

/** time_reclaimed in minutes = gross − slip deductions (§B2 Time Reclaimed). */
export function calcTimeReclaimed(
  lifetimeSmokeFreeDays: number,
  cigarettesPerDay: number,
  cigarettesSmoked: number,
): number {
  const gross = lifetimeSmokeFreeDays * cigarettesPerDay * MINUTES_PER_CIGARETTE
  const deductions = cigarettesSmoked * MINUTES_PER_CIGARETTE
  return Math.max(0, gross - deductions)
}

/** cigarettes_not_smoked = gross − logged smoked, floored at 0 (§B2). */
export function calcCigarettesNotSmoked(
  lifetimeSmokeFreeDays: number,
  cigarettesPerDay: number,
  cigarettesSmoked: number,
): number {
  return Math.max(0, lifetimeSmokeFreeDays * cigarettesPerDay - cigarettesSmoked)
}

/** Single entry point: all three counters + the shared derivations. */
export function computeSavings(inputs: SavingsInputs, now: Date = new Date()): SavingsResult {
  const { attempts, slips, cigarettesPerDay, pricePerCigarette } = inputs
  const hasOpenAttempt = attempts.some((a) => a.ended_at === null && a.quit_date)
  const ready =
    hasOpenAttempt && cigarettesPerDay != null && cigarettesPerDay > 0 && pricePerCigarette != null

  const lifetimeSmokeFreeDays = calcLifetimeSmokeFreeDays(attempts, slips, now)
  const cigarettesSmoked = calcCigarettesSmoked(slips)
  const cpd = cigarettesPerDay ?? 0
  const price = pricePerCigarette ?? 0

  return {
    ready,
    lifetimeSmokeFreeDays,
    cigarettesSmoked,
    moneySavedPaise: calcMoneySaved(lifetimeSmokeFreeDays, cpd, price, cigarettesSmoked),
    timeReclaimedMinutes: calcTimeReclaimed(lifetimeSmokeFreeDays, cpd, cigarettesSmoked),
    cigarettesNotSmoked: calcCigarettesNotSmoked(lifetimeSmokeFreeDays, cpd, cigarettesSmoked),
  }
}

// ── Display formatting ───────────────────────────────────────────────────────

/** ₹ amount from paise. Above ₹9,999 → compact "₹12.3K" (§8 edge case). */
export function formatRupees(paise: number): string {
  const rupees = Math.floor(paise / 100)
  if (rupees > 9999) {
    return `₹${(rupees / 1000).toFixed(1)}K`
  }
  return `₹${rupees.toLocaleString('en-IN')}`
}

/** Minutes → "Hh Mm" / "Hh" / "Mm" (§7 — H hours M minutes reclaimed). */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

// ── Stage 0 preview (§6 / §7) ────────────────────────────────────────────────

export interface DailyPreview {
  moneyPaisePerDay: number
  minutesPerDay: number
  cigarettesPerDay: number
}

/**
 * Stage 0 motivational preview — "Once you quit, every day saves you ₹[rate]".
 * Counters show 0 in Stage 0; this is the per-day rate the user *will* accrue,
 * derived from their onboarding cigarettes/day and price. Returns null when those
 * inputs are missing (the dashboard falls back to its "—" prompt).
 */
export function dailyPreview(
  cigarettesPerDay: number | null,
  pricePerCigaretteRupees: number | null,
): DailyPreview | null {
  if (!cigarettesPerDay || cigarettesPerDay <= 0 || pricePerCigaretteRupees == null) return null
  return {
    moneyPaisePerDay: cigarettesPerDay * Math.round(pricePerCigaretteRupees * 100),
    minutesPerDay: cigarettesPerDay * MINUTES_PER_CIGARETTE,
    cigarettesPerDay,
  }
}

// ── Scale ladder (DASH-2 §5 Section 1) ───────────────────────────────────────

export interface ScaleLadderRow {
  label: 'per day' | 'per week' | 'per month' | 'per year'
  value: string
}

/**
 * The four-row scale ladder for the expanded counter view (§5). Personalised from
 * cigarettes/day: daily × 7 / × 30 / × 365. `counter` selects the unit — cigarettes
 * (raw count), money (₹ from price), or time (duration from 7-min/cig).
 */
export function scaleLadder(
  counter: 'money' | 'time' | 'cigarettes',
  cigarettesPerDay: number,
  pricePerCigaretteRupees: number,
): ScaleLadderRow[] {
  const periods: { label: ScaleLadderRow['label']; days: number }[] = [
    { label: 'per day', days: 1 },
    { label: 'per week', days: 7 },
    { label: 'per month', days: 30 },
    { label: 'per year', days: 365 },
  ]
  return periods.map(({ label, days }) => {
    const cigs = cigarettesPerDay * days
    let value: string
    if (counter === 'cigarettes') {
      value = `${cigs.toLocaleString('en-IN')} cigarettes`
    } else if (counter === 'money') {
      value = formatRupees(cigs * Math.round(pricePerCigaretteRupees * 100))
    } else {
      value = formatDuration(cigs * MINUTES_PER_CIGARETTE)
    }
    return { label, value }
  })
}

// ── Relatable equivalents (§B7) ──────────────────────────────────────────────

interface MoneyEquivalentDef {
  /** Cost of one unit, in rupees. */
  unitRupees: number
  /** Plural noun for N units, e.g. "Zomato orders". */
  noun: string
  /** Singular used in the "almost enough" copy, e.g. "Zomato order". */
  singular: string
}

// §B7a — money equivalent lookup. Prices are quarterly-reviewable defaults.
const MONEY_EQUIVALENTS: Record<RelatableCategory, MoneyEquivalentDef> = {
  food_delivery:   { unitRupees: 180, noun: 'Zomato orders',  singular: 'Zomato order' },
  movies_ott:      { unitRupees: 250, noun: 'movie tickets',  singular: 'movie ticket' },
  music_podcasts:  { unitRupees: 119, noun: 'months of Spotify', singular: 'month of Spotify' },
  travel:          { unitRupees: 500, noun: 'weekend trips',   singular: 'weekend trip' },
  gaming:          { unitRupees: 299, noun: 'gaming top-ups',  singular: 'gaming top-up' },
  clothes_shopping:{ unitRupees: 499, noun: 'new fits',        singular: 'new fit' },
}

/**
 * §B7a — convert money saved (paise) into a relatable-equivalent line.
 * Below one unit → "Almost enough for your next X" to avoid showing "0 orders".
 */
export function moneyEquivalent(
  savedPaise: number,
  category: RelatableCategory | null,
): string {
  const def = MONEY_EQUIVALENTS[category ?? 'food_delivery']
  const unitPaise = def.unitRupees * 100
  const count = Math.floor(savedPaise / unitPaise)
  if (count < 1) {
    return `Almost enough for your next ${def.singular}.`
  }
  return `That's ${count} ${def.noun}.`
}

/**
 * §B7b — convert time reclaimed (minutes) into a relatable-equivalent line.
 * Banded by hours, independent of category (the spec's time table is category-agnostic).
 */
export function timeEquivalent(totalMinutes: number): string {
  const hours = totalMinutes / 60
  if (hours < 2) {
    const videos = Math.max(1, Math.floor(totalMinutes / 12)) // ~12-min YouTube video
    return `Enough to watch ${videos} YouTube videos.`
  }
  if (hours < 10) {
    const episodes = Math.max(1, Math.floor(totalMinutes / 40)) // 40-min episode
    return `Enough to watch ${episodes} episodes.`
  }
  if (hours < 30) {
    const movies = Math.max(1, Math.floor(hours / 2)) // 2-hour film
    return `Enough to watch ${movies} movies back to back.`
  }
  const days = Math.floor(hours / 24)
  return `That's ${days} full days back in your pocket.`
}

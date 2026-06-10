import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import {
  computeSavings,
  dailyPreview,
  formatRupees,
  formatDuration,
  moneyEquivalent,
  timeEquivalent,
  type AttemptRow,
  type SlipRow,
  type SavingsResult,
  type DailyPreview,
} from '../lib/savings'

export interface DashboardData extends SavingsResult {
  /** Formatted display strings for DASH-1 counter cards. */
  moneyLabel: string
  moneyEquivalentLine: string
  timeLabel: string
  timeEquivalentLine: string
  cigarettesLabel: string
  /** Per-day accrual rate for the Stage 0 preview; null if onboarding incomplete. */
  preview: DailyPreview | null
  /** True when cigarettes/day, price, and an open attempt are all set. */
  hasOnboardingInputs: boolean
  isLoading: boolean
}

/**
 * Progress Dashboard data (DASH-1 / DASH-2). Fetches ALL quit_attempts (lifetime
 * calc) + ALL slip logs + the profile, then computes the three counters in a memo
 * (ProgressDashboard_Spec §B2). Read-only — the dashboard writes nothing.
 *
 * Recalc triggers (§B5 — slip log, return modal, settings change) are handled by the
 * React Query cache: those mutations invalidate quit_attempts / logs / profile, which
 * re-runs these queries and the memo. Midnight rollover is covered by app-foreground
 * refetch.
 */
export function useDashboard(): DashboardData {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()

  const attemptsQuery = useQuery({
    queryKey: queryKeys.allAttempts(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('quit_attempts')
        .select('quit_date, ended_at')
        .eq('user_id', user!.id)
        .throwOnError()
      return (data ?? []) as AttemptRow[]
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  })

  const slipsQuery = useQuery({
    queryKey: queryKeys.logsByType(user?.id ?? '', 'slip'),
    queryFn: async () => {
      const { data } = await supabase
        .from('log')
        .select('timestamp, cigarette_count')
        .eq('user_id', user!.id)
        .eq('log_type', 'slip')
        .throwOnError()
      return (data ?? []) as SlipRow[]
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  const attempts = attemptsQuery.data ?? []
  const slips = slipsQuery.data ?? []
  const cigarettesPerDay = profile?.cigarettes_per_day ?? null
  const pricePerCigarette = profile?.price_per_cigarette ?? null
  const relatableCategory = profile?.relatable_category ?? null

  const result = useMemo(
    () =>
      computeSavings({
        attempts,
        slips,
        cigarettesPerDay,
        pricePerCigarette,
      }),
    [attempts, slips, cigarettesPerDay, pricePerCigarette],
  )

  // Onboarding inputs present? (cigarettes/day + price set). Distinct from `ready`,
  // which also requires an open attempt — Stage 0 has inputs but no live counters.
  const hasOnboardingInputs =
    cigarettesPerDay != null && cigarettesPerDay > 0 && pricePerCigarette != null

  return {
    ...result,
    moneyLabel: formatRupees(result.moneySavedPaise),
    moneyEquivalentLine: moneyEquivalent(result.moneySavedPaise, relatableCategory),
    timeLabel: formatDuration(result.timeReclaimedMinutes),
    timeEquivalentLine: timeEquivalent(result.timeReclaimedMinutes),
    cigarettesLabel: result.cigarettesNotSmoked.toLocaleString('en-IN'),
    preview: dailyPreview(cigarettesPerDay, pricePerCigarette),
    hasOnboardingInputs,
    isLoading: profileLoading || attemptsQuery.isLoading || slipsQuery.isLoading,
  }
}

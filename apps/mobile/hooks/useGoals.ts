import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import {
  deriveGoal,
  MAX_ACTIVE_GOALS,
  type GoalQueryRow,
  type GoalWithProgress,
  type TopUpRow,
} from '../lib/goals'
import type { Database } from '../types/database'

type GoalInsert = Database['public']['Tables']['goal']['Insert']
type GoalUpdate = Database['public']['Tables']['goal']['Update']

export interface GoalsData {
  active: GoalWithProgress[]
  /** Completed + retired, newest first — the GOAL-09 history list. */
  history: GoalWithProgress[]
  activeCount: number
  /** False once the 3-active cap is hit (Spec §B2 Goal Count Gate). */
  canAddGoal: boolean
  isLoading: boolean
}

/**
 * All goals with derived progress (Architecture Guide Step 17). One nested
 * select — goal + top_up_log(amount) — so current_amount is always computed
 * from the log sum, never read from the (unwritten) DB column.
 */
export function useGoals(): GoalsData {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: queryKeys.goals(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('goal')
        .select('*, top_up_log(amount)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
        .throwOnError()
      return ((data ?? []) as unknown as GoalQueryRow[]).map(deriveGoal)
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  const goals = query.data ?? []
  const active = goals.filter((g) => g.status === 'active')
  const history = goals
    .filter((g) => g.status !== 'active')
    .sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at))

  return {
    active,
    history,
    activeCount: active.length,
    canAddGoal: active.length < MAX_ACTIVE_GOALS,
    isLoading: query.isLoading,
  }
}

/** Fields the caller supplies on create; the hook fills user_id. */
export type CreateGoalInput = Omit<GoalInsert, 'user_id'>

export function useCreateGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!user) throw new Error('No authenticated user')
      const { data } = await supabase
        .from('goal')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
        .throwOnError()
      return data
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: queryKeys.goals(user.id) })
    },
  })
}

/** Partial goal update — status changes (complete/retire) + GOAL-10 allocation. */
export function useUpdateGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ goalId, patch }: { goalId: string; patch: GoalUpdate }) => {
      await supabase.from('goal').update(patch).eq('goal_id', goalId).throwOnError()
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: queryKeys.goals(user.id) })
    },
  })
}

/**
 * GOAL-07 manual top-up. Inserts the top_up_log row ONLY — goal.current_amount
 * is derived from the sum, never patched (Step 17 verify item).
 */
export function useTopUp() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      if (!user) throw new Error('No authenticated user')
      await supabase
        .from('top_up_log')
        .insert({ goal_id: goalId, user_id: user.id, amount })
        .throwOnError()
    },
    onSuccess: (_data, { goalId }) => {
      if (user) qc.invalidateQueries({ queryKey: queryKeys.goals(user.id) })
      qc.invalidateQueries({ queryKey: queryKeys.topUpLog(goalId) })
    },
  })
}

/** GOAL-06 top-up history, newest first. */
export function useTopUpHistory(goalId: string | null) {
  return useQuery({
    queryKey: queryKeys.topUpLog(goalId ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('top_up_log')
        .select('*')
        .eq('goal_id', goalId!)
        .order('created_at', { ascending: false })
        .throwOnError()
      return (data ?? []) as TopUpRow[]
    },
    enabled: !!goalId,
  })
}

/**
 * GOAL-10 confirm — writes allocated_amount per goal. Validation (sum ≤
 * total_saved) happens at the UI level; this just commits the values.
 */
export function useAllocate() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (allocations: { goalId: string; amount: number }[]) => {
      await Promise.all(
        allocations.map(({ goalId, amount }) =>
          supabase
            .from('goal')
            .update({ allocated_amount: amount })
            .eq('goal_id', goalId)
            .throwOnError(),
        ),
      )
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: queryKeys.goals(user.id) })
    },
  })
}

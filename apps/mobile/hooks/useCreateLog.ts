import { useMutation, useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useAuth } from './useAuth'
import { useCurrentAttempt } from './useCurrentAttempt'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { deriveStage } from '../lib/stage'
import type { Database } from '../types/database'

type LogInsert = Database['public']['Tables']['log']['Insert']
type LogRow = Database['public']['Tables']['log']['Row']

/** Fields the caller supplies; the hook fills user_id, attempt_id, day_number, stage, timestamp. */
export type CreateLogInput = Omit<
  LogInsert,
  'user_id' | 'attempt_id' | 'quit_day_number' | 'current_stage' | 'timestamp'
>

/**
 * Inserts a log row (Architecture Guide §9.2). Computes attempt_id,
 * quit_day_number (negative pre-quit, 0 = quit day, positive after — Logging
 * Spec §B4), and current_stage from the open attempt. Returns the inserted row
 * (so flows can capture log_id for follow-up PATCHes). Invalidates the logs cache.
 */
export function useCreateLog() {
  const { user } = useAuth()
  const { data: attempt } = useCurrentAttempt()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateLogInput): Promise<LogRow> => {
      if (!user) throw new Error('No authenticated user')

      const quitDate = attempt?.quit_date ?? null
      const quitDayNumber = quitDate
        ? differenceInCalendarDays(new Date(), parseISO(quitDate))
        : 0
      const currentStage = deriveStage(quitDate)

      const row: LogInsert = {
        ...input,
        user_id: user.id,
        attempt_id: attempt?.attempt_id ?? null,
        quit_day_number: quitDayNumber,
        current_stage: currentStage,
        timestamp: new Date().toISOString(),
      }

      const { data } = await supabase.from('log').insert(row).select().single().throwOnError()
      return data as LogRow
    },
    onSuccess: () => {
      if (user && attempt) {
        qc.invalidateQueries({ queryKey: queryKeys.logs(user.id, attempt.attempt_id) })
      }
    },
  })
}

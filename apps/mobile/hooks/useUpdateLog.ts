import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useCurrentAttempt } from './useCurrentAttempt'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import type { Database } from '../types/database'

type LogUpdate = Database['public']['Tables']['log']['Update']

/** PATCH an existing log row by log_id (Architecture Guide §9.2). */
export interface UpdateLogInput {
  logId: string
  patch: Omit<LogUpdate, 'log_id' | 'user_id'>
}

/**
 * Updates a previously-created log row as the user fills optional fields after
 * the commit point (e.g. A2 context chips, SOS-3 outcome). Invalidates logs cache.
 */
export function useUpdateLog() {
  const { user } = useAuth()
  const { data: attempt } = useCurrentAttempt()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ logId, patch }: UpdateLogInput) => {
      const { data } = await supabase
        .from('log')
        .update(patch)
        .eq('log_id', logId)
        .select()
        .single()
        .throwOnError()
      return data
    },
    onSuccess: () => {
      if (user && attempt) {
        qc.invalidateQueries({ queryKey: queryKeys.logs(user.id, attempt.attempt_id) })
      }
    },
  })
}

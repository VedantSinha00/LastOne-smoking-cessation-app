import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

/**
 * Deletes one of the caller's own journal notes (log_type='note') via the
 * `delete_note_log` RPC. The `log` table has no client DELETE policy, so deletion
 * must go through the security-definer function (scoped to the user's own notes).
 * Invalidates the logs cache so Journal refreshes.
 */
export function useDeleteNote() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase.rpc('delete_note_log', { p_log_id: logId })
      if (error) throw error
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: ['logs', user.id] })
    },
  })
}

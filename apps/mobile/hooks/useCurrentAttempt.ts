import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

/** The current open quit attempt (ended_at is null) — Architecture Guide §7.8. */
export function useCurrentAttempt() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.currentAttempt(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('quit_attempts')
        .select('*')
        .eq('user_id', user!.id)
        .is('ended_at', null)
        .single()
        .throwOnError()
      return data
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  })
}

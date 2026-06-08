import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

/** Full profile row for the signed-in user (Architecture Guide §7.8). */
export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()
        .throwOnError()
      return data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

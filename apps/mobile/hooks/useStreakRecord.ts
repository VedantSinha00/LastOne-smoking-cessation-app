import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

/**
 * The user's single streak_record row (Data Schema §4 / Architecture Guide §8.3).
 * Short staleTime: streak values change frequently (every confirmation, slip,
 * freeze). Returns null if no row exists yet (should not happen post-onboarding).
 */
export function useStreakRecord() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.streakRecord(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('streak_record')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
        .throwOnError()
      return data
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  })
}

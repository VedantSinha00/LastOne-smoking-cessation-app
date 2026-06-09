import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import type { Database } from '../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']
type ToolScore = Database['public']['Tables']['user_tool_scores']['Row']

export interface RankedTool extends CopingTool {
  score: number
}

/**
 * SOS-eligible coping tools (Architecture Guide §9.8 / Logging Spec §6), ranked
 * by the user's tool_score so the most effective tools surface at the top of
 * SOS-1. Tools with removed_from_sos = true are excluded.
 *
 * Note: requires coping_tools to be seeded on the remote DB (Step 9 DB task).
 */
export function useCopingTools() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.copingTools(),
    queryFn: async (): Promise<RankedTool[]> => {
      const [{ data: tools }, { data: scores }] = await Promise.all([
        supabase.from('coping_tools').select('*').eq('sos_eligible', true).throwOnError(),
        user
          ? supabase.from('user_tool_scores').select('*').eq('user_id', user.id).throwOnError()
          : Promise.resolve({ data: [] as ToolScore[] }),
      ])

      const scoreMap = new Map((scores ?? []).map((s) => [s.tool_id, s]))
      return (tools ?? [])
        .filter((t) => !scoreMap.get(t.tool_id)?.removed_from_sos)
        .map((t) => ({ ...t, score: scoreMap.get(t.tool_id)?.tool_score ?? 0 }))
        .sort((a, b) => b.score - a.score)
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

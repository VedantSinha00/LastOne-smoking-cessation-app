import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import {
  selectSOSTools,
  type CravingInput,
  type SmokerProfile,
} from '../lib/sosTool'
import type { Database } from '../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']
type ToolScore = Database['public']['Tables']['user_tool_scores']['Row']

/**
 * Derive the smoker profile used by the waterfall's Step 4 fallback from the data we
 * actually store post-onboarding: dependency_level (streak_record) + cigarettes_per_day
 * (profiles). The full onboarding calcSmokerProfile needs a dependence score that isn't
 * persisted, so this is the available-signal approximation (Coping Tools §6.1 Step 4).
 */
function deriveProfile(
  dependency: string | null | undefined,
  cigarettesPerDay: number | null | undefined,
): SmokerProfile {
  if ((cigarettesPerDay ?? 99) <= 5 && dependency === 'light') return 'social_occasional'
  if (dependency === 'light') return 'regular_light'
  return 'regular_moderate_heavy'
}

/**
 * Runs the real SOS selection waterfall (Coping Tools §06) for a given craving.
 * Fetches the full catalogue + the user's scores + stage/dependency, then calls the
 * pure selectSOSTools. `craving` is supplied by the SOS modal (intensity + context
 * gate answer). Returns the 3 chosen tools.
 */
export function useSosSelection(craving: CravingInput, enabled = true, exclude: string[] = []) {
  const { user } = useAuth()
  return useQuery({
    // `exclude` participates in the key so the SOS-1 shuffle re-runs the waterfall
    // with the current trio dropped, surfacing the next-best valid set.
    queryKey: ['sos_selection', user?.id ?? '', craving.intensity ?? 'none', craving.context, exclude.join(',')],
    queryFn: async (): Promise<CopingTool[]> => {
      const [{ data: tools }, { data: scores }, { data: streak }, { data: profile }] =
        await Promise.all([
          supabase.from('coping_tools').select('*').throwOnError(),
          supabase.from('user_tool_scores').select('*').eq('user_id', user!.id).throwOnError(),
          supabase
            .from('streak_record')
            .select('current_stage, dependency_level')
            .eq('user_id', user!.id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('cigarettes_per_day')
            .eq('id', user!.id)
            .maybeSingle(),
        ])

      const scoreMap = new Map<string, ToolScore>(
        (scores ?? []).map((s) => [s.tool_id, s as ToolScore]),
      )
      return selectSOSTools({
        tools: (tools ?? []) as CopingTool[],
        scores: scoreMap,
        craving,
        stage: streak?.current_stage ?? 0,
        profile: deriveProfile(streak?.dependency_level, profile?.cigarettes_per_day),
        hasBuddy: false, // Quit Buddy is a V2/Step-18 concept — MIN-03 excluded for now.
        exclude,
      })
    },
    enabled: enabled && !!user,
    staleTime: 0, // always recompute for a fresh craving
    gcTime: 0,
  })
}

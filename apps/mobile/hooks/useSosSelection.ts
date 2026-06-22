import { useMemo } from 'react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
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

/** The raw inputs the waterfall ranks over. The catalogue is effectively static;
 *  scores/stage/profile change slowly. Fetched once and cached so opening SOS is
 *  near-instant after the first time — only the (free, in-memory) ranking re-runs
 *  per craving. */
// NOTE: every field here must be JSON-serializable — this is persisted to disk by
// PersistQueryClientProvider. A Map is NOT (it rehydrates as {} → "scores.get is
// not a function"), so we store scores as a plain array and build the Map in the
// consumer (useMemo below) instead.
export interface SosData {
  tools: CopingTool[]
  scores: ToolScore[]
  stage: number
  profile: SmokerProfile
}

async function fetchSosData(userId: string): Promise<SosData> {
  const [{ data: tools }, { data: scores }, { data: streak }, { data: profile }] =
    await Promise.all([
      supabase.from('coping_tools').select('*').throwOnError(),
      supabase.from('user_tool_scores').select('*').eq('user_id', userId).throwOnError(),
      supabase
        .from('streak_record')
        .select('current_stage, dependency_level')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('cigarettes_per_day')
        .eq('id', userId)
        .maybeSingle(),
    ])

  return {
    tools: (tools ?? []) as CopingTool[],
    scores: (scores ?? []) as ToolScore[],
    stage: streak?.current_stage ?? 0,
    profile: deriveProfile(streak?.dependency_level, profile?.cigarettes_per_day),
  }
}

// Catalogue rarely changes; scores get explicitly invalidated after a tool runs
// (updateToolScore). A 5-min staleTime keeps repeat SOS opens instant without
// risking visibly stale rankings within a session.
const SOS_DATA_STALE = 5 * 60 * 1000

/** Cached fetch of the waterfall inputs. */
function useSosData(enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.sosData(user?.id ?? ''),
    queryFn: () => fetchSosData(user!.id),
    enabled: enabled && !!user,
    staleTime: SOS_DATA_STALE,
  })
}

/** Warm the SOS data cache ahead of time (call when the SOS modal mounts, while
 *  the user is still on the context gate) so the tool list is ready the moment a
 *  context is picked. No-op if already cached + fresh. */
export function prefetchSosData(qc: QueryClient, userId: string) {
  return qc.prefetchQuery({
    queryKey: queryKeys.sosData(userId),
    queryFn: () => fetchSosData(userId),
    staleTime: SOS_DATA_STALE,
  })
}

/**
 * Runs the real SOS selection waterfall (Coping Tools §06) for a given craving.
 * The data (catalogue + scores + stage/profile) is fetched once and cached; the
 * pure selectSOSTools ranking recomputes in-memory on every craving/shuffle, so
 * behaviour is identical to before — only the network cost is removed from the
 * hot path. `craving` is supplied by the SOS modal (intensity + context gate).
 * Returns the 3 chosen tools.
 */
export function useSosSelection(craving: CravingInput, enabled = true, exclude: string[] = []) {
  const data = useSosData(enabled)

  const tools = useMemo(() => {
    if (!data.data) return undefined
    // Build the score Map here (not in the cached data — see SosData note).
    const scoreMap = new Map<string, ToolScore>(
      data.data.scores.map((s) => [s.tool_id, s]),
    )
    return selectSOSTools({
      tools: data.data.tools,
      scores: scoreMap,
      craving,
      stage: data.data.stage,
      profile: data.data.profile,
      hasBuddy: false, // Quit Buddy is a V2/Step-18 concept — MIN-03 excluded for now.
      exclude,
    })
    // Recompute when the inputs OR the live craving/exclude change.
  }, [data.data, craving.intensity, craving.context, exclude.join(',')])

  return { data: tools, isLoading: data.isLoading }
}

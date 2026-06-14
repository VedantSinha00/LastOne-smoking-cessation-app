import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import type { Database } from '../types/database'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Settings writes (Settings Spec §B4). Profile field PATCHes invalidate the
 * profile cache so voice/category/etc. changes reflect on next render without
 * a restart. CPD/price edits write a change-log row FIRST (prospective-only
 * recalculation, §B2.2) then PATCH the profile, then invalidate the dashboard.
 */
export function useSettings() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const qc = useQueryClient()

  const invalidateProfile = () => {
    if (!user) return
    qc.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
    // The onboarding-gate key caches a slim profile too — keep it fresh.
    qc.invalidateQueries({ queryKey: queryKeys.onboardingGate(user.id) })
  }

  /** Generic profile field PATCH (voice_style, relatable_category, display_name,
   *  notification_preference, notifications_enabled, quiet hours…). */
  const updateProfile = useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      if (!user) throw new Error('No authenticated user')
      await supabase
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .throwOnError()
    },
    onSuccess: invalidateProfile,
  })

  /** PROF-04 — CPD edit: write cpd_change_log then PATCH profile (§5 Flow 3). */
  const updateCpd = useMutation({
    mutationFn: async (newValue: number) => {
      if (!user) throw new Error('No authenticated user')
      const previous = profile?.cigarettes_per_day ?? newValue
      if (previous !== newValue) {
        await supabase
          .from('cpd_change_log')
          .insert({ user_id: user.id, previous_value: previous, new_value: newValue })
          .throwOnError()
      }
      await supabase
        .from('profiles')
        .update({ cigarettes_per_day: newValue, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .throwOnError()
    },
    onSuccess: () => {
      invalidateProfile()
      qc.invalidateQueries({ queryKey: ['quit_attempt'] }) // dashboard recompute
      if (user) qc.invalidateQueries({ queryKey: queryKeys.cpdLog(user.id) })
    },
  })

  /** PROF-05 — price edit: write price_change_log then PATCH profile (§5 Flow 4). */
  const updatePrice = useMutation({
    mutationFn: async (newValue: number) => {
      if (!user) throw new Error('No authenticated user')
      const previous = profile?.price_per_cigarette ?? newValue
      if (previous !== newValue) {
        await supabase
          .from('price_change_log')
          .insert({ user_id: user.id, previous_value: previous, new_value: newValue })
          .throwOnError()
      }
      await supabase
        .from('profiles')
        .update({ price_per_cigarette: newValue, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .throwOnError()
    },
    onSuccess: () => {
      invalidateProfile()
      qc.invalidateQueries({ queryKey: ['quit_attempt'] })
      if (user) qc.invalidateQueries({ queryKey: queryKeys.priceLog(user.id) })
    },
  })

  /** PROF-02 — Stage-0 quit date: write to the open quit_attempts row (§B2.1). */
  const updateQuitDate = useMutation({
    mutationFn: async (isoDate: string) => {
      if (!user) throw new Error('No authenticated user')
      await supabase
        .from('quit_attempts')
        .update({ quit_date: isoDate })
        .eq('user_id', user.id)
        .is('ended_at', null)
        .throwOnError()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quit_attempt'] })
      qc.invalidateQueries({ queryKey: ['streak_record'] })
    },
  })

  return { updateProfile, updateCpd, updatePrice, updateQuitDate }
}

/** PROF-14 — delete account: RPC purges all data, then sign out + clear device. */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_user_account', { p_user_id: userId })
  if (error) throw error
}

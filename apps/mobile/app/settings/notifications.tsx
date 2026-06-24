import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Toggle } from '../../components/settings/Toggle'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { supabase } from '../../lib/supabase'
import { reconcileNotifications } from '../../lib/notifications'
import { EditScreen } from '../../components/settings/EditScreen'
import { TIER_OPTIONS } from '../../lib/settings'
import type { NotificationTier } from '../../types/database'

/**
 * PROF-10 — Notification Settings. Both the master toggle and the frequency
 * tier autosave on tap (no Save button — a missed Save would silently keep the
 * old preference). Changing the tier also resets notification_state.effective_tier
 * so any active auto-reduce clears (Architecture Guide §20); reconciles after.
 */
export default function NotificationSettings() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { updateProfile } = useSettings()

  const enabled = profile?.notifications_enabled ?? true
  const tier = profile?.notification_preference ?? 'app_decides'

  const toggleMaster = async (value: boolean) => {
    await updateProfile.mutateAsync({ notifications_enabled: value })
    if (user) await reconcileNotifications(user.id)
  }

  const pickTier = async (value: NotificationTier) => {
    if (value === tier) return
    await updateProfile.mutateAsync({ notification_preference: value })
    if (user) {
      // Reset effective_tier so any active auto-reduce is cleared on a manual change.
      await supabase
        .from('notification_state')
        .update({ effective_tier: value, consecutive_ignored: 0, auto_reduce_active_until: null })
        .eq('user_id', user.id)
        .throwOnError()
      await reconcileNotifications(user.id)
    }
  }

  return (
    <EditScreen title="Notifications">
      <View className="bg-card border border-border rounded-3xl px-5 py-1">
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-foreground text-base">Notifications</Text>
          <Toggle on={enabled} onChange={toggleMaster} />
        </View>
      </View>

      <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mt-2">
        How often
      </Text>
      {TIER_OPTIONS.map((opt) => {
        const active = tier === opt.value
        return (
          <Pressable
            key={opt.value}
            disabled={!enabled}
            onPress={() => pickTier(opt.value)}
            className={`rounded-2xl border p-4 flex-row items-center justify-between ${
              active ? 'bg-primary/10 border-primary' : 'bg-card border-border'
            } ${enabled ? '' : 'opacity-40'}`}
          >
            <Text className={`font-sans-bold ${active ? 'text-primary' : 'text-foreground'}`}>
              {opt.label}
            </Text>
            {active && <Text className="text-primary">✓</Text>}
          </Pressable>
        )
      })}
    </EditScreen>
  )
}

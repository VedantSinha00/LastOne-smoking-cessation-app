import React, { useState } from 'react'
import { View, Text, Pressable, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { supabase } from '../../lib/supabase'
import { reconcileNotifications } from '../../lib/notifications'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'
import { TIER_OPTIONS } from '../../lib/settings'
import type { NotificationTier } from '../../types/database'

/**
 * PROF-10 — Notification Settings. Master on/off toggle (saved immediately) +
 * frequency tier (saved on Confirm). Saving the tier also resets
 * notification_state.effective_tier so the auto-reduce clears when the
 * preference changes (Architecture Guide §20). Reconciles after each change.
 */
export default function NotificationSettings() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { updateProfile } = useSettings()

  const [enabled, setEnabled] = useState(profile?.notifications_enabled ?? true)
  const [tier, setTier] = useState<NotificationTier>(profile?.notification_preference ?? 'app_decides')

  const toggleMaster = async (value: boolean) => {
    setEnabled(value)
    await updateProfile.mutateAsync({ notifications_enabled: value })
    if (user) await reconcileNotifications(user.id)
  }

  const save = async () => {
    if (tier !== profile?.notification_preference) {
      await updateProfile.mutateAsync({ notification_preference: tier })
      // Reset effective_tier so any active auto-reduce is cleared on a manual change.
      if (user) {
        await supabase
          .from('notification_state')
          .update({ effective_tier: tier, consecutive_ignored: 0, auto_reduce_active_until: null })
          .eq('user_id', user.id)
          .throwOnError()
        await reconcileNotifications(user.id)
      }
    }
    router.back()
  }

  return (
    <EditScreen title="Notifications">
      <View className="bg-card border border-border rounded-3xl px-5 py-1">
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-foreground text-base">Notifications</Text>
          <Switch value={enabled} onValueChange={toggleMaster} trackColor={{ true: '#7FC200' }} />
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
            onPress={() => setTier(opt.value)}
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

      <Button title="Save" onPress={save} loading={updateProfile.isPending} />
    </EditScreen>
  )
}

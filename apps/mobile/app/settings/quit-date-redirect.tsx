import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { PauseCircle, RotateCcw } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { useConfirm } from '../../hooks/useConfirm'
import { queryClient } from '../../lib/queryClient'
import { pauseStreak, restartAttempt } from '../../lib/streak'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'

/**
 * PROF-03 — Quit Date Redirect (Stage 1+). The quit date is the timeline
 * anchor once a journey is underway, so it's not freely editable (§3 Decision).
 * Instead of a date picker, this offers the two real actions: "Take a break"
 * → pause (STK-7), "Start fresh" → restart attempt (C3). Cancel → back.
 *
 * Presented as a full EditScreen page (TopBar + eyebrow back-link), cohesive
 * with the rest of the Profile flow — each action is its own roomy card with a
 * heading, an explanation, and its button, rather than a cramped half-sheet.
 */
export default function QuitDateRedirect() {
  const router = useRouter()
  const { user } = useAuth()
  const confirm = useConfirm()
  const [busy, setBusy] = useState<null | 'break' | 'fresh'>(null)

  const takeBreak = async () => {
    if (!user) return
    setBusy('break')
    await pauseStreak(user.id)
    await queryClient.invalidateQueries({ queryKey: ['streak_record', user.id] })
    setBusy(null)
    router.dismissTo('/(tabs)/profile')
  }

  const startFresh = async () => {
    const ok = await confirm({
      title: 'Start fresh?',
      message: 'This begins a new quit attempt from today. Your history and progress are kept.',
      confirmLabel: 'Start fresh',
      destructive: true,
    })
    if (!ok || !user) return
    setBusy('fresh')
    await restartAttempt(user.id)
    await queryClient.invalidateQueries({ queryKey: ['quit_attempt'] })
    await queryClient.invalidateQueries({ queryKey: ['streak_record', user.id] })
    setBusy(null)
    router.dismissTo('/(tabs)')
  }

  return (
    <EditScreen
      title="Quit date"
      footer={<Button title="Cancel" variant="secondary" onPress={() => router.back()} />}
    >
      <Text className="text-foreground font-display text-2xl" style={{ letterSpacing: -0.3 }}>
        Your quit date is set.
      </Text>
      <Text className="text-muted-foreground text-sm leading-relaxed">
        Once your journey is underway, your quit date anchors your whole timeline,
        so it stays fixed. If something's changed, here&apos;s what you can do instead.
      </Text>

      {/* Take a break — pause the streak, keep the date */}
      <View className="bg-card border border-border rounded-2xl p-5 mt-2 gap-3">
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <View className="h-9 w-9 rounded-full bg-secondary items-center justify-center">
            <PauseCircle size={18} color="#15110D" strokeWidth={2} />
          </View>
          <Text className="text-foreground font-sans-bold text-base">Take a break</Text>
        </View>
        <Text className="text-muted-foreground text-sm leading-relaxed">
          Pauses your streak without losing it. Your quit date stays, and gentle
          nudges keep you company until you&apos;re ready to pick back up.
        </Text>
        <Button title="Take a break" onPress={takeBreak} loading={busy === 'break'} />
      </View>

      {/* Start fresh — new attempt from today (the confirm is the action itself) */}
      <View className="bg-card border border-destructive/40 rounded-2xl p-5 gap-3">
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <View className="h-9 w-9 rounded-full bg-accent items-center justify-center">
            <RotateCcw size={18} color="#F15025" strokeWidth={2} />
          </View>
          <Text className="text-foreground font-sans-bold text-base">Start fresh</Text>
        </View>
        <Text className="text-muted-foreground text-sm leading-relaxed">
          Begins a new quit attempt from today. Your history and progress are kept —
          you&apos;re just resetting the clock.
        </Text>
        <Button
          title="Start fresh"
          variant="danger"
          onPress={startFresh}
          loading={busy === 'fresh'}
        />
      </View>
    </EditScreen>
  )
}

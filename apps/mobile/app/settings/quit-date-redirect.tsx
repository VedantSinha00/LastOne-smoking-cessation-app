import React, { useState } from 'react'
import { View, Text, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { queryClient } from '../../lib/queryClient'
import { pauseStreak, restartAttempt } from '../../lib/streak'
import { Button } from '../../components/ui/button'

/**
 * PROF-03 — Quit Date Redirect (Stage 1+). The quit date is the timeline
 * anchor once a journey is underway, so it's not freely editable (§3 Decision).
 * "Take a break" → pause (STK-7); "Start fresh" → restart flow (C3). Dismiss →
 * back, no change.
 */
export default function QuitDateRedirect() {
  const router = useRouter()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)

  const takeBreak = async () => {
    if (!user) return
    setBusy(true)
    await pauseStreak(user.id)
    await queryClient.invalidateQueries({ queryKey: ['streak_record', user.id] })
    setBusy(false)
    router.dismissTo('/(tabs)/profile')
  }

  const startFresh = () => {
    Alert.alert(
      'Start fresh?',
      'This begins a new quit attempt from today. Your history and progress are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start fresh',
          style: 'destructive',
          onPress: async () => {
            if (!user) return
            setBusy(true)
            await restartAttempt(user.id)
            await queryClient.invalidateQueries({ queryKey: ['quit_attempt'] })
            await queryClient.invalidateQueries({ queryKey: ['streak_record', user.id] })
            setBusy(false)
            router.dismissTo('/(tabs)')
          },
        },
      ],
    )
  }

  return (
    <View className="flex-1 bg-black/40 justify-end">
      <Pressable className="flex-1" onPress={() => router.back()} />
      <View className="bg-card rounded-t-3xl p-6 pb-10">
        <Text className="text-foreground font-display text-xl">What would you like to do?</Text>
        <View className="gap-3 mt-5">
          <View>
            <Button title="Take a break" onPress={takeBreak} loading={busy} />
            <Text className="text-muted-foreground text-xs mt-1.5 px-1">
              Pauses your streak. Your quit date stays. Gentle nudges keep you company.
            </Text>
          </View>
          <View>
            <Button title="Start fresh" variant="secondary" onPress={startFresh} />
            <Text className="text-muted-foreground text-xs mt-1.5 px-1">
              Begins a new attempt from today. History is kept.
            </Text>
          </View>
          <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    </View>
  )
}

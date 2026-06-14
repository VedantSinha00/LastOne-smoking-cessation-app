import React, { useEffect } from 'react'
import { Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useGivingUpTrigger } from '../../hooks/useGivingUpTrigger'

/**
 * GU-1 — Tier 1 trigger card. Distinct visual treatment from the daily
 * check-in: warmer and softer, NO streak imagery, NO numbers (Spec §5).
 * Replaces the daily check-in card for the session when both are due (§8).
 * Rendering it registers a potential no-tap session toward the 3-session cap;
 * tapping starts the experience and resets the counter.
 */
export const GivingUpCard: React.FC = () => {
  const router = useRouter()
  const gu = useGivingUpTrigger()

  useEffect(() => {
    if (gu.showCard) gu.registerShown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gu.showCard])

  if (!gu.showCard) return null

  const open = async () => {
    const eventId = await gu.begin()
    router.push({
      pathname: '/(modals)/giving-up',
      params: eventId ? { eventId } : {},
    })
  }

  return (
    <Pressable
      onPress={open}
      className="bg-accent border border-craving/30 rounded-3xl p-6 active:opacity-90"
    >
      <Text className="text-foreground font-display text-lg leading-snug">{gu.cardCopy}</Text>
      <Text className="text-craving font-sans-bold text-sm mt-3">Take 2 minutes →</Text>
    </Pressable>
  )
}

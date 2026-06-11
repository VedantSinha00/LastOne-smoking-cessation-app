import React, { useCallback, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSavingsCard } from '../../hooks/useSavingsCard'

/**
 * Inline savings-milestone celebration card (Content Cards §2.2 / SW-01–10). Appears on
 * Home when money_saved crosses a ₹ threshold not yet celebrated. Fires once per
 * threshold — dismissing records the impression so it won't return.
 *
 * Pacing: at most ONE savings card per Home visit. Dismissing hides it for the rest of
 * this visit; the next crossed threshold surfaces on the next return to Home (the
 * focus effect clears the local dismissed flag). Avoids stacking several celebration
 * cards at once when multiple thresholds were crossed together (e.g. backfilled).
 */
export const SavingsMilestoneCard: React.FC = () => {
  const { card, markShown } = useSavingsCard()
  const [dismissed, setDismissed] = useState(false)

  // Reset the per-visit dismiss on each Home focus so the next threshold can show.
  useFocusEffect(
    useCallback(() => {
      setDismissed(false)
    }, []),
  )

  if (!card || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    markShown() // record so this threshold never re-fires (§2.2)
  }

  return (
    <View className="bg-primary/10 border border-primary/30 rounded-3xl p-5">
      <View className="flex-row justify-between items-start">
        <Text className="text-success text-[11px] font-sans-bold uppercase tracking-wider">
          {card.card.pill_tag}
        </Text>
        <Pressable onPress={dismiss} hitSlop={8} className="active:opacity-60">
          <Text className="text-muted-foreground text-xs">Dismiss</Text>
        </Pressable>
      </View>
      <Text className="text-foreground font-display text-lg mt-1.5 leading-snug">
        {card.card.title}
      </Text>
      <Text className="text-muted-foreground text-sm mt-2 leading-relaxed">{card.body}</Text>
    </View>
  )
}

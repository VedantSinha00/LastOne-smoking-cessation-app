import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useSavingsCard } from '../../hooks/useSavingsCard'

/**
 * Inline savings-milestone celebration card (Content Cards §2.2 / SW-01–10). Appears on
 * Home when money_saved crosses a ₹ threshold not yet celebrated. Fires once per
 * threshold — dismissing records the impression so it won't return. Renders nothing
 * when no new threshold has been crossed.
 */
export const SavingsMilestoneCard: React.FC = () => {
  const { card, markShown } = useSavingsCard()
  const [dismissed, setDismissed] = useState(false)

  if (!card || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    markShown() // record so this threshold never re-fires (§2.2)
  }

  return (
    <View className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 shadow-md">
      <View className="flex-row justify-between items-start">
        <Text className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">
          {card.card.pill_tag}
        </Text>
        <Pressable onPress={dismiss} hitSlop={8} className="active:opacity-60">
          <Text className="text-zinc-500 text-xs">Dismiss</Text>
        </Pressable>
      </View>
      <Text className="text-white text-lg font-extrabold mt-1.5 leading-snug">
        {card.card.title}
      </Text>
      <Text className="text-zinc-300 text-sm mt-2 leading-relaxed">{card.body}</Text>
    </View>
  )
}

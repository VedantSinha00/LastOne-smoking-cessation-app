import React from 'react'
import { View, Text, Pressable, Linking } from 'react-native'
import { Card } from '../ui/Card'
import type { CausesCardContent } from '../../lib/causesCard'

interface Props {
  card: CausesCardContent
  onDismiss: () => void
  /** Stamps tapped_learn_more on the log row; the URL opens here. */
  onLearnMore: () => void
}

/**
 * GOAL-11 — inline Causes Card on the Goals Dashboard (Stage 3+ only).
 * Awareness only: NGO name, descriptor, voice-matched copy, Learn more link.
 * Card remains visible after Learn more; dismiss advances the rotation
 * (already logged at impression) and hides it for this 14-day cycle.
 */
export const CausesCardView: React.FC<Props> = ({ card, onDismiss, onLearnMore }) => (
  <Card className="bg-muted">
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-[11px] font-sans-bold uppercase tracking-wider text-muted-foreground">
          A cause worth knowing
        </Text>
        <Text className="text-foreground font-sans-bold text-base mt-1">{card.name}</Text>
        <Text className="text-muted-foreground text-xs mt-0.5">{card.descriptor}</Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={12}>
        <Text className="text-muted-foreground text-base">✕</Text>
      </Pressable>
    </View>
    <Text className="text-foreground text-sm leading-relaxed mt-3">{card.body}</Text>
    <Pressable
      onPress={() => {
        onLearnMore()
        Linking.openURL(card.url)
      }}
      className="mt-3 self-start"
      hitSlop={8}
    >
      <Text className="text-primary font-sans-bold text-sm">Learn more →</Text>
    </Pressable>
  </Card>
)

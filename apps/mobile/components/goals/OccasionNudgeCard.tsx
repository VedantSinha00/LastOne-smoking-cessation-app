import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Card } from '../ui/Card'

interface Props {
  title: string
  copy: string
  onDismiss: () => void
  /** Shown only when the user has no active goals ("Set a goal" CTA). */
  onSetGoal?: () => void
}

/**
 * Occasion nudge card on GOAL-01 (Spec §B2). Renders inside the 3–5 day
 * pre-occasion window; dismissal silences this occasion for the calendar year.
 */
export const OccasionNudgeCard: React.FC<Props> = ({ title, copy, onDismiss, onSetGoal }) => (
  <Card className="border-primary/40">
    <View className="flex-row items-start justify-between">
      <Text className="text-[11px] font-sans-bold uppercase tracking-wider text-primary flex-1 pr-3">
        {title}
      </Text>
      <Pressable onPress={onDismiss} hitSlop={12}>
        <Text className="text-muted-foreground text-base">✕</Text>
      </Pressable>
    </View>
    <Text className="text-foreground text-sm leading-relaxed mt-2">{copy}</Text>
    {onSetGoal && (
      <Pressable onPress={onSetGoal} className="mt-3 self-start" hitSlop={8}>
        <Text className="text-primary font-sans-bold text-sm">Set a goal →</Text>
      </Pressable>
    )}
  </Card>
)

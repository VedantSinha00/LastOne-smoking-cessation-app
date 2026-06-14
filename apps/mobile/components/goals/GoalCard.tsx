import React from 'react'
import { View, Text, Image } from 'react-native'
import { Card } from '../ui/Card'
import { formatGoalRupees, type GoalWithProgress } from '../../lib/goals'

/**
 * Two-segment progress bar shared by the goal card and the detail screen:
 * faint fill = allocated intent (GOAL-10), solid fill = committed money
 * (top-ups). Intent renders behind commitment and never counts as progress.
 */
export const GoalProgressBar: React.FC<{ ratio: number; allocatedRatio?: number }> = ({
  ratio,
  allocatedRatio = 0,
}) => (
  <View className="h-2 rounded-full bg-muted overflow-hidden">
    {allocatedRatio > 0 && (
      <View
        // Explicit rgba (lime @ 25%) instead of a Tailwind opacity class: this
        // is the only place that shade exists, and a missed style regeneration
        // renders an unknown class as transparent — invisible segment.
        className="rounded-full"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: 'rgba(127, 194, 0, 0.28)',
          width: `${Math.max(4, allocatedRatio * 100)}%`,
        }}
      />
    )}
    <View
      className="h-2 rounded-full bg-primary"
      style={{ width: `${Math.max(ratio > 0 ? 4 : 0, ratio * 100)}%` }}
    />
  </View>
)

/** Emoji or product image avatar; falls back to a target glyph. */
export const GoalThumb: React.FC<{ goal: GoalWithProgress; size?: 'sm' | 'lg' }> = ({
  goal,
  size = 'sm',
}) => {
  const box = size === 'lg' ? 'w-16 h-16 rounded-2xl' : 'w-12 h-12 rounded-xl'
  if (goal.product_image_url) {
    return <Image source={{ uri: goal.product_image_url }} className={`${box} bg-muted`} resizeMode="cover" />
  }
  return (
    <View className={`${box} bg-primary/10 items-center justify-center`}>
      <Text className={size === 'lg' ? 'text-3xl' : 'text-2xl'}>{goal.emoji || '🎯'}</Text>
    </View>
  )
}

/** Active goal card on GOAL-01. Tap → GOAL-06 detail. */
export const GoalCard: React.FC<{ goal: GoalWithProgress; onPress: () => void }> = ({
  goal,
  onPress,
}) => (
  <Card onPress={onPress}>
    <View className="flex-row items-center gap-3">
      <GoalThumb goal={goal} />
      <View className="flex-1">
        <Text className="text-foreground font-sans-bold text-base" numberOfLines={1}>
          {goal.goal_name}
        </Text>
        <Text className="text-muted-foreground text-xs mt-0.5">
          {formatGoalRupees(goal.derivedCurrentAmount)} of {formatGoalRupees(Number(goal.target_amount))}
        </Text>
      </View>
      <Text className="text-primary font-display text-lg">{goal.progressLabel}</Text>
    </View>
    <View className="mt-3">
      <GoalProgressBar ratio={goal.barRatio} allocatedRatio={goal.allocatedRatio} />
    </View>
  </Card>
)

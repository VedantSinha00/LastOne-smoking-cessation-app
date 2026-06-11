import React from 'react'
import { View, Text } from 'react-native'
import { Card } from '../ui/Card'
import type { Stage } from '../../lib/stage'
import type { Database } from '../../types/database'

type StreakRecord = Database['public']['Tables']['streak_record']['Row']

interface StreakBarProps {
  stage: Stage
  streak: StreakRecord | null | undefined
}

/** Snowflake row representing available freezes (Streak Spec §5 / STK-1). */
const FreezeIcons: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null
  return (
    <View className="flex-row items-center mt-2">
      {Array.from({ length: count }).map((_, i) => (
        <Text key={i} className="text-base mr-0.5">
          ❄️
        </Text>
      ))}
      <Text className="text-muted-foreground text-xs ml-1">
        {count} {count === 1 ? 'freeze' : 'freezes'}
      </Text>
    </View>
  )
}

/**
 * Streak Bar — Home Screen Spec §5 Section B / Streak Spec §5.
 *
 * Stage 0:   logging-streak framing (quit streak does not exist yet).
 * Stage 1+:  current_streak_days with freeze snowflakes.
 * STK-5:     reset state when current_streak_days === 0 — lifetime total becomes
 *            the prominent number (CTAs live in the home screen, not here).
 *
 * Note: the precise Stage-0 logging-streak *count* is derived from the log table
 * (Step 9). Until then Stage 0 renders its framing with the data that exists.
 */
export const StreakBar: React.FC<StreakBarProps> = ({ stage, streak }) => {
  const isPreQuit = stage === 0
  const currentStreak = streak?.current_streak_days ?? 0
  const lifetime = streak?.lifetime_smoke_free_days ?? 0
  const freezeStock = streak?.freeze_stock ?? 0
  const isPaused = streak?.streak_status === 'paused'
  const isReset = !isPreQuit && currentStreak === 0 // STK-5

  // ── Stage 0: logging streak framing ──────────────────────────────────────
  if (isPreQuit) {
    return (
      <Card>
        <Text className="text-muted-foreground text-sm font-sans-medium uppercase tracking-wider">
          Learning Week
        </Text>
        <Text className="text-foreground font-display text-2xl mt-1">
          Building your profile
        </Text>
        <Text className="text-muted-foreground text-xs mt-1 leading-relaxed">
          Keep logging — your quit streak starts the day you quit.
        </Text>
      </Card>
    )
  }

  // ── STK-5: streak reset state ─────────────────────────────────────────────
  if (isReset) {
    return (
      <Card>
        <Text className="text-muted-foreground text-sm font-sans-medium uppercase tracking-wider">
          Streak Reset
        </Text>
        <Text className="text-foreground font-display text-2xl mt-1">Day 0</Text>
        <Text className="text-craving text-sm font-sans-bold mt-2">
          {lifetime} lifetime smoke-free {lifetime === 1 ? 'day' : 'days'}
        </Text>
        <Text className="text-muted-foreground text-xs mt-1 leading-relaxed">
          That total doesn&apos;t reset. Today is a fresh Day 1 when you&apos;re ready.
        </Text>
      </Card>
    )
  }

  // ── STK-1: active (or paused) quit streak ─────────────────────────────────
  return (
    <Card className="flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="text-muted-foreground text-sm font-sans-medium uppercase tracking-wider">
          {isPaused ? 'Streak Paused' : 'Current Streak'}
        </Text>
        <Text className="text-foreground font-display mt-1" style={{ fontSize: 40, lineHeight: 44 }}>
          {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
        </Text>
        <Text className="text-muted-foreground text-xs mt-1">
          {lifetime} lifetime smoke-free {lifetime === 1 ? 'day' : 'days'}
        </Text>
        {!isPaused && <FreezeIcons count={freezeStock} />}
      </View>
      <View className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 items-center justify-center ml-4">
        <Text className="text-2xl">
          {isPaused ? '⏸️' : '🔥'}
        </Text>
      </View>
    </Card>
  )
}

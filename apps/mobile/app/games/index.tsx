import React from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useGameStreak } from '../../hooks/useGameStreak'
import { GAME_LABELS } from '../../lib/games'
import { Card } from '../../components/ui/Card'
import type { GameType } from '../../types/database'

const TILES: { type: GameType; route: string; emoji: string }[] = [
  { type: 'memory_1p', route: '/games/memory-1p', emoji: '🃏' },
  { type: 'echo_tap', route: '/games/echo-tap', emoji: '🎵' },
  { type: 'memory_2p', route: '/games/memory-2p', emoji: '👥' },
]

/**
 * MG-HUB-1 — Games Hub. Lists the three games, the current craving-game streak,
 * and a shortcut to the streak dashboard (§5 Flow 1). Each tile routes to its
 * game, which shows the craving prompt before play.
 */
export default function GamesHub() {
  const router = useRouter()
  const { current, isLoading } = useGameStreak()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-muted-foreground text-sm font-sans-medium">Need a distraction?</Text>
          <Text className="text-foreground font-display text-2xl">Pick a game</Text>
        </View>
      </View>

      {/* Streak summary + shortcut to MG-STREAK-1 */}
      <Pressable onPress={() => router.push('/games/streaks')}>
        <Card className="bg-muted">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider">
                Cravings fought with a game
              </Text>
              <Text className="text-foreground font-display text-2xl mt-1">
                {isLoading ? '—' : `${current}-day streak`}
              </Text>
            </View>
            <Text className="text-primary font-display text-xl">→</Text>
          </View>
        </Card>
      </Pressable>

      {TILES.map((tile) => (
        <Card key={tile.type} onPress={() => router.push(tile.route)}>
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">{tile.emoji}</Text>
            <View className="flex-1">
              <Text className="text-foreground font-sans-bold text-base">
                {GAME_LABELS[tile.type].name}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {GAME_LABELS[tile.type].blurb}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  )
}

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
      {/* Header — design TopBar pattern (back ← + centered title + close) */}
      <View className="h-14 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 24 }}>
          <Text className="text-2xl" style={{ color: '#0D0D0D' }}>
            ←
          </Text>
        </Pressable>
        <Text className="font-display" style={{ fontSize: 16, color: '#0D0D0D' }}>
          Mini-games
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 24, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, color: '#888888' }}>✕</Text>
        </Pressable>
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
          <View className="flex-row items-center" style={{ gap: 16 }}>
            {/* Family-coloured (Games blue) round icon chip, design style */}
            <View
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCEBFB' }}
            >
              <Text style={{ fontSize: 24 }}>{tile.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-display text-base">
                {GAME_LABELS[tile.type].name}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {GAME_LABELS[tile.type].blurb}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: '#76706C' }}>›</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  )
}

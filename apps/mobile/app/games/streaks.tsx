import React from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useGameStreak } from '../../hooks/useGameStreak'
import { supabase } from '../../lib/supabase'
import { GAME_LABELS } from '../../lib/games'
import { Card } from '../../components/ui/Card'
import type { GameType } from '../../types/database'

const GAME_ORDER: GameType[] = ['memory_1p', 'echo_tap', 'memory_2p']

/**
 * MG-STREAK-1 — Game Streaks Dashboard (§5 Flow 7). Read-only: current streak,
 * personal best, this week's craving sessions, and a per-game breakdown of
 * craving-linked sessions. Reached from the hub's streak shortcut.
 */
export default function GameStreaks() {
  const router = useRouter()
  const { user } = useAuth()
  const { current, longest, sessionsThisWeek, isLoading } = useGameStreak()

  // Per-game craving-linked session counts (all-time).
  const { data: perGame } = useQuery({
    queryKey: ['game_session_breakdown', user?.id ?? ''],
    queryFn: async () => {
      const { data } = await supabase
        .from('game_session')
        .select('game_type')
        .eq('user_id', user!.id)
        .eq('session_type', 'craving_linked')
        .throwOnError()
      const counts: Record<GameType, number> = { memory_1p: 0, echo_tap: 0, memory_2p: 0 }
      for (const row of (data ?? []) as { game_type: GameType }[]) counts[row.game_type] += 1
      return counts
    },
    enabled: !!user,
  })

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-foreground font-display text-2xl">Games played during cravings</Text>
        </View>
      </View>
      <Text className="text-muted-foreground text-sm leading-relaxed -mt-1">
        Every time you opened a game during a craving, it counted. Here&apos;s your record.
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#7FC200" className="mt-6" />
      ) : (
        <>
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center">
              <Text className="text-primary font-display text-3xl">{current}</Text>
              <Text className="text-muted-foreground text-xs mt-1 text-center">Day streak</Text>
            </Card>
            <Card className="flex-1 items-center">
              <Text className="text-primary font-display text-3xl">{longest}</Text>
              <Text className="text-muted-foreground text-xs mt-1 text-center">Personal best</Text>
            </Card>
            <Card className="flex-1 items-center">
              <Text className="text-primary font-display text-3xl">{sessionsThisWeek}</Text>
              <Text className="text-muted-foreground text-xs mt-1 text-center">This week</Text>
            </Card>
          </View>

          <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mt-4">
            By game
          </Text>
          {GAME_ORDER.map((g) => (
            <Card key={g}>
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground font-sans-bold">{GAME_LABELS[g].name}</Text>
                <Text className="text-muted-foreground text-sm">
                  {perGame?.[g] ?? 0} craving session{(perGame?.[g] ?? 0) === 1 ? '' : 's'}
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  )
}

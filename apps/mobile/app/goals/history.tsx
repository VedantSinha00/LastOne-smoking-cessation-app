import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { useGoals } from '../../hooks/useGoals'
import { formatGoalRupees } from '../../lib/goals'
import { GoalThumb } from '../../components/goals/GoalCard'
import { Card } from '../../components/ui/Card'

/**
 * GOAL-09 — Completed Goals History: past completed and retired goals,
 * newest first. Read-only.
 */
export default function GoalsHistory() {
  const router = useRouter()
  const { history } = useGoals()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl">Goal history</Text>
      </View>

      {history.length === 0 && (
        <Text className="text-muted-foreground text-sm">Nothing here yet.</Text>
      )}

      {history.map((g) => (
        <Card key={g.goal_id}>
          <View className="flex-row items-center gap-3">
            <GoalThumb goal={g} />
            <View className="flex-1">
              <Text className="text-foreground font-sans-bold text-base" numberOfLines={1}>
                {g.goal_name}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {formatGoalRupees(g.derivedCurrentAmount)} saved
                {g.completed_at && ` · ${format(parseISO(g.completed_at), 'd MMM yyyy')}`}
              </Text>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full ${
                g.status === 'completed' ? 'bg-primary/15' : 'bg-muted'
              }`}
            >
              <Text
                className={`text-[11px] font-sans-bold ${
                  g.status === 'completed' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {g.status === 'completed' ? 'Completed' : 'Retired'}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  )
}

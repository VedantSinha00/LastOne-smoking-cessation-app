import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Card } from '../../components/ui/Card'

/**
 * GOAL-02 — Add Goal: entry method. Two paths: paste a product link (→ GOAL-03)
 * or enter manually (→ GOAL-05). Back saves nothing (§5.1).
 */
export default function AddGoal() {
  const router = useRouter()
  return (
    <View className="flex-1 bg-background p-6 gap-4">
      <View className="flex-row items-center gap-3 mb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl">Add a goal</Text>
      </View>

      <Card onPress={() => router.push('/goals/add-url')} elevation="soft">
        <Text className="text-3xl mb-2">🔗</Text>
        <Text className="text-foreground font-sans-bold text-base">Paste a link</Text>
        <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
          Drop a product link and we&apos;ll pull the name, image, and price for you.
        </Text>
      </Card>

      <Card onPress={() => router.push('/goals/add-manual')}>
        <Text className="text-3xl mb-2">✏️</Text>
        <Text className="text-foreground font-sans-bold text-base">Enter manually</Text>
        <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
          Name your goal and set a target amount yourself.
        </Text>
      </Card>
    </View>
  )
}

import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

/**
 * Home-screen sections whose full logic is owned by later build steps. Each
 * renders a minimal real card so the Home scroll order (Home Spec §P6) is
 * correct and verifiable in Step 8. Replace each with its real implementation
 * at the step noted below.
 */

/** Section C — Progress Dashboard. Real counters: Step 12 (Progress Dashboard). */
export const ProgressDashboardPlaceholder: React.FC = () => (
  <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
      Your Progress
    </Text>
    <View className="flex-row justify-between">
      {[
        { label: 'Saved', value: '₹0' },
        { label: 'Time back', value: '0h' },
        { label: 'Not smoked', value: '0' },
      ].map((c) => (
        <View key={c.label} className="items-center flex-1">
          <Text className="text-white text-xl font-extrabold">{c.value}</Text>
          <Text className="text-zinc-500 text-[11px] mt-1">{c.label}</Text>
        </View>
      ))}
    </View>
  </View>
)

/** Section E — Daily Check-In card. Real flow: Step 9 (Logging System §8). */
export const DailyCheckInPlaceholder: React.FC = () => {
  const router = useRouter()
  return (
    <Pressable
      onPress={() => router.push('/(modals)/log')}
      className="bg-zinc-900 border border-amber-900/40 rounded-2xl p-6 shadow-md active:bg-zinc-850"
    >
      <Text className="text-white text-base font-bold">Daily check-in</Text>
      <Text className="text-zinc-400 text-sm mt-1 leading-relaxed">
        Log how today is going before it ends.
      </Text>
    </Pressable>
  )
}

/** Section D — Content Carousel. Real cards: Step 14 (Content Cards). */
export const ContentCarouselPlaceholder: React.FC = () => (
  <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
      For you today
    </Text>
    <Text className="text-zinc-500 text-sm leading-relaxed">
      Daily content cards will appear here.
    </Text>
  </View>
)

/** Section F — Insights Preview card. Real insight: Step 16 (Insights). */
export const InsightsPreviewPlaceholder: React.FC = () => (
  <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
      Insights
    </Text>
    <Text className="text-zinc-500 text-sm leading-relaxed">
      Log a few cigarettes and we&apos;ll start finding your patterns.
    </Text>
  </View>
)

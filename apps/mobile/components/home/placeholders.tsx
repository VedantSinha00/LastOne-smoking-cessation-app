import React from 'react'
import { View, Text } from 'react-native'

/**
 * Home-screen sections whose full logic is owned by later build steps. Each
 * renders a minimal real card so the Home scroll order (Home Spec §P6) is
 * correct and verifiable in Step 8. Replace each with its real implementation
 * at the step noted below.
 */

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

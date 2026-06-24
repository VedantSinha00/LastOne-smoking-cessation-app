import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { TrendingUp } from 'lucide-react-native'
import { Card } from '../ui/Card'
import { useInsights } from '../../hooks/useInsights'

/**
 * Home Insights Preview (Home Spec §F) — ported to the Lovable `RecentInsights`
 * layout: a circular TrendingUp icon on the left, the top insight headline +
 * its supporting line on the right. Deep-links to the Insights tab. Logic is
 * unchanged from before (top-ranked feed item; gentle prompt before any insight
 * exists) — only the presentation matches the design now.
 */
export const InsightsPreview: React.FC = () => {
  const router = useRouter()
  const { feed, hasAnyLog, isLoading } = useInsights()
  const top = feed[0]

  const emptyCopy = isLoading
    ? 'Looking for your patterns…'
    : hasAnyLog
      ? 'A few more logs and your patterns will start to show.'
      : "Log a few cigarettes and we'll start finding your patterns."

  return (
    <Card onPress={() => router.push('/insights')} className="p-6 flex-row items-start" style={{ gap: 16 }}>
      <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center">
        <TrendingUp size={16} color="#15110D" strokeWidth={2} />
      </View>
      <View className="flex-1">
        {top ? (
          <>
            <Text
              className="text-foreground font-display tracking-tight"
              style={{ fontSize: 16, lineHeight: 21 }}
            >
              {top.content.headline}
            </Text>
            <Text className="text-muted-foreground text-[13px] mt-1.5 leading-relaxed" numberOfLines={2}>
              {top.content.body}
            </Text>
          </>
        ) : (
          <Text className="text-muted-foreground text-sm leading-relaxed">{emptyCopy}</Text>
        )}
      </View>
    </Card>
  )
}

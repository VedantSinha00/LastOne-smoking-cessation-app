import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useInsights, useInsightActions } from '../../hooks/useInsights'
import { useStage } from '../../hooks/useStage'
import { InsightCardView } from '../../components/insights/InsightCardView'

/**
 * INS-1 — Insights Feed (Insights Spec §5.2). A ranked vertical feed of insight
 * cards derived from the user's own data. Cards expand in-place (INS-2 ↔ INS-3);
 * first expansion marks the card read + logs engagement. The Learning Week profile
 * cards (profile_*) are part of the same feed — they lead in early stages and rank
 * to the bottom from Stage 3 (feed ranking §B2.2).
 *
 * INS-1a empty state (Stage 0, before the first log) shows the single log prompt.
 */
export default function Insights() {
  const { feed, hasAnyLog, screenState, isLoading } = useInsights()
  const { stage } = useStage()
  const { expandCard, toggleRiskWindow } = useInsightActions()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  // Collapse any expanded card when the screen loses focus, so it opens fresh.
  useFocusEffect(
    useCallback(() => {
      return () => setExpandedKey(null)
    }, []),
  )

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7FC200" />
      </View>
    )
  }

  // INS-1a — Stage 0, no logs yet. Single prompt; replaced permanently on first log.
  if (!hasAnyLog) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-foreground font-display text-2xl text-center leading-8">
          Log your first cigarette to start seeing your patterns.
        </Text>
        <Text className="text-muted-foreground text-sm text-center mt-3 leading-relaxed">
          The more you log, the clearer the picture of what's really driving it.
        </Text>
      </View>
    )
  }

  const handleToggle = (key: string) => {
    const item = feed.find((f) => f.card.insight_key === key)
    if (!item) return
    const next = expandedKey === key ? null : key
    setExpandedKey(next)
    // First expansion → mark read + engagement (idempotent thereafter).
    if (next && item.card.card_state !== 'read') expandCard.mutate(item.card)
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5 gap-4 pb-12">
      <View>
        <Text className="text-muted-foreground text-sm font-sans-medium">Your patterns</Text>
        <Text className="text-foreground font-display text-2xl mt-0.5">Insights</Text>
      </View>

      {feed.length === 0 ? (
        <View className="bg-card border border-border rounded-3xl p-5">
          <Text className="text-muted-foreground text-sm leading-relaxed">
            Your quit patterns will start appearing here as you go. Check back after a few days.
          </Text>
        </View>
      ) : (
        feed.map((item) => (
          <InsightCardView
            key={item.card.insight_key}
            item={item}
            expanded={expandedKey === item.card.insight_key}
            onToggle={() => handleToggle(item.card.insight_key)}
            onToggleRiskWindow={
              item.content.riskWindowStartHour != null
                ? () => toggleRiskWindow.mutate(item.content.riskWindowStartHour!)
                : undefined
            }
          />
        ))
      )}

      {/* Stage 3+ context: the Learning Week profile cards have ranked to the bottom
          of the feed above (feed_led/feed_continues). No separate route needed. */}
      {(screenState === 'feed_led' || screenState === 'feed_continues') && stage >= 3 && (
        <Text className="text-muted-foreground text-xs text-center mt-2 leading-relaxed">
          Your Learning Week profile sits at the bottom — tap any card to revisit it.
        </Text>
      )}
    </ScrollView>
  )
}

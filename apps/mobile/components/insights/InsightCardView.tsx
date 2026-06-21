import React from 'react'
import { Text, View, Pressable } from 'react-native'
import { Card } from '../ui/Card'
import type { FeedItem } from '../../hooks/useInsights'
import type { InsightMetrics } from '../../lib/insights'
import { insightInfographic } from '../../lib/insightInfographic'
import { InfographicRenderer } from './InfographicRenderer'

interface Props {
  item: FeedItem
  expanded: boolean
  /** Live metrics — resolves the optional infographic for this card type. */
  metrics: InsightMetrics
  onToggle: () => void
  onToggleRiskWindow?: () => void
}

/**
 * Insight card — INS-2 (collapsed) / INS-3 (expanded), states of one component
 * (Insights Spec §4). Collapsed: category label + headline + one-line body.
 * Expanded in-place: full body + optional transparency line with a risk-window
 * toggle. Read-only, no full-screen navigation (DD-05).
 */
export const InsightCardView: React.FC<Props> = ({
  item,
  expanded,
  metrics,
  onToggle,
  onToggleRiskWindow,
}) => {
  const { card, content } = item
  const isRead = card.card_state === 'read'

  // Generic infographic: present only when the resolver has one for this type.
  const infographic = insightInfographic(card.insight_type, metrics)

  return (
    <Card onPress={onToggle} className={isRead && !expanded ? 'opacity-80' : ''}>
      <Text className="text-primary text-[11px] font-sans-bold uppercase tracking-wider">
        {content.categoryLabel}
      </Text>
      <Text className="text-foreground font-display text-lg mt-1 leading-6">
        {content.headline}
      </Text>

      {expanded ? (
        <View className="mt-2">
          <Text className="text-muted-foreground text-sm leading-relaxed">{content.body}</Text>

          {content.transparencyLine && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-muted-foreground text-xs leading-relaxed">
                {content.transparencyLine}
              </Text>
              {onToggleRiskWindow && (
                <Pressable
                  onPress={onToggleRiskWindow}
                  className="mt-2 self-start px-3 py-1.5 rounded-full border border-border active:bg-muted"
                >
                  <Text className="text-foreground text-xs font-sans-bold">
                    Turn off alertness for this window
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Generic infographic — rendered inline whenever the card is expanded
              and the resolver has one for this type. No extra tap. */}
          {infographic && (
            <View className="mt-4 pt-4 border-t border-border">
              <InfographicRenderer spec={infographic} />
            </View>
          )}
        </View>
      ) : (
        <Text className="text-muted-foreground text-sm mt-1.5 leading-relaxed" numberOfLines={1}>
          {content.body}
        </Text>
      )}
    </Card>
  )
}

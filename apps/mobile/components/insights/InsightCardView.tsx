import React, { useEffect } from 'react'
import { Text, View, Pressable } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { ChevronDown, Zap, Clock, TrendingUp, Check, AlertTriangle, Users, Sparkles } from 'lucide-react-native'
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

const CARD_THEME: Record<string, { Icon: any; iconColor: string; textColor: string; bgLight: string }> = {
  top_trigger: { Icon: Zap, iconColor: '#F15025', textColor: 'text-craving', bgLight: '#FFF1EB' },
  profile_trigger_category: { Icon: Zap, iconColor: '#F15025', textColor: 'text-craving', bgLight: '#FFF1EB' },
  resistance_rate: { Icon: Check, iconColor: '#0E9254', textColor: 'text-success', bgLight: '#E6F4D6' },
  peak_risk_window: { Icon: AlertTriangle, iconColor: '#E19100', textColor: 'text-warning', bgLight: '#FFF3D6' },
  craving_drop: { Icon: TrendingUp, iconColor: '#0E9254', textColor: 'text-success', bgLight: '#E6F4D6' },
  slip_pattern: { Icon: AlertTriangle, iconColor: '#F51B3D', textColor: 'text-destructive', bgLight: '#FFE5DC' },
  profile_peak_windows: { Icon: Clock, iconColor: '#E19100', textColor: 'text-warning', bgLight: '#FFF3D6' },
  profile_social_context: { Icon: Users, iconColor: '#7FC200', textColor: 'text-primary', bgLight: '#F3F8E6' },
}

const DEFAULT_THEME = { Icon: Sparkles, iconColor: '#7FC200', textColor: 'text-primary', bgLight: '#F7F5F1' }

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

  // Rotating chevron transition
  const rotation = useSharedValue(0)
  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 200 })
  }, [expanded, rotation])

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const theme = CARD_THEME[card.insight_type] ?? DEFAULT_THEME

  return (
    <Card onPress={onToggle} className={isRead && !expanded ? 'opacity-80' : ''}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <View className="px-2.5 py-1 rounded-full flex-row items-center" style={{ backgroundColor: theme.bgLight, gap: 4 }}>
            <theme.Icon size={12} color={theme.iconColor} strokeWidth={2.5} />
            <Text className={`text-[10px] font-sans-bold uppercase tracking-wider ${theme.textColor}`}>
              {content.categoryLabel}
            </Text>
          </View>
        </View>
        <Animated.View style={animatedChevronStyle}>
          <ChevronDown size={18} color="#76706C" strokeWidth={2} />
        </Animated.View>
      </View>

      <Text className="text-foreground font-display text-lg mt-2 leading-6">
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

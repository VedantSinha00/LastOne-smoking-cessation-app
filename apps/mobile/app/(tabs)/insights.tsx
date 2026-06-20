import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Zap, Wrench, FileText, AlertTriangle, Users, MapPin, Activity, ChevronRight, ArrowLeft } from 'lucide-react-native'
import { useInsights, useInsightActions } from '../../hooks/useInsights'
import { useStage } from '../../hooks/useStage'
import { InsightCardView } from '../../components/insights/InsightCardView'
import { CravingsBarChart } from '../../components/insights/CravingsBarChart'

/**
 * INS-1 — Insights, reworked to the Lovable stats/explore HUB (product decision
 * 2026-06-20): an overview stat grid + "Cravings This Week" bar chart + an
 * Explore menu. All stats are REAL (computeMetrics). The original ranked insight
 * FEED is preserved as the "Patterns" Explore destination (no logic lost); other
 * sub-views that have no backing data yet are "coming soon".
 */
type HubView = 'main' | 'patterns'

const EXPLORE: {
  key: HubView | 'soon'
  label: string
  sub: string
  Icon: typeof Zap
  tint: string
  bg: string
}[] = [
  { key: 'patterns', label: 'Cravings', sub: 'Patterns, intensity, timing', Icon: Zap, tint: '#F15025', bg: '#FFE5DC' },
  { key: 'soon', label: 'Top tools', sub: "What's working for you", Icon: Wrench, tint: '#4E9A52', bg: '#E6F4D6' },
  { key: 'soon', label: 'Journal', sub: 'Your notes over time', Icon: FileText, tint: '#378ADD', bg: '#DCEBFB' },
  { key: 'soon', label: 'Triggers', sub: 'What sets off cravings', Icon: AlertTriangle, tint: '#E0A52B', bg: '#FFF3D6' },
  { key: 'soon', label: 'People', sub: 'Who you were with', Icon: Users, tint: '#8B5CF6', bg: '#F3E8FF' },
  { key: 'soon', label: 'Places', sub: 'Where cravings hit', Icon: MapPin, tint: '#268255', bg: '#D6F0E2' },
  { key: 'soon', label: 'Streaks', sub: 'Your quit history', Icon: Activity, tint: '#E0A52B', bg: '#FFF3D6' },
]

export default function Insights() {
  const { feed, metrics, hasAnyLog, screenState, isLoading, resnapshotOrder } = useInsights()
  const { stage } = useStage()
  const { expandCard, toggleRiskWindow } = useInsightActions()
  const [view, setView] = useState<HubView>('main')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [soon, setSoon] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      resnapshotOrder()
      return () => {
        setExpandedKey(null)
        setView('main')
        setSoon(null)
      }
    }, [resnapshotOrder]),
  )

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7FC200" />
      </View>
    )
  }

  // INS-1a — Stage 0, no logs yet.
  if (!hasAnyLog) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-foreground font-display text-2xl text-center leading-8">
          Log your first cigarette to start seeing your patterns.
        </Text>
        <Text className="text-muted-foreground text-sm text-center mt-3 leading-relaxed">
          The more you log, the clearer the picture of what&apos;s really driving it.
        </Text>
      </View>
    )
  }

  // ── Patterns sub-view — the original ranked insight feed ────────────────────
  if (view === 'patterns') {
    const handleToggle = (key: string) => {
      const item = feed.find((f) => f.card.insight_key === key)
      if (!item) return
      const next = expandedKey === key ? null : key
      setExpandedKey(next)
      if (next && item.card.card_state !== 'read') expandCard.mutate(item.card)
    }
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5 gap-4 pb-12">
        <View className="h-12 flex-row items-center">
          <Pressable onPress={() => setView('main')} className="pr-3 active:opacity-60" accessibilityLabel="Back">
            <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
          </Pressable>
          <Text className="text-foreground font-display text-2xl">Cravings</Text>
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
        {(screenState === 'feed_led' || screenState === 'feed_continues') && stage >= 3 && (
          <Text className="text-muted-foreground text-xs text-center mt-2 leading-relaxed">
            Your Learning Week profile sits at the bottom — tap any card to revisit it.
          </Text>
        )}
      </ScrollView>
    )
  }

  // ── Main hub view ───────────────────────────────────────────────────────────
  const successRate = metrics.resistanceRate != null ? `${Math.round(metrics.resistanceRate)}%` : '—'

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-8 pb-12 gap-6">
      <Text className="text-foreground font-display text-center" style={{ fontSize: 22 }}>
        Insights
      </Text>

      {/* Overview 2×2 stat grid */}
      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3 px-1">
          Overview
        </Text>
        <View style={{ gap: 12 }}>
          <View className="flex-row" style={{ gap: 12 }}>
            <StatCell value={String(metrics.cravingCount)} label="total cravings" />
            <StatCell value={String(metrics.overcomeCount)} label="cravings beaten" highlight />
          </View>
          <View className="flex-row" style={{ gap: 12 }}>
            <StatCell value={successRate} label="success rate" highlight />
            <StatCell value={String(metrics.slipCount)} label="slips logged" />
          </View>
        </View>
      </View>

      {/* Cravings this week */}
      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3 px-1">
          Cravings this week
        </Text>
        <CravingsBarChart data={metrics.weeklyCravings} />
      </View>

      {/* Explore */}
      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3 px-1">
          Explore
        </Text>
        <View style={{ gap: 12 }}>
          {EXPLORE.map((e) => (
            <Pressable
              key={e.label}
              onPress={() => (e.key === 'patterns' ? setView('patterns') : setSoon(e.label))}
              className="bg-card border border-border rounded-3xl p-5 flex-row items-center active:scale-[0.99]"
              style={{ gap: 16 }}
            >
              <View className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: e.bg }}>
                <e.Icon size={16} color={e.tint} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-display" style={{ fontSize: 16 }}>
                  {e.label}
                </Text>
                <Text className="text-muted-foreground text-[13px] mt-0.5">{e.sub}</Text>
              </View>
              <ChevronRight size={18} color="#76706C" strokeWidth={2} />
            </Pressable>
          ))}
        </View>
        {soon && (
          <Text className="text-muted-foreground text-xs text-center mt-3">
            {soon} insights are coming soon.
          </Text>
        )}
      </View>
    </ScrollView>
  )
}

const StatCell: React.FC<{ value: string; label: string; highlight?: boolean }> = ({
  value,
  label,
  highlight,
}) => (
  <View className="flex-1 bg-card border border-border rounded-3xl p-5" style={{ minHeight: 96 }}>
    <Text
      className={`font-display ${highlight ? 'text-primary' : 'text-foreground'}`}
      style={{ fontSize: 32, letterSpacing: -0.5 }}
    >
      {value}
    </Text>
    <Text className="text-muted-foreground text-sm mt-1">{label}</Text>
  </View>
)

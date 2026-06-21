import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Zap, Wrench, FileText, AlertTriangle, Users, MapPin, Activity, ChevronRight } from 'lucide-react-native'
import { useInsights, useInsightActions } from '../../hooks/useInsights'
import { useStage } from '../../hooks/useStage'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryKeys'
import {
  triggerBreakdown,
  socialBreakdown,
  locationBreakdown,
  toolStats,
} from '../../lib/insights'
import { TRIGGER_TOKENS, SOCIAL_TOKENS, LOCATION_TOKENS } from '../../lib/logOptions'
import { InsightCardView } from '../../components/insights/InsightCardView'
import { CravingsBarChart } from '../../components/insights/CravingsBarChart'
import { BreakdownView } from '../../components/insights/BreakdownView'
import { TopToolsView } from '../../components/insights/TopToolsView'
import { ScreenHeader } from '../../components/ui/ScreenHeader'

// token -> display label maps (reuse the canonical logging tokens)
const labelMap = (tokens: { value: string; label: string }[]) => {
  const m: Record<string, string> = {}
  for (const t of tokens) m[t.value] = t.label
  return m
}
const TRIGGER_LABELS = labelMap(TRIGGER_TOKENS)
const SOCIAL_LABELS = labelMap(SOCIAL_TOKENS)
const LOCATION_LABELS = labelMap(LOCATION_TOKENS)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * INS-1 — Insights, reworked to the Lovable stats/explore HUB (product decision
 * 2026-06-20): an overview stat grid + "Cravings This Week" bar chart + an
 * Explore menu. All stats are REAL (computeMetrics). The original ranked insight
 * FEED is preserved as the "Patterns" Explore destination (no logic lost); other
 * sub-views that have no backing data yet are "coming soon".
 */
type HubView = 'main' | 'patterns' | 'tools' | 'triggers' | 'people' | 'places'

const EXPLORE: {
  key: HubView | 'soon'
  label: string
  sub: string
  Icon: typeof Zap
  tint: string
  bg: string
}[] = [
  { key: 'patterns', label: 'Cravings', sub: 'Patterns, intensity, timing', Icon: Zap, tint: '#F15025', bg: '#FFE5DC' },
  { key: 'tools', label: 'Top tools', sub: "What's working for you", Icon: Wrench, tint: '#4E9A52', bg: '#E6F4D6' },
  { key: 'soon', label: 'Journal', sub: 'Your notes over time', Icon: FileText, tint: '#378ADD', bg: '#DCEBFB' },
  { key: 'triggers', label: 'Triggers', sub: 'What sets off cravings', Icon: AlertTriangle, tint: '#E0A52B', bg: '#FFF3D6' },
  { key: 'people', label: 'People', sub: 'Who you were with', Icon: Users, tint: '#8B5CF6', bg: '#F3E8FF' },
  { key: 'places', label: 'Places', sub: 'Where cravings hit', Icon: MapPin, tint: '#268255', bg: '#D6F0E2' },
  { key: 'soon', label: 'Streaks', sub: 'Your quit history', Icon: Activity, tint: '#E0A52B', bg: '#FFF3D6' },
]

export default function Insights() {
  const insets = useSafeAreaInsets()
  const { feed, metrics, logs, hasAnyLog, screenState, isLoading, resnapshotOrder } = useInsights()
  const { stage } = useStage()

  // coping_tools catalog (id -> name/family + total count) for the Top tools view.
  const { data: toolCatalog } = useQuery({
    queryKey: [...queryKeys.copingTools(), 'catalog'],
    queryFn: async () => {
      const { data } = await supabase.from('coping_tools').select('tool_id, name, family').throwOnError()
      const rows = (data ?? []) as { tool_id: string; name: string; family: string }[]
      const name: Record<string, string> = {}
      const family: Record<string, string> = {}
      for (const t of rows) {
        name[t.tool_id] = t.name
        family[t.tool_id] = t.family
      }
      return { name, family, total: rows.length }
    },
    staleTime: 5 * 60 * 1000,
  })

  // Pre-aggregate the spec-backed Explore breakdowns from the raw logs.
  const triggers = useMemo(() => triggerBreakdown(logs), [logs])
  const social = useMemo(() => socialBreakdown(logs), [logs])
  const places = useMemo(() => locationBreakdown(logs), [logs])
  const tools = useMemo(
    () => toolStats(logs, toolCatalog?.total ?? 0),
    [logs, toolCatalog?.total],
  )

  // Pretty family names for the "BRE-01 · Breathing" sub-label.
  const familyLabel = (fam: string) =>
    ({ breathing: 'Breathing', physical: 'Physical', mini_games: 'Mini-Game', reframing: 'Reframe' } as Record<string, string>)[fam] ??
    cap(fam)
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
      <View className="flex-1 bg-background">
        <ScreenHeader title="Cravings" onBack={() => setView('main')} />
        <ScrollView className="flex-1" contentContainerClassName="p-5 gap-4 pb-12">
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
              metrics={metrics}
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
      </View>
    )
  }

  // ── Triggers — what sets off cravings (spec top_trigger / INS-4 categories) ──
  if (view === 'triggers') {
    return (
      <BreakdownView
        title="Triggers"
        caption="What sets off your cravings, most common first."
        rows={triggers.rows}
        total={triggers.total}
        labelFor={(k) => TRIGGER_LABELS[k] ?? cap(k)}
        emptyText="As you tag what's behind each craving, the patterns will show up here."
        onBack={() => setView('main')}
      />
    )
  }

  // ── People — social context breakdown (spec INS-4) ──────────────────────────
  if (view === 'people') {
    return (
      <BreakdownView
        title="People"
        caption="Who you were with when cravings hit."
        rows={social.rows}
        total={social.total}
        labelFor={(k) => SOCIAL_LABELS[k] ?? cap(k)}
        emptyText="When you log who you're around during a craving, you'll see the breakdown here."
        onBack={() => setView('main')}
      />
    )
  }

  // ── Places — location breakdown ─────────────────────────────────────────────
  if (view === 'places') {
    return (
      <BreakdownView
        title="Places"
        caption="Where your cravings tend to hit."
        rows={places.rows}
        total={places.total}
        labelFor={(k) => LOCATION_LABELS[k] ?? cap(k)}
        emptyText="When you log where a craving happened, the places that trigger you most will show up here."
        onBack={() => setView('main')}
      />
    )
  }

  // ── Top tools — the design's 5-section ToolStatsView ────────────────────────
  if (view === 'tools') {
    return (
      <TopToolsView
        stats={tools}
        labelFor={(id) => toolCatalog?.name[id] ?? id}
        subFor={(id) => {
          const fam = toolCatalog?.family[id]
          return fam ? `${id} · ${familyLabel(fam)}` : id
        }}
        triggerLabel={(k) => TRIGGER_LABELS[k] ?? cap(k)}
        onBack={() => setView('main')}
      />
    )
  }

  // ── Main hub view ───────────────────────────────────────────────────────────
  const successRate = metrics.resistanceRate != null ? `${Math.round(metrics.resistanceRate)}%` : '—'

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-12 gap-6"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
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
              onPress={() => (e.key === 'soon' ? setSoon(e.label) : setView(e.key))}
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

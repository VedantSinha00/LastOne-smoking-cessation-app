import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Zap, Wrench, FileText, AlertTriangle, Users, MapPin, Activity, ChevronRight, ChevronDown } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useInsights, useInsightActions } from '../../hooks/useInsights'
import { useStage } from '../../hooks/useStage'
import { useStreakRecord } from '../../hooks/useStreakRecord'
import { useDeleteNote } from '../../hooks/useDeleteNote'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryKeys'
import {
  triggerBreakdown,
  socialBreakdown,
  locationBreakdown,
  toolStats,
  slipDaySet,
} from '../../lib/insights'
import { TRIGGER_TOKENS, SOCIAL_TOKENS, LOCATION_TOKENS } from '../../lib/logOptions'
import { InsightCardView } from '../../components/insights/InsightCardView'
import { CravingsBarChart } from '../../components/insights/CravingsBarChart'
import { BreakdownInline } from '../../components/insights/BreakdownView'
import { TopToolsView } from '../../components/insights/TopToolsView'
import { StreaksView } from '../../components/insights/StreaksView'
import { JournalView } from '../../components/insights/JournalView'
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
// Full-page Explore destinations (rich multi-section screens).
type HubView = 'main' | 'patterns' | 'tools' | 'streaks' | 'journal'
// Inline expandable Explore destinations (breakdown shows in place on the hub).
type ExpandKey = 'triggers' | 'people' | 'places'

type ExploreItem = {
  label: string
  sub: string
  Icon: typeof Zap
  tint: string
  bg: string
} & (
  | { kind: 'nav'; view: HubView }
  | { kind: 'expand'; expand: ExpandKey }
  | { kind: 'soon' }
)

const EXPLORE: ExploreItem[] = [
  { kind: 'nav', view: 'patterns', label: 'Cravings', sub: 'Patterns, intensity, timing', Icon: Zap, tint: '#F15025', bg: '#FFE5DC' },
  { kind: 'nav', view: 'tools', label: 'Top tools', sub: "What's working for you", Icon: Wrench, tint: '#4E9A52', bg: '#E6F4D6' },
  { kind: 'nav', view: 'journal', label: 'Journal', sub: 'Your notes over time', Icon: FileText, tint: '#378ADD', bg: '#DCEBFB' },
  { kind: 'expand', expand: 'triggers', label: 'Triggers', sub: 'What sets off cravings', Icon: AlertTriangle, tint: '#E0A52B', bg: '#FFF3D6' },
  { kind: 'expand', expand: 'people', label: 'People', sub: 'Who you were with', Icon: Users, tint: '#8B5CF6', bg: '#F3E8FF' },
  { kind: 'expand', expand: 'places', label: 'Places', sub: 'Where cravings hit', Icon: MapPin, tint: '#268255', bg: '#D6F0E2' },
  { kind: 'nav', view: 'streaks', label: 'Streaks', sub: 'Your quit history', Icon: Activity, tint: '#E0A52B', bg: '#FFF3D6' },
]

export default function Insights() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { feed, metrics, logs, hasAnyLog, screenState, isLoading, resnapshotOrder } = useInsights()
  const { stage, quitDate } = useStage()
  const { data: streak } = useStreakRecord()
  const deleteNote = useDeleteNote()

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
  const slipDays = useMemo(() => slipDaySet(logs), [logs])
  const tools = useMemo(
    () => toolStats(logs, toolCatalog?.total ?? 0),
    [logs, toolCatalog?.total],
  )

  // Pretty family names for the "BRE-01 · Breathing" sub-label.
  const familyLabel = (fam: string) =>
    ({ breathing: 'Breathing', physical: 'Physical', mini_games: 'Mini-Game', reframing: 'Reframe' } as Record<string, string>)[fam] ??
    cap(fam)

  // Props for the inline Explore breakdowns (Triggers/People/Places) shown on the hub.
  const inlineBreakdown: Record<ExpandKey, React.ComponentProps<typeof BreakdownInline>> = {
    triggers: {
      kind: 'triggers',
      caption: 'What sets off your cravings, most common first.',
      rows: triggers.rows,
      total: triggers.total,
      labelFor: (k) => TRIGGER_LABELS[k] ?? cap(k),
      emptyText: "As you tag what's behind each craving, the patterns will show up here.",
    },
    people: {
      kind: 'people',
      caption: 'Who you were with when cravings hit.',
      rows: social.rows,
      total: social.total,
      labelFor: (k) => SOCIAL_LABELS[k] ?? cap(k),
      emptyText: "When you log who you're around during a craving, you'll see the breakdown here.",
    },
    places: {
      kind: 'places',
      caption: 'Where your cravings tend to hit.',
      rows: places.rows,
      total: places.total,
      labelFor: (k) => LOCATION_LABELS[k] ?? cap(k),
      emptyText: 'When you log where a craving happened, the places that trigger you most will show up here.',
    },
  }
  const { expandCard, toggleRiskWindow } = useInsightActions()
  // Optional deep-link param: /(tabs)/insights?view=journal opens that sub-view
  // (used when returning from the Quick Note flow so we land back on Journal).
  const params = useLocalSearchParams<{ view?: string }>()
  const paramView = params.view as HubView | undefined
  const [view, setView] = useState<HubView>(paramView ?? 'main')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [soon, setSoon] = useState<string | null>(null)
  // Which inline Explore breakdown (Triggers/People/Places) is open on the hub.
  const [openExplore, setOpenExplore] = useState<ExpandKey | null>(null)

  useFocusEffect(
    useCallback(() => {
      resnapshotOrder()
      // Apply a deep-link view param on focus (e.g. returning to Journal after a note).
      if (paramView) setView(paramView)
      return () => {
        // Reset transient in-view state on blur, but DO NOT reset `view` here —
        // opening a modal (e.g. "+ Add a note" → Flow D) blurs the tab, and we
        // want router.back() to return to the same sub-view (e.g. Journal), not
        // snap back to the hub.
        setExpandedKey(null)
        setSoon(null)
        setOpenExplore(null)
      }
    }, [resnapshotOrder, paramView]),
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
          <View className="bg-card border border-border rounded-3xl p-8 items-center justify-center">
            <View className="h-16 w-16 rounded-full items-center justify-center bg-accent mb-4">
              <Zap size={32} color="#F15025" strokeWidth={2} />
            </View>
            <Text className="text-foreground font-display text-lg text-center mb-2">
              Quit patterns taking shape
            </Text>
            <Text className="text-muted-foreground text-sm text-center leading-relaxed px-2">
              We analyze your logs to find key patterns in when, where, and why you feel cravings. Check back in a few days after logging a few entry points.
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-muted-foreground text-sm px-1 mb-1 leading-relaxed">
              Analyze patterns in your craving intensity, triggers, and timing to build better defenses.
            </Text>
            {feed.map((item) => (
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
            ))}
          </>
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

  // ── Streaks — current/best + month calendar + history (design StreaksView) ──
  if (view === 'streaks') {
    return (
      <StreaksView
        currentStreak={streak?.current_streak_days ?? 0}
        bestStreak={streak?.longest_streak_ever ?? 0}
        totalSmokeFree={streak?.lifetime_smoke_free_days ?? 0}
        quitDate={quitDate ? quitDate.slice(0, 10) : null}
        slipDays={slipDays}
        onBack={() => setView('main')}
      />
    )
  }

  // ── Journal — Quick Note logs over time (design JournalView) ────────────────
  if (view === 'journal') {
    return (
      <JournalView
        logs={logs}
        onBack={() => setView('main')}
        onAddNote={() => router.push({ pathname: '/(modals)/log-d', params: { from: 'journal' } })}
        onDelete={(logId) =>
          deleteNote.mutate(logId, {
            onError: (e: any) => Alert.alert("Couldn't delete", e?.message ?? 'Please try again.'),
          })
        }
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
          {EXPLORE.map((e) => {
            const isExpand = e.kind === 'expand'
            const isOpen = isExpand && openExplore === e.expand
            const onPress = () => {
              if (e.kind === 'soon') setSoon((s) => (s === e.label ? null : e.label))
              else if (e.kind === 'nav') setView(e.view)
              else setOpenExplore((cur) => (cur === e.expand ? null : e.expand))
            }
            return (
              <View
                key={e.label}
                className="bg-card border border-border rounded-3xl overflow-hidden"
              >
                <Pressable
                  onPress={onPress}
                  className="p-5 flex-row items-center active:opacity-90"
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
                  {isExpand ? (
                    <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                      <ChevronDown size={18} color="#76706C" strokeWidth={2} />
                    </View>
                  ) : (
                    <ChevronRight size={18} color="#76706C" strokeWidth={2} />
                  )}
                </Pressable>
                {isExpand && isOpen && (
                  <View className="px-5 pb-5 pt-1">
                    <View className="pt-4 border-t border-border">
                      <BreakdownInline {...inlineBreakdown[e.expand]} />
                    </View>
                  </View>
                )}
                {e.kind === 'soon' && soon === e.label && (
                  <View className="px-5 pb-5 pt-1">
                    <View className="pt-4 border-t border-border">
                      <Text className="text-muted-foreground text-sm text-center leading-relaxed">
                        {e.label} insights are coming soon.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )
          })}
        </View>
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

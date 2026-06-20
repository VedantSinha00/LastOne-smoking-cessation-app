import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router'
import { ArrowLeft, Wallet, CigaretteOff, Clock } from 'lucide-react-native'
import { useProfile } from '../../hooks/useProfile'
import { useDashboard } from '../../hooks/useDashboard'
import { useGoals } from '../../hooks/useGoals'
import { useMilestoneCards, type MilestoneCard } from '../../hooks/useMilestoneCards'
import { scaleLadder, formatRupees } from '../../lib/savings'
import type { CounterKey } from '../../components/home/ProgressDashboard'

const COUNTER_META: Record<
  CounterKey,
  { title: string; primary: 'moneyLabel' | 'timeLabel' | 'cigarettesLabel'; Icon: typeof Wallet }
> = {
  cigarettes: { title: 'Cigs Avoided', primary: 'cigarettesLabel', Icon: CigaretteOff },
  money: { title: 'Money Saved', primary: 'moneyLabel', Icon: Wallet },
  time: { title: 'Time Reclaimed', primary: 'timeLabel', Icon: Clock },
}

// Main-view order matches the design's "WHAT YOU'VE GAINED" stack.
const HERO_ORDER: CounterKey[] = ['money', 'cigarettes', 'time']

type ProgressView = 'main' | CounterKey

/** One reference card in the DASH-2 horizontal scroll (Milestone Spec §3, §4). */
const ReferenceCard: React.FC<{
  card: MilestoneCard
  active: boolean
  expanded: boolean
  onPress: () => void
}> = ({ card, active, expanded, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`w-64 mr-3 rounded-3xl p-5 border ${
      active ? 'bg-card border-primary/40' : 'bg-muted border-border'
    } active:opacity-80`}
  >
    <Text
      className={`text-[11px] font-sans-bold uppercase tracking-wider ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {card.pillTag}
    </Text>
    <Text className={`font-display text-lg mt-1 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
      {card.title}
    </Text>
    {active ? (
      expanded ? (
        <Text className="text-muted-foreground text-sm mt-2 leading-relaxed">{card.body}</Text>
      ) : (
        <Text className="text-muted-foreground text-xs mt-2">Tap to read</Text>
      )
    ) : (
      <Text className="text-muted-foreground text-xs mt-2">Keep going — you&apos;ll unlock this one.</Text>
    )}
  </Pressable>
)

/**
 * DASH-2 — Expanded Counter View (ProgressDashboard_Spec §5 Flow 2). Doubles as the
 * Progress tab landing screen.
 *
 * Navigation model ported from the Lovable ProgressDashboard (design decision
 * 2026-06-20): a main "WHAT YOU'VE GAINED" view with three hero cards (Money / Cigs
 * / Time) that tap into a per-counter drill-down (scale ladder + milestone reference
 * cards + Personal Goals entry). All data + content are the app's real ones —
 * `scaleLadder()` math and the canonical CM-01–08 Milestone System cards — NOT the
 * design's mock copy.
 *
 * Entry: a counter-card tap on Home deep-links with ?counter=… → opens directly in
 * that drill-down; the tab bar enters with none → the hero main view.
 */
export default function Progress() {
  const router = useRouter()
  const params = useLocalSearchParams<{ counter?: string }>()
  const deepLinked = (params.counter as CounterKey) ?? null
  const [view, setView] = useState<ProgressView>(
    deepLinked && HERO_ORDER.includes(deepLinked) ? deepLinked : 'main',
  )
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Collapse any expanded reference card whenever the screen regains focus, so the
  // DASH-2 view always opens fresh. This tab stays mounted in the background.
  useFocusEffect(
    useCallback(() => {
      return () => setExpandedCard(null)
    }, []),
  )

  const { data: profile } = useProfile()
  const d = useDashboard()
  const { active: activeGoals } = useGoals()
  const { data: milestones, isLoading: milestonesLoading } = useMilestoneCards(
    profile?.voice_style ?? null,
  )

  const cpd = profile?.cigarettes_per_day ?? 0
  const price = profile?.price_per_cigarette ?? 0

  // ── Main view — "WHAT YOU'VE GAINED": three hero cards ──────────────────────
  if (view === 'main') {
    const perDay = d.preview
    const heroMeta: Record<CounterKey, { value: string; equiv: string; perDay: string }> = {
      money: {
        value: d.moneyLabel,
        equiv: d.moneyEquivalentLine,
        perDay: perDay ? `${formatRupees(perDay.moneyPaisePerDay)} per day` : '',
      },
      cigarettes: {
        value: d.cigarettesLabel,
        equiv: "cigarettes you didn't smoke",
        perDay: perDay ? `${perDay.cigarettesPerDay} per day` : '',
      },
      time: {
        value: d.timeLabel,
        equiv: d.timeEquivalentLine,
        perDay: perDay ? `${perDay.minutesPerDay} min per day` : '',
      },
    }

    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-2 pb-12 gap-3">
        <View className="h-14 flex-row items-center">
          <Pressable onPress={() => router.back()} accessibilityLabel="Back" className="pr-3 active:opacity-60">
            <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
          </Pressable>
          <Text className="text-foreground font-display" style={{ fontSize: 22, letterSpacing: -0.3 }}>
            Progress
          </Text>
        </View>

        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-1 px-1">
          What you&apos;ve gained
        </Text>

        {HERO_ORDER.map((key) => {
          const { Icon, title } = COUNTER_META[key]
          const m = heroMeta[key]
          return (
            <Pressable
              key={key}
              onPress={() => setView(key)}
              className="rounded-3xl bg-card border border-border p-5 active:scale-[0.99]"
              style={{
                shadowColor: '#15110D',
                shadowOpacity: 0.06,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Icon size={20} color="#7FC200" strokeWidth={1.9} />
                <Text className="text-muted-foreground text-[11px] font-sans-medium uppercase tracking-wider">
                  {title}
                </Text>
              </View>
              <Text
                className="text-foreground font-display mt-3"
                style={{ fontSize: 40, lineHeight: 44, letterSpacing: -0.5 }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {m.value}
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">{m.equiv}</Text>
              <View className="flex-row items-center justify-between mt-4">
                <Text className="text-muted-foreground/70 text-xs">{m.perDay}</Text>
                <Text className="text-primary text-xs font-sans-medium">Tap to explore →</Text>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
    )
  }

  // ── Drill-down — scale ladder + milestone reference cards + goals ───────────
  const counter = view
  const meta = COUNTER_META[counter]
  const primaryValue = d[meta.primary]
  const ladder = cpd > 0 ? scaleLadder(counter, cpd, price) : []
  // Back from a deep-linked drill-down should leave Progress entirely; from the
  // main view it returns to the hero cards.
  const goBack = () => (deepLinked ? router.back() : setView('main'))

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-2 pb-12 gap-6">
      <View className="h-14 flex-row items-center">
        <Pressable onPress={goBack} accessibilityLabel="Back" className="pr-3 active:opacity-60">
          <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
        </Pressable>
        <Text className="text-foreground font-display" style={{ fontSize: 22, letterSpacing: -0.3 }}>
          {meta.title}
        </Text>
      </View>

      <View>
        <Text className="text-primary font-display" style={{ fontSize: 40, letterSpacing: -0.5 }}>
          {primaryValue}
        </Text>
      </View>

      {/* Section 1 — Scale ladder ("AT YOUR RATE") */}
      <View className="bg-card border border-border rounded-3xl p-5">
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3">
          At your rate
        </Text>
        {ladder.length === 0 ? (
          <Text className="text-muted-foreground text-sm">
            Set your daily cigarettes and cost to see your scale.
          </Text>
        ) : (
          ladder.map((row, i) => (
            <View
              key={row.label}
              className={`flex-row justify-between items-center py-3.5 ${
                i === 0 ? '' : 'border-t border-border'
              }`}
            >
              <Text className="text-muted-foreground text-sm">{row.label}</Text>
              <Text
                className={`${
                  row.label === 'per year' ? 'text-primary text-xl' : 'text-foreground text-base'
                } font-sans-bold`}
              >
                {row.value}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Personal Goals entry (Goals live inside Progress/Savings, Spec §2.2) */}
      <Pressable
        onPress={() => router.push('/goals')}
        className="bg-card border border-border rounded-3xl p-5 active:opacity-80"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider">
              Personal Goals
            </Text>
            <Text className="text-foreground font-display text-lg mt-1">
              {activeGoals.length > 0
                ? `${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''}`
                : 'Give your savings a destination'}
            </Text>
          </View>
          <Text className="text-primary font-display text-xl">→</Text>
        </View>
      </Pressable>

      {/* Section 2 — Milestone reference cards (Milestone Spec §3) */}
      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3">
          Milestones
        </Text>
        {milestonesLoading ? (
          <ActivityIndicator color="#7FC200" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(milestones ?? []).map((card) => (
              <ReferenceCard
                key={card.cardId}
                card={card}
                active={d.cigarettesNotSmoked >= card.threshold}
                expanded={expandedCard === card.cardId}
                onPress={() =>
                  d.cigarettesNotSmoked >= card.threshold
                    ? setExpandedCard(expandedCard === card.cardId ? null : card.cardId)
                    : undefined
                }
              />
            ))}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  )
}

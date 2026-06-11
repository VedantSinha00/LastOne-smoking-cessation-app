import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { useDashboard } from '../../hooks/useDashboard'
import { useMilestoneCards, type MilestoneCard } from '../../hooks/useMilestoneCards'
import { scaleLadder } from '../../lib/savings'
import type { CounterKey } from '../../components/home/ProgressDashboard'

const COUNTER_META: Record<CounterKey, { title: string; primary: string }> = {
  money: { title: 'Money Saved', primary: 'moneyLabel' },
  time: { title: 'Time Reclaimed', primary: 'timeLabel' },
  cigarettes: { title: 'Cigarettes Not Smoked', primary: 'cigarettesLabel' },
}

const COUNTER_ORDER: CounterKey[] = ['cigarettes', 'money', 'time']

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
 * Progress tab landing screen. Two sections: the personalised scale ladder for the
 * selected counter, and the shared milestone reference-card scroll (CM-01–08), whose
 * active/inactive state is derived from cigarettes_not_smoked (Milestone Spec §2).
 *
 * Entry: a counter-card tap deep-links with ?counter=…; the tab bar enters with none,
 * defaulting to the cigarettes counter (the spec's emotional anchor, §2.3).
 */
export default function Progress() {
  const params = useLocalSearchParams<{ counter?: string }>()
  const initial = (params.counter as CounterKey) ?? 'cigarettes'
  const [counter, setCounter] = useState<CounterKey>(
    COUNTER_ORDER.includes(initial) ? initial : 'cigarettes',
  )
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Collapse any expanded reference card whenever the screen regains focus, so the
  // DASH-2 view always opens fresh (cards default closed until tapped). This tab stays
  // mounted in the background, so without this the expanded state would persist across
  // navigations. Mirrors the spec's DASH-2 back behaviour (cards collapse on exit).
  useFocusEffect(
    useCallback(() => {
      return () => setExpandedCard(null)
    }, []),
  )

  const { data: profile } = useProfile()
  const d = useDashboard()
  const { data: milestones, isLoading: milestonesLoading } = useMilestoneCards(
    profile?.voice_style ?? null,
  )

  const cpd = profile?.cigarettes_per_day ?? 0
  const price = profile?.price_per_cigarette ?? 0
  const ladder = cpd > 0 ? scaleLadder(counter, cpd, price) : []
  const meta = COUNTER_META[counter]
  const primaryValue = d[meta.primary as 'moneyLabel' | 'timeLabel' | 'cigarettesLabel']

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-6 pb-12">
      {/* Header + current total */}
      <View>
        <Text className="text-muted-foreground text-sm font-sans-medium">Your Progress</Text>
        <Text className="text-foreground font-display text-2xl mt-0.5">{meta.title}</Text>
        <Text className="text-primary font-display text-4xl mt-2">{primaryValue}</Text>
      </View>

      {/* Counter switcher (tab-entry convenience; deep-link sets the initial one) */}
      <View className="flex-row gap-2">
        {COUNTER_ORDER.map((key) => (
          <Pressable
            key={key}
            onPress={() => setCounter(key)}
            className={`px-3 py-2 rounded-full border ${
              counter === key ? 'bg-primary/15 border-primary/40' : 'border-border'
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${
                counter === key ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {COUNTER_META[key].title}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Section 1 — Scale ladder (§5 Section 1) */}
      <View className="bg-card border border-border rounded-3xl p-5">
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3">
          At this rate
        </Text>
        {ladder.length === 0 ? (
          <Text className="text-muted-foreground text-sm">
            Set your daily cigarettes and cost to see your scale.
          </Text>
        ) : (
          ladder.map((row) => (
            <View
              key={row.label}
              className="flex-row justify-between items-center py-2 border-b border-border last:border-0"
            >
              <Text className="text-muted-foreground text-sm">{row.label}</Text>
              <Text className="text-foreground text-base font-sans-bold">{row.value}</Text>
            </View>
          ))
        )}
      </View>

      {/* Section 2 — Milestone reference cards (§5 Section 2, Milestone Spec §3) */}
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

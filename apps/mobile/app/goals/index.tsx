import React from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useDashboard } from '../../hooks/useDashboard'
import { useGoals } from '../../hooks/useGoals'
import { useCausesCard } from '../../hooks/useCausesCard'
import { useOccasionNudge } from '../../hooks/useOccasionNudge'
import { useStage } from '../../hooks/useStage'
import { GoalCard } from '../../components/goals/GoalCard'
import { CausesCardView } from '../../components/goals/CausesCard'
import { OccasionNudgeCard } from '../../components/goals/OccasionNudgeCard'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/button'

/**
 * GOAL-01 — Goals Dashboard. total_saved pool once at top, active goal cards,
 * occasion nudge when in window, Causes Card (Stage 3+), history entry.
 * Root screen of the goals stack; back returns to the Progress tab.
 */
export default function GoalsDashboard() {
  const router = useRouter()
  const { isPreQuit } = useStage()
  const d = useDashboard()
  const { active, history, canAddGoal, isLoading } = useGoals()

  const causes = useCausesCard(d.moneySavedPaise, d.moneyLabel)

  const poolRupees = Math.floor(d.moneySavedPaise / 100)
  const totalAllocated = active.reduce((s, g) => s + Math.floor(Number(g.allocated_amount)), 0)

  // Goal-contextual occasion copy references the goal nearest to completion.
  const nearestGoal =
    active.length > 0
      ? active.reduce((best, g) => (g.progressPct > best.progressPct ? g : best))
      : null
  const nudge = useOccasionNudge(d.moneyLabel, nearestGoal?.goal_name ?? null)

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-4 pb-12">
      {/* Header */}
      <View className="flex-row items-center gap-3">
        {/* Explicit target: Goals is only entered from Progress, but a plain
            back() loses the active-tab state and lands on Home (§2.2 — Goals
            lives inside the Progress/Savings section). */}
        <Pressable onPress={() => router.navigate('/progress')} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-muted-foreground text-sm font-sans-medium">Your savings</Text>
          <Text className="text-foreground font-display text-2xl">Personal Goals</Text>
        </View>
      </View>

      {/* total_saved pool — shown once, never user-written (Spec §3) */}
      <Card elevation="soft">
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider">
          Saved so far
        </Text>
        <Text className="text-primary font-display text-4xl mt-1">{d.moneyLabel}</Text>
        {isPreQuit && (
          <Text className="text-muted-foreground text-xs mt-1">
            Your savings start on quit day.
          </Text>
        )}
        {/* Savings can dip below intent after a slip — allocated_amount is never
            auto-rewritten, so surface it softly and let the user adjust. */}
        {totalAllocated > poolRupees && (
          <Text className="text-craving text-xs mt-2 leading-relaxed">
            Your savings dipped below what you&apos;ve allocated — adjust whenever you like.
          </Text>
        )}
        {active.length > 0 && (
          <Pressable
            onPress={() =>
              active.length === 1
                ? router.push({ pathname: '/goals/allocate', params: { goalId: active[0].goal_id } })
                : router.push('/goals/allocate')
            }
            className="mt-3 self-start"
            hitSlop={8}
          >
            <Text className="text-primary font-sans-bold text-sm">Allocate savings →</Text>
          </Pressable>
        )}
      </Card>

      {/* Occasion nudge (Stage 1+, 3–5 days before an occasion) */}
      {nudge.occasion && nudge.copy && (
        <OccasionNudgeCard
          title={`${nudge.occasion.name} · ${nudge.occasion.daysUntil} days away`}
          copy={nudge.copy}
          onDismiss={nudge.dismiss}
          onSetGoal={active.length === 0 && canAddGoal ? () => router.push('/goals/add') : undefined}
        />
      )}

      {/* Active goals */}
      {active.map((goal) => (
        <GoalCard key={goal.goal_id} goal={goal} onPress={() => router.push(`/goals/${goal.goal_id}`)} />
      ))}

      {/* Empty state (§8.1) */}
      {!isLoading && active.length === 0 && (
        <Card>
          <Text className="text-foreground font-sans-bold text-base">No goals yet</Text>
          <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
            {isPreQuit
              ? "Your savings start on quit day. Set a goal now so you're ready."
              : 'Give your savings a destination — something you actually want.'}
          </Text>
        </Card>
      )}

      {/* Add a Goal — disabled at the 3-active cap (§B2 Goal Count Gate) */}
      <Button
        title={canAddGoal ? 'Add a goal' : 'Complete a goal to add another'}
        onPress={() => router.push('/goals/add')}
        disabled={!canAddGoal}
      />

      {/* Causes Card (GOAL-11) — silent conditional below goal cards (§8.3) */}
      {causes.card && (
        <CausesCardView card={causes.card} onDismiss={causes.dismiss} onLearnMore={causes.markLearnMore} />
      )}

      {/* GOAL-09 entry */}
      {history.length > 0 && (
        <Pressable onPress={() => router.push('/goals/history')} className="self-center mt-2" hitSlop={8}>
          <Text className="text-muted-foreground text-sm font-sans-medium">
            Goal history ({history.length}) →
          </Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

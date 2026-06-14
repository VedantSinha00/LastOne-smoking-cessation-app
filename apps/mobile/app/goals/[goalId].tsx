import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView, Modal, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { useGoals, useTopUp, useTopUpHistory, useUpdateGoal } from '../../hooks/useGoals'
import { useDashboard } from '../../hooks/useDashboard'
import { formatGoalRupees, parseRupees } from '../../lib/goals'
import { GoalProgressBar, GoalThumb } from '../../components/goals/GoalCard'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/button'

/**
 * GOAL-06 — Goal Detail View, with GOAL-07 (manual top-up) and GOAL-08
 * (completion state) presented as overlaying modals.
 *
 * The completion trigger fires only when a manual top-up pushes
 * current_amount ≥ target_amount — never from allocation or total_saved
 * (Spec §B2). Until the user acts, an active goal past 100% keeps a
 * persistent "goal reached" banner (§5.1 GOAL-08 back behaviour) and the
 * progress label shows overflow (104%… capped at 999%).
 */
export default function GoalDetail() {
  const router = useRouter()
  const { goalId } = useLocalSearchParams<{ goalId: string }>()
  const { active, history, isLoading } = useGoals()
  const d = useDashboard()
  const topUp = useTopUp()
  const updateGoal = useUpdateGoal()
  const { data: topUps } = useTopUpHistory(goalId ?? null)

  const [topUpVisible, setTopUpVisible] = useState(false)
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [completionVisible, setCompletionVisible] = useState(false)

  const goal = [...active, ...history].find((g) => g.goal_id === goalId)

  if (!goal) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        {!isLoading && (
          <Pressable onPress={() => router.back()}>
            <Text className="text-muted-foreground">Goal not found. Go back.</Text>
          </Pressable>
        )}
      </View>
    )
  }

  const target = Number(goal.target_amount)
  const isActive = goal.status === 'active'
  const reached = goal.derivedCurrentAmount >= target

  const confirmTopUp = async () => {
    const value = parseRupees(amount)
    if (value == null) {
      setAmountError('Enter an amount of at least ₹1 to continue.')
      return
    }
    const crossesTarget = !reached && goal.derivedCurrentAmount + value >= target
    await topUp.mutateAsync({ goalId: goal.goal_id, amount: value })
    setTopUpVisible(false)
    setAmount('')
    if (crossesTarget) setCompletionVisible(true)
  }

  const markComplete = async () => {
    await updateGoal.mutateAsync({
      goalId: goal.goal_id,
      patch: { status: 'completed', completed_at: new Date().toISOString() },
    })
    setCompletionVisible(false)
    router.dismissTo('/goals')
  }

  const retire = () => {
    Alert.alert('Retire this goal?', 'It moves to your history and frees up a goal slot.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retire',
        style: 'destructive',
        onPress: async () => {
          await updateGoal.mutateAsync({ goalId: goal.goal_id, patch: { status: 'retired' } })
          router.dismissTo('/goals')
        },
      },
    ])
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl flex-1" numberOfLines={1}>
          {goal.goal_name}
        </Text>
      </View>

      <Card elevation="soft">
        <View className="flex-row items-center gap-4">
          <GoalThumb goal={goal} size="lg" />
          <View className="flex-1">
            <Text className="text-primary font-display text-3xl">{goal.progressLabel}</Text>
            <Text className="text-muted-foreground text-sm mt-0.5">
              {formatGoalRupees(goal.derivedCurrentAmount)} of {formatGoalRupees(target)}
            </Text>
          </View>
        </View>
        <View className="mt-4">
          <GoalProgressBar ratio={goal.barRatio} allocatedRatio={goal.allocatedRatio} />
        </View>
        {/* Legend for the two segments */}
        <View className="flex-row justify-between mt-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <Text className="text-muted-foreground text-xs">
                {formatGoalRupees(goal.derivedCurrentAmount)} added
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'rgba(127, 194, 0, 0.28)' }}
              />
              <Text className="text-muted-foreground text-xs">
                {formatGoalRupees(Number(goal.allocated_amount))} allocated
              </Text>
            </View>
          </View>
          <Text className="text-muted-foreground text-xs">Pool: {d.moneyLabel}</Text>
        </View>
        {goal.why && (
          <Text className="text-muted-foreground text-sm italic mt-3 leading-relaxed">
            &ldquo;{goal.why}&rdquo;
          </Text>
        )}
      </Card>

      {isActive && reached && (
        <Card className="border-primary/40">
          <Text className="text-foreground font-sans-bold text-base">You&apos;ve reached this goal 🎉</Text>
          <View className="mt-3">
            <Button title="Mark as complete" onPress={() => setCompletionVisible(true)} />
          </View>
        </Card>
      )}

      {isActive && (
        <View className="gap-3">
          <Button title="Add money" onPress={() => setTopUpVisible(true)} />
          {/* Scoped to THIS goal — the all-goals list is the dashboard's entry. */}
          <Button
            title="Allocate savings"
            variant="secondary"
            onPress={() => router.push({ pathname: '/goals/allocate', params: { goalId: goal.goal_id } })}
          />
        </View>
      )}

      {/* Top-up history (§B4 — newest first) */}
      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3">
          Top-ups
        </Text>
        {(topUps ?? []).length === 0 ? (
          <Text className="text-muted-foreground text-sm">
            Money you set aside for this goal shows up here.
          </Text>
        ) : (
          (topUps ?? []).map((t) => (
            <View
              key={t.topup_id}
              className="flex-row justify-between items-center py-2 border-b border-border"
            >
              <Text className="text-foreground text-sm font-sans-bold">
                {formatGoalRupees(Number(t.amount))}
              </Text>
              <Text className="text-muted-foreground text-xs">
                {format(parseISO(t.created_at), 'd MMM yyyy')}
              </Text>
            </View>
          ))
        )}
      </View>

      {isActive && (
        <Pressable onPress={retire} className="self-center mt-2" hitSlop={8}>
          <Text className="text-muted-foreground text-sm">Retire this goal</Text>
        </Pressable>
      )}

      {/* GOAL-07 — manual top-up input */}
      <Modal visible={topUpVisible} transparent animationType="fade" onRequestClose={() => setTopUpVisible(false)}>
        <View className="flex-1 bg-black/40 items-center justify-center p-6">
          <View className="bg-card rounded-3xl p-6 w-full">
            <Text className="text-foreground font-display text-xl">Add money</Text>
            <Text className="text-muted-foreground text-sm mt-1">
              Real money you&apos;re setting aside for this goal.
            </Text>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(t)
                setAmountError(null)
              }}
              placeholder="₹ amount"
              placeholderTextColor="#A8A29E"
              keyboardType="numeric"
              autoFocus
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base mt-4"
            />
            {amountError && <Text className="text-craving text-sm mt-2">{amountError}</Text>}
            <View className="gap-2 mt-4">
              <Button title="Confirm" onPress={confirmTopUp} loading={topUp.isPending} />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setTopUpVisible(false)
                  setAmount('')
                  setAmountError(null)
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* GOAL-08 — completion state */}
      <Modal
        visible={completionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCompletionVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center p-6">
          <View className="bg-card rounded-3xl p-6 w-full items-center">
            <Text className="text-5xl">🎉</Text>
            <Text className="text-foreground font-display text-2xl mt-3 text-center">
              You did it
            </Text>
            <Text className="text-muted-foreground text-sm mt-2 text-center leading-relaxed">
              &ldquo;{goal.goal_name}&rdquo; is fully funded — money that used to go up in smoke.
            </Text>
            <View className="gap-2 mt-5 w-full">
              <Button title="Mark as complete" onPress={markComplete} loading={updateGoal.isPending} />
              <Button title="Keep saving" variant="secondary" onPress={() => setCompletionVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useGoals, useAllocate } from '../../hooks/useGoals'
import { useDashboard } from '../../hooks/useDashboard'
import { allocationState, formatGoalRupees, pctToRupees } from '../../lib/goals'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/button'

type Mode = 'rupees' | 'pct'

/**
 * GOAL-10 — Allocate Savings. Two entry shapes:
 *   - from the dashboard with 2+ goals → all active goals listed (the spec's screen)
 *   - with ?goalId=… (from a goal's detail, or a single-goal dashboard) → scoped
 *     to that one goal; other goals' existing allocations still count against the
 *     pool so the sum-≤-total_saved rule holds across both shapes.
 * Over-allocation disables Confirm with the inline error (UI-level block, §B2).
 * allocated_amount is intent only — reversible, drives no progress bar.
 */
export default function AllocateSavings() {
  const router = useRouter()
  const { goalId } = useLocalSearchParams<{ goalId?: string }>()
  const { active } = useGoals()
  const d = useDashboard()
  const allocate = useAllocate()

  const totalSaved = Math.floor(d.moneySavedPaise / 100)

  // Scoped mode: only the named goal is editable; the rest hold their numbers.
  const targets = goalId ? active.filter((g) => g.goal_id === goalId) : active
  const others = goalId ? active.filter((g) => g.goal_id !== goalId) : []
  const othersAllocated = others.reduce((s, g) => s + Math.floor(Number(g.allocated_amount)), 0)
  const availablePool = Math.max(0, totalSaved - othersAllocated)

  const [mode, setMode] = useState<Mode>('rupees')
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      targets.map((g) => [
        g.goal_id,
        Number(g.allocated_amount) > 0 ? String(Math.floor(Number(g.allocated_amount))) : '',
      ]),
    ),
  )

  /** Current rupee value per goal, whatever the input mode. Percentages are of
   *  the full pool (§B2: rupee_equivalent = pct/100 × total_saved). */
  const rupeeValue = (id: string): number => {
    const raw = parseFloat(inputs[id] ?? '')
    if (!Number.isFinite(raw) || raw <= 0) return 0
    return mode === 'pct' ? pctToRupees(raw, totalSaved) : Math.floor(raw)
  }

  const rupeeMap = Object.fromEntries(targets.map((g) => [g.goal_id, rupeeValue(g.goal_id)]))
  const { remainder, overAllocated } = allocationState(rupeeMap, availablePool)

  const switchMode = (next: Mode) => {
    if (next === mode) return
    // Recalculate inputs in the new unit so the rupee meaning is preserved (§5.1).
    setInputs((prev) =>
      Object.fromEntries(
        targets.map((g) => {
          const rupees = rupeeValue(g.goal_id)
          if (rupees <= 0) return [g.goal_id, '']
          if (next === 'pct') {
            const pct = totalSaved > 0 ? (rupees / totalSaved) * 100 : 0
            return [g.goal_id, String(Math.round(pct * 10) / 10)]
          }
          return [g.goal_id, String(rupees)]
        }),
      ),
    )
    setMode(next)
  }

  const confirm = async () => {
    const allValues = targets.map((g) => rupeeMap[g.goal_id])
    // All fields zero/empty → no write, return unchanged (§5.1).
    if (allValues.every((v) => v === 0)) {
      router.back()
      return
    }
    await allocate.mutateAsync(targets.map((g) => ({ goalId: g.goal_id, amount: rupeeMap[g.goal_id] })))
    router.back()
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 gap-4 pb-12"
      // Buttons respond on the FIRST tap even while the keyboard is up.
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-foreground font-display text-2xl">Allocate savings</Text>
          {goalId && targets[0] && (
            <Text className="text-muted-foreground text-sm" numberOfLines={1}>
              for &ldquo;{targets[0].goal_name}&rdquo;
            </Text>
          )}
        </View>
      </View>

      <Card elevation="soft">
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider">
          Your savings pool
        </Text>
        <Text className="text-primary font-display text-3xl mt-1">{formatGoalRupees(totalSaved)}</Text>
        {others.length > 0 && othersAllocated > 0 && (
          <Text className="text-muted-foreground text-xs mt-1">
            {formatGoalRupees(othersAllocated)} already allocated to other goals
          </Text>
        )}
        <Text
          className={`text-sm mt-2 ${overAllocated ? 'text-craving' : 'text-muted-foreground'}`}
        >
          {overAllocated
            ? `Total exceeds your ${formatGoalRupees(availablePool)} savings. Adjust to continue.`
            : `Unallocated: ${formatGoalRupees(Math.max(0, remainder))}`}
        </Text>
      </Card>

      {/* Mode switch — ₹ amounts vs percentage (recalculates in real time) */}
      <View className="flex-row gap-2">
        {(['rupees', 'pct'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => switchMode(m)}
            className={`px-4 py-2 rounded-full border ${
              mode === m ? 'bg-primary/15 border-primary/40' : 'border-border'
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${mode === m ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {m === 'rupees' ? '₹ amount' : '% of savings'}
            </Text>
          </Pressable>
        ))}
      </View>

      {targets.map((g) => (
        <Card key={g.goal_id}>
          <Text className="text-foreground font-sans-bold text-base" numberOfLines={1}>
            {g.goal_name}
          </Text>
          <View className="flex-row items-center gap-3 mt-3">
            <TextInput
              value={inputs[g.goal_id] ?? ''}
              onChangeText={(t) => setInputs((prev) => ({ ...prev, [g.goal_id]: t }))}
              placeholder="0"
              placeholderTextColor="#A8A29E"
              keyboardType="numeric"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base flex-1"
            />
            <Text className="text-muted-foreground text-sm w-20">
              {mode === 'pct' ? `= ${formatGoalRupees(rupeeMap[g.goal_id])}` : 'rupees'}
            </Text>
          </View>
        </Card>
      ))}

      <Button
        title="Confirm"
        onPress={confirm}
        disabled={overAllocated}
        loading={allocate.isPending}
      />
    </ScrollView>
  )
}

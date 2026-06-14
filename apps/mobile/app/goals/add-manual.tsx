import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useCreateGoal } from '../../hooks/useGoals'
import { parseRupees, singleEmoji, suggestEmoji } from '../../lib/goals'
import { Button } from '../../components/ui/button'

/**
 * GOAL-05 — Add Goal: manual entry. Required: name + target amount. Optional:
 * emoji, "Why this matters" (private, ≤200 chars). Per-field inline validation;
 * back discards everything, no draft (§5.1).
 */
export default function AddGoalManual() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [emoji, setEmoji] = useState('')
  const [why, setWhy] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

  const createGoal = useCreateGoal()

  const save = async () => {
    const target = parseRupees(amount)
    const nameOk = !!name.trim()
    setNameError(nameOk ? null : 'Give your goal a name to continue.')
    setAmountError(target != null ? null : 'Enter a target amount of at least ₹1 to continue.')
    if (!nameOk || target == null) return

    await createGoal.mutateAsync({
      goal_name: name.trim().slice(0, 60),
      target_amount: target,
      source: 'manual',
      // User's emoji wins; otherwise best-guess from the goal name.
      emoji: emoji.trim() || suggestEmoji(name),
      why: why.trim() ? why.trim().slice(0, 200) : null,
    })
    // Pop the creation screens — back from the dashboard exits the flow (§5.1).
    router.dismissTo('/goals')
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 gap-4"
      // Buttons respond on the FIRST tap even while the keyboard is up.
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-3 mb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl">Your goal</Text>
      </View>

      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          Goal name
        </Text>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t)
            setNameError(null)
          }}
          placeholder="e.g. boAt headphones"
          placeholderTextColor="#A8A29E"
          maxLength={60}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
        />
        {nameError && <Text className="text-craving text-sm mt-1">{nameError}</Text>}
      </View>

      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          Target amount (₹)
        </Text>
        <TextInput
          value={amount}
          onChangeText={(t) => {
            setAmount(t)
            setAmountError(null)
          }}
          placeholder="1899"
          placeholderTextColor="#A8A29E"
          keyboardType="numeric"
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
        />
        {amountError && <Text className="text-craving text-sm mt-1">{amountError}</Text>}
      </View>

      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          Emoji (optional)
        </Text>
        <TextInput
          value={emoji}
          // One emoji only (Spec §B1) — typing a new emoji replaces the previous.
          onChangeText={(t) => setEmoji(singleEmoji(t))}
          placeholder="🎧"
          placeholderTextColor="#A8A29E"
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base w-24 text-center"
        />
      </View>

      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          Why this matters (optional, just for you)
        </Text>
        <TextInput
          value={why}
          onChangeText={setWhy}
          maxLength={200}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base min-h-[80px]"
        />
      </View>

      <Button title="Save goal" onPress={save} loading={createGoal.isPending} />
    </ScrollView>
  )
}

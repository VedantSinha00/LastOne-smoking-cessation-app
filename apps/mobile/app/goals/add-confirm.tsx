import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, Image, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useCreateGoal } from '../../hooks/useGoals'
import { parseRupees, suggestEmoji } from '../../lib/goals'
import { Button } from '../../components/ui/button'

/**
 * GOAL-04 — Add Goal: confirm pulled details. All fields editable; price is
 * blank after a partial parse and REQUIRED before save (§5.1). Back discards
 * the pulled details.
 */
export default function AddGoalConfirm() {
  const router = useRouter()
  const params = useLocalSearchParams<{ name?: string; image?: string; price?: string; url?: string }>()

  const [name, setName] = useState(params.name ?? '')
  const [price, setPrice] = useState(params.price ?? '')
  const [image, setImage] = useState(params.image || null)
  const [validation, setValidation] = useState<string | null>(null)

  const createGoal = useCreateGoal()

  const save = async () => {
    const target = parseRupees(price)
    if (target == null) {
      setValidation('Enter a target amount of at least ₹1 to continue.')
      return
    }
    if (!name.trim()) {
      setValidation('Give your goal a name to continue.')
      return
    }
    await createGoal.mutateAsync({
      goal_name: name.trim().slice(0, 60),
      target_amount: target,
      source: 'link',
      product_url: params.url || null,
      product_image_url: image,
      // Name-matched emoji so the goal card has a face when the parse couldn't
      // pull an image (the usual case on Amazon/Flipkart).
      emoji: suggestEmoji(name),
    })
    // Pop the creation screens off the stack — back from the dashboard must
    // leave the goals flow, never replay it (flow-reverse, §5.1).
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
        <Text className="text-foreground font-display text-2xl">Confirm your goal</Text>
      </View>

      {image && (
        <View className="items-center">
          <Image source={{ uri: image }} className="w-40 h-40 rounded-2xl bg-muted" resizeMode="cover" />
          <Pressable onPress={() => setImage(null)} className="mt-2" hitSlop={8}>
            <Text className="text-muted-foreground text-xs">Remove image</Text>
          </Pressable>
        </View>
      )}

      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          Goal name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={60}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
        />
      </View>

      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          Target amount (₹)
        </Text>
        <TextInput
          value={price}
          onChangeText={(t) => {
            setPrice(t)
            setValidation(null)
          }}
          placeholder={params.price ? undefined : "We couldn't read the price — enter it here"}
          placeholderTextColor="#A8A29E"
          keyboardType="numeric"
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
        />
      </View>

      {validation && <Text className="text-craving text-sm">{validation}</Text>}

      <Button title="Save goal" onPress={save} loading={createGoal.isPending} />
    </ScrollView>
  )
}

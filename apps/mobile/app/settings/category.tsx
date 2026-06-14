import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'
import { CATEGORY_OPTIONS } from '../../lib/settings'
import type { RelatableCategory } from '../../types/database'

/** PROF-07 — Spending Category Picker. Change re-renders dashboard equivalents
 *  (§5 Flow 6). */
export default function EditCategory() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { updateProfile } = useSettings()
  const [selected, setSelected] = useState<RelatableCategory | null>(profile?.relatable_category ?? null)

  const save = async () => {
    if (selected && selected !== profile?.relatable_category) {
      await updateProfile.mutateAsync({ relatable_category: selected })
    }
    router.back()
  }

  return (
    <EditScreen title="Spending category">
      {CATEGORY_OPTIONS.map((opt) => {
        const active = selected === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => setSelected(opt.value)}
            className={`rounded-3xl border p-4 ${active ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}
          >
            <View className="flex-row items-center justify-between">
              <Text className={`font-sans-bold text-base ${active ? 'text-primary' : 'text-foreground'}`}>
                {opt.label}
              </Text>
              {active && <Text className="text-primary">✓</Text>}
            </View>
            <Text className="text-muted-foreground text-xs mt-0.5">{opt.description}</Text>
          </Pressable>
        )
      })}
      <Button title="Confirm" onPress={save} loading={updateProfile.isPending} />
    </EditScreen>
  )
}

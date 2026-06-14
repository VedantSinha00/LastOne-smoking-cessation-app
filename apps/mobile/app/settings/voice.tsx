import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { VOICE_OPTIONS } from '../../lib/settings'
import type { VoiceStyle } from '../../types/database'

/** PROF-06 — Voice Style Picker. Autosaves on tap (the selection IS the
 *  decision); stays on screen so you can compare examples. Change reflects on
 *  next content delivery (§5 Flow 5). */
export default function EditVoice() {
  const { data: profile } = useProfile()
  const { updateProfile } = useSettings()
  const selected = profile?.voice_style ?? null

  const pick = (value: VoiceStyle) => {
    if (value !== selected) updateProfile.mutate({ voice_style: value })
  }

  return (
    <EditScreen title="Voice style">
      {VOICE_OPTIONS.map((opt) => {
        const active = selected === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => pick(opt.value)}
            className={`rounded-3xl border p-4 ${active ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}
          >
            <View className="flex-row items-center justify-between">
              <Text className={`font-sans-bold text-base ${active ? 'text-primary' : 'text-foreground'}`}>
                {opt.label}
              </Text>
              {active && <Text className="text-primary">✓</Text>}
            </View>
            <Text className="text-muted-foreground text-xs mt-0.5">{opt.sublabel}</Text>
            <Text className="text-foreground text-sm italic mt-2 leading-relaxed">
              &ldquo;{opt.example}&rdquo;
            </Text>
          </Pressable>
        )
      })}
    </EditScreen>
  )
}

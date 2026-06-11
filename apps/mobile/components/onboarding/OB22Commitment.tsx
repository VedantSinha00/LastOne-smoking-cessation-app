import React, { useRef } from 'react'
import { Animated, Pressable, Text, TextInput, View } from 'react-native'
import { useOnboarding } from '../../hooks/useOnboarding'
import { OBScreen, OBHeader } from './parts'
import { COMMITMENT_REASON_CHIPS, COMMITMENT_IDENTITY_CHIPS } from './options'

function ChipRow({ chips, onPick }: { chips: string[]; onPick: (c: string) => void }) {
  return (
    <View className="flex-row flex-wrap mt-3 mb-6">
      {chips.map((c) => (
        <Pressable
          key={c}
          onPress={() => onPick(c)}
          className="bg-card border border-border rounded-full px-4 py-2 mr-2 mb-2 active:bg-muted"
        >
          <Text className="text-muted-foreground text-sm">{c}</Text>
        </Pressable>
      ))}
    </View>
  )
}

// OB-22 — Commitment. Two blanks (free text or chip; chip overrides typed text).
// Hold button fills over 3s; releasing early resets with nothing saved (§7.5 / §B2.6).
export function OB22Commitment() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  const reason = state.commitmentReason ?? ''
  const identity = state.commitmentIdentity ?? ''
  const bothFilled = reason.trim().length > 0 && identity.trim().length > 0

  const fill = useRef(new Animated.Value(0)).current
  const anim = useRef<Animated.CompositeAnimation | null>(null)

  const reset = () => {
    anim.current?.stop()
    Animated.timing(fill, { toValue: 0, duration: 150, useNativeDriver: false }).start()
  }

  const startHold = () => {
    if (!bothFilled) return
    anim.current = Animated.timing(fill, { toValue: 1, duration: 3000, useNativeDriver: false })
    anim.current.start(({ finished }) => {
      if (finished) nextStep() // reason + identity already in context
    })
  }

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <OBScreen onBack={prevStep}>
      <OBHeader title="Make it yours." subtitle="Fill these in. This is the promise you're holding yourself to." />

      <Text className="text-muted-foreground text-sm mb-1">I'm doing this for…</Text>
      <TextInput
        value={reason}
        onChangeText={(t) => setAnswer('commitmentReason', t)}
        placeholder="my reason"
        placeholderTextColor="#76706C"
        className="bg-card border border-border rounded-2xl px-5 py-4 text-foreground text-lg"
      />
      <ChipRow chips={COMMITMENT_REASON_CHIPS} onPick={(c) => setAnswer('commitmentReason', c)} />

      <Text className="text-muted-foreground text-sm mb-1">I'm becoming someone who is…</Text>
      <TextInput
        value={identity}
        onChangeText={(t) => setAnswer('commitmentIdentity', t)}
        placeholder="who I want to be"
        placeholderTextColor="#76706C"
        className="bg-card border border-border rounded-2xl px-5 py-4 text-foreground text-lg"
      />
      <ChipRow chips={COMMITMENT_IDENTITY_CHIPS} onPick={(c) => setAnswer('commitmentIdentity', c)} />

      <Pressable
        onPressIn={startHold}
        onPressOut={reset}
        disabled={!bothFilled}
        style={!bothFilled ? { opacity: 0.4 } : undefined}
        className="h-14 rounded-2xl overflow-hidden bg-muted items-center justify-center mt-2"
      >
        <Animated.View
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width }}
          className="bg-primary"
        />
        <Text className="text-foreground font-sans-bold text-base">Hold to commit</Text>
      </Pressable>
    </OBScreen>
  )
}

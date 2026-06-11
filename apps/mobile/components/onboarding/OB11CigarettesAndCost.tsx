import React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useOnboarding } from '../../hooks/useOnboarding'
import { OBScreen, OBHeader, OBContinue } from './parts'

function StepperButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-14 h-14 rounded-2xl bg-card border border-border items-center justify-center active:bg-muted"
    >
      <Text className="text-primary text-3xl leading-8">{label}</Text>
    </Pressable>
  )
}

// OB-11 — Cigarettes per day (stepper, min 1, default 5) + price per cigarette
// (INR, default 15). Untouched inputs keep the defaults already in state.
export function OB11CigarettesAndCost() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()

  const setCigs = (n: number) => setAnswer('cigarettesPerDay', Math.max(1, n))

  const onPriceChange = (t: string) => {
    const digits = t.replace(/[^0-9]/g, '')
    setAnswer('pricePerCigarette', digits === '' ? 0 : parseInt(digits, 10))
  }

  return (
    <OBScreen onBack={prevStep} footer={<OBContinue onPress={nextStep} />}>
      <OBHeader title="On an average day, how much?" subtitle="A rough number is fine — you can change this later." />

      <Text className="text-muted-foreground text-sm mb-3">Cigarettes per day</Text>
      <View className="flex-row items-center justify-between mb-8">
        <StepperButton label="−" onPress={() => setCigs(state.cigarettesPerDay - 1)} />
        <Text className="text-foreground font-display text-4xl">{state.cigarettesPerDay}</Text>
        <StepperButton label="+" onPress={() => setCigs(state.cigarettesPerDay + 1)} />
      </View>

      <Text className="text-muted-foreground text-sm mb-3">Cost per cigarette (₹)</Text>
      <View className="flex-row items-center bg-card border border-border rounded-2xl px-5">
        <Text className="text-muted-foreground text-lg mr-1">₹</Text>
        <TextInput
          value={state.pricePerCigarette ? String(state.pricePerCigarette) : ''}
          onChangeText={onPriceChange}
          keyboardType="number-pad"
          placeholder="15"
          placeholderTextColor="#76706C"
          className="flex-1 py-4 text-foreground text-lg"
        />
      </View>
    </OBScreen>
  )
}

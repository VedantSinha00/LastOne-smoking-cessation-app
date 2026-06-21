import React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import { useOnboarding } from '../../hooks/useOnboarding'
import { OBScreen, OBHeader, OBContinue, OBEyebrow, OBProgress } from './parts'

// Circular outline stepper, matching the design's per-day control.
function StepperButton({ icon, onPress }: { icon: 'minus' | 'plus'; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-11 h-11 rounded-full border border-border items-center justify-center active:bg-secondary"
    >
      {icon === 'minus' ? <Minus size={18} color="#76706C" /> : <Plus size={18} color="#76706C" />}
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
      <OBEyebrow label="Understanding better  2 of 9" />
      <OBProgress value={2 / 9} />
      <View className="mt-6">
        <OBHeader title="On an average day, how much?" subtitle="A rough number is fine — you can change this later." />
      </View>

      <View className="items-center mt-2">
        <View className="flex-row items-center" style={{ gap: 32 }}>
          <StepperButton icon="minus" onPress={() => setCigs(state.cigarettesPerDay - 1)} />
          <Text className="text-foreground font-display text-5xl">{state.cigarettesPerDay}</Text>
          <StepperButton icon="plus" onPress={() => setCigs(state.cigarettesPerDay + 1)} />
        </View>
        <Text className="text-muted-foreground text-xs mt-3">cigarettes per day</Text>
      </View>

      <View className="mt-10 flex-row items-center justify-between bg-card border border-border rounded-2xl px-5 py-4">
        <Text className="text-foreground text-sm">Cost per cigarette</Text>
        <View className="flex-row items-center">
          <Text className="text-foreground text-sm mr-1">₹</Text>
          <TextInput
            value={state.pricePerCigarette ? String(state.pricePerCigarette) : ''}
            onChangeText={onPriceChange}
            keyboardType="number-pad"
            placeholder="15"
            placeholderTextColor="#76706C"
            className="text-foreground font-display text-base text-right"
            style={{ minWidth: 48 }}
          />
        </View>
      </View>
      <Text className="text-muted-foreground text-xs mt-2">Tap to edit. Default is ₹15.</Text>
    </OBScreen>
  )
}

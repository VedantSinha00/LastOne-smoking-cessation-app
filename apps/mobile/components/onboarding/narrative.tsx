import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding } from '../../hooks/useOnboarding'
import { OBScreen, OBContinue } from './parts'

// OB-01 — Logo. Auto-advances after 2s (Spec OB-01).
export function OB01Logo() {
  const { nextStep } = useOnboarding()
  useEffect(() => {
    const t = setTimeout(nextStep, 2000)
    return () => clearTimeout(t)
  }, [nextStep])
  return (
    <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-amber-500 text-5xl font-black">LastOne</Text>
      <Text className="text-zinc-500 text-base mt-3">Your last cigarette starts here.</Text>
    </SafeAreaView>
  )
}

// OB-02 — Welcome. No back (nothing behind this screen; Spec: hardware back exits app).
export function OB02Welcome() {
  const { nextStep } = useOnboarding()
  return (
    <OBScreen footer={<OBContinue title="Get Started" onPress={nextStep} />}>
      <View className="flex-1 justify-center">
        <Text className="text-white text-3xl font-bold leading-9">
          You don't have to have it all figured out.
        </Text>
        <Text className="text-zinc-400 text-base mt-4 leading-relaxed">
          LastOne meets you where you are — whether you're ready to quit or just tired of the hold it
          has on you.
        </Text>
      </View>
    </OBScreen>
  )
}

// OB-03 — Intro.
export function OB03Intro() {
  const { nextStep, prevStep } = useOnboarding()
  return (
    <OBScreen onBack={prevStep} footer={<OBContinue onPress={nextStep} />}>
      <View className="flex-1 justify-center">
        <Text className="text-white text-2xl font-bold leading-8">This isn't a lecture.</Text>
        <Text className="text-zinc-400 text-base mt-4 leading-relaxed">
          No scary stats, no guilt. First we'll get to know your habit — when you smoke, why, and what
          sets it off. The more honest you are, the more this works for you.
        </Text>
      </View>
    </OBScreen>
  )
}

// OB-04 — Promise.
export function OB04Promise() {
  const { nextStep, prevStep } = useOnboarding()
  return (
    <OBScreen onBack={prevStep} footer={<OBContinue onPress={nextStep} />}>
      <View className="flex-1 justify-center">
        <Text className="text-white text-2xl font-bold leading-8">A quick promise.</Text>
        <Text className="text-zinc-400 text-base mt-4 leading-relaxed">
          Slips happen. They're data, not failure. LastOne won't shame you for them — it'll help you
          understand them and keep going.
        </Text>
      </View>
    </OBScreen>
  )
}

// OB-09 — Buffer 1.
export function OB09Buffer1() {
  const { state, nextStep, prevStep } = useOnboarding()
  const name = state.firstName ? `, ${state.firstName}` : ''
  return (
    <OBScreen onBack={prevStep} footer={<OBContinue title="Let's go" onPress={nextStep} />}>
      <View className="flex-1 justify-center">
        <Text className="text-white text-2xl font-bold leading-8">Good start{name}.</Text>
        <Text className="text-zinc-400 text-base mt-4 leading-relaxed">
          Now the part that actually shapes your plan — your habit, in your words.
        </Text>
      </View>
    </OBScreen>
  )
}

// OB-18 — Buffer 2. Exact headline from Spec OB-18 (no first_name personalisation).
export function OB18Buffer2() {
  const { nextStep, prevStep } = useOnboarding()
  return (
    <OBScreen onBack={prevStep} footer={<OBContinue onPress={nextStep} />}>
      <View className="flex-1 justify-center">
        <Text className="text-white text-2xl font-bold leading-8">
          Progress isn't linear. Every attempt that didn't work is part of getting this one right.
        </Text>
      </View>
    </OBScreen>
  )
}

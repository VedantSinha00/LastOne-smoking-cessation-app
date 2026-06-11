import React from 'react'
import { TextInput, View } from 'react-native'
import { useOnboarding } from '../../hooks/useOnboarding'
import { OBScreen, OBHeader, OBContinue, SingleChoiceScreen, MultiChoiceScreen } from './parts'
import {
  AGE_OPTIONS,
  LIFE_STAGE_OPTIONS,
  INTENT_OPTIONS,
  SMOKING_REASON_OPTIONS,
  TRIGGER_TIME_OPTIONS,
  FIRST_CIGARETTE_OPTIONS,
  CRAVING_OPTIONS,
  QUIT_HISTORY_OPTIONS,
  QUIT_STRUGGLE_OPTIONS,
  MOTIVATION_OPTIONS,
  RELATABLE_CATEGORY_OPTIONS,
} from './options'

// Toggle a value in a multi-select array.
function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

// OB-06 — Name (free text, ≥1 character).
export function OB06Name() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  const valid = state.firstName.trim().length >= 1
  return (
    <OBScreen
      onBack={prevStep}
      footer={<OBContinue disabled={!valid} onPress={() => valid && nextStep()} />}
    >
      <OBHeader title="First, what should we call you?" />
      <TextInput
        value={state.firstName}
        onChangeText={(t) => setAnswer('firstName', t)}
        placeholder="Your name"
        placeholderTextColor="#76706C"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => valid && nextStep()}
        className="bg-card border border-border rounded-2xl px-5 py-4 text-foreground text-lg"
      />
    </OBScreen>
  )
}

// OB-07 — Age.
export function OB07Age() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="How old are you?"
      options={AGE_OPTIONS}
      value={state.ageRange}
      onSelect={(v) => setAnswer('ageRange', v)}
      onContinue={nextStep}
    />
  )
}

// OB-08 — Life stage.
export function OB08LifeStage() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="Where are you in life right now?"
      options={LIFE_STAGE_OPTIONS}
      value={state.lifeStage}
      onSelect={(v) => setAnswer('lifeStage', v)}
      onContinue={nextStep}
    />
  )
}

// OB-10 — Intent.
export function OB10Intent() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="What brings you here?"
      subtitle="Either answer is fine. It just helps us set the right pace."
      options={INTENT_OPTIONS}
      value={state.intent}
      onSelect={(v) => setAnswer('intent', v)}
      onContinue={nextStep}
    />
  )
}

// OB-11b — Relatable category (Step 12 pre-build). Defaults to food_delivery so Continue is live.
export function OB11bCategory() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="If that money went somewhere better, where?"
      subtitle="We'll show your savings as something you'd actually rather spend on."
      options={RELATABLE_CATEGORY_OPTIONS}
      value={state.relatableCategory}
      onSelect={(v) => setAnswer('relatableCategory', v)}
      onContinue={nextStep}
    />
  )
}

// OB-12 — Reasons for smoking (multi).
export function OB12Reasons() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <MultiChoiceScreen
      onBack={prevStep}
      title="What's usually behind it?"
      subtitle="Pick all that fit."
      options={SMOKING_REASON_OPTIONS}
      values={state.smokingReasons}
      onToggle={(v) => setAnswer('smokingReasons', toggle(state.smokingReasons, v))}
      onContinue={nextStep}
    />
  )
}

// OB-13 — Trigger timing (multi).
export function OB13Triggers() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <MultiChoiceScreen
      onBack={prevStep}
      title="When do the cravings hit hardest?"
      subtitle="Pick all that fit."
      options={TRIGGER_TIME_OPTIONS}
      values={state.triggerTimes}
      onToggle={(v) => setAnswer('triggerTimes', toggle(state.triggerTimes, v))}
      onContinue={nextStep}
    />
  )
}

// OB-14 — First cigarette timing.
export function OB14FirstCig() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="How soon after waking do you have your first?"
      options={FIRST_CIGARETTE_OPTIONS}
      value={state.timeToFirstCigarette}
      onSelect={(v) => setAnswer('timeToFirstCigarette', v)}
      onContinue={nextStep}
    />
  )
}

// OB-15 — Craving intensity.
export function OB15Craving() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="When a craving comes, how strong is it?"
      options={CRAVING_OPTIONS}
      value={state.cravingIntensity}
      onSelect={(v) => setAnswer('cravingIntensity', v)}
      onContinue={nextStep}
    />
  )
}

// OB-16 — Quit history. Selecting 'never' clears struggles; nextStep skips OB-17 (branch-aware).
export function OB16QuitHistory() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  const onContinue = () => {
    if (state.previousQuitAttempts === 'never') setAnswer('quitStruggles', null)
    nextStep()
  }
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="Have you tried to quit before?"
      options={QUIT_HISTORY_OPTIONS}
      value={state.previousQuitAttempts}
      onSelect={(v) => setAnswer('previousQuitAttempts', v)}
      onContinue={onContinue}
    />
  )
}

// OB-17 — Biggest struggle (conditional: only shown if quit_attempts != never).
export function OB17Struggles() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  const values = state.quitStruggles ?? []
  return (
    <MultiChoiceScreen
      onBack={prevStep}
      title="Last time, what got in the way?"
      subtitle="Pick all that fit."
      options={QUIT_STRUGGLE_OPTIONS}
      values={values}
      onToggle={(v) => setAnswer('quitStruggles', toggle(values, v))}
      onContinue={nextStep}
    />
  )
}

// OB-19 — Motivation.
export function OB19Motivation() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  return (
    <SingleChoiceScreen
      onBack={prevStep}
      title="What's pulling you toward this?"
      options={MOTIVATION_OPTIONS}
      value={state.motivation}
      onSelect={(v) => setAnswer('motivation', v)}
      onContinue={nextStep}
    />
  )
}

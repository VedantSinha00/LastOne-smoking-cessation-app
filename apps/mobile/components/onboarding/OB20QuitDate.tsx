import React, { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useOnboarding } from '../../hooks/useOnboarding'
import { OBScreen, OBHeader, OBContinue, OBTextLink } from './parts'

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const fmt = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// OB-20 — Quit date. Default today+7, minimum today+3 (account creation + 3,
// and the account was created moments ago in this flow). Skip is always available
// (Spec OB-20 / §B2.4). Continuing with a date routes to OB-22; skip routes to OB-23.
export function OB20QuitDate() {
  const { state, setAnswer, nextStep, prevStep } = useOnboarding()
  const today = new Date()
  const minDate = addDays(today, 3)
  const [selected, setSelected] = useState<Date>(state.quitDate ?? addDays(today, 7))
  const [show, setShow] = useState(Platform.OS === 'ios')

  const onChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (date) setSelected(date)
  }

  const onContinue = () => {
    setAnswer('quitDate', selected)
    nextStep()
  }

  const onSkip = () => {
    setAnswer('quitDate', null)
    nextStep()
  }

  return (
    <OBScreen
      onBack={prevStep}
      footer={
        <View>
          <OBContinue title="Set my quit date" onPress={onContinue} />
          <OBTextLink title="I'm here to understand myself first" onPress={onSkip} />
        </View>
      }
    >
      <OBHeader
        title="When do you want this to be your last?"
        subtitle="Pick a date at least a few days out — enough time to learn your patterns first. No pressure to decide now."
      />

      {Platform.OS === 'android' && (
        <Pressable
          onPress={() => setShow(true)}
          className="bg-card border border-border rounded-2xl px-5 py-4 mb-4 active:bg-muted"
        >
          <Text className="text-primary text-lg">{fmt(selected)}</Text>
        </Pressable>
      )}

      {show && (
        <DateTimePicker
          value={selected}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minDate}
          onChange={onChange}
          themeVariant="light"
        />
      )}
    </OBScreen>
  )
}

import React, { useState } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useProfile } from '../../hooks/useProfile'
import { useStage } from '../../hooks/useStage'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
const fmt = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/**
 * PROF-02 — Edit Quit Date (Stage 0 only). Minimum = max(account_created_at +
 * 3 days, today); no maximum (§B2.1). Writes to the open quit_attempts row.
 * Stage 1+ users never reach this — the row routes to the redirect instead.
 */
export default function EditQuitDate() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { quitDate, stage } = useStage()
  const { updateQuitDate } = useSettings()

  const accountCreated = profile?.account_created_at ? new Date(profile.account_created_at) : new Date()
  const minDate = (() => {
    const plus3 = addDays(accountCreated, 3)
    const today = new Date()
    return plus3 > today ? plus3 : today
  })()

  const [selected, setSelected] = useState<Date>(quitDate ? new Date(quitDate) : addDays(new Date(), 7))
  const [show, setShow] = useState(Platform.OS === 'ios')

  // Guard: only Stage 0 may edit here.
  if (stage !== 0) {
    return (
      <EditScreen title="Quit date">
        <Text className="text-muted-foreground text-sm">
          Your quit date is locked once your journey begins. Use Take a break or Start fresh instead.
        </Text>
        <Button title="Back" variant="secondary" onPress={() => router.navigate('/(tabs)/profile')} />
      </EditScreen>
    )
  }

  const onChange = (_e: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (date) setSelected(date)
  }

  const save = async () => {
    await updateQuitDate.mutateAsync(selected.toISOString().slice(0, 10))
    router.navigate('/(tabs)/profile')
  }

  return (
    <EditScreen title="Quit date">
      <Text className="text-muted-foreground text-sm">
        Pick at least a few days out — enough time to learn your patterns first.
      </Text>

      {Platform.OS === 'android' && (
        <Pressable
          onPress={() => setShow(true)}
          className="bg-card border border-border rounded-2xl px-5 py-4 active:bg-muted"
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

      <View className="mt-2">
        <Button title="Confirm" onPress={save} loading={updateQuitDate.isPending} />
      </View>
    </EditScreen>
  )
}

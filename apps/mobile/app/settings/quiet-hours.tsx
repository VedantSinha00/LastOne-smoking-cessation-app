import React, { useState } from 'react'
import { View, Text, Pressable, Switch, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'
import { formatTime } from '../../lib/settings'

/** 'HH:MM:SS' → Date (today) for the picker; null → a default time. */
function hmsToDate(hms: string | null, fallbackHour: number): Date {
  const d = new Date()
  if (hms) {
    const [h, m] = hms.split(':').map(Number)
    d.setHours(h, m, 0, 0)
  } else {
    d.setHours(fallbackHour, 0, 0, 0)
  }
  return d
}
const dateToHms = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`

/**
 * PROF-11 — Quiet Hours. Toggle (saved immediately) + start/end time pickers
 * (saved on Confirm). Overnight ranges (start > end) are valid. SOS always
 * bypasses — note shown (§5 Flow 10). Default 23:00–08:00 on first enable.
 */
export default function QuietHours() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { updateProfile } = useSettings()

  const [enabled, setEnabled] = useState(profile?.quiet_hours_enabled ?? false)
  const [start, setStart] = useState<Date>(hmsToDate(profile?.quiet_hours_start ?? null, 23))
  const [end, setEnd] = useState<Date>(hmsToDate(profile?.quiet_hours_end ?? null, 8))
  const [show, setShow] = useState<'start' | 'end' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggle = async (value: boolean) => {
    setEnabled(value)
    await updateProfile.mutateAsync({
      quiet_hours_enabled: value,
      // Seed defaults on first enable so the dashboard row shows a range.
      ...(value && !profile?.quiet_hours_start
        ? { quiet_hours_start: '23:00:00', quiet_hours_end: '08:00:00' }
        : {}),
    })
  }

  const save = async () => {
    if (dateToHms(start) === dateToHms(end)) {
      setError('Start and end time cannot be the same.')
      return
    }
    await updateProfile.mutateAsync({
      quiet_hours_enabled: enabled,
      quiet_hours_start: dateToHms(start),
      quiet_hours_end: dateToHms(end),
    })
    router.back()
  }

  const onChange = (which: 'start' | 'end') => (_e: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShow(null)
    if (date) {
      which === 'start' ? setStart(date) : setEnd(date)
      setError(null)
    }
  }

  return (
    <EditScreen title="Quiet hours">
      <View className="bg-card border border-border rounded-3xl px-5 py-1">
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-foreground text-base">Quiet hours</Text>
          <Switch value={enabled} onValueChange={toggle} trackColor={{ true: '#7FC200' }} />
        </View>
      </View>

      {enabled && (
        <>
          <Pressable
            onPress={() => setShow('start')}
            className="bg-card border border-border rounded-2xl px-5 py-4 flex-row justify-between active:bg-muted"
          >
            <Text className="text-foreground">Start</Text>
            <Text className="text-primary">{formatTime(dateToHms(start))}</Text>
          </Pressable>
          <Pressable
            onPress={() => setShow('end')}
            className="bg-card border border-border rounded-2xl px-5 py-4 flex-row justify-between active:bg-muted"
          >
            <Text className="text-foreground">End</Text>
            <Text className="text-primary">{formatTime(dateToHms(end))}</Text>
          </Pressable>

          {show && (
            <DateTimePicker
              value={show === 'start' ? start : end}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange(show)}
              themeVariant="light"
            />
          )}
        </>
      )}

      <Text className="text-muted-foreground text-xs leading-relaxed">
        SOS notifications always come through, even during quiet hours.
      </Text>
      {error && <Text className="text-craving text-sm">{error}</Text>}
      {enabled && <Button title="Save" onPress={save} loading={updateProfile.isPending} />}
    </EditScreen>
  )
}

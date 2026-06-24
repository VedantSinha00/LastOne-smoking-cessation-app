import React, { useState } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Toggle } from '../../components/settings/Toggle'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
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
 * PROF-11 — Quiet Hours. Toggle + start/end time pickers all autosave on
 * change (no Save button). Overnight ranges (start > end) are valid; start ==
 * end is rejected inline. SOS always bypasses — note shown (§5 Flow 10).
 * Default 23:00–08:00 on first enable.
 */
export default function QuietHours() {
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

  // A time change autosaves immediately, unless it would make start == end
  // (invalid range) — then we hold the local value + show the error and skip
  // the write, so a missed Save can't leave an inconsistent range.
  const onChange = (which: 'start' | 'end') => (_e: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShow(null)
    if (!date) return
    const nextStart = which === 'start' ? date : start
    const nextEnd = which === 'end' ? date : end
    which === 'start' ? setStart(date) : setEnd(date)
    if (dateToHms(nextStart) === dateToHms(nextEnd)) {
      setError('Start and end time cannot be the same.')
      return
    }
    setError(null)
    updateProfile.mutate({
      quiet_hours_enabled: true,
      quiet_hours_start: dateToHms(nextStart),
      quiet_hours_end: dateToHms(nextEnd),
    })
  }

  return (
    <EditScreen title="Quiet hours">
      <View className="bg-card border border-border rounded-3xl px-5 py-1">
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-foreground text-base">Quiet hours</Text>
          <Toggle on={enabled} onChange={toggle} />
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
    </EditScreen>
  )
}

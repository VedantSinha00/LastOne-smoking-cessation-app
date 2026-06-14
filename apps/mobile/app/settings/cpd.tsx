import React, { useState } from 'react'
import { Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'

/** PROF-04 — Edit Cigarettes Per Day. Integer ≥ 1; writes cpd_change_log then
 *  PATCHes profile (prospective recalc, §5 Flow 3). */
export default function EditCpd() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { updateCpd } = useSettings()
  const [value, setValue] = useState(profile?.cigarettes_per_day != null ? String(profile.cigarettes_per_day) : '')
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const n = parseInt(value, 10)
    if (!Number.isFinite(n) || n <= 0) {
      // Not a "smoke more" nudge — this is the pre-quit baseline used for savings.
      setError("This is your old daily habit (before quitting), not today's — we use it to work out your savings. Pop in that number.")
      return
    }
    await updateCpd.mutateAsync(n)
    router.navigate('/(tabs)/profile')
  }

  return (
    <EditScreen title="Cigarettes per day">
      <Text className="text-muted-foreground text-sm leading-relaxed">
        How many you used to smoke on an average day, before you quit. This is your baseline — we use
        it to calculate how much you&apos;ve saved, not what you smoke now.
      </Text>
      <TextInput
        value={value}
        onChangeText={(t) => {
          setValue(t)
          setError(null)
        }}
        keyboardType="number-pad"
        placeholder="e.g. 5"
        placeholderTextColor="#A8A29E"
        className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
      />
      {error && <Text className="text-craving text-sm">{error}</Text>}
      <Button title="Save" onPress={save} loading={updateCpd.isPending} />
    </EditScreen>
  )
}

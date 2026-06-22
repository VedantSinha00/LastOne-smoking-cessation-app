import React, { useState } from 'react'
import { Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'

/** PROF-05 — Edit Price Per Cigarette (INR, decimal allowed). Writes
 *  price_change_log then PATCHes profile (prospective recalc, §5 Flow 4). */
export default function EditPrice() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { updatePrice } = useSettings()
  const [value, setValue] = useState(profile?.price_per_cigarette != null ? String(profile.price_per_cigarette) : '')
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const n = parseFloat(value)
    if (!Number.isFinite(n) || n <= 0) {
      setError("We need the price of one cigarette to work out your savings. What does a single one cost?")
      return
    }
    await updatePrice.mutateAsync(n)
    // Pop back to where we came from (Your Journey), not all the way to root.
    if (router.canGoBack()) router.back()
    else router.navigate('/(tabs)/profile')
  }

  return (
    <EditScreen title="Price per cigarette">
      <Text className="text-muted-foreground text-sm">What one loose cigarette costs you (₹).</Text>
      <TextInput
        value={value}
        onChangeText={(t) => {
          setValue(t)
          setError(null)
        }}
        keyboardType="decimal-pad"
        placeholder="e.g. 15"
        placeholderTextColor="#A8A29E"
        className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
      />
      {error && <Text className="text-craving text-sm">{error}</Text>}
      <Button title="Save" onPress={save} loading={updatePrice.isPending} />
    </EditScreen>
  )
}

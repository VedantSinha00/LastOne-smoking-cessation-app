import React, { useState } from 'react'
import { Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'

/** PROF-08 — Edit Display Name. Max 30 chars, non-empty after trim (§5 Flow 7). */
export default function EditName() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { updateProfile } = useSettings()
  const [value, setValue] = useState(profile?.display_name ?? '')
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Name cannot be empty.')
      return
    }
    await updateProfile.mutateAsync({ display_name: trimmed.slice(0, 30) })
    router.navigate('/(tabs)/profile')
  }

  return (
    <EditScreen title="Display name">
      <TextInput
        value={value}
        onChangeText={(t) => {
          setValue(t)
          setError(null)
        }}
        maxLength={30}
        placeholder="Your name"
        placeholderTextColor="#A8A29E"
        className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
      />
      <Text className="text-muted-foreground text-xs">{value.length}/30</Text>
      {error && <Text className="text-craving text-sm">{error}</Text>}
      <Button title="Save" onPress={save} loading={updateProfile.isPending} />
    </EditScreen>
  )
}

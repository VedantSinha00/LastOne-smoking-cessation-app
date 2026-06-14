import React, { useState } from 'react'
import { View, Text, TextInput, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { deleteAccount } from '../../hooks/useSettings'
import { clearSupportPerson } from '../../lib/givingUp'
import { queryClient } from '../../lib/queryClient'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'
import { DELETE_CONFIRM_WORD } from '../../lib/settings'

/**
 * PROF-14 — Delete Account (§5 Flow 13). Requires typing "DELETE" exactly; the
 * Confirm button stays disabled otherwise. Calls delete_user_account (purges
 * profiles → cascades all child tables → auth.users), clears the SecureStore
 * SOS contact, then signs out. Closing the app mid-flow deletes nothing.
 */
export default function DeleteAccount() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const enabled = confirm === DELETE_CONFIRM_WORD

  const doDelete = async () => {
    if (!user || !enabled) return
    setBusy(true)
    try {
      await deleteAccount(user.id)
      // Device-local data is not covered by the server cascade — clear it too.
      await clearSupportPerson()
      queryClient.clear()
      await signOut() // routes back to onboarding/landing
    } catch (e) {
      setBusy(false)
      Alert.alert('Could not delete account', e instanceof Error ? e.message : 'Try again.')
    }
  }

  return (
    <EditScreen title="Delete account">
      <Text className="text-foreground text-sm leading-relaxed">
        This will permanently delete your account and all your data. This cannot be undone. Type{' '}
        <Text className="font-sans-bold">DELETE</Text> below to confirm.
      </Text>
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Type DELETE"
        placeholderTextColor="#A8A29E"
        autoCapitalize="none"
        autoCorrect={false}
        className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
      />
      <View className="gap-3 mt-2">
        {/* danger variant; disabled until the exact word is typed */}
        <Button title="Delete my account" variant="danger" onPress={doDelete} disabled={!enabled} loading={busy} />
        <Button title="Cancel" variant="secondary" onPress={() => router.navigate('/(tabs)/profile')} />
      </View>
    </EditScreen>
  )
}

import React, { useState } from 'react'
import { View, Text, TextInput, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'

/**
 * PROF-12 — Account Details. Shows the email; offers Change Email + Change
 * Password via standard Supabase Auth (§5 Flow 11). Email/password change with
 * an OAuth-only account isn't applicable, but the controls are wired for
 * password accounts.
 */
export default function AccountDetails() {
  const router = useRouter()
  const { user } = useAuth()
  const [mode, setMode] = useState<'view' | 'email' | 'password'>('view')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const changeEmail = async () => {
    if (!newEmail.trim()) return
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setBusy(false)
    if (error) Alert.alert('Could not change email', error.message)
    else {
      Alert.alert('Check your inbox', 'Confirm the change from the email we just sent.')
      setMode('view')
    }
  }

  const changePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Use at least 8 characters.')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setBusy(false)
    if (error) Alert.alert('Could not change password', error.message)
    else {
      Alert.alert('Done', 'Your password has been updated.')
      setMode('view')
    }
  }

  return (
    <EditScreen title="Account">
      <View className="bg-card border border-border rounded-3xl px-5 py-4">
        <Text className="text-muted-foreground text-xs">Email</Text>
        <Text className="text-foreground text-base mt-0.5">{user?.email ?? '—'}</Text>
      </View>

      {mode === 'view' && (
        <View className="gap-3">
          <Button title="Change Email" variant="secondary" onPress={() => setMode('email')} />
          <Button title="Change Password" variant="secondary" onPress={() => setMode('password')} />
        </View>
      )}

      {mode === 'email' && (
        <View className="gap-3">
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="New email"
            placeholderTextColor="#A8A29E"
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
          />
          <Button title="Send confirmation" onPress={changeEmail} loading={busy} />
          <Button title="Cancel" variant="secondary" onPress={() => setMode('view')} />
        </View>
      )}

      {mode === 'password' && (
        <View className="gap-3">
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor="#A8A29E"
            secureTextEntry
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
          />
          <Button title="Update password" onPress={changePassword} loading={busy} />
          <Button title="Cancel" variant="secondary" onPress={() => setMode('view')} />
        </View>
      )}
    </EditScreen>
  )
}

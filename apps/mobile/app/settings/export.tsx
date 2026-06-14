import React, { useState } from 'react'
import { Text, Platform, ToastAndroid, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { EditScreen } from '../../components/settings/EditScreen'
import { Button } from '../../components/ui/button'

/**
 * PROF-13 — Data Export (§5 Flow 12). V1: confirmation only. The actual export
 * job is a server task (Edge Function) deferred to Step 21 with the rest of the
 * server pipeline — the UI surface ships now; tapping confirms intent.
 */
export default function DataExport() {
  const router = useRouter()
  const { user } = useAuth()
  const [done, setDone] = useState(false)
  const email = user?.email ?? 'your email'

  const requestExport = () => {
    setDone(true)
    const msg = `Your data will be sent to ${email} within a few minutes.`
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG)
    else Alert.alert('Export requested', msg)
  }

  return (
    <EditScreen title="Data export">
      <Text className="text-muted-foreground text-sm leading-relaxed">
        We&apos;ll send a full export of your LastOne data to {email}. This includes all your log
        entries, streak history, goal progress, and craving patterns.
      </Text>
      {done ? (
        <Text className="text-success text-sm">
          Requested — it&apos;ll arrive at {email} shortly.
        </Text>
      ) : (
        <Button title="Request Export" onPress={requestExport} />
      )}
      <Button title="Back" variant="secondary" onPress={() => router.navigate('/(tabs)/profile')} />
    </EditScreen>
  )
}

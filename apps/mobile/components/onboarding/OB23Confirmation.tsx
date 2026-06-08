import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { useOnboarding } from '../../hooks/useOnboarding'
import { completeOnboarding } from '../../lib/onboarding'
import { requestPushPermissionAndStoreToken } from '../../lib/notifications'
import { OBScreen, OBContinue } from './parts'

async function withRetry(fn: () => Promise<void>, attempts = 3, delayMs = 1500): Promise<void> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      await fn()
      return
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}

// OB-23 — Confirmation + the single OB-23 write. Two copy variants depending on
// whether the user committed (came via OB-22) or skipped the quit date (Spec OB-23).
export function OB23Confirmation() {
  const { state, prevStep } = useOnboarding()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const committed = state.quitDate !== null
  const name = state.firstName || 'You'
  const headline = committed ? 'From here, everything changes.' : "You're here. That's where it starts."
  const confirmation = committed
    ? `${name} made a promise today.`
    : `${name} took the first step today.`

  const handleGo = async () => {
    setError(null)
    setSaving(true)
    try {
      // Ask notification permission first (best-effort; never blocks the write).
      if (state.userId) await requestPushPermissionAndStoreToken(state.userId)
      // The write, with silent retry on transient network failure.
      await withRetry(() => completeOnboarding(state))
      // Success: the root layout observes onboarding_complete = true and routes
      // to the tabs. Keep the spinner until this screen unmounts.
    } catch {
      setError("Couldn't save your profile. Check your connection and try again.")
      setSaving(false)
    }
  }

  return (
    <OBScreen
      onBack={saving ? undefined : prevStep}
      footer={
        <View>
          {error ? <Text className="text-red-400 text-sm mb-3 text-center">{error}</Text> : null}
          <OBContinue title="Go to LastOne" onPress={handleGo} loading={saving} />
        </View>
      }
    >
      <View className="flex-1 justify-center">
        <Text className="text-white text-3xl font-bold leading-9">{headline}</Text>
        <Text className="text-amber-400 text-lg mt-4">Let's begin.</Text>
        <Text className="text-zinc-500 text-base mt-8">{confirmation}</Text>
      </View>
    </OBScreen>
  )
}

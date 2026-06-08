import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useOnboarding } from '../../hooks/useOnboarding'
import { OBScreen, OBHeader } from './parts'

// OB-05 — Create account. Account is created mid-flow (Architecture Guide §7.1).
// If a session already exists (a user who signed up but didn't finish), skip
// straight past — userId is synced into onboarding state by the provider.
export function OB05CreateAccount() {
  const { signInWithGoogle } = useAuth()
  const { state, nextStep, prevStep } = useOnboarding()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (state.userId) nextStep()
  }, [state.userId, nextStep])

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError("Couldn't sign you in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <OBScreen onBack={prevStep}>
      <View className="flex-1 justify-center">
        <OBHeader
          title="Let's save your progress."
          subtitle="Create your account so your plan and streak are always here when you come back."
        />

        <Pressable
          onPress={loading ? undefined : handleGoogle}
          className="w-full bg-white rounded-2xl py-4 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="#09090b" />
          ) : (
            <Text className="text-zinc-950 text-base font-semibold">Continue with Google</Text>
          )}
        </Pressable>

        {error ? <Text className="text-red-400 text-sm mt-4 text-center">{error}</Text> : null}

        <Text className="text-zinc-600 text-xs mt-6 text-center leading-relaxed">
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </OBScreen>
  )
}

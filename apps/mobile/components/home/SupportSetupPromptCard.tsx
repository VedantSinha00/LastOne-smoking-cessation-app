import React, { useEffect, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { useStage } from '../../hooks/useStage'
import { useSupportPerson } from '../../hooks/useSupportPerson'
import { markSetupPromptShown, wasSetupPromptShown } from '../../lib/givingUp'

/**
 * One-time Stage-2 contextual prompt (GU Spec §B2 re-surface logic): if no
 * support person is configured when the user reaches Stage 2, nudge setup
 * once — low-priority card, fires a maximum of once ever. (GU-9 was not added
 * to the onboarding flow in V1, so this is the primary setup path.)
 */
export const SupportSetupPromptCard: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { stage } = useStage()
  const { configured, isLoading } = useSupportPerson()
  const [eligible, setEligible] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (user && stage >= 2 && !isLoading && !configured) {
      wasSetupPromptShown(user.id).then((shown) => {
        if (!cancelled && !shown) setEligible(true)
      })
    }
    return () => {
      cancelled = true
    }
  }, [user, stage, configured, isLoading])

  if (!eligible) return null

  const dismiss = () => {
    if (user) markSetupPromptShown(user.id)
    setEligible(false)
  }

  return (
    <View className="bg-card border border-border rounded-3xl p-5">
      <View className="flex-row items-start justify-between">
        <Text className="text-foreground font-sans-bold text-base flex-1 pr-3">
          Want to set up a support person?
        </Text>
        <Pressable onPress={dismiss} hitSlop={12}>
          <Text className="text-muted-foreground text-base">✕</Text>
        </Pressable>
      </View>
      <Text className="text-muted-foreground text-sm mt-1">One person, two minutes.</Text>
      <Pressable
        onPress={() => {
          dismiss() // fires max once, even if setup is then abandoned (§B2)
          router.push('/(modals)/support-person')
        }}
        className="mt-3 self-start"
        hitSlop={8}
      >
        <Text className="text-primary font-sans-bold text-sm">Set up →</Text>
      </Pressable>
    </View>
  )
}

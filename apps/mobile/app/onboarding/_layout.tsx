import { Stack } from 'expo-router'
import { OnboardingProvider } from '../../hooks/useOnboarding'

// Onboarding is a single route (index) that swaps step components internally,
// driven by OnboardingContext. No tab bar; swipe-back disabled so the flow owns
// navigation (Architecture Guide §7.2).
export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </OnboardingProvider>
  )
}

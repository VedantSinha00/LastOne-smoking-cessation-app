import React from 'react'
import { Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Card } from '../ui/Card'
import { useAlertLevel } from '../../hooks/useAlertLevel'

/**
 * Coping Surface Card (Insights Spec DD-03 "Position B" / §B2.8). Surfaces quietly
 * on Home at alert_level = 2 — i.e. the current hour falls inside an active,
 * high-confidence risk window. Renders nothing otherwise.
 *
 * CRITICAL: the card NEVER names the window or the timing. Naming it ("you usually
 * crave at 6pm") would turn the app into a smoking bell — the exact failure mode
 * DD-03 was stress-tested against. The copy is a neutral, low-pressure offer.
 */
export const CopingSurfaceCard: React.FC = () => {
  const router = useRouter()
  const alertLevel = useAlertLevel()
  if (alertLevel !== 2) return null

  return (
    <Card elevation="soft" onPress={() => router.push('/(modals)/sos')}>
      <Text className="text-foreground font-display text-xl">Need a moment?</Text>
      <Text className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
        Something quick to lean on, if you want it.
      </Text>
    </Card>
  )
}

import React from 'react'
import { Text } from 'react-native'
import { Card } from '../ui/Card'

/**
 * Home-screen sections whose full logic is owned by later build steps. Each
 * renders a minimal real card so the Home scroll order (Home Spec §P6) is
 * correct and verifiable in Step 8. Replace each with its real implementation
 * at the step noted below.
 */

/** Section F — Insights Preview card. Real insight: Step 16 (Insights). */
export const InsightsPreviewPlaceholder: React.FC = () => (
  <Card>
    <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
      Insights
    </Text>
    <Text className="text-muted-foreground text-sm leading-relaxed">
      Log a few cigarettes and we&apos;ll start finding your patterns.
    </Text>
  </Card>
)

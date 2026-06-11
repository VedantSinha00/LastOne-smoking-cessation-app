import React from 'react'
import { Text } from 'react-native'
import { parseISO, differenceInHours } from 'date-fns'
import { Card } from '../ui/Card'
import type { Stage } from '../../lib/stage'

/**
 * Early health-recovery milestones, offset in hours from quit_date.
 * Subset for the home countdown; the full set + inline YB cards land in Step 14
 * (Content Cards spec). Keep these offsets in sync with the YB card set then.
 */
const MILESTONES: { name: string; offsetHours: number }[] = [
  { name: 'Heart rate normalises', offsetHours: 0.33 }, // ~20 min
  { name: 'Carbon monoxide clears', offsetHours: 12 },
  { name: 'Nicotine leaves your body', offsetHours: 72 },
  { name: 'Taste & smell sharpen', offsetHours: 48 },
  { name: 'Circulation improves', offsetHours: 14 * 24 },
  { name: 'Lung function climbs', offsetHours: 90 * 24 },
].sort((a, b) => a.offsetHours - b.offsetHours)

interface HealthMilestonesCardProps {
  stage: Stage
  quitDate: string | null
  onPress?: () => void
}

/**
 * Health Milestones card — Home Screen Spec §5 Section G.
 * Forward-looking only: shows the next unearned milestone countdown, or a teaser
 * when there is no quit date. Days if > 48h away, hours if within 48h (B2.2).
 */
export const HealthMilestonesCard: React.FC<HealthMilestonesCardProps> = ({
  stage,
  quitDate,
  onPress,
}) => {
  let body: string

  if (!quitDate) {
    // Teaser — no quit date set.
    body = "You'll see your body's recovery here once you set a quit date."
  } else {
    const quit = parseISO(quitDate)
    const hoursSinceQuit = differenceInHours(new Date(), quit)
    const next = MILESTONES.find((m) => m.offsetHours > hoursSinceQuit)

    if (stage === 0) {
      // Pre-quit teaser — quit day not yet reached.
      const hoursUntilQuit = Math.max(0, -hoursSinceQuit)
      const days = Math.ceil(hoursUntilQuit / 24)
      body = `Your recovery starts in ${days} ${days === 1 ? 'day' : 'days'}. You'll see your body change here.`
    } else if (!next) {
      // All tracked milestones earned.
      body =
        'Your body has fully recovered. Every day smoke-free is a day it stays that way.'
    } else {
      const hoursLeft = next.offsetHours - hoursSinceQuit
      if (hoursLeft > 48) {
        const days = Math.ceil(hoursLeft / 24)
        body = `Next: ${next.name} in ${days} ${days === 1 ? 'day' : 'days'}`
      } else {
        const hours = Math.max(1, Math.ceil(hoursLeft))
        body = `Next: ${next.name} in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
      }
    }
  }

  return (
    <Card onPress={onPress}>
      <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
        Health
      </Text>
      <Text className="text-foreground text-base leading-relaxed">{body}</Text>
    </Card>
  )
}

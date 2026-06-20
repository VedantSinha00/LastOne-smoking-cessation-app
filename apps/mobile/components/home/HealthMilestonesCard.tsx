import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { parseISO, differenceInHours } from 'date-fns'
import { ChevronRight } from 'lucide-react-native'
import { Card } from '../ui/Card'
import type { Stage } from '../../lib/stage'
import { nextMilestone } from '../../lib/healthMilestones'

interface HealthMilestonesCardProps {
  stage: Stage
  quitDate: string | null
  /** Optional override; defaults to pushing the STK-8 timeline screen. */
  onPress?: () => void
}

/**
 * Health Milestones card — Home Screen Spec §5 Section G.
 * Forward-looking countdown only (the lean Home view): shows the next unearned
 * milestone, or a teaser when there is no quit date. Days if > 48h away, hours if
 * within 48h (B2.2). Tapping opens the full staged accordion timeline
 * (/milestones) — the rich view lives there, per the Home-vs-spec decision.
 * Milestone offsets are shared with the timeline via lib/healthMilestones.
 */
export const HealthMilestonesCard: React.FC<HealthMilestonesCardProps> = ({
  stage,
  quitDate,
  onPress,
}) => {
  const router = useRouter()
  let body: string

  if (!quitDate) {
    body = "You'll see your body's recovery here once you set a quit date."
  } else {
    const hoursSinceQuit = differenceInHours(new Date(), parseISO(quitDate))
    const next = nextMilestone(hoursSinceQuit)

    if (stage === 0) {
      const hoursUntilQuit = Math.max(0, -hoursSinceQuit)
      const days = Math.ceil(hoursUntilQuit / 24)
      body = `Your recovery starts in ${days} ${days === 1 ? 'day' : 'days'}. You'll see your body change here.`
    } else if (!next) {
      body = 'Your body has fully recovered. Every day smoke-free is a day it stays that way.'
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
    <Card onPress={onPress ?? (() => router.push('/milestones'))}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
            Health Milestones
          </Text>
          <Text className="text-foreground text-base leading-relaxed">{body}</Text>
        </View>
        <ChevronRight size={20} color="#76706C" strokeWidth={2} />
      </View>
    </Card>
  )
}

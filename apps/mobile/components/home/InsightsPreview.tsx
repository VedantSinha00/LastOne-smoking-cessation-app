import React from 'react'
import { Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Card } from '../ui/Card'
import { useInsights } from '../../hooks/useInsights'

/**
 * Home Insights Preview (Home Spec §F). Shows the top-ranked insight headline as a
 * teaser and deep-links to the Insights tab. Before any insight exists, shows the
 * gentle prompt to log. Replaces the Step-8 placeholder.
 */
export const InsightsPreview: React.FC = () => {
  const router = useRouter()
  const { feed, hasAnyLog, isLoading } = useInsights()
  const top = feed[0]

  return (
    <Card onPress={() => router.push('/insights')}>
      <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
        Insights
      </Text>
      {top ? (
        <Text className="text-foreground text-base leading-relaxed">{top.content.headline}</Text>
      ) : (
        <Text className="text-muted-foreground text-sm leading-relaxed">
          {isLoading
            ? 'Looking for your patterns…'
            : hasAnyLog
              ? 'A few more logs and your patterns will start to show.'
              : "Log a few cigarettes and we'll start finding your patterns."}
        </Text>
      )}
    </Card>
  )
}

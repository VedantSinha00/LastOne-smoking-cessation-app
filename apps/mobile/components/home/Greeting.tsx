import React from 'react'
import { View, Text } from 'react-native'

/**
 * Time-aware greeting line — Home Screen Spec §5 Section A.
 *   05:00–12:00 → "Good morning"
 *   12:00–17:00 → "Hey"
 *   17:00–21:00 → "Good evening"
 *   21:00–05:00 → "Hey"
 *
 * Styled to the Lovable design: name rendered in primary green (Space Grotesk),
 * with an optional "Day N of not smoking." subline beneath.
 */
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Hey'
}

interface GreetingProps {
  firstName?: string | null
  /** Days since quit. When provided, renders the "Day N of not smoking." subline. */
  dayCount?: number
}

export const Greeting: React.FC<GreetingProps> = ({ firstName, dayCount }) => {
  const greeting = greetingFor(new Date().getHours())
  const name = firstName?.trim()

  return (
    <View>
      <Text
        className="text-primary font-display"
        style={{ fontSize: 34, letterSpacing: -0.5, lineHeight: 40 }}
      >
        {name ? `${greeting}, ${name}.` : `${greeting}.`}
      </Text>
      {typeof dayCount === 'number' && (
        <Text className="text-muted-foreground font-sans mt-1" style={{ fontSize: 15 }}>
          Day <Text className="text-foreground font-sans-medium">{dayCount}</Text> of not smoking.
        </Text>
      )}
    </View>
  )
}

import React from 'react'
import { View, Text } from 'react-native'

/**
 * Time-aware greeting line — Home Screen Spec §5 Section A.
 *   05:00–12:00 → "Good morning"
 *   12:00–17:00 → "Hey"
 *   17:00–21:00 → "Good evening"
 *   21:00–05:00 → "Hey"
 */
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Hey'
}

interface GreetingProps {
  firstName?: string | null
}

export const Greeting: React.FC<GreetingProps> = ({ firstName }) => {
  const greeting = greetingFor(new Date().getHours())
  const name = firstName?.trim()

  return (
    <View className="mb-6">
      <Text className="text-white text-2xl font-extrabold">
        {name ? `${greeting}, ${name}.` : `${greeting}.`}
      </Text>
    </View>
  )
}

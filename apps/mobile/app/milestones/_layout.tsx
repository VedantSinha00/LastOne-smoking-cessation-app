import { Stack } from 'expo-router'

/**
 * Health Milestones timeline stack (STK-8). Entered from the Home Health
 * Milestones card (which itself shows only the next-milestone countdown). The
 * full staged accordion lives here.
 */
export default function MilestonesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FBFAF9' },
      }}
    />
  )
}

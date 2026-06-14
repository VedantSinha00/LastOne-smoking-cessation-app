import { Stack } from 'expo-router'

/**
 * Mini-Games stack (Step 19). Entered from the Tools tab (Games & Puzzles) and
 * the home games card. index = MG-HUB-1; memory-1p / echo-tap / memory-2p are
 * the games; streaks = MG-STREAK-1.
 */
export default function GamesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FBFAF9' },
      }}
    />
  )
}

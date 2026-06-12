import { Stack } from 'expo-router'

/**
 * Personal Goals stack (Step 17). Lives under the Progress/Savings section —
 * entered from the Progress tab, not a tab of its own (Spec §2.2).
 * index = GOAL-01 dashboard; add* = creation flow; [goalId] = detail;
 * allocate = GOAL-10; history = GOAL-09.
 */
export default function GoalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FBFAF9' },
      }}
    />
  )
}

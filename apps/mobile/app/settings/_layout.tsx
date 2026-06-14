import { Stack } from 'expo-router'

/**
 * Settings & Profile stack (Step 20). The Profile tab renders index (PROF-01);
 * each editable row pushes a sub-screen (PROF-02..14).
 */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FBFAF9' },
      }}
    />
  )
}

import { Stack } from 'expo-router'
import { View } from 'react-native'
import { SosFab } from '../../components/sos/sos-fab'

/**
 * Settings & Profile stack (Step 20). The Profile tab renders index (PROF-01);
 * each editable row pushes a sub-screen (PROF-02..14).
 *
 * The LastOne `TopBar` (wordmark + profile icon) is rendered by each screen's
 * own chrome (SettingsRoot directly; sub-screens via EditScreen) rather than
 * here — the Profile *tab* enters through `(tabs)/profile`, which does NOT pass
 * through this stack layout, so a TopBar mounted here would be missing on the
 * root. Putting it in the shared chrome makes it appear on every entry path and
 * stay pinned across the whole flow.
 *
 * The persistent SOS FAB is mounted here so it stays visible across every
 * settings sub-screen (e.g. Your Journey) — these screens live in a sibling
 * stack of (tabs), so the tabs-layout FAB doesn't cover them. The Profile tab
 * ROOT still gets its FAB from the tabs layout.
 */
export default function SettingsLayout() {
  return (
    <View className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FBFAF9' },
        }}
      />
      <SosFab />
    </View>
  )
}

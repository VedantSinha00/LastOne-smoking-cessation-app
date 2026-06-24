import { Stack } from 'expo-router'

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
 * The SOS FAB is NOT mounted here. It belongs on passive/browsing surfaces, not
 * on focused edit forms — so it is opt-in per screen via EditScreen's `showSos`
 * prop (the browsing category screens set it; the leaf edit forms don't).
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

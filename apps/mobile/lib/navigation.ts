import { router } from 'expo-router'

/**
 * Close any open log/SOS modal flow and return to Home.
 *
 * The log modals are pushed over the tabs, and the picker sheet enters a flow via
 * router.replace — so the stack entry beneath a flow is whatever tab was active
 * when the FAB was tapped (often Progress, after the /progress deep-links). A plain
 * router.back() therefore lands on that tab, not Home.
 *
 * We first dismiss every open modal (so nothing from the log stack lingers), then
 * navigate explicitly to the Home tab's index route — matching the named-route
 * pattern that EditScreen uses ('/(tabs)/profile') so it lands reliably regardless
 * of which tab was active underneath.
 */
export function exitToHome() {
  // dismissAll throws if there's nothing to dismiss; guard it.
  try {
    router.dismissAll()
  } catch {
    // no modals to dismiss — fine
  }
  // Reset to Home. '/(tabs)' (no trailing slash) + replace is the exact call the
  // root layout uses to land on Home after onboarding, so it resolves to the Home
  // index rather than restoring the tab group's last-active tab (Progress).
  router.replace('/(tabs)')
}

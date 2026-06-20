import { router } from 'expo-router'

/**
 * Close any open log/SOS modal flow and return to Home.
 *
 * The log modals are pushed over the tabs, and the picker sheet enters a flow via
 * router.replace — so the stack entry beneath a flow is whatever tab was active
 * when the FAB was tapped (often Progress). A plain router.back() therefore lands
 * on that tab, not Home. Navigating explicitly to the Home tab dismisses the modal
 * stack and lands reliably on Home regardless of where the user came from.
 */
export function exitToHome() {
  router.navigate('/(tabs)/')
}

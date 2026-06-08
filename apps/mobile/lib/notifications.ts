import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { supabase } from './supabase'

// Best-effort token fetch + store. Never throws — onboarding/app launch must not
// break if there's no EAS projectId yet (push sending is wired in Phase 5) or the
// profiles.push_token column hasn't been added to the remote DB yet.
async function fetchAndStoreToken(userId: string): Promise<void> {
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
    ?.projectId
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
  await supabase.from('profiles').update({ push_token: token.data }).eq('id', userId).throwOnError()
}

/**
 * OB-23 — asks OS notification permission (Architecture Guide §7.9), then stores
 * the push token if granted. This is the only place that PROMPTS for permission.
 */
export async function requestPushPermissionAndStoreToken(userId: string): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
    let status = existing
    if (existing !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status
    }
    if (status !== 'granted') return
    await fetchAndStoreToken(userId)
  } catch (err) {
    console.warn('Push token registration skipped:', err)
  }
}

/**
 * App-launch sync. Stores the push token if permission is ALREADY granted — never
 * prompts. Idempotent: safe to call on every launch. Backfills users who onboarded
 * before profiles.push_token existed, or before a token could be fetched.
 */
export async function syncPushTokenIfGranted(userId: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return
    await fetchAndStoreToken(userId)
  } catch (err) {
    console.warn('Push token sync skipped:', err)
  }
}

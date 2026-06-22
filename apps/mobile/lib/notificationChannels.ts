import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

/**
 * Android notification channels — make system notifications feel intentional
 * rather than generic: named categories the user recognises (and can tune per
 * type in OS settings), each with the brand light colour, sensible importance,
 * and vibration. Channels are an Android concept; all of this is a no-op on iOS.
 *
 * The channel is attached at schedule time via the trigger's `channelId` (see
 * channelFor). Channels must exist before a notification posts to them, so
 * ensureNotificationChannels() runs once at app launch.
 */

const BRAND_GREEN = '#7FC200' // primary — the LED/accent colour for our notifications

/** Stable channel ids. Keep in sync with channelFor(). */
export const CHANNELS = {
  milestones: 'milestones',
  checkins: 'checkins',
  reengagement: 'reengagement',
} as const

type ChannelId = (typeof CHANNELS)[keyof typeof CHANNELS]

/**
 * Map a notification `data.type` code to its channel.
 *  - N-CON-*  health milestones      → Milestones (celebratory, high importance)
 *  - N-STK-*  daily check-in/streak  → Check-ins
 *  - N-PROF-* voice-style prompt     → Check-ins (a gentle nudge)
 *  - N-PAU-*  pause re-engagement    → Re-engagement
 */
export function channelFor(type: string | undefined): ChannelId {
  if (!type) return CHANNELS.checkins
  if (type.startsWith('N-CON')) return CHANNELS.milestones
  if (type.startsWith('N-PAU')) return CHANNELS.reengagement
  return CHANNELS.checkins // N-STK-*, N-PROF-*, fallback
}

/**
 * Create/refresh all channels. Idempotent — Android merges by id, so calling on
 * every launch just keeps them current. Safe to call unconditionally (no-op off
 * Android).
 */
export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync(CHANNELS.milestones, {
    name: 'Milestones',
    description: 'Health milestones and progress you’ve unlocked.',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: BRAND_GREEN,
    vibrationPattern: [0, 200, 120, 200],
    sound: 'default',
  })

  await Notifications.setNotificationChannelAsync(CHANNELS.checkins, {
    name: 'Daily check-ins',
    description: 'Gentle reminders to check in and keep your streak honest.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: BRAND_GREEN,
    vibrationPattern: [0, 150],
    sound: 'default',
  })

  await Notifications.setNotificationChannelAsync(CHANNELS.reengagement, {
    name: 'Coming back',
    description: 'A nudge to pick things back up when you’ve paused.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: BRAND_GREEN,
    vibrationPattern: [0, 150],
    sound: 'default',
  })
}

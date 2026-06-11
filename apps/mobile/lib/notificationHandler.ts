import type { Router } from 'expo-router'
import { supabase } from './supabase'
import { recordOpened } from './notificationState'
import type { NotificationType } from '../types/database'

/**
 * Notification response handling (Step 15). When the user TAPS a notification:
 *   1. mark the most recent matching notification_log row 'opened'
 *   2. reset the auto-reduce counter (recordOpened — §B2.4)
 *   3. route to the screen the notification points at
 *
 * Routing targets are kept conservative for the local-only build: health
 * milestones and the pause track land on Home; the daily check-in opens the log
 * sheet; the voice-style prompt opens Profile/Settings. Insight + goal routing is
 * added with the server delivery layer (Step 21).
 */

const ROUTE_BY_TYPE: Partial<Record<NotificationType, Parameters<Router['push']>[0]>> = {
  'N-STK-01': '/(modals)/log', // daily check-in → log sheet
  'N-PROF-01': '/(tabs)/profile', // voice-style prompt → Settings
  // Health milestones + pause track → Home (default below).
}

function routeFor(type: NotificationType | undefined): Parameters<Router['push']>[0] {
  if (type && ROUTE_BY_TYPE[type]) return ROUTE_BY_TYPE[type]!
  return '/(tabs)'
}

/**
 * Mark the latest queued/delivered log row of this type as opened. Best-effort —
 * the notification may pre-date logging (e.g. N-STK-01 has no per-fire log row),
 * in which case there is simply nothing to update.
 */
async function markOpened(userId: string, type: NotificationType): Promise<void> {
  try {
    const { data } = await supabase
      .from('notification_log')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', type)
      .in('status', ['queued', 'delivered'])
      .order('scheduled_for', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) return
    await supabase
      .from('notification_log')
      .update({ status: 'opened', opened_at: new Date().toISOString() })
      .eq('id', data.id)
      .throwOnError()
  } catch (err) {
    console.warn('markOpened skipped:', err)
  }
}

/** Handle a tapped notification: log it opened, reset auto-reduce, then navigate. */
export async function handleNotificationResponse(
  userId: string | undefined,
  data: Record<string, unknown> | undefined,
  router: Router,
): Promise<void> {
  const type = data?.type as NotificationType | undefined
  if (userId) {
    await recordOpened(userId)
    if (type) await markOpened(userId, type)
  }
  router.push(routeFor(type))
}

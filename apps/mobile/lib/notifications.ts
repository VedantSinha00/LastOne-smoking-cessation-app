import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { parseISO } from 'date-fns'
import { supabase } from './supabase'
import type {
  NotificationType,
  NotificationTier,
  RiskWindow,
  VoiceStyle,
} from '../types/database'
import { deriveStage } from './stage'
import {
  applyQuietHours,
  isEligibleForTier,
  type QuietHours,
} from './notificationGating'
import {
  healthMilestoneContent,
  pauseContent,
  voicePromptContent,
  type HealthMilestoneCode,
  type PauseCode,
} from './notificationCopy'
import { revertExpiredAutoReduce } from './notificationState'
import { channelFor } from './notificationChannels'

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

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL NOTIFICATION SCHEDULING — Step 15 (Notifications Spec §B2, Architecture
// Guide §Step 15). Local types only: health milestones (N-CON), daily check-in
// (N-STK-01), pause track (N-PAU). Insight + goal notifications are server-side
// (Edge Functions) and deferred until push credentials exist (Step 21).
//
// Every scheduled notification uses a STABLE identifier prefixed by group so we
// can cancel/reschedule a group precisely (Expo keys scheduled notifications by
// identifier). data.type carries the N-code; the response handler reads it to
// route the open and log it.
// ─────────────────────────────────────────────────────────────────────────────

const ID = {
  milestone: (code: HealthMilestoneCode) => `milestone-${code}`,
  checkin: 'daily-checkin', // single repeating reminder
  pause: (code: PauseCode) => `pause-${code}`,
  voicePrompt: 'voice-style-prompt',
} as const

/** Health milestone offsets from quit_date (Registry §5). Maps N-code → ms. */
const HEALTH_MILESTONE_OFFSETS_MS: Record<HealthMilestoneCode, number> = {
  'N-CON-01': 20 * 60_000, // 20 min
  'N-CON-02': 8 * 3_600_000, // 8 hr
  'N-CON-03': 12 * 3_600_000,
  'N-CON-04': 24 * 3_600_000,
  'N-CON-05': 48 * 3_600_000,
  'N-CON-06': 72 * 3_600_000,
  'N-CON-07': 7 * 86_400_000, // 1 week
  'N-CON-08': 14 * 86_400_000,
  'N-CON-09': 30 * 86_400_000,
  'N-CON-10': 90 * 86_400_000,
  'N-CON-11': 365 * 86_400_000,
  'N-CON-12': 1825 * 86_400_000,
}

/**
 * Delivery context read once per reconcile — the preference/quiet-hours state that
 * gates every scheduled notification. Pulled from profiles + notification_state.
 */
export interface DeliveryContext {
  notificationsEnabled: boolean
  effectiveTier: NotificationTier
  voiceStyle: VoiceStyle | null
  quietHours: QuietHours
}

export async function loadDeliveryContext(userId: string): Promise<DeliveryContext> {
  const [{ data: profile }, { data: state }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'notifications_enabled, voice_style, quiet_hours_enabled, quiet_hours_start, quiet_hours_end',
      )
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('notification_state')
      .select('effective_tier')
      .eq('user_id', userId)
      .maybeSingle(),
  ])
  return {
    notificationsEnabled: profile?.notifications_enabled ?? true,
    effectiveTier: state?.effective_tier ?? 'app_decides',
    voiceStyle: profile?.voice_style ?? null,
    quietHours: {
      enabled: profile?.quiet_hours_enabled ?? false,
      start: profile?.quiet_hours_start ?? null,
      end: profile?.quiet_hours_end ?? null,
    },
  }
}

/** Records a queued notification in notification_log (best-effort, never throws). */
async function logQueued(
  userId: string,
  type: NotificationType,
  scheduledFor: Date,
): Promise<void> {
  try {
    await supabase.from('notification_log').insert({
      user_id: userId,
      notification_type: type,
      status: 'queued',
      scheduled_for: scheduledFor.toISOString(),
    })
  } catch (err) {
    console.warn(`notification_log insert skipped (${type}):`, err)
  }
}

/**
 * Schedule the health-milestone notifications (N-CON-01…12). Each fires once at
 * quit_date + its offset. Only FUTURE milestones are scheduled — a milestone whose
 * moment has already passed is skipped (its card surfaces in-app instead). Cancels
 * any previously-scheduled milestones first so a quit-date change reschedules
 * cleanly. No-ops entirely when notifications are disabled.
 */
export async function scheduleHealthMilestoneNotifications(
  userId: string,
  quitDate: string | null,
  ctx: DeliveryContext,
): Promise<void> {
  await cancelHealthMilestoneNotifications()
  if (!quitDate || !ctx.notificationsEnabled) return

  const quit = parseISO(quitDate).getTime()
  const now = Date.now()

  for (const code of Object.keys(HEALTH_MILESTONE_OFFSETS_MS) as HealthMilestoneCode[]) {
    if (!isEligibleForTier(code, ctx.effectiveTier)) continue
    const fireAt = new Date(quit + HEALTH_MILESTONE_OFFSETS_MS[code])
    if (fireAt.getTime() <= now) continue // moment passed — skip

    const when = applyQuietHours(code, fireAt, ctx.quietHours)
    const content = healthMilestoneContent(code, ctx.voiceStyle)
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: ID.milestone(code),
        content: { title: content.title, body: content.body, data: { type: code } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: channelFor(code) },
      })
      await logQueued(userId, code, when)
    } catch (err) {
      console.warn(`Schedule ${code} skipped:`, err)
    }
  }
}

export async function cancelHealthMilestoneNotifications(): Promise<void> {
  for (const code of Object.keys(HEALTH_MILESTONE_OFFSETS_MS) as HealthMilestoneCode[]) {
    await Notifications.cancelScheduledNotificationAsync(ID.milestone(code)).catch(() => {})
  }
}

/**
 * Schedule the daily check-in reminder (N-STK-01) — a daily repeating notification
 * at the user's known risk-window hour (fallback 20:00). Stage 1–2 only; the caller
 * cancels it at Stage 3. Bypasses quiet hours (Decision 3) but respects
 * notifications_enabled. Re-scheduling replaces the prior reminder (same id).
 */
export async function scheduleDailyCheckinReminder(
  userId: string,
  riskWindowHour: number | null,
  ctx: DeliveryContext,
): Promise<void> {
  await cancelDailyCheckinReminder()
  if (!ctx.notificationsEnabled) return
  // N-STK-01 fires for every tier except on_demand (Registry §5: on_demand = ✗).
  if (!isEligibleForTier('N-STK-01', ctx.effectiveTier)) return

  const hour = riskWindowHour ?? 20 // fallback 20:00 local
  // Streak-owned copy (Streak Spec §7). Kept inline — it is the only N-STK copy
  // Step 15 schedules locally and is not duplicated elsewhere.
  // Title names the action (the OS header already shows the app name) — the body
  // carries the nudge.
  const content = {
    title: 'Daily check-in',
    body: 'Have you checked in today? A quick tap keeps your streak honest.',
  }
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.checkin,
      content: { title: content.title, body: content.body, data: { type: 'N-STK-01' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
        channelId: channelFor('N-STK-01'),
      },
    })
  } catch (err) {
    console.warn('Schedule N-STK-01 skipped:', err)
  }
}

export async function cancelDailyCheckinReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID.checkin).catch(() => {})
}

/** Pause-track day offsets (Registry §5): Day 3, 7, 14, 30 at 09:00 local. */
const PAUSE_OFFSETS: { code: PauseCode; day: number }[] = [
  { code: 'N-PAU-01', day: 3 },
  { code: 'N-PAU-02', day: 7 },
  { code: 'N-PAU-03', day: 14 },
  { code: 'N-PAU-04', day: 30 },
]

/**
 * Schedule the pause re-engagement track (N-PAU-01…04) at Day 3/7/14/30 of the
 * pause, 09:00 local. Fires for ALL tiers including on_demand (Decision 10).
 * Cancels any prior pause track first. Only future offsets are scheduled. Call on
 * pause; call cancelPauseNotifications() on resume/restart.
 */
export async function schedulePauseNotifications(
  userId: string,
  pausedAt: string,
  ctx: DeliveryContext,
): Promise<void> {
  await cancelPauseNotifications()
  if (!ctx.notificationsEnabled) return

  const start = parseISO(pausedAt)
  const now = Date.now()
  for (const { code, day } of PAUSE_OFFSETS) {
    const fireAt = new Date(start)
    fireAt.setDate(fireAt.getDate() + day)
    fireAt.setHours(9, 0, 0, 0)
    if (fireAt.getTime() <= now) continue

    const content = pauseContent(code, ctx.voiceStyle)
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: ID.pause(code),
        content: { title: content.title, body: content.body, data: { type: code } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: channelFor(code) },
      })
      await logQueued(userId, code, fireAt)
    } catch (err) {
      console.warn(`Schedule ${code} skipped:`, err)
    }
  }
}

export async function cancelPauseNotifications(): Promise<void> {
  for (const { code } of PAUSE_OFFSETS) {
    await Notifications.cancelScheduledNotificationAsync(ID.pause(code)).catch(() => {})
  }
}

/** First active high-confidence risk window's start hour, else null (Step 16 data). */
function riskWindowHour(riskWindows: RiskWindow[] | null | undefined): number | null {
  const w = riskWindows?.find((r) => r.active && r.confidence === 'high')
  return w ? w.start_hour : null
}

/**
 * App-open reconcile — the single idempotent entry point for local notification
 * scheduling. Reads current state and brings the OS-scheduled set in line with it:
 *
 *   - reverts an expired auto-reduce window first (so we schedule under the right tier)
 *   - PAUSED: cancel all active-user notifications; schedule only the N-PAU track
 *   - ACTIVE: schedule health milestones; daily check-in only in Stage 1–2
 *     (cancelled from Stage 3); cancel any stale pause track
 *
 * Safe to call on every launch. Best-effort: never throws into the launch path.
 */
export async function reconcileNotifications(userId: string): Promise<void> {
  try {
    await revertExpiredAutoReduce(userId)
    const ctx = await loadDeliveryContext(userId)

    const [{ data: attempt }, { data: streak }, { data: profile }] = await Promise.all([
      supabase
        .from('quit_attempts')
        .select('quit_date')
        .eq('user_id', userId)
        .is('ended_at', null)
        .maybeSingle(),
      supabase
        .from('streak_record')
        .select('streak_status, paused_at')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('profiles').select('risk_windows').eq('id', userId).maybeSingle(),
    ])

    // PAUSED: all active-user notifications suspended; only the N-PAU track fires.
    if (streak?.streak_status === 'paused') {
      await Promise.all([cancelHealthMilestoneNotifications(), cancelDailyCheckinReminder()])
      if (streak.paused_at) await schedulePauseNotifications(userId, streak.paused_at, ctx)
      return
    }

    // ACTIVE: ensure no stale pause track, then schedule active-user notifications.
    await cancelPauseNotifications()

    const quitDate = attempt?.quit_date ?? null
    await scheduleHealthMilestoneNotifications(userId, quitDate, ctx)

    // Daily check-in: Stage 1–2 only (days 1–7). Cancelled from Stage 3 on.
    const stage = deriveStage(quitDate)
    if (stage === 1 || stage === 2) {
      await scheduleDailyCheckinReminder(userId, riskWindowHour(profile?.risk_windows), ctx)
    } else {
      await cancelDailyCheckinReminder()
    }
  } catch (err) {
    console.warn('reconcileNotifications skipped:', err)
  }
}

/** Voice-style prompt (N-PROF-01) — Day 3 if voice not yet set. Exposed for the
 *  caller that knows account age; kept here for symmetry. Single neutral version. */
export async function scheduleVoiceStylePrompt(at: Date): Promise<void> {
  const content = voicePromptContent()
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.voicePrompt,
      content: { title: content.title, body: content.body, data: { type: 'N-PROF-01' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: channelFor('N-PROF-01') },
    })
  } catch (err) {
    console.warn('Schedule N-PROF-01 skipped:', err)
  }
}

export async function cancelVoiceStylePrompt(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID.voicePrompt).catch(() => {})
}

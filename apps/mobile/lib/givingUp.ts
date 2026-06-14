/**
 * Giving Up Support System (Step 18) — pure logic, copy, and device storage.
 * Spec: LastOne_Giving_Up_Support_System.md (§B2 triggers, §7 copy).
 *
 * Three-tier despair intervention, NOT a craving tool: Tier 1 = in-app
 * narrative interrupt (GU-1→4), Tier 2 = pre-briefed personal contact
 * (GU-5/6/7), Tier 3 = professional resources (GU-8). No push notifications
 * by design (§B3) — the card is only seen on app open.
 *
 * SECURITY (T-F / F-1, security constraints memory): support person's name AND
 * phone live in SecureStore ONLY — never on Supabase. The live profiles table
 * has no sos_contact_* columns (verified by probe 2026-06-13). Settings
 * PROF-09 and the SOS escalation tools reference this same single contact.
 */

import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { differenceInCalendarDays, differenceInHours, parseISO } from 'date-fns'
import type { GuTriggerCondition, VoiceStyle } from '../types/database'

// ── Support person (device-only) ─────────────────────────────────────────────

// Same keys the Settings spec names (PROF-09) — one contact, three features.
const PHONE_KEY = 'sos_contact_phone'
const NAME_KEY = 'sos_contact_name'

export interface SupportPerson {
  name: string
  phone: string // E.164-ish, e.g. +919876543210
}

export async function getSupportPerson(): Promise<SupportPerson | null> {
  const [name, phone] = await Promise.all([
    SecureStore.getItemAsync(NAME_KEY),
    SecureStore.getItemAsync(PHONE_KEY),
  ])
  // support_person_configured is DERIVED: both present (GU Spec §B1).
  return name && phone ? { name, phone } : null
}

export async function setSupportPerson(name: string, phone: string): Promise<void> {
  await SecureStore.setItemAsync(NAME_KEY, name)
  await SecureStore.setItemAsync(PHONE_KEY, phone)
}

export async function clearSupportPerson(): Promise<void> {
  await SecureStore.deleteItemAsync(NAME_KEY)
  await SecureStore.deleteItemAsync(PHONE_KEY)
}

/** Loose E.164 normalisation for Indian numbers: 10 digits → +91…; keeps an
 *  existing +country prefix. Returns null when it can't make a dialable number. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '')
  if (/^\+\d{8,15}$/.test(digits)) return digits
  if (/^\d{10}$/.test(digits)) return `+91${digits}`
  if (/^0\d{10}$/.test(digits)) return `+91${digits.slice(1)}`
  return null
}

// briefing-sent flag is device-side: the spec's profiles.support_person_briefing_sent
// column does not exist on the live DB (probe 2026-06-13) and it's informational only.
const briefingKey = (userId: string) => `gu_briefing_sent:${userId}`
export const setBriefingSent = (userId: string) => AsyncStorage.setItem(briefingKey(userId), '1')
export const getBriefingSent = async (userId: string) =>
  (await AsyncStorage.getItem(briefingKey(userId))) === '1'

/** Stage-2 one-time "set up a support person" prompt (§B2) — fires max once ever. */
const setupPromptKey = (userId: string) => `gu_setup_prompt_shown:${userId}`
export const markSetupPromptShown = (userId: string) =>
  AsyncStorage.setItem(setupPromptKey(userId), '1')
export const wasSetupPromptShown = async (userId: string) =>
  (await AsyncStorage.getItem(setupPromptKey(userId))) === '1'

// ── Tier 1 trigger evaluation (§B2) ──────────────────────────────────────────

export interface GuTriggerInput {
  stage: number
  /** COUNT of slip logs in the last 14 days (rolling_14d_slips). */
  slipsLast14d: number
  /** A slip_type='return_to_smoking' log exists within the last 48h. */
  returnToSmokingWithin48h: boolean
  /** Calendar days since streak_record.last_confirmed_date (passive disengagement,
   *  Architecture Guide Step 18 operationalisation of §B2 Condition C). */
  daysSinceLastConfirmed: number
  /** profiles.last_giving_up_trigger_at — 7-day suppression anchor. */
  lastTriggerAt: string | null
  /** profiles.giving_up_card_dismissed_count — 3-session cap. */
  dismissedCount: number
  now?: Date
}

export interface GuTriggerResult {
  show: boolean
  condition: GuTriggerCondition | null
}

/**
 * GU-1 eligibility, evaluated on app open. Stage gates (§6): Tier 1 only in
 * Stages 2–5; passive disengagement only from Stage 3. Stage 5 raises the slip
 * threshold to 4. 7-day suppression and the 3-dismissal cap override everything.
 * Condition precedence when several hold: the most acute signal wins
 * (return_to_smoking > slip_threshold > passive_disengagement).
 */
export function evaluateGuTrigger(input: GuTriggerInput): GuTriggerResult {
  const now = input.now ?? new Date()
  const none: GuTriggerResult = { show: false, condition: null }

  if (input.stage < 2) return none
  if (input.dismissedCount >= 3) return none
  if (
    input.lastTriggerAt &&
    differenceInCalendarDays(now, parseISO(input.lastTriggerAt)) < 7
  ) {
    return none
  }

  if (input.returnToSmokingWithin48h) return { show: true, condition: 'return_to_smoking' }

  const slipThreshold = input.stage >= 5 ? 4 : 3
  if (input.slipsLast14d >= slipThreshold) return { show: true, condition: 'slip_threshold' }

  if (input.stage >= 3 && input.daysSinceLastConfirmed >= 3) {
    return { show: true, condition: 'passive_disengagement' }
  }

  return none
}

/** Helper for hooks: true when a slip log timestamp is within the 48h window. */
export function isWithinHours(timestamp: string, hours: number, now: Date = new Date()): boolean {
  return differenceInHours(now, parseISO(timestamp)) < hours
}

// ── Beat 2 resistance data (§B2) ─────────────────────────────────────────────

export interface ResistanceData {
  count: number
  /** True when falling back to all-time count ("since you started" copy). */
  sinceStart: boolean
}

/** Null = skip GU-3 entirely — never show a zero (§5 GU-3 edge case). */
export function resistanceData(
  overcomeLast14d: number,
  overcomeAllTime: number,
): ResistanceData | null {
  if (overcomeLast14d > 0) return { count: overcomeLast14d, sinceStart: false }
  if (overcomeAllTime > 0) return { count: overcomeAllTime, sinceStart: true }
  return null
}

// ── Voice mapping + §7 copy (verbatim; high-sensitivity, all three voices) ───

type GuVoice = 'steady' | 'emotional' | 'light'

/** Light & Honest maps to the app's real_and_practical voice (same mapping as
 *  notificationCopy). Null/unknown → steady. */
export function guVoice(style: VoiceStyle | null): GuVoice {
  if (style === 'emotional_and_understanding') return 'emotional'
  if (style === 'real_and_practical') return 'light'
  return 'steady'
}

type VoiceCopy = Record<GuVoice, string>

export const GU_COPY = {
  triggerCard: {
    steady: 'This stretch has been hard. We noticed. Take 2 minutes?',
    emotional: "The last few days haven't been easy. We're still here. Take 2 minutes with us?",
    light: "Okay, it's been a rough patch. We've got you for 2 minutes — want to?",
  } as VoiceCopy,
  beat1: {
    steady:
      "Some stretches of quitting are just harder. That's not a character flaw. It's how quitting actually works.",
    emotional:
      "A difficult stretch doesn't mean something is wrong with you. It means quitting is genuinely hard — and you're still here.",
    light:
      "Your brain is doing its best impression of your worst enemy right now. That's normal. It doesn't mean it's winning.",
  } as VoiceCopy,
  beat2Support: {
    steady:
      "Those didn't vanish. You made it through each one. That's [X] times your instinct to quit was stronger than the urge.",
    emotional:
      "It's easy to remember the moments that were hard. These [X] moments — you got through them. Every single one.",
    light:
      "Your brain only shows you the highlight reel of bad moments. Here's the edit it left out: [X] cravings you beat without making a big deal of it.",
  } as VoiceCopy,
  beat3: {
    steady: "You don't have to decide anything right now. What feels okay for the next hour?",
    emotional: "There's no pressure here. What would feel right for you in the next little while?",
    light: 'No big decisions required. Future you can handle the rest. What works for the next hour?',
  } as VoiceCopy,
  talkSubtext: {
    steady: 'Sometimes a conversation is the right move.',
    emotional: "You don't have to sit with this alone.",
    light: 'Turns out other humans can be useful sometimes.',
  } as VoiceCopy,
  preCall: {
    steady: '[Name] knows you’re trying. Just say the word.',
    emotional: '[Name] is there. You don’t have to explain everything — just reach out.',
    light: '[Name] picked up before. They’ll pick up again.',
  } as VoiceCopy,
  resourcesIntro: {
    steady: "Sometimes it helps to talk to someone who's heard this story before.",
    emotional:
      "There are people whose job is to sit with this — and they've heard it before, without judgement.",
    light: 'Professionally trained humans exist for exactly this moment. Might as well use them.',
  } as VoiceCopy,
  setupBody: {
    steady:
      "Pick one person you trust. The app will help you tell them what you need — so if things get hard, they'll know what to do.",
    emotional:
      "Sometimes the hardest part is asking for help. Let's make that easier. Pick one person, and we'll give them a heads-up on how to show up for you.",
    light:
      "Pick someone who won't immediately suggest you just 'have willpower.' We'll send them a quick brief on actually being helpful.",
  } as VoiceCopy,
} as const

/** GU-3 data line: same in all voices; only the framing copy varies (§7). */
export function beat2Lines(
  voice: GuVoice,
  data: ResistanceData,
): { headline: string; support: string } {
  const headline = data.sinceStart
    ? `Since you started, you resisted ${data.count} cravings.`
    : `In the last 14 days, you resisted ${data.count} cravings.`
  return { headline, support: GU_COPY.beat2Support[voice].replace(/\[X\]/g, String(data.count)) }
}

// ── Tier 3 resources (GU-8) ──────────────────────────────────────────────────

// ⚠ PRE-SHIP (spec §5 GU-8 vetting note + security constraints memory): these
// numbers are the spec's suggested starting points and MUST be live-tested and
// team-verified before release. Structure ships; numbers are provisional.
export interface ResourceCard {
  id: 'tobacco_quitline' | 'emotional_support'
  organisation: string
  description: string
  phone: string
  phoneDisplay: string
}

export const RESOURCE_CARDS: ResourceCard[] = [
  {
    id: 'tobacco_quitline',
    organisation: 'National Tobacco Quitline (MoHFW)',
    description: 'Trained counsellors specifically for tobacco and smoking cessation. Free, confidential.',
    phone: '18001122356',
    phoneDisplay: '1800-112-356',
  },
  {
    id: 'emotional_support',
    organisation: 'iCall (TISS)',
    description:
      "If the weight of this moment is about more than smoking — stress, anxiety, feeling overwhelmed — trained counsellors are available.",
    phone: '+919152987821',
    phoneDisplay: '+91 91529 87821',
  },
]

// ── Briefing message (GU-10, §5 draft copy — operational, content review pre-ship) ──

export function briefingMessage(contactName: string): string {
  return (
    `Hey ${contactName} — I'm using an app called LastOne to quit smoking. ` +
    `I've set you as my support person, which means if I'm having a really rough moment, I might send you a message or give you a quick call.\n\n` +
    `You don't need to do anything right now, and you don't need to have any answers. If I reach out, I'm not looking for advice on whether to quit — I've already decided that. I just need someone to be on the other end for a few minutes.\n\n` +
    `The most helpful thing you can do is just listen and say something like "I'm here" or "that sounds hard." You don't need to fix anything.\n\n` +
    `Thanks for being in my corner.`
  )
}

// ── Deep links ───────────────────────────────────────────────────────────────

export const telUrl = (phone: string) => `tel:${phone}`
export const smsUrl = (phone: string, body?: string) =>
  body ? `sms:${phone}?body=${encodeURIComponent(body)}` : `sms:${phone}`
/** wa.me works whether or not WhatsApp is the default handler; strips '+'. */
export const whatsappUrl = (phone: string, text?: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`

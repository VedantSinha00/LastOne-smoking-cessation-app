/**
 * Settings & Profile (Step 20) — static option lists + copy (Settings Spec §5, §7).
 * Pure data; the screens render these and write via useSettings.
 */

import type { NotificationTier, RelatableCategory, VoiceStyle } from '../types/database'

// PROF-06 — voice style picker (§5 Flow 5 example lines + §7 sublabels).
export const VOICE_OPTIONS: {
  value: VoiceStyle
  label: string
  sublabel: string
  example: string
}[] = [
  {
    value: 'steady_and_direct',
    label: 'Steady & Direct',
    sublabel: 'Short. Confident. No fluff.',
    example: "The craving is here. It'll pass. You know what to do.",
  },
  {
    value: 'emotional_and_understanding',
    label: 'Warm & Grounding',
    sublabel: 'Empathetic. Acknowledges the hard moments.',
    example: "This is a hard moment, and that's okay. Take a breath.",
  },
  {
    value: 'real_and_practical',
    label: 'Light & Honest',
    sublabel: 'A touch of humour. Self-aware.',
    example: "Your brain is being dramatic. Give it 3 minutes and it'll get bored.",
  },
]

// PROF-07 — spending category picker (§5 Flow 6 descriptions).
export const CATEGORY_OPTIONS: {
  value: RelatableCategory
  label: string
  description: string
}[] = [
  { value: 'food_delivery', label: 'Food Delivery', description: 'Zomato orders, chai runs, canteen meals' },
  { value: 'movies_ott', label: 'Movies & OTT', description: 'Movie tickets, streaming subscriptions' },
  { value: 'music_podcasts', label: 'Music & Podcasts', description: 'Spotify, headphones, earphones' },
  { value: 'travel', label: 'Travel', description: 'Bus/train tickets, Ola/Uber rides' },
  { value: 'gaming', label: 'Gaming', description: 'In-app purchases, gaming gear' },
  { value: 'clothes_shopping', label: 'Clothes & Shopping', description: 'Outfits, shoes, accessories' },
]

// PROF-10 — notification frequency tiers (§5 Flow 9). once_daily intentionally absent.
export const TIER_OPTIONS: { value: NotificationTier; label: string }[] = [
  { value: 'app_decides', label: 'App Decides' },
  { value: 'few_daily', label: 'Few Daily' },
  { value: 'on_demand', label: 'On Demand' },
]

export function voiceLabel(style: VoiceStyle | null): string {
  return VOICE_OPTIONS.find((o) => o.value === style)?.label ?? 'Not set'
}

export function categoryLabel(cat: RelatableCategory | null): string {
  return CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? 'Not set'
}

export function tierLabel(tier: NotificationTier | null): string {
  return TIER_OPTIONS.find((o) => o.value === tier)?.label ?? 'App Decides'
}

/** 'HH:MM:SS' (or 'HH:MM') → "11:00 PM" display. */
export function formatTime(hms: string | null): string {
  if (!hms) return '—'
  const [h, m] = hms.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export const DELETE_CONFIRM_WORD = 'DELETE'

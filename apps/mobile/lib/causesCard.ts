/**
 * Causes Card (GOAL-11) — eligibility, NGO rotation, and copy.
 * Personal Goals Spec §7 (copy), §B2 (eligibility + rotation).
 *
 * Awareness only — no donation flow. 'Learn more' opens the NGO site externally.
 *
 * ⚠ PRE-SHIP (security constraints): NGO URLs below are working selections and
 * MUST be team-verified before release. If an NGO is replaced, its descriptor
 * and both copy variants must be rewritten (structure/rotation unaffected).
 */

import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { NgoId, VoiceStyle } from '../types/database'

export const NGO_ROTATION: NgoId[] = ['CFI', 'CPAA', 'CanSupport']

/** Causes Cards author only two voices (Spec §3): Light & Honest is excluded;
 *  real_and_practical falls back to Steady & Direct (§7.3). */
export type CausesVoice = 'emotional' | 'steady'

export function causesVoice(style: VoiceStyle | null): CausesVoice {
  return style === 'emotional_and_understanding' ? 'emotional' : 'steady'
}

interface NgoInfo {
  name: string
  /** One-line descriptor shown under the name on every card (§7.1). */
  descriptor: string
  /** ⚠ unverified — team must confirm URL + destination (donate vs about) pre-ship. */
  url: string
}

export const NGO_INFO: Record<NgoId, NgoInfo> = {
  CFI: {
    name: 'Cancer Foundation of India',
    descriptor: 'Working on tobacco control and cancer prevention across India since 2002.',
    url: 'https://www.cancerfoundationofindia.org',
  },
  CPAA: {
    name: 'Cancer Patients Aid Association',
    descriptor:
      'Providing free treatment support, medicines, and rehabilitation to cancer patients across India since 1969.',
    url: 'https://www.cancer.org.in',
  },
  CanSupport: {
    name: 'CanSupport',
    descriptor:
      "Running India's largest free home-based palliative care program for cancer patients since 1996.",
    url: 'https://www.cansupport.org',
  },
}

// §7.2 — card copy. ₹[X] token replaced with total_saved at render. CFI's
// emotional voice has two authored variants (Prompts 1 and 7); impressionCount
// alternates them so repeat viewers don't see identical copy.
const CARD_COPY: Record<NgoId, Record<CausesVoice, string[]>> = {
  CFI: {
    emotional: [
      "You've saved ₹[X]. The Cancer Foundation of India has worked on tobacco control and cancer prevention across the country since 2002. Here's their work, if you'd like to take a look.",
      "₹[X] saved. The Cancer Foundation of India pushes for stronger tobacco laws and runs prevention programmes across the country. Worth knowing who's doing the ground work.",
    ],
    steady: [
      '₹[X] saved. Cancer Foundation of India — tobacco control and cancer prevention work across India since 2002. Link below.',
    ],
  },
  CPAA: {
    emotional: [
      "You've saved ₹[X]. CPAA has been helping underprivileged cancer patients access free treatment and medicines for over 55 years. Worth knowing they exist.",
    ],
    steady: [
      '₹[X] saved. CPAA gives underprivileged cancer patients access to free treatment, medicines, and rehabilitation. 55 years of this work across India. Link below.',
    ],
  },
  CanSupport: {
    emotional: [
      "You've saved ₹[X]. CanSupport sends doctors, nurses, and counsellors to cancer patients' homes — free of charge — across six states. Here's their story.",
    ],
    steady: [
      "₹[X] saved. CanSupport runs India's largest free home-based palliative care program — medical and emotional support, delivered at home. Link below.",
    ],
  },
}

/** Rotation index = COUNT(causes_card_log rows for user) % 3 (§B2). */
export function ngoForImpressionCount(impressionCount: number): NgoId {
  return NGO_ROTATION[impressionCount % NGO_ROTATION.length]
}

/**
 * Eligibility (§B2) — checked on every app open. All three must hold:
 * stage ≥ 3, total_saved > 0, and ≥14 days since the last impression (no
 * prior impression counts as eligible). Absence does NOT reset the interval.
 */
export function causesCardEligible(
  stage: number,
  totalSavedPaise: number,
  lastShownAt: string | null,
  now: Date = new Date(),
): boolean {
  if (stage < 3) return false
  if (totalSavedPaise <= 0) return false
  if (!lastShownAt) return true
  return differenceInCalendarDays(now, parseISO(lastShownAt)) >= 14
}

export interface CausesCardContent {
  ngoId: NgoId
  name: string
  descriptor: string
  url: string
  body: string
}

export function causesCardContent(
  ngoId: NgoId,
  voice: CausesVoice,
  savedLabel: string,
  impressionCount: number,
): CausesCardContent {
  const variants = CARD_COPY[ngoId][voice]
  const body = variants[impressionCount % variants.length].replace('₹[X]', savedLabel)
  const info = NGO_INFO[ngoId]
  return { ngoId, name: info.name, descriptor: info.descriptor, url: info.url, body }
}

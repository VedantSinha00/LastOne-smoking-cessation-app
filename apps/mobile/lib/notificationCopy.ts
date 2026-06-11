import type { NotificationType, VoiceStyle } from '../types/database'

/**
 * Notification copy — verbatim from LastOne_Notifications_Spec_V1_2 §7.
 *
 * Scope: the LOCALLY-scheduled notifications (Step 15, local-only build):
 *   - N-CON-01…12  health milestones (high-sensitivity, 3 voice variants)
 *   - N-PAU-01…04  pause re-engagement (2 variants: S&D + E&U; title + body)
 *   - N-PROF-01    voice-style prompt (single neutral version)
 *
 * Server-delivered copy (N-INS-*, N-GOAL-*) lives with the Edge Functions and is
 * out of scope until push credentials exist (Step 21). N-STK-01/02/03 and N-OB-*
 * copy is owned by their source specs; this module carries only what Step 15
 * schedules locally that isn't already wired elsewhere.
 *
 * Voice fallback: when profiles.voice_style is null (collected later, Day-3 prompt
 * or Settings — Onboarding §B7), fall back to steady_and_direct. Matches the
 * Insights spec's documented fallback for unset voice styles.
 */

const FALLBACK_VOICE: VoiceStyle = 'steady_and_direct'

export interface NotificationContent {
  title: string
  body: string
}

/** Title shown for milestone + prompt notifications that lead with a single line. */
const APP_TITLE = 'LastOne'

// ── N-CON-01…12 — Health milestones (§7, 3 voice variants each) ──────────────
// Body leads with the time anchor so it stands alone on the lock screen; tapping
// opens the full card (YB-01…12, Content Cards spec). Max 12 words per spec.

type HealthMilestoneCode =
  | 'N-CON-01' | 'N-CON-02' | 'N-CON-03' | 'N-CON-04' | 'N-CON-05' | 'N-CON-06'
  | 'N-CON-07' | 'N-CON-08' | 'N-CON-09' | 'N-CON-10' | 'N-CON-11' | 'N-CON-12'

const HEALTH_MILESTONE_COPY: Record<HealthMilestoneCode, Record<VoiceStyle, string>> = {
  'N-CON-01': {
    steady_and_direct: '20 minutes in. Your heart rate has already dropped.',
    emotional_and_understanding: "20 minutes. Small start — your heart's already responding.",
    real_and_practical: '20 minutes smoke-free. Heart rate down, blood pressure falling now.',
  },
  'N-CON-02': {
    steady_and_direct: '8 hours. Carbon monoxide is clearing out of your blood.',
    emotional_and_understanding: '8 hours done. Your blood is already clearing the carbon monoxide.',
    real_and_practical: '8 hours smoke-free. Carbon monoxide dropping; haemoglobin carrying oxygen again.',
  },
  'N-CON-03': {
    steady_and_direct: '12 hours. Carbon monoxide is back to normal levels.',
    emotional_and_understanding: "12 hours in. Your blood's carrying oxygen properly again.",
    real_and_practical: '12 hours smoke-free. CO normalised; haemoglobin at full oxygen capacity.',
  },
  'N-CON-04': {
    steady_and_direct: '24 hours. One smoke-free day. Heart attack risk already down.',
    emotional_and_understanding: "One full day smoke-free. That's real — and your heart knows.",
    real_and_practical: '24 hours smoke-free. Risk of a cardiac event measurably lower.',
  },
  'N-CON-05': {
    steady_and_direct: '48 hours. Nicotine is completely out of your body now.',
    emotional_and_understanding: "48 hours. The nicotine's gone — smell and taste start returning.",
    real_and_practical: '48 hours smoke-free. Nicotine fully cleared; smell and taste recovering.',
  },
  'N-CON-06': {
    steady_and_direct: '72 hours. The hardest stretch — and your lungs are opening up.',
    emotional_and_understanding: "72 hours. This part's hard. It peaks here, then it drops.",
    real_and_practical: '72 hours smoke-free. Withdrawal peaks now, then eases. Lungs already recovering.',
  },
  'N-CON-07': {
    steady_and_direct: 'One week. Peak withdrawal is behind you now.',
    emotional_and_understanding: 'One week smoke-free. The worst of withdrawal is behind you.',
    real_and_practical: 'One week smoke-free. Nicotine receptors returning to a normal count.',
  },
  'N-CON-08': {
    steady_and_direct: 'Two weeks. Blood is reaching your hands and feet better.',
    emotional_and_understanding: "Two weeks smoke-free. Your circulation's noticeably better than Day 1.",
    real_and_practical: 'Two weeks smoke-free. Circulation improved; lung function up since Day 1.',
  },
  'N-CON-09': {
    steady_and_direct: 'One month. The cilia in your airways are working again.',
    emotional_and_understanding: 'One month smoke-free. Your lungs are cleaning themselves out again.',
    real_and_practical: 'One month smoke-free. Airway cilia regrown, clearing debris properly again.',
  },
  'N-CON-10': {
    steady_and_direct: 'Three months. Your lung function is significantly stronger now.',
    emotional_and_understanding: 'Three months smoke-free. Breathing and energy genuinely feel different now.',
    real_and_practical: 'Three months smoke-free. Coughing and breathlessness a fraction of Day 1.',
  },
  'N-CON-11': {
    steady_and_direct: "One year smoke-free. Your heart disease risk is now half a smoker's.",
    emotional_and_understanding: "One year smoke-free. A whole year you chose this. Your heart's safer.",
    real_and_practical: 'One year smoke-free. Coronary heart disease risk now halved versus a smoker.',
  },
  'N-CON-12': {
    steady_and_direct: 'Five years smoke-free. Your stroke risk is near someone who never smoked.',
    emotional_and_understanding: "Five years. That's a different life now — stroke risk near a non-smoker's.",
    real_and_practical: "Five years smoke-free. Stroke risk now approaches a never-smoker's baseline.",
  },
}

// ── N-PAU-01…04 — Pause re-engagement (§7, title + body) ─────────────────────
// 2 voice variants only (S&D + E&U); real_and_practical deferred → falls back to
// steady_and_direct. Low-sensitivity framing: calm, no guilt, no false cheer.

type PauseCode = 'N-PAU-01' | 'N-PAU-02' | 'N-PAU-03' | 'N-PAU-04'

const PAUSE_COPY: Record<PauseCode, Partial<Record<VoiceStyle, NotificationContent>>> = {
  'N-PAU-01': {
    steady_and_direct: {
      title: 'Still with you.',
      body: "Your quit journey is paused. Everything's saved — come back when you're ready.",
    },
    emotional_and_understanding: {
      title: 'Take your time.',
      body: "Stepping back takes courage too. We're here whenever you're ready.",
    },
  },
  'N-PAU-02': {
    steady_and_direct: {
      title: 'One week paused.',
      body: 'Your progress is saved. Whenever you’re ready, your journey picks up where you left off.',
    },
    emotional_and_understanding: {
      title: 'A week in.',
      body: "It's okay to need more time. Your journey is waiting — no judgement, whenever you're ready.",
    },
  },
  'N-PAU-03': {
    steady_and_direct: {
      title: 'Last check-in for now.',
      body: "We'll give you space from here. Everything's saved and ready when you are.",
    },
    emotional_and_understanding: {
      title: "We'll stop nudging you.",
      body: "We don't want to pressure you. Your journey is here — come back in your own time.",
    },
  },
  'N-PAU-04': {
    steady_and_direct: {
      title: 'One last check-in.',
      body: "It's been a month. Ready to try again? Your journey is one tap away.",
    },
    emotional_and_understanding: {
      title: 'Still thinking of you.',
      body: "A month is a long time to hold onto this. Whenever you're ready — even if it's not today — we're here.",
    },
  },
}

// ── N-PROF-01 — Voice style prompt (§7, single neutral version) ──────────────

const VOICE_PROMPT_COPY: NotificationContent = {
  title: 'How should LastOne talk to you?',
  body: 'Pick how LastOne talks to you — ten seconds in Settings.',
}

/** Resolve a voice_style to a concrete variant, falling back per spec. */
export function resolveVoice(voice: VoiceStyle | null | undefined): VoiceStyle {
  return voice ?? FALLBACK_VOICE
}

/** Copy for a health milestone (N-CON-01…12), voice-matched. */
export function healthMilestoneContent(
  code: HealthMilestoneCode,
  voice: VoiceStyle | null | undefined,
): NotificationContent {
  return { title: APP_TITLE, body: HEALTH_MILESTONE_COPY[code][resolveVoice(voice)] }
}

/** Copy for a pause re-engagement notification (N-PAU-01…04), voice-matched. */
export function pauseContent(
  code: PauseCode,
  voice: VoiceStyle | null | undefined,
): NotificationContent {
  const byVoice = PAUSE_COPY[code]
  // Only S&D + E&U are authored; real_and_practical is deferred (§7). A user on
  // R&P (or unset voice) therefore resolves to the S&D variant.
  return byVoice[resolveVoice(voice)] ?? byVoice[FALLBACK_VOICE]!
}

/** Copy for the voice-style prompt (N-PROF-01) — single version, no variants. */
export function voicePromptContent(): NotificationContent {
  return VOICE_PROMPT_COPY
}

export type { HealthMilestoneCode, PauseCode }

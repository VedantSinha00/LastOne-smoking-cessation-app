/**
 * Mini-Games (Step 19) — pure logic + copy. No React, no I/O.
 * Spec: LastOne_MiniGames_FeatureSpec.md (§5 flows, §7 copy, §B2 logic).
 *
 * Tool IDs for score writes are the spec's game-type values
 * ('memory_1p' | 'echo_tap' | 'memory_2p'), each an independent tool_score
 * entry in the coping system.
 */

import type { GameReflection, GameType, VoiceStyle } from '../types/database'

// ── Memory grid generation (Flow 3 / §B2) ────────────────────────────────────

export const GRID_PAIRS: Record<'3x4' | '4x4', number> = { '3x4': 6, '4x4': 8 }

export interface MemoryCard {
  /** Position id 0..n-1 — match is by faceId, identity by this (§8 image-bug fallback). */
  id: number
  /** 0..pairs-1; two cards share a faceId. */
  faceId: number
}

/**
 * Build a shuffled deck for a grid. faceId pairs are duplicated then
 * Fisher–Yates shuffled; id is the final position so equality checks never
 * depend on the rendered glyph (§8 — match by position/faceId, not image).
 */
export function generateGrid(grid: '3x4' | '4x4', rng: () => number = Math.random): MemoryCard[] {
  const pairs = GRID_PAIRS[grid]
  const faces: number[] = []
  for (let f = 0; f < pairs; f++) faces.push(f, f)
  for (let i = faces.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[faces[i], faces[j]] = [faces[j], faces[i]]
  }
  return faces.map((faceId, id) => ({ id, faceId }))
}

// Generic emoji face set (≥8 distinct). Themed faces handled separately (§B2).
export const GENERIC_FACES = ['🍋', '🚀', '🎧', '⚽', '🎲', '🌸', '🔑', '⭐', '🍀', '🎸']
export const THEMED_FACES = ['💪', '🌅', '🫁', '💰', '🎯', '🧠', '🏃', '✨']

export function faceGlyph(faceId: number, skin: 'generic' | 'themed'): string {
  const set = skin === 'themed' ? THEMED_FACES : GENERIC_FACES
  return set[faceId % set.length]
}

// ── Echo Tap sequence logic (Flow 4 / §B2) ───────────────────────────────────

export const ECHO_ZONES = 4 // four tap zones, values 0..3
export const ECHO_MIN_LENGTH = 2

/** A fresh sequence of the given length, each step a zone 0..3. */
export function generateSequence(length: number, rng: () => number = Math.random): number[] {
  return Array.from({ length }, () => Math.floor(rng() * ECHO_ZONES))
}

/**
 * Result of grading one full attempt (§B2): order-only correctness. Next length
 * grows by 1 on a perfect match, shrinks by 1 (floor 2) otherwise. No ceiling.
 */
export function gradeEchoAttempt(
  sequence: number[],
  taps: number[],
): { correct: boolean; nextLength: number } {
  const correct =
    taps.length === sequence.length && sequence.every((zone, i) => taps[i] === zone)
  const nextLength = correct
    ? sequence.length + 1
    : Math.max(ECHO_MIN_LENGTH, sequence.length - 1)
  return { correct, nextLength }
}

// ── Reflection → tool score (§B2) ────────────────────────────────────────────

/**
 * 'passed'/'partial' → +1 successful_resistance; 'ongoing'/null → no change.
 * Returned as the delta for increment_tool_score (Architecture Guide §19).
 */
export function reflectionScoreDelta(response: GameReflection | null): number {
  return response === 'passed' || response === 'partial' ? 1 : 0
}

// ── Streak milestones (§7 / B3) ──────────────────────────────────────────────

export const STREAK_MILESTONES = [3, 7, 14, 30] as const
export type StreakMilestone = (typeof STREAK_MILESTONES)[number]

export function isStreakMilestone(streak: number): streak is StreakMilestone {
  return (STREAK_MILESTONES as readonly number[]).includes(streak)
}

// ── Voice + copy (§7) ────────────────────────────────────────────────────────

type GameVoice = 'steady' | 'emotional' | 'light'

export function gameVoice(style: VoiceStyle | null): GameVoice {
  if (style === 'emotional_and_understanding') return 'emotional'
  if (style === 'real_and_practical') return 'light'
  return 'steady'
}

type VoiceCopy = Record<GameVoice, string>

// §7 high-sensitivity copy (craving prompt + reflection), verbatim.
export const GAME_COPY = {
  cravingQuestion: {
    steady: 'Craving hitting right now?',
    emotional: 'Are you playing because of a craving?',
    light: 'Brain being annoying right now?',
  } as VoiceCopy,
  cravingYes: {
    steady: "Yes — let's deal with it.",
    emotional: 'Yes, I need a distraction.',
    light: 'Yeah, shut it up.',
  } as VoiceCopy,
  cravingNo: {
    steady: 'No — just playing.',
    emotional: 'No, just here for fun.',
    light: 'Nope, just bored.',
  } as VoiceCopy,
  reflectQuestion: {
    steady: 'Craving still there?',
    emotional: 'How are you feeling now?',
    light: 'Did the craving get the memo?',
  } as VoiceCopy,
  reflectPassed: {
    steady: 'It passed.',
    emotional: "Yes, I'm feeling better.",
    light: 'Gone. See ya.',
  } as VoiceCopy,
  reflectPartial: {
    steady: 'Getting there.',
    emotional: 'Not fully, but better.',
    light: 'Fading, slowly.',
  } as VoiceCopy,
  reflectOngoing: {
    steady: "Still there. That's okay.",
    emotional: 'Still going. It will pass.',
    light: 'Still here. Annoying, right?',
  } as VoiceCopy,
  reengageNudge: {
    steady: "You've used games to get through cravings before. They're still here.",
    emotional: "It's been a few days. Games helped you before — they're still there if you need them.",
    light: 'The games are starting to wonder where you went. Just saying.',
  } as VoiceCopy,
} as const

/** Streak-milestone push copy (§7), keyed by milestone day. */
export const STREAK_MILESTONE_COPY: Record<StreakMilestone, VoiceCopy> = {
  3: {
    steady: '3 cravings in a row, handled with a game. That’s a streak worth keeping.',
    emotional:
      'Three days of reaching for something other than a cigarette. That matters more than it sounds.',
    light: '3-day game streak. Your brain tried it, your hands cooperated. Keep going.',
  },
  7: {
    steady: 'A week of fighting cravings with games. The habit is shifting.',
    emotional: "Seven days. You've been showing up for yourself, one craving at a time.",
    light: 'One week streak. At this point the game is basically your craving’s nemesis.',
  },
  14: {
    steady: '14 days. This is no longer a coincidence — it’s a pattern.',
    emotional: 'Two weeks of choosing differently in hard moments. That’s real.',
    light: '14-day streak. Your cravings must be exhausted by now.',
  },
  30: {
    steady: '30 days. You built a new reflex. That’s the whole point.',
    emotional:
      'A month of meeting your cravings with something better. You’ve come a long way from Day 1.',
    light: '30 days. The craving shows up, you open a game, the craving sulks away. Honestly, respect.',
  },
}

// ── Low-sensitivity labels (§7 neutral-warm) ─────────────────────────────────

export const GAME_LABELS: Record<GameType, { name: string; blurb: string }> = {
  memory_1p: { name: 'Memory Game', blurb: 'Flip cards. Find pairs. Good for a busy brain.' },
  echo_tap: { name: 'Echo Tap', blurb: 'Listen, remember, tap it back. Gets harder as you go.' },
  memory_2p: { name: 'Memory — 2 Players', blurb: 'Take turns. Find more pairs than your friend.' },
}

export function reflectionLabel(voice: GameVoice, response: GameReflection): string {
  if (response === 'passed') return GAME_COPY.reflectPassed[voice]
  if (response === 'partial') return GAME_COPY.reflectPartial[voice]
  return GAME_COPY.reflectOngoing[voice]
}

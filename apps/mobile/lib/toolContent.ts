/**
 * Per-tool "How it works" + "Steps" copy for the tool intro screen
 * (ToolIntroScreen). Ported from the Lovable design's tools.ts (which hardcodes
 * this content per tool) — our coping_tools table has no such columns, so this
 * lives in code, keyed by data_model_id. Added family-by-family as we build each
 * family's intro page.
 *
 * Best for / Context / Used-by-you are NOT here — those derive from real data
 * (intensity range, context[], user_tool_scores.total_uses).
 */
export interface ToolContent {
  howItWorks: string
  steps: string[]
}

export const TOOL_CONTENT: Record<string, ToolContent> = {
  // ── Breathing ──────────────────────────────────────────────────────────────
  box_breathing: {
    howItWorks:
      'In for 4, hold for 4, out for 4, hold for 4. Activates the parasympathetic nervous system. Used by athletes and surgeons under pressure.',
    steps: ['Breathe in for 4 counts', 'Hold for 4 counts', 'Breathe out for 4 counts', 'Hold for 4. Repeat 4×.'],
  },
  reset_478: {
    howItWorks: 'Inhale 4, hold 7, exhale 8. Slows heart rate quickly and drops cortisol.',
    steps: ['Inhale through nose for 4', 'Hold breath for 7', 'Exhale through mouth for 8', 'Repeat 4×.'],
  },
  physiological_sigh: {
    howItWorks:
      'Double inhale through the nose, long exhale through the mouth. Fastest known way to reduce stress in real time.',
    steps: ['Inhale fully through nose', 'Top up with a short second inhale', 'Long slow exhale through mouth', 'Repeat 3-5×.'],
  },
  grounding_555: {
    howItWorks: 'A grounding pattern for calm moments, not SOS. Builds breath awareness over time.',
    steps: ['Inhale 5', 'Hold 5', 'Exhale 5', 'Repeat 5×.'],
  },

  // ── Physical ───────────────────────────────────────────────────────────────
  finger_pulse: {
    howItWorks: 'Pressing pulse points activates a vagal response that lowers craving intensity.',
    steps: ['Press thumb on inside of wrist', 'Hold firm 20s', 'Switch wrist', 'Hold 20s.'],
  },
  tongue_press: {
    howItWorks: 'Press tongue to roof of mouth — discreet way to interrupt the urge loop.',
    steps: ['Press tongue firmly to roof of mouth', 'Hold 30s', 'Release', 'Repeat 1×.'],
  },
  pushups: {
    howItWorks: 'Hard burst of exertion floods the system with endorphins and breaks the craving.',
    steps: ['Drop down', '10 push-ups', 'Stand up', 'Breathe.'],
  },
  squat_jumps: {
    howItWorks: 'Explosive movement quickly resets the nervous system and crushes a craving.',
    steps: ['Stand feet shoulder-width', '10 squat jumps', 'Stand', 'Breathe.'],
  },

  // ── Mini-games ─────────────────────────────────────────────────────────────
  echo_tap: {
    howItWorks: 'Tap-along pattern game. Distracts the mind for the 3-minute craving peak.',
    steps: ['Tap each circle as it appears', 'Match the rhythm', 'Play 2 rounds.'],
  },
  memory_1p: {
    howItWorks: 'Classic memory pairs. Engages working memory long enough for the craving to pass.',
    steps: ['Flip two cards', 'Find matches', 'Clear the board.'],
  },
  memory_2p: {
    howItWorks: 'Pass-and-play with a friend. Turns a craving moment into a social moment.',
    steps: ['Open with a friend', 'Take turns', 'Best of 3.'],
  },
  find_match_2p: {
    howItWorks: 'Pass-and-play with a friend. Turns a craving moment into a social moment.',
    steps: ['Open with a friend', 'Take turns', 'Best of 3.'],
  },

  // ── Reframe ────────────────────────────────────────────────────────────────
  urge_surfing: {
    howItWorks: 'Observe the craving like a wave instead of fighting it. Reframes the urge as temporary.',
    steps: ['Notice the urge', 'Describe its shape and intensity', 'Watch it rise and fall', 'Let it pass.'],
  },
  future_self_letter: {
    howItWorks:
      'Write a short note from your 1-year-smoke-free self. Shifts identity from smoker to ex-smoker.',
    steps: ['Picture yourself in 1 year', "Write 3 lines they'd tell you", 'Re-read out loud.'],
  },
  cost_reframe: {
    howItWorks: 'Translate this cigarette into what the money/time actually buys. Breaks autopilot.',
    steps: ['Estimate cost of this pack', 'Picture what that buys this week', 'Choose: pack or that.'],
  },
  name_the_trigger: {
    howItWorks: 'Label the trigger out loud — stress, boredom, social, after-meal. Naming reduces its grip.',
    steps: ['Pause', 'Ask: what triggered this?', 'Name it in one word', 'Move on.'],
  },
}

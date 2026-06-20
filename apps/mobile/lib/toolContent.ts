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
}

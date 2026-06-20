/**
 * Health recovery milestones grouped into the design's staged timeline
 * (Stage 1 / 2 / 3+), each offset in hours from quit_date. Drives both the Home
 * countdown card (next unearned milestone) and the full staged accordion screen
 * (STK-8). Unlocked/locked state is derived from hours-since-quit — real, from
 * the user's actual quit date, not mock.
 *
 * Offsets are kept in sync with the YB card set (Content Cards spec) — same
 * source the prior Home card used. Extend/replace here as the YB set firms up.
 */

export interface Milestone {
  name: string
  offsetHours: number
}

export interface MilestoneStage {
  /** "Stage 1" etc. */
  name: string
  /** "First 72 Hours" etc. */
  range: string
  milestones: Milestone[]
}

export const MILESTONE_STAGES: MilestoneStage[] = [
  {
    name: 'Stage 1',
    range: 'First 72 Hours',
    milestones: [
      { name: 'Heart rate normalises', offsetHours: 0.33 }, // ~20 min
      { name: 'Carbon monoxide clears', offsetHours: 12 },
      { name: 'Oxygen levels rising', offsetHours: 24 },
      { name: 'Nicotine leaves your body', offsetHours: 72 },
    ],
  },
  {
    name: 'Stage 2',
    range: 'Days 4–7',
    milestones: [
      { name: 'Taste & smell sharpen', offsetHours: 4 * 24 },
      { name: 'Breathing becomes easier', offsetHours: 5 * 24 },
      { name: 'Energy levels climbing', offsetHours: 7 * 24 },
    ],
  },
  {
    name: 'Stage 3',
    range: 'Weeks 2–3',
    milestones: [
      { name: 'Blood pressure normalising', offsetHours: 10 * 24 },
      { name: 'Cilia in lungs regenerating', offsetHours: 14 * 24 },
      { name: 'Circulation improving', offsetHours: 18 * 24 },
      { name: 'Lung capacity increasing', offsetHours: 21 * 24 },
    ],
  },
]

/** Flat, time-ordered list — used for the Home "next milestone" countdown. */
export const ALL_MILESTONES: Milestone[] = MILESTONE_STAGES.flatMap((s) => s.milestones).sort(
  (a, b) => a.offsetHours - b.offsetHours,
)

/** The next unearned milestone given hours since quit, or null if all earned. */
export function nextMilestone(hoursSinceQuit: number): Milestone | null {
  return ALL_MILESTONES.find((m) => m.offsetHours > hoursSinceQuit) ?? null
}

import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { useStage } from './useStage'
import {
  dismissOccasion,
  findActiveOccasion,
  occasionCopy,
  type ActiveOccasion,
} from '../lib/occasions'

export interface OccasionNudgeState {
  occasion: ActiveOccasion | null
  /** Card body — goal-contextual when a nearest goal name is supplied. */
  copy: string | null
  dismiss: () => void
}

/**
 * Occasion nudge card state for GOAL-01 (Spec §B2). Re-checks the calendar
 * every time the screen focuses ("check on every app open" — the Goals
 * dashboard is the only V1 surface). Stage 0 returns nothing, dismissal is
 * per-occasion per-calendar-year. dateOfBirth is always null in V1 (profiles
 * has no DOB column) — birthday nudge silently skips per §8.7.
 */
export function useOccasionNudge(
  savedLabel: string,
  nearestGoalName: string | null,
): OccasionNudgeState {
  const { stage, isLoading } = useStage()
  const [occasion, setOccasion] = useState<ActiveOccasion | null>(null)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      if (!isLoading) {
        findActiveOccasion(stage, null).then((occ) => {
          if (!cancelled) setOccasion(occ)
        })
      }
      return () => {
        cancelled = true
      }
    }, [stage, isLoading]),
  )

  return {
    occasion,
    copy: occasion ? occasionCopy(occasion, savedLabel, nearestGoalName) : null,
    dismiss: () => {
      if (!occasion) return
      dismissOccasion(occasion)
      setOccasion(null)
    },
  }
}

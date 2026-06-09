import { useCurrentAttempt } from './useCurrentAttempt'
import { deriveStage, daysSinceQuit, type Stage } from '../lib/stage'

export interface StageInfo {
  stage: Stage
  daysSinceQuit: number
  /** True in Stage 0: no quit date set, or quit day not yet reached. */
  isPreQuit: boolean
  quitDate: string | null
  /** Underlying attempt query is still loading. */
  isLoading: boolean
}

/**
 * Derived recovery stage for the current quit attempt (Architecture Guide §8.2).
 * Reads the open quit_attempts row (ended_at IS NULL) and computes stage +
 * days-since-quit from its quit_date.
 */
export function useStage(): StageInfo {
  const { data: attempt, isLoading } = useCurrentAttempt()
  const quitDate = attempt?.quit_date ?? null
  const stage = deriveStage(quitDate)

  return {
    stage,
    daysSinceQuit: daysSinceQuit(quitDate),
    isPreQuit: stage === 0,
    quitDate,
    isLoading,
  }
}

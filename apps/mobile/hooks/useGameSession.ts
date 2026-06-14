import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useStage } from './useStage'
import { useGameStreak } from './useGameStreak'
import { supabase } from '../lib/supabase'
import { updateToolScore } from '../lib/sos'
import { reflectionScoreDelta } from '../lib/games'
import type {
  Database,
  GameReflection,
  GameType,
  GameSessionType,
} from '../types/database'

type GameSessionInsert = Database['public']['Tables']['game_session']['Insert']

/** Game-specific result fields the caller fills (the rest is filled by the hook). */
export type GameResult = Pick<
  GameSessionInsert,
  | 'grid_size'
  | 'card_skin'
  | 'pairs_matched'
  | 'time_taken_seconds'
  | 'sequences_completed'
  | 'longest_streak'
  | 'player1_score'
  | 'player2_score'
  | 'winner'
>

export interface FinishGameInput {
  gameType: GameType
  sessionType: GameSessionType
  startedAt: Date
  result: GameResult
}

/**
 * Persists a completed game session and, for craving-linked sessions, advances
 * the game streak (MiniGames §B2). Returns the inserted session_id so the
 * reflection screen can PATCH reflection_response onto the same row.
 *
 * Casual sessions: write the row, no streak, no reflection (§5). Abandoned
 * games never call this — nothing is saved (§8 escape hatches).
 */
export function useGameSession() {
  const { user } = useAuth()
  const { stage } = useStage()
  const { recordCravingSession } = useGameStreak()
  const qc = useQueryClient()

  /** Create the session row + (if craving-linked) bump the streak. */
  const finishGame = async (
    input: FinishGameInput,
  ): Promise<{ sessionId: string | null; milestone: number | null }> => {
    if (!user) return { sessionId: null, milestone: null }
    const endedAt = new Date()
    const duration = Math.max(0, Math.round((endedAt.getTime() - input.startedAt.getTime()) / 1000))

    let sessionId: string | null = null
    try {
      const { data } = await supabase
        .from('game_session')
        .insert({
          user_id: user.id,
          game_type: input.gameType,
          session_type: input.sessionType,
          started_at: input.startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_seconds: duration,
          stage_at_session: stage,
          ...input.result,
        })
        .select('session_id')
        .single()
        .throwOnError()
      sessionId = (data as { session_id: string }).session_id
    } catch {
      // Session write failed — still let the player out; nothing to track.
      return { sessionId: null, milestone: null }
    }

    let milestone: number | null = null
    if (input.sessionType === 'craving_linked') {
      try {
        milestone = await recordCravingSession()
      } catch {
        // streak update best-effort
      }
    }
    if (user) qc.invalidateQueries({ queryKey: ['game_streak', user.id] })
    return { sessionId, milestone }
  }

  /**
   * Record the reflection (craving-linked only) + update the game's tool score
   * (§B2: passed/partial → +1, ongoing/null → no change). Idempotent enough —
   * called once per session from MG-REFLECT-1.
   */
  const recordReflection = async (
    sessionId: string,
    gameType: GameType,
    response: GameReflection | null,
  ): Promise<void> => {
    if (!user) return
    if (response) {
      try {
        await supabase
          .from('game_session')
          .update({ reflection_response: response })
          .eq('session_id', sessionId)
          .throwOnError()
      } catch {
        // reflection write best-effort — never block the close
      }
    }
    const delta = reflectionScoreDelta(response)
    if (delta !== 0) {
      // Each game type is its own tool_score entry (tool_id = game_type).
      await updateToolScore(user.id, gameType, delta, 'better')
    }
  }

  return { finishGame, recordReflection }
}

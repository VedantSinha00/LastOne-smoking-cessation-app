import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useProfile } from '../../hooks/useProfile'
import { useGameSession } from '../../hooks/useGameSession'
import { gameVoice, GAME_COPY } from '../../lib/games'
import type { GameReflection, GameType } from '../../types/database'

interface Props {
  sessionId: string
  gameType: GameType
  /** Called after a response is recorded OR the 5s auto-dismiss fires. */
  onDone: () => void
}

const OPTIONS: GameReflection[] = ['passed', 'partial', 'ongoing']

/**
 * MG-REFLECT-1 — post-game reflection, craving-linked sessions only (§5 Flow 6).
 * "Did the craving pass?" → records reflection + updates tool score
 * (passed/partial → +1). No input for 5s → auto-dismiss, response stays null
 * (no score change). Casual sessions never render this.
 */
export const Reflection: React.FC<Props> = ({ sessionId, gameType, onDone }) => {
  const { data: profile } = useProfile()
  const { recordReflection } = useGameSession()
  const voice = gameVoice(profile?.voice_style ?? null)
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finish = (response: GameReflection | null) => {
    if (done) return
    setDone(true)
    if (timer.current) clearTimeout(timer.current)
    void recordReflection(sessionId, gameType, response)
    onDone()
  }

  useEffect(() => {
    timer.current = setTimeout(() => finish(null), 5000)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const label = (r: GameReflection) =>
    r === 'passed'
      ? GAME_COPY.reflectPassed[voice]
      : r === 'partial'
        ? GAME_COPY.reflectPartial[voice]
        : GAME_COPY.reflectOngoing[voice]

  return (
    <View className="flex-1 bg-background px-8 justify-center">
      <Text className="text-foreground font-display text-2xl text-center mb-8 leading-snug">
        {GAME_COPY.reflectQuestion[voice]}
      </Text>
      <View className="gap-3">
        {OPTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => finish(r)}
            className="bg-card border-[1.5px] border-border rounded-2xl py-4 items-center active:bg-muted"
          >
            <Text className="text-foreground font-sans-bold text-base">{label(r)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

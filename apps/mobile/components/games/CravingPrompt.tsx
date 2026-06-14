import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useProfile } from '../../hooks/useProfile'
import { gameVoice, GAME_COPY } from '../../lib/games'
import type { GameSessionType } from '../../types/database'

interface Props {
  /** Resolve the prompt with the chosen session type, then launch the game. */
  onResolve: (type: GameSessionType) => void
}

/**
 * MG-HUB-2 — craving prompt overlay, shown at EVERY game launch (§5 Flow 2).
 * "Yes" → craving_linked; No / dismiss / 8s timeout → casual. The 8-second
 * auto-dismiss defaulting to casual is the spec's explicit rule (§8).
 */
export const CravingPrompt: React.FC<Props> = ({ onResolve }) => {
  const { data: profile } = useProfile()
  const voice = gameVoice(profile?.voice_style ?? null)
  const [resolved, setResolved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolve = (type: GameSessionType) => {
    if (resolved) return
    setResolved(true)
    if (timer.current) clearTimeout(timer.current)
    onResolve(type)
  }

  useEffect(() => {
    timer.current = setTimeout(() => resolve('casual'), 8000)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View className="flex-1 bg-black/50 justify-center px-8">
      <View className="bg-card rounded-3xl p-6">
        <View className="flex-row justify-end">
          <Pressable onPress={() => resolve('casual')} hitSlop={12}>
            <Text className="text-muted-foreground text-base">✕</Text>
          </Pressable>
        </View>
        <Text className="text-foreground font-display text-2xl text-center mt-1 leading-snug">
          {GAME_COPY.cravingQuestion[voice]}
        </Text>
        <View className="gap-3 mt-7">
          <Pressable
            onPress={() => resolve('craving_linked')}
            className="bg-primary rounded-2xl py-4 items-center active:opacity-90"
          >
            <Text className="text-primary-foreground font-sans-bold text-base">
              {GAME_COPY.cravingYes[voice]}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => resolve('casual')}
            className="bg-card border-[1.5px] border-border rounded-2xl py-4 items-center active:bg-muted"
          >
            <Text className="text-foreground font-sans-bold text-base">
              {GAME_COPY.cravingNo[voice]}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

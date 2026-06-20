import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { CravingPrompt } from '../../components/games/CravingPrompt'
import { Reflection } from '../../components/games/Reflection'
import { MemoryBoard } from '../../components/games/MemoryBoard'
import { Button } from '../../components/ui/button'
import { useGameSession } from '../../hooks/useGameSession'
import { generateGrid, GRID_PAIRS, type MemoryCard } from '../../lib/games'
import type { GameCardSkin, GameGridSize, GameSessionType } from '../../types/database'

type Phase = 'prompt' | 'entry' | 'playing' | 'result' | 'reflection'

/**
 * Memory 1P (MG-MEM1-1/2/3, §5 Flow 3). Flow: craving prompt → entry (grid +
 * skin) → board → result → reflection (craving-linked only). No-match cards
 * flip back after 1s; game ends when all pairs are matched. Back mid-game
 * abandons — nothing saved (§8).
 */
export default function Memory1P() {
  const router = useRouter()
  const { finishGame } = useGameSession()

  const [phase, setPhase] = useState<Phase>('prompt')
  const [sessionType, setSessionType] = useState<GameSessionType>('casual')
  const [grid, setGrid] = useState<GameGridSize>('3x4')
  const [skin, setSkin] = useState<GameCardSkin>('generic')

  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const startedAt = useRef<Date>(new Date())
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)

  const pairsTotal = GRID_PAIRS[grid]
  const pairsMatched = matched.length / 2

  // Resolve a non-matching pair after 1s, or a match immediately (§5 step 4–5).
  useEffect(() => {
    if (flipped.length !== 2) return
    const [a, b] = flipped
    const cardA = cards.find((c) => c.id === a)
    const cardB = cards.find((c) => c.id === b)
    if (cardA && cardB && cardA.faceId === cardB.faceId) {
      setMatched((m) => [...m, a, b])
      setFlipped([])
    } else {
      flipTimer.current = setTimeout(() => setFlipped([]), 1000)
    }
    return () => {
      if (flipTimer.current) clearTimeout(flipTimer.current)
    }
  }, [flipped, cards])

  // All pairs matched → end the game and write the session.
  useEffect(() => {
    if (phase === 'playing' && matched.length > 0 && matched.length === cards.length) {
      void endGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, phase])

  const start = () => {
    setCards(generateGrid(grid))
    setFlipped([])
    setMatched([])
    startedAt.current = new Date()
    setPhase('playing')
  }

  const endGame = async () => {
    const timeTaken = Math.round((Date.now() - startedAt.current.getTime()) / 1000)
    setPhase('result')
    const { sessionId } = await finishGame({
      gameType: 'memory_1p',
      sessionType,
      startedAt: startedAt.current,
      result: {
        grid_size: grid,
        card_skin: skin,
        pairs_matched: pairsTotal,
        time_taken_seconds: timeTaken,
      },
    })
    setSessionId(sessionId)
  }

  const flip = (id: number) => {
    if (flipped.length >= 2) return
    setFlipped((f) => (f.includes(id) ? f : [...f, id]))
  }

  const leaveAfterResult = () => {
    if (sessionType === 'craving_linked' && sessionId) setPhase('reflection')
    else router.back()
  }

  if (phase === 'prompt') {
    return (
      <CravingPrompt
        onResolve={(type) => {
          setSessionType(type)
          setPhase('entry')
        }}
      />
    )
  }

  if (phase === 'entry') {
    return (
      <View className="flex-1 bg-background px-6 pt-14">
        <Pressable onPress={() => router.back()} hitSlop={12} className="mb-6">
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl">Memory Game</Text>
        <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
          Flip cards. Find pairs. Give your brain something to do.
        </Text>

        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mt-8 mb-2">
          How long do you want to play?
        </Text>
        <View className="flex-row gap-3">
          {(['3x4', '4x4'] as GameGridSize[]).map((g) => (
            <Pressable
              key={g}
              onPress={() => setGrid(g)}
              className={`flex-1 rounded-2xl border py-4 items-center ${
                grid === g ? 'bg-primary/15 border-primary' : 'bg-card border-border'
              }`}
            >
              <Text className={`font-sans-bold ${grid === g ? 'text-primary' : 'text-foreground'}`}>
                {g === '3x4' ? 'Quick' : 'Longer'}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {g === '3x4' ? '12 cards' : '16 cards'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mt-6 mb-2">
          Card style
        </Text>
        <View className="flex-row gap-3">
          {(['generic', 'themed'] as GameCardSkin[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSkin(s)}
              className={`flex-1 rounded-2xl border py-4 items-center ${
                skin === s ? 'bg-primary/15 border-primary' : 'bg-card border-border'
              }`}
            >
              <Text className={`font-sans-bold ${skin === s ? 'text-primary' : 'text-foreground'}`}>
                {s === 'generic' ? 'Icons' : 'Quit journey'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-10">
          <Button title="Start" onPress={start} />
        </View>
      </View>
    )
  }

  if (phase === 'playing') {
    return (
      <View className="flex-1 bg-background px-5 pt-14">
        {/* Header — "Memory" title + close, design-styled */}
        <View className="h-14 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 24 }}>
            <Text className="text-2xl" style={{ color: '#0D0D0D' }}>
              ←
            </Text>
          </Pressable>
          <Text className="font-display" style={{ fontSize: 16, color: '#0D0D0D' }}>
            Memory
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 24, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 18, color: '#888888' }}>✕</Text>
          </Pressable>
        </View>

        {/* "X / N pairs" — centered bold green (design) */}
        <Text
          className="font-sans-bold text-center"
          style={{ fontSize: 18, color: '#84C524', marginTop: 6, marginBottom: 18 }}
        >
          {pairsMatched} / {pairsTotal} pairs
        </Text>

        <MemoryBoard
          cards={cards}
          grid={grid}
          skin={skin}
          flipped={flipped}
          matched={matched}
          onFlip={flip}
        />

        <Text className="text-center" style={{ marginTop: 22, fontSize: 13, color: '#888888' }}>
          Tap a card to flip it
        </Text>
      </View>
    )
  }

  if (phase === 'result') {
    const timeTaken = Math.round((Date.now() - startedAt.current.getTime()) / 1000)
    return (
      <View className="flex-1 bg-background px-8 justify-center items-center">
        <Text className="text-5xl mb-3">🎉</Text>
        <Text className="text-foreground font-display text-2xl">All pairs found.</Text>
        <View className="flex-row gap-8 mt-6">
          <View className="items-center">
            <Text className="text-primary font-display text-2xl">{pairsTotal}</Text>
            <Text className="text-muted-foreground text-xs mt-1">Pairs matched</Text>
          </View>
          <View className="items-center">
            <Text className="text-primary font-display text-2xl">{timeTaken}s</Text>
            <Text className="text-muted-foreground text-xs mt-1">Time taken</Text>
          </View>
        </View>
        <View className="mt-10 w-full">
          <Button title="Done" onPress={leaveAfterResult} />
        </View>
      </View>
    )
  }

  // reflection
  return (
    <Reflection
      sessionId={sessionId!}
      gameType="memory_1p"
      onDone={() => router.back()}
    />
  )
}

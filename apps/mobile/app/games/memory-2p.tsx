import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { CravingPrompt } from '../../components/games/CravingPrompt'
import { Reflection } from '../../components/games/Reflection'
import { MemoryBoard } from '../../components/games/MemoryBoard'
import { Button } from '../../components/ui/button'
import { useGameSession } from '../../hooks/useGameSession'
import { generateGrid, type MemoryCard } from '../../lib/games'
import type { GameCardSkin, GameGridSize, GameSessionType, GameWinner } from '../../types/database'

type Phase = 'prompt' | 'entry' | 'playing' | 'handoff' | 'result' | 'reflection'

/**
 * Memory 2P (MG-MEM2-1..5, §5 Flow 5). Pass-and-play on one device. A match
 * keeps the same player's turn; a miss shows the handoff screen (covers the
 * board — "don't peek") before the other player continues (§B2 turn logic).
 * Winner = higher score; tie = draw. Back mid-game abandons — nothing saved.
 */
export default function Memory2P() {
  const router = useRouter()
  const { finishGame } = useGameSession()

  const [phase, setPhase] = useState<Phase>('prompt')
  const [sessionType, setSessionType] = useState<GameSessionType>('casual')
  const [grid, setGrid] = useState<GameGridSize>('3x4')
  const [skin, setSkin] = useState<GameCardSkin>('generic')

  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [player, setPlayer] = useState<0 | 1>(0)
  const [scores, setScores] = useState<[number, number]>([0, 0])
  const startedAt = useRef<Date>(new Date())
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Resolve a pair: match → same player continues; miss → handoff after 1s.
  useEffect(() => {
    if (flipped.length !== 2) return
    const [a, b] = flipped
    const cardA = cards.find((c) => c.id === a)
    const cardB = cards.find((c) => c.id === b)
    if (cardA && cardB && cardA.faceId === cardB.faceId) {
      setMatched((m) => [...m, a, b])
      setScores((s) => {
        const next: [number, number] = [...s]
        next[player] += 1
        return next
      })
      setFlipped([])
      // same player continues — no handoff
    } else {
      flipTimer.current = setTimeout(() => {
        setFlipped([])
        setPlayer((p) => (p === 0 ? 1 : 0))
        setPhase('handoff')
      }, 1000)
    }
    return () => {
      if (flipTimer.current) clearTimeout(flipTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, cards])

  // All matched → end.
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
    setScores([0, 0])
    setPlayer(0)
    startedAt.current = new Date()
    setPhase('playing')
  }

  const endGame = async () => {
    setPhase('result')
    const winner: GameWinner =
      scores[0] > scores[1] ? 'player1' : scores[1] > scores[0] ? 'player2' : 'draw'
    const { sessionId } = await finishGame({
      gameType: 'memory_2p',
      sessionType,
      startedAt: startedAt.current,
      result: {
        grid_size: grid,
        card_skin: skin,
        pairs_matched: cards.length / 2,
        player1_score: scores[0],
        player2_score: scores[1],
        winner,
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
        <Text className="text-foreground font-display text-2xl">Memory — 2 Players</Text>
        <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
          One phone, two players. Take turns flipping cards — match a pair to score and go again.
          Miss, and you pass the phone. Most pairs wins.
        </Text>

        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mt-8 mb-2">
          Board size
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

  if (phase === 'handoff') {
    return (
      <View className="flex-1 bg-primary px-8 justify-center items-center">
        <Text className="text-primary-foreground font-display text-3xl text-center">
          Pass the phone.
        </Text>
        <Text className="text-primary-foreground/80 text-base mt-2 text-center">
          Cover the board — don&apos;t peek.
        </Text>
        <View className="mt-10 w-full">
          <Pressable
            onPress={() => setPhase('playing')}
            className="bg-card rounded-2xl py-4 items-center active:opacity-90"
          >
            <Text className="text-foreground font-sans-bold text-base">
              Player {player + 1} — start my turn
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (phase === 'playing') {
    return (
      <View className="flex-1 bg-background px-4 pt-14">
        <View className="flex-row items-center justify-between px-2 mb-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-foreground text-2xl">✕</Text>
          </Pressable>
          <Text className="text-foreground font-sans-bold text-sm">Player {player + 1}&apos;s turn</Text>
        </View>
        <View className="flex-row justify-center gap-8 mb-5">
          <Text className={`text-sm ${player === 0 ? 'text-primary font-sans-bold' : 'text-muted-foreground'}`}>
            P1: {scores[0]}
          </Text>
          <Text className={`text-sm ${player === 1 ? 'text-primary font-sans-bold' : 'text-muted-foreground'}`}>
            P2: {scores[1]}
          </Text>
        </View>
        <MemoryBoard cards={cards} grid={grid} skin={skin} flipped={flipped} matched={matched} onFlip={flip} />
      </View>
    )
  }

  if (phase === 'result') {
    const draw = scores[0] === scores[1]
    const winnerName = scores[0] > scores[1] ? 'Player 1' : 'Player 2'
    return (
      <View className="flex-1 bg-background px-8 justify-center items-center">
        <Text className="text-5xl mb-3">{draw ? '🤝' : '🏆'}</Text>
        <Text className="text-foreground font-display text-2xl text-center">
          {draw ? "It's a draw!" : `${winnerName} wins!`}
        </Text>
        <Text className="text-muted-foreground text-sm mt-3">
          P1 {scores[0]} · P2 {scores[1]}
        </Text>
        <View className="mt-10 w-full">
          <Button title="Done" onPress={leaveAfterResult} />
        </View>
      </View>
    )
  }

  return <Reflection sessionId={sessionId!} gameType="memory_2p" onDone={() => router.back()} />
}

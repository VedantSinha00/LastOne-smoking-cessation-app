import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Vibration, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { CravingPrompt } from '../../components/games/CravingPrompt'
import { Reflection } from '../../components/games/Reflection'
import { Button } from '../../components/ui/button'
import { useGameSession } from '../../hooks/useGameSession'
import {
  ECHO_MIN_LENGTH,
  ECHO_ZONES,
  generateSequence,
  gradeEchoAttempt,
} from '../../lib/games'
import type { GameSessionType } from '../../types/database'

type Phase = 'prompt' | 'entry' | 'showing' | 'input' | 'result' | 'reflection'

const ZONE_COLORS = ['#7FC200', '#F15025', '#4E9A52', '#E19100'] // 4 tap zones
// Concrete pixel tile size (NOT %-width + aspectRatio — that resolves to height 0
// inside a flex-wrap row on RN Fabric, making the zones invisible). 2 cols, gap 14.
const TILE = Math.min(150, Math.floor((Dimensions.get('window').width - 48 - 14) / 2))
const SESSION_SECONDS = 180 // ~3 min session window (§5 Flow 4)

/**
 * Echo Tap (MG-ECHO-1/2/3, §5 Flow 4). The game plays a sequence (visual pulse
 * + haptic), the player taps it back in order. Correct → streak++, length+1.
 * Wrong → streak reset, length−1 (floor 2). No termination on a wrong tap — the
 * attempt always completes. X completes the current attempt then shows the
 * result (§B2). Order-only grading; no timing precision in V1.
 */
export default function EchoTap() {
  const router = useRouter()
  const { finishGame } = useGameSession()

  const [phase, setPhase] = useState<Phase>('prompt')
  const [sessionType, setSessionType] = useState<GameSessionType>('casual')

  const [sequence, setSequence] = useState<number[]>([])
  const [taps, setTaps] = useState<number[]>([])
  const [activeZone, setActiveZone] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [longest, setLongest] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [flashWrong, setFlashWrong] = useState(false)

  const startedAt = useRef<Date>(new Date())
  const lengthRef = useRef(ECHO_MIN_LENGTH)
  const endRequested = useRef(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Session timer — when it elapses, end after the current attempt completes.
  useEffect(() => {
    if (phase !== 'showing' && phase !== 'input') return
    const id = setTimeout(() => {
      endRequested.current = true
    }, SESSION_SECONDS * 1000)
    return () => clearTimeout(id)
  }, [phase])

  const playSequence = (seq: number[]) => {
    setPhase('showing')
    setTaps([])
    seq.forEach((zone, i) => {
      setTimeout(() => {
        setActiveZone(zone)
        Vibration.vibrate(40)
        setTimeout(() => setActiveZone(null), 350)
        if (i === seq.length - 1) {
          setTimeout(() => setPhase('input'), 450)
        }
      }, i * 650)
    })
  }

  const startGame = () => {
    lengthRef.current = ECHO_MIN_LENGTH
    setStreak(0)
    setLongest(0)
    setCompleted(0)
    startedAt.current = new Date()
    endRequested.current = false
    const seq = generateSequence(lengthRef.current)
    setSequence(seq)
    playSequence(seq)
  }

  const handleTap = (zone: number) => {
    if (phase !== 'input') return
    const nextTaps = [...taps, zone]
    setTaps(nextTaps)
    // Visual + haptic feedback per tap.
    setActiveZone(zone)
    Vibration.vibrate(25)
    setTimeout(() => setActiveZone(null), 150)

    if (nextTaps.length === sequence.length) {
      // Attempt complete — grade it (§B2 order-only).
      const { correct, nextLength } = gradeEchoAttempt(sequence, nextTaps)
      if (correct) {
        const newStreak = streak + 1
        setStreak(newStreak)
        setLongest((l) => Math.max(l, newStreak))
        setCompleted((c) => c + 1)
      } else {
        setStreak(0)
        setFlashWrong(true)
        Vibration.vibrate(120)
        setTimeout(() => setFlashWrong(false), 300)
      }
      lengthRef.current = nextLength

      // End if requested (timer elapsed or X pressed); else next attempt.
      setTimeout(() => {
        if (endRequested.current) {
          void endGame(correct ? completed + 1 : completed, Math.max(longest, correct ? streak + 1 : longest))
        } else {
          const seq = generateSequence(lengthRef.current)
          setSequence(seq)
          playSequence(seq)
        }
      }, 600)
    }
  }

  // X button: complete the current attempt first, then show result (§B2).
  const requestEnd = () => {
    endRequested.current = true
    if (phase === 'input' && taps.length === 0) {
      // Nothing tapped yet this attempt — end immediately.
      void endGame(completed, longest)
    }
    // Otherwise the in-progress attempt's completion handler will end it.
  }

  const endGame = async (finalCompleted: number, finalLongest: number) => {
    setPhase('result')
    const { sessionId } = await finishGame({
      gameType: 'echo_tap',
      sessionType,
      startedAt: startedAt.current,
      result: {
        sequences_completed: finalCompleted,
        longest_streak: finalLongest,
      },
    })
    setSessionId(sessionId)
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
        <Text className="text-foreground font-display text-2xl">Echo Tap</Text>
        <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
          Listen. Remember. Tap it back. Sequences get longer as you go.
        </Text>
        <View className="bg-card border border-border rounded-2xl p-5 mt-6">
          <Text className="text-muted-foreground text-sm leading-relaxed">
            The game flashes a sequence — watch and feel it. Then tap the same sequence back, in
            order. Get it right and the next one grows. Get it wrong and it dials back. No timer
            pressure.
          </Text>
        </View>
        <Text className="text-muted-foreground text-xs mt-4">Starts easy. Gets harder as you go.</Text>
        <View className="mt-8">
          <Button title="Start" onPress={startGame} />
        </View>
      </View>
    )
  }

  if (phase === 'result') {
    return (
      <View className="flex-1 bg-background px-8 justify-center items-center">
        <Text className="text-foreground font-display text-2xl">Nice session.</Text>
        <View className="flex-row gap-8 mt-6">
          <View className="items-center">
            <Text className="text-primary font-display text-2xl">{completed}</Text>
            <Text className="text-muted-foreground text-xs mt-1">Sequences completed</Text>
          </View>
          <View className="items-center">
            <Text className="text-primary font-display text-2xl">{longest}</Text>
            <Text className="text-muted-foreground text-xs mt-1">Longest streak</Text>
          </View>
        </View>
        <View className="mt-10 w-full">
          <Button title="Done" onPress={leaveAfterResult} />
        </View>
      </View>
    )
  }

  if (phase === 'reflection') {
    return <Reflection sessionId={sessionId!} gameType="echo_tap" onDone={() => router.back()} />
  }

  // showing / input — the play board
  return (
    <View className={`flex-1 px-6 pt-14 ${flashWrong ? 'bg-craving/10' : 'bg-background'}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted-foreground text-sm font-sans-bold">Streak {streak}</Text>
        <Pressable onPress={requestEnd} hitSlop={12}>
          <Text className="text-foreground text-2xl">✕</Text>
        </Pressable>
      </View>
      <Text className="text-center text-muted-foreground text-sm mb-6">
        {phase === 'showing' ? 'Watch…' : 'Your turn — tap it back'}
      </Text>

      <View
        className="flex-row flex-wrap justify-center self-center"
        style={{ gap: 14, width: TILE * 2 + 14 }}
      >
        {Array.from({ length: ECHO_ZONES }).map((_, zone) => (
          <Pressable
            key={zone}
            disabled={phase !== 'input'}
            onPress={() => handleTap(zone)}
            style={{
              width: TILE,
              height: TILE,
              backgroundColor: ZONE_COLORS[zone],
              opacity: activeZone === zone ? 1 : 0.35,
            }}
            className="rounded-3xl"
          />
        ))}
      </View>

      {phase === 'input' && (
        <Text className="text-center text-muted-foreground text-xs mt-6">
          {taps.length} / {sequence.length}
        </Text>
      )}
    </View>
  )
}

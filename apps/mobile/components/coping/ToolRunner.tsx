import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Button } from '../ui/button'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Minimal tool-runner surfaces (Coping Tools §02–04). These run the timing/structure
 * of each family and hand off to the SOS check-in via onDone(). They are deliberately
 * functional rather than pixel-perfect — the animated pacers, haptics, and per-phase
 * copy described in the spec are Figma-owned visual design (Step 13 scope: logic +
 * working runners; full game implementations land in Step 19).
 */

interface RunnerProps {
  tool: CopingTool
  onDone: () => void
}

// ── Breathing pacer ───────────────────────────────────────────────────────────

interface Phase {
  label: string
  seconds: number
}

/** Per-tool breath patterns (Coping Tools §02). Fallback to Box Breathing 4-4-4-4. */
const BREATH_PATTERNS: Record<string, Phase[]> = {
  'BRE-01': [
    { label: 'Breathe in', seconds: 4 },
    { label: 'Hold', seconds: 4 },
    { label: 'Breathe out', seconds: 4 },
    { label: 'Hold', seconds: 4 },
  ],
  'BRE-02': [
    { label: 'Breathe in', seconds: 4 },
    { label: 'Hold', seconds: 7 },
    { label: 'Breathe out', seconds: 8 },
  ],
  'BRE-03': [
    { label: 'Inhale', seconds: 3 },
    { label: 'Sniff — top up', seconds: 1 },
    { label: 'Slow exhale', seconds: 9 },
  ],
  'BRE-04': [
    { label: 'In — notice what you see', seconds: 5 },
    { label: 'Hold — feel your feet', seconds: 5 },
    { label: 'Out — notice what you hear', seconds: 5 },
  ],
}

const TARGET_CYCLES: Record<string, number> = { 'BRE-01': 4, 'BRE-02': 4, 'BRE-03': 3, 'BRE-04': 3 }

export const BreathingTool: React.FC<RunnerProps> = ({ tool, onDone }) => {
  const pattern = BREATH_PATTERNS[tool.tool_id] ?? BREATH_PATTERNS['BRE-01']
  const totalCycles = TARGET_CYCLES[tool.tool_id] ?? 4
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [cycle, setCycle] = useState(1)
  const [remaining, setRemaining] = useState(pattern[0].seconds)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (finished) return
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1
        // advance phase / cycle
        setPhaseIdx((pi) => {
          const nextPi = pi + 1
          if (nextPi < pattern.length) {
            setRemaining(pattern[nextPi].seconds)
            return nextPi
          }
          // cycle complete
          setCycle((c) => {
            if (c >= totalCycles) {
              setFinished(true)
              return c
            }
            setRemaining(pattern[0].seconds)
            return c + 1
          })
          return nextPi < pattern.length ? nextPi : 0
        })
        return prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [finished, pattern, totalCycles])

  const phase = pattern[Math.min(phaseIdx, pattern.length - 1)]

  return (
    <View className="flex-1 bg-background px-6 py-8 items-center justify-center">
      <Text className="text-foreground font-display text-xl text-center">{tool.name}</Text>
      <Text className="text-muted-foreground text-xs mt-1">
        Cycle {Math.min(cycle, totalCycles)} of {totalCycles}
      </Text>

      <View className="w-52 h-52 rounded-full bg-surface-accent/10 border-4 border-surface-accent/60 items-center justify-center my-10">
        {finished ? (
          <Text className="text-surface-accent text-lg font-sans-bold text-center px-4">Nice. That&apos;s done.</Text>
        ) : (
          <>
            <Text className="text-foreground font-display text-xl text-center px-4">{phase.label}</Text>
            <Text className="text-foreground font-display text-3xl mt-2">{remaining}s</Text>
          </>
        )}
      </View>

      <Button
        title={finished ? 'How are you now?' : "I'm done"}
        onPress={onDone}
        className="w-full"
      />
    </View>
  )
}

// ── Physical rep runner ─────────────────────────────────────────────────────────

const STILL_SECONDS: Record<string, number> = { 'PHY-03': 10, 'PHY-04': 15 }

export const PhysicalTool: React.FC<RunnerProps & { repCount?: number }> = ({
  tool,
  onDone,
  repCount = 10,
}) => {
  // PHY-01/02 are count/breath based and socially invisible; PHY-03/04 are rep based.
  const isRepBased = tool.tool_id === 'PHY-03' || tool.tool_id === 'PHY-04'
  const stillSeconds = STILL_SECONDS[tool.tool_id] ?? 10
  const [reps, setReps] = useState(repCount)
  const [still, setStill] = useState<number | null>(null)

  // After reps are done, run the still/recovery timer (spec §03).
  useEffect(() => {
    if (still == null) return
    if (still <= 0) return
    const id = setInterval(() => setStill((s) => (s != null && s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [still])

  if (!isRepBased) {
    // PHY-01 Finger Pulse Press / PHY-02 Tongue Press — simple guided screen.
    return (
      <View className="flex-1 bg-background px-6 py-8 items-center justify-center">
        <Text className="text-foreground font-display text-xl text-center mb-4">{tool.name}</Text>
        <Text className="text-muted-foreground text-base text-center leading-relaxed px-2 mb-10">
          {tool.tool_id === 'PHY-01'
            ? 'Press a finger to your wrist. Count 10 heartbeats — exhale slowly with each one.'
            : 'Press your tongue to the roof of your mouth. Breathe through your nose for 5 slow breaths.'}
        </Text>
        <Button title="Done" onPress={onDone} className="w-full" />
      </View>
    )
  }

  if (still != null) {
    return (
      <View className="flex-1 bg-background px-6 py-8 items-center justify-center">
        <Text className="text-foreground font-display text-xl text-center mb-6">Stand still</Text>
        <Text className="text-foreground font-display text-5xl mb-2">{still}</Text>
        <Text className="text-muted-foreground text-sm mb-10">Notice your breathing.</Text>
        <Button title="How are you now?" onPress={onDone} className="w-full" disabled={still > 0} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background px-6 py-8 items-center justify-center">
      <Text className="text-foreground font-display text-xl text-center mb-2">{tool.name}</Text>
      <Text className="text-muted-foreground text-sm mb-8">Tap each rep. Any pace.</Text>
      <Pressable
        onPress={() => {
          setReps((r) => {
            if (r <= 1) {
              setStill(stillSeconds)
              return 0
            }
            return r - 1
          })
        }}
        className="w-56 h-56 rounded-full bg-primary/15 border-4 border-primary items-center justify-center active:bg-primary/30"
      >
        <Text className="text-primary font-display text-7xl">{reps}</Text>
        <Text className="text-muted-foreground text-sm mt-1">reps left</Text>
      </Pressable>
      <Text className="text-muted-foreground text-xs mt-8">Tap the circle for each one.</Text>
    </View>
  )
}

// ── Mini-game stubs (full games = Step 19) ───────────────────────────────────────

export const GameStub: React.FC<RunnerProps> = ({ tool, onDone }) => (
  <View className="flex-1 bg-background px-6 py-8 items-center justify-center">
    <Text className="text-foreground font-display text-xl text-center mb-3">{tool.name}</Text>
    <View className="bg-card border border-border rounded-3xl p-6 mb-10">
      <Text className="text-muted-foreground text-sm text-center leading-relaxed">
        The full game lands soon. For now, take a couple of minutes on something that occupies
        your hands and eyes — the craving fades while your attention is busy.
      </Text>
    </View>
    <Button title="How are you now?" onPress={onDone} className="w-full" />
  </View>
)

/** Route a tool to its runner by family. */
export const ToolRunner: React.FC<RunnerProps & { repCount?: number }> = ({
  tool,
  onDone,
  repCount,
}) => {
  if (tool.family === 'breathing') return <BreathingTool tool={tool} onDone={onDone} />
  if (tool.family === 'physical') return <PhysicalTool tool={tool} onDone={onDone} repCount={repCount} />
  return <GameStub tool={tool} onDone={onDone} />
}

import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { X } from 'lucide-react-native'
import type { Database } from '../../types/database'
import { PhysiologicalSighTool } from './PhysiologicalSighTool'
import { FingerPulseTool } from './FingerPulseTool'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Minimal tool-runner surfaces (Coping Tools §02–04). These run the timing/structure
 * of each family and hand off to the SOS check-in via onDone(). They are deliberately
 * functional rather than pixel-perfect — the animated pacers, haptics, and per-phase
 * copy described in the spec are Figma-owned visual design (Step 13 scope: logic +
 * working runners; full game implementations land in Step 19).
 */

/**
 * Accent context. Calm green for the explorative Tools library; craving orange when
 * the runner is launched from an active SOS session (matches the Lovable SOS design).
 */
export type RunnerAccent = 'calm' | 'craving'

type AccentCfg = { ring: string; tint: string }
const ACCENT: Record<RunnerAccent, AccentCfg> = {
  calm: { ring: '#4E9A52', tint: 'rgba(78,154,82,0.12)' }, // surface-accent green
  craving: { ring: '#F15025', tint: 'rgba(241,80,37,0.15)' }, // craving orange
}

/** Shared runner chrome (Lovable SOS-2): top ✕ bar, orange badge, primary button. */
const RunnerTopBar: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <View className="h-14 px-5 flex-row items-center justify-end">
    <Pressable onPress={onClose} hitSlop={12} className="active:opacity-60">
      <X size={22} color="#76706C" strokeWidth={2} />
    </Pressable>
  </View>
)

const RunnerBadge: React.FC<{ label: string; accent: AccentCfg }> = ({ label, accent }) => (
  <View className="rounded-full px-4 py-1.5 mb-8" style={{ backgroundColor: accent.tint }}>
    <Text className="font-sans-bold" style={{ color: accent.ring, fontSize: 12, letterSpacing: 1.2 }}>
      {label.toUpperCase()}
    </Text>
  </View>
)

const RunnerPrimaryButton: React.FC<{ label: string; onPress: () => void; accent: AccentCfg; disabled?: boolean }> = ({
  label,
  onPress,
  accent,
  disabled,
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    className="rounded-2xl h-[52px] w-full items-center justify-center active:opacity-90"
    style={{ backgroundColor: accent.ring, maxWidth: 320, opacity: disabled ? 0.5 : 1 }}
  >
    <Text className="text-white font-sans-bold text-[15px]">{label}</Text>
  </Pressable>
)

interface RunnerProps {
  tool: CopingTool
  onDone: () => void
  /** Visual accent — defaults to calm (Tools library); SOS passes "craving". */
  accent?: RunnerAccent
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

export const BreathingTool: React.FC<RunnerProps> = ({ tool, onDone, accent = 'calm' }) => {
  const a = ACCENT[accent]
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
    <View className="flex-1 bg-secondary">
      <RunnerTopBar onClose={onDone} />
      <View className="flex-1 px-6 items-center justify-center">
        <RunnerBadge label={tool.name} accent={a} />
        <Text className="text-muted-foreground text-xs mb-8 -mt-5">
          Cycle {Math.min(cycle, totalCycles)} of {totalCycles}
        </Text>

        {/* Concentric breathing rings (Lovable SOS-2a). */}
        <View className="w-52 h-52 rounded-full items-center justify-center my-2" style={{ borderWidth: 1, borderColor: a.ring + "26" }}>
          <View className="w-[150px] h-[150px] rounded-full items-center justify-center" style={{ borderWidth: 1, borderColor: a.ring + "40" }}>
            <View
              className="w-[100px] h-[100px] rounded-full items-center justify-center"
              style={{ backgroundColor: a.tint, borderWidth: 1.5, borderColor: a.ring }}
            >
              {finished ? (
                <Text className="text-sm font-sans-bold text-center px-2" style={{ color: a.ring }}>Done</Text>
              ) : (
                <Text className="font-sans-bold text-center" style={{ color: a.ring, fontSize: 14 }}>
                  {remaining}s
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text className="text-foreground font-display text-lg text-center mt-8 mb-2">
          {finished ? "Nice. That's done." : phase.label}
        </Text>
        <View className="mt-8 w-full items-center">
          <RunnerPrimaryButton
            label={finished ? 'How are you now?' : "I'm done"}
            onPress={onDone}
            accent={a}
          />
        </View>
      </View>
    </View>
  )
}

// ── Physical rep runner ─────────────────────────────────────────────────────────

const STILL_SECONDS: Record<string, number> = { 'PHY-03': 10, 'PHY-04': 15 }

export const PhysicalTool: React.FC<RunnerProps & { repCount?: number }> = ({
  tool,
  onDone,
  repCount = 10,
  accent = 'calm',
}) => {
  const a = ACCENT[accent]
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
      <View className="flex-1 bg-secondary">
        <RunnerTopBar onClose={onDone} />
        <View className="flex-1 px-6 items-center justify-center">
          <RunnerBadge label={tool.name} accent={a} />
          <Text className="text-muted-foreground text-base text-center leading-relaxed px-2 mb-12">
            {tool.tool_id === 'PHY-01'
              ? 'Press a finger to your wrist. Count 10 heartbeats — exhale slowly with each one.'
              : 'Press your tongue to the roof of your mouth. Breathe through your nose for 5 slow breaths.'}
          </Text>
          <RunnerPrimaryButton label="Done" onPress={onDone} accent={a} />
        </View>
      </View>
    )
  }

  if (still != null) {
    return (
      <View className="flex-1 bg-secondary">
        <RunnerTopBar onClose={onDone} />
        <View className="flex-1 px-6 items-center justify-center">
          <RunnerBadge label="Stand still" accent={a} />
          <Text className="font-display text-6xl mb-2" style={{ color: a.ring }}>{still}</Text>
          <Text className="text-muted-foreground text-sm mb-12">Notice your breathing.</Text>
          <RunnerPrimaryButton label="How are you now?" onPress={onDone} accent={a} disabled={still > 0} />
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-secondary">
      <RunnerTopBar onClose={onDone} />
      <View className="flex-1 px-6 items-center justify-center">
        <RunnerBadge label={tool.name} accent={a} />
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
          className="w-56 h-56 rounded-full border-4 items-center justify-center active:opacity-80"
          style={{ backgroundColor: a.tint, borderColor: a.ring }}
        >
          <Text className="font-display text-7xl" style={{ color: a.ring }}>{reps}</Text>
          <Text className="text-muted-foreground text-sm mt-1">reps left</Text>
        </Pressable>
        <Text className="text-muted-foreground text-xs mt-8">Tap the circle for each one.</Text>
      </View>
    </View>
  )
}

// ── Mini-game stubs (full games = Step 19) ───────────────────────────────────────

export const GameStub: React.FC<RunnerProps> = ({ tool, onDone, accent = 'calm' }) => {
  const a = ACCENT[accent]
  return (
    <View className="flex-1 bg-secondary">
      <RunnerTopBar onClose={onDone} />
      <View className="flex-1 px-6 items-center justify-center">
        <RunnerBadge label={tool.name} accent={a} />
        <View className="bg-card border border-border rounded-2xl p-6 mb-12">
          <Text className="text-muted-foreground text-sm text-center leading-relaxed">
            The full game lands soon. For now, take a couple of minutes on something that occupies
            your hands and eyes — the craving fades while your attention is busy.
          </Text>
        </View>
        <RunnerPrimaryButton label="How are you now?" onPress={onDone} accent={a} />
      </View>
    </View>
  )
}

/** Route a tool to its runner. Two tools have bespoke screens (matching the
 *  design's Physiological Sigh + Finger Pulse animations), keyed by data_model_id;
 *  everything else falls back to the generic family runners. */
export const ToolRunner: React.FC<RunnerProps & { repCount?: number }> = ({
  tool,
  onDone,
  repCount,
  accent = 'calm',
}) => {
  if (tool.data_model_id === 'physiological_sigh')
    return <PhysiologicalSighTool tool={tool} onDone={onDone} />
  if (tool.data_model_id === 'finger_pulse') return <FingerPulseTool tool={tool} onDone={onDone} />
  if (tool.family === 'breathing') return <BreathingTool tool={tool} onDone={onDone} accent={accent} />
  if (tool.family === 'physical')
    return <PhysicalTool tool={tool} onDone={onDone} repCount={repCount} accent={accent} />
  return <GameStub tool={tool} onDone={onDone} accent={accent} />
}

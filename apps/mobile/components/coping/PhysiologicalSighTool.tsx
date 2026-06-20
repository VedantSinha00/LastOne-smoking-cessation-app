import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Animated, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Physiological Sigh — bespoke runner for BRE-03 (data_model_id physiological_sigh),
 * ported from the Lovable `PhysiologicalSighGame`. A double-inhale + long exhale
 * cycle (the fastest physiological way to down-regulate arousal), guided by an
 * animated orange circle: inhale (grow) → sniff (small extra grow) → exhale
 * (shrink, long) → stillness → repeat ×3.
 *
 * Replaces the generic BreathingTool for this tool only (routed in ToolRunner).
 * Same RunnerProps contract (onDone hands off to the SOS/library check-in).
 */
interface Props {
  tool: CopingTool
  onDone: () => void
}

type Phase = 'intro' | 'inhale' | 'sniff' | 'exhale' | 'stillness' | 'complete'

const TIMINGS: Record<Exclude<Phase, 'intro' | 'complete'>, number> = {
  inhale: 2600,
  sniff: 900,
  exhale: 9000,
  stillness: 2000,
}
const TOTAL_ROUNDS = 3

const ORANGE = '#F15025'
const ORANGE_HALO = '#FCE0D7'

const PHASE_LABEL: Record<Phase, string> = {
  intro: '',
  inhale: 'Breathe in…',
  sniff: 'Sip a little more air',
  exhale: 'Slowly let it all out',
  stillness: 'Rest',
  complete: '',
}

export const PhysiologicalSighTool: React.FC<Props> = ({ tool, onDone }) => {
  const insets = useSafeAreaInsets()
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(1)
  const scale = useRef(new Animated.Value(0.5)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => () => clearTimer(), [])

  // Drive both the circle animation and the phase progression.
  useEffect(() => {
    clearTimer()
    const animateTo = (toValue: number, duration: number) =>
      Animated.timing(scale, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start()

    if (phase === 'inhale') {
      animateTo(0.95, TIMINGS.inhale)
      timer.current = setTimeout(() => setPhase('sniff'), TIMINGS.inhale)
    } else if (phase === 'sniff') {
      animateTo(1.1, TIMINGS.sniff)
      timer.current = setTimeout(() => setPhase('exhale'), TIMINGS.sniff)
    } else if (phase === 'exhale') {
      animateTo(0.5, TIMINGS.exhale)
      timer.current = setTimeout(() => setPhase('stillness'), TIMINGS.exhale)
    } else if (phase === 'stillness') {
      timer.current = setTimeout(() => {
        if (round < TOTAL_ROUNDS) {
          setRound((r) => r + 1)
          setPhase('inhale')
        } else {
          setPhase('complete')
        }
      }, TIMINGS.stillness)
    }
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round])

  const begin = () => {
    setRound(1)
    setPhase('inhale')
  }

  return (
    <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
      {/* top bar */}
      <View className="h-14 flex-row items-center justify-between px-5">
        <Text className="text-foreground font-display text-base">{tool.name}</Text>
        <Pressable onPress={onDone} accessibilityLabel="Close" hitSlop={12}>
          <X size={20} color="#76706C" strokeWidth={2} />
        </Pressable>
      </View>

      {phase === 'intro' ? (
        <View className="flex-1 items-center px-8">
          <View className="rounded-full px-4 py-2 mt-6" style={{ backgroundColor: ORANGE_HALO }}>
            <Text className="font-sans-bold text-[11px]" style={{ color: ORANGE, letterSpacing: 1.2 }}>
              FOR INTENSE MOMENTS
            </Text>
          </View>
          <Text
            className="text-foreground font-display text-center mt-7"
            style={{ fontSize: 26, lineHeight: 32, maxWidth: 280 }}
          >
            Just do what the screen does. Nothing else.
          </Text>
          <View
            className="mt-12"
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: ORANGE_HALO, borderWidth: 1.5, borderColor: ORANGE }}
          />
          <Pressable
            onPress={begin}
            className="rounded-full mt-auto mb-12 px-8 py-4 active:opacity-90"
            style={{ backgroundColor: ORANGE }}
          >
            <Text className="text-white font-sans-bold text-base">Begin</Text>
          </Pressable>
        </View>
      ) : phase === 'complete' ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-foreground font-display text-2xl text-center">Nicely done.</Text>
          <Text className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
            That double-breath resets your nervous system faster than almost anything else.
          </Text>
          <Pressable
            onPress={onDone}
            className="rounded-full mt-10 px-8 py-4 active:opacity-90"
            style={{ backgroundColor: ORANGE }}
          >
            <Text className="text-white font-sans-bold text-base">How are you now?</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: ORANGE_HALO,
              borderWidth: 2,
              borderColor: ORANGE,
              transform: [{ scale }],
            }}
          />
          <Text className="text-foreground font-display text-xl mt-12">{PHASE_LABEL[phase]}</Text>
          <Text className="text-muted-foreground text-sm mt-2">
            Round {round} of {TOTAL_ROUNDS}
          </Text>
        </View>
      )}
    </View>
  )
}

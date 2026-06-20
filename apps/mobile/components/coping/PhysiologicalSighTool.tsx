import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Animated, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, ArrowLeft, Check } from 'lucide-react-native'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Physiological Sigh — full flow ported 1:1 from the Lovable `PhysiologicalSighGame`:
 *   intro ("for intense moments" + "Just do what the screen does" + Begin)
 *   → active phases ×3 rounds: inhale → sniff → exhale → stillness, each with a
 *     label + subtext, an animated halo/circle that scales per phase, and round
 *     progress dots
 *   → complete ("That craving just lost 90 seconds" → "How's the craving now? →").
 *
 * The complete screen is our post-tool check-in: its button reports onComplete(true)
 * (a finished sigh = helped). Falls back to onDone() when no onComplete (e.g. SOS).
 */
interface Props {
  tool: CopingTool
  onDone: () => void
  onComplete?: (helped: boolean) => void
}

type Phase = 'intro' | 'inhale' | 'sniff' | 'exhale' | 'stillness' | 'complete'

const T = { inhale: 2600, sniff: 900, exhale: 9000, stillness: 2000 }
const TOTAL_ROUNDS = 3

const ORANGE = '#F15025'
const ORANGE_HALO = '#FCE0D7'
const ORANGE_SOFT = '#F8B8A3'
const DARK = '#0D0D0D'
const MUTED = '#888888'

const PHASE_META: Record<string, { label: string; sub: string; scale: number; dur: number }> = {
  inhale: { label: 'Inhale', sub: 'Full breath in through your nose', scale: 0.78, dur: T.inhale },
  sniff: { label: 'One more sip', sub: 'A short extra sniff — top it off', scale: 1, dur: T.sniff },
  exhale: { label: 'Let it go', sub: 'Long, slow exhale through your mouth', scale: 0.32, dur: T.exhale },
  stillness: { label: '', sub: '', scale: 0.18, dur: 600 },
}

export const PhysiologicalSighTool: React.FC<Props> = ({ tool, onDone, onComplete }) => {
  const insets = useSafeAreaInsets()
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(1)
  const scale = useRef(new Animated.Value(0.35)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => () => clearTimer(), [])

  useEffect(() => {
    clearTimer()
    const meta = PHASE_META[phase]
    if (meta) {
      Animated.timing(scale, {
        toValue: meta.scale,
        duration: meta.dur,
        easing: phase === 'exhale' ? Easing.bezier(0.4, 0, 0.6, 1) : Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start()
    }
    if (phase === 'inhale') timer.current = setTimeout(() => setPhase('sniff'), T.inhale)
    else if (phase === 'sniff') timer.current = setTimeout(() => setPhase('exhale'), T.sniff)
    else if (phase === 'exhale') timer.current = setTimeout(() => setPhase('stillness'), T.exhale)
    else if (phase === 'stillness')
      timer.current = setTimeout(() => {
        if (round < TOTAL_ROUNDS) {
          setRound((r) => r + 1)
          setPhase('inhale')
        } else setPhase('complete')
      }, T.stillness)
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round])

  const finish = () => (onComplete ? onComplete(true) : onDone())

  const TopBar = ({ title }: { title: string }) => (
    <View className="h-14 flex-row items-center justify-between px-5">
      <Pressable onPress={onDone} accessibilityLabel="Back" hitSlop={12} style={{ width: 24 }}>
        <ArrowLeft size={22} color={DARK} strokeWidth={2} />
      </Pressable>
      <Text className="font-display" style={{ fontSize: 16, color: DARK }}>
        {title}
      </Text>
      <Pressable onPress={onDone} accessibilityLabel="Close" hitSlop={12} style={{ width: 24, alignItems: 'flex-end' }}>
        <X size={18} color={MUTED} strokeWidth={2} />
      </Pressable>
    </View>
  )

  const isStillness = phase === 'stillness'

  return (
    <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
      <TopBar
        title={
          phase === 'intro' || phase === 'complete'
            ? phase === 'intro'
              ? 'Physiological Sigh'
              : ''
            : isStillness
              ? 'Stillness'
              : `Round ${round} of ${TOTAL_ROUNDS}`
        }
      />

      {phase === 'intro' && (
        <View className="items-center px-6" style={{ paddingTop: 12 }}>
          <View className="rounded-full mt-5" style={{ backgroundColor: ORANGE_HALO, paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text className="font-sans-bold" style={{ color: ORANGE, fontSize: 11, letterSpacing: 1.2 }}>
              FOR INTENSE MOMENTS
            </Text>
          </View>
          <Text className="font-display text-center" style={{ fontSize: 26, lineHeight: 32, color: DARK, marginTop: 28, maxWidth: 280 }}>
            Just do what the screen does. Nothing else.
          </Text>
          <View style={{ marginTop: 48, width: 80, height: 80, borderRadius: 40, backgroundColor: ORANGE_HALO, borderWidth: 1.5, borderColor: ORANGE }} />
          <Pressable
            onPress={() => {
              setRound(1)
              setPhase('inhale')
            }}
            className="rounded-full items-center"
            style={{ marginTop: 56, width: '100%', paddingVertical: 18, backgroundColor: ORANGE }}
          >
            <Text className="font-sans-bold text-white" style={{ fontSize: 16 }}>
              Begin
            </Text>
          </Pressable>
        </View>
      )}

      {phase === 'complete' && (
        <View className="items-center px-6" style={{ paddingTop: 60 }}>
          <View className="items-center justify-center" style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#5BAA2E' }}>
            <Check size={44} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text className="font-display text-center" style={{ fontSize: 24, lineHeight: 31, color: DARK, marginTop: 28, maxWidth: 280 }}>
            That craving just lost 90 seconds.
          </Text>
          <Text style={{ marginTop: 10, fontSize: 14, color: MUTED }}>It&apos;s already weaker.</Text>
          <Pressable
            onPress={finish}
            className="rounded-full items-center"
            style={{ marginTop: 48, width: '100%', paddingVertical: 18, backgroundColor: '#143109' }}
          >
            <Text className="font-sans-bold text-white" style={{ fontSize: 16 }}>
              How&apos;s the craving now? →
            </Text>
          </Pressable>
        </View>
      )}

      {phase !== 'intro' && phase !== 'complete' && (
        <View className="flex-1 px-6 items-center">
          {/* circle area */}
          <View className="flex-1 w-full items-center justify-center" style={{ minHeight: 300 }}>
            <View
              className="items-center justify-center"
              style={{ width: 260, height: 260, borderRadius: 130, backgroundColor: isStillness ? 'transparent' : ORANGE_HALO }}
            >
              <Animated.View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  backgroundColor: isStillness || phase === 'exhale' ? ORANGE_SOFT : ORANGE,
                  transform: [{ scale }],
                }}
              />
            </View>
          </View>

          {!isStillness && (
            <>
              <Text className="font-display text-center" style={{ fontSize: 28, color: DARK }}>
                {PHASE_META[phase]?.label}
              </Text>
              <Text className="text-center" style={{ marginTop: 8, fontSize: 14, color: MUTED }}>
                {PHASE_META[phase]?.sub}
              </Text>
            </>
          )}

          {/* round dots */}
          <View className="flex-row" style={{ gap: 8, marginTop: 28, marginBottom: 24 }}>
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: i + 1 === round ? 24 : 8,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: i + 1 === round ? ORANGE : i + 1 < round ? ORANGE_SOFT : '#D9D6D2',
                }}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

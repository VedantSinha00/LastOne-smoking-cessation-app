import React, { useRef, useState } from 'react'
import { View, Text, Pressable, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, ArrowLeft, ThumbsUp, ThumbsDown, Check } from 'lucide-react-native'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Finger Pulse Press — full flow ported 1:1 from the Lovable `FingerPulsePressGame`:
 *   intro (40s badge + wrist illustration + "I found it")
 *   → counting (watch-face circle, tap-per-beat counter to 10, ring-glow when done,
 *     "Continue →")
 *   → checkin ("Release your hand / How does it feel?" → Calmer / Same).
 *
 * Logic: the design's Calmer/Same end screen IS our post-tool check-in. Calmer →
 * onComplete(true) (helped, +score), Same → onComplete(false). Falls back to
 * onDone() when no onComplete is provided (e.g. SOS).
 */
interface Props {
  tool: CopingTool
  onDone: () => void
  onComplete?: (helped: boolean) => void
}

type Phase = 'intro' | 'counting' | 'checkin'
const TARGET = 10

const ORANGE = '#F15025'
const ORANGE_HALO = '#FCE0D7'
const GREEN = '#5BAA2E'
const DARK = '#0D0D0D'
const MUTED = '#888888'

export const FingerPulseTool: React.FC<Props> = ({ tool, onDone, onComplete }) => {
  const insets = useSafeAreaInsets()
  const [phase, setPhase] = useState<Phase>('intro')
  const [beats, setBeats] = useState(0)
  const pulse = useRef(new Animated.Value(1)).current
  const done = beats >= TARGET

  const finish = (helped: boolean) => (onComplete ? onComplete(helped) : onDone())

  const tapBeat = () => {
    if (done) return
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start()
    setBeats((b) => Math.min(TARGET, b + 1))
  }

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

  return (
    <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
      <TopBar title={phase === 'counting' ? '' : 'Finger Pulse Press'} />

      {phase === 'intro' && (
        <View className="items-center px-6" style={{ paddingTop: 12 }}>
          <View
            className="rounded-full mt-5 items-center"
            style={{ backgroundColor: ORANGE_HALO, paddingVertical: 10, paddingHorizontal: 16, maxWidth: 260 }}
          >
            <Text
              className="font-sans-bold text-center"
              style={{ color: ORANGE, fontSize: 11, letterSpacing: 1.2, lineHeight: 16 }}
            >
              40 SECONDS · LOOKS LIKE CHECKING YOUR WATCH
            </Text>
          </View>

          {/* wrist illustration */}
          <View
            className="items-center justify-center"
            style={{ marginTop: 44, width: 110, height: 70, borderRadius: 36, backgroundColor: ORANGE_HALO }}
          >
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ORANGE }} />
          </View>

          <Text className="text-center" style={{ marginTop: 36, fontSize: 15, color: MUTED, lineHeight: 22, maxWidth: 260 }}>
            Press your right index finger on your left wrist, over your pulse.
          </Text>

          <Pressable
            onPress={() => {
              setBeats(0)
              setPhase('counting')
            }}
            className="rounded-full items-center"
            style={{ marginTop: 48, width: '100%', maxWidth: 260, paddingVertical: 16, backgroundColor: '#143109' }}
          >
            <Text className="font-sans-bold text-white" style={{ fontSize: 16 }}>
              I found it
            </Text>
          </Pressable>
        </View>
      )}

      {phase === 'counting' && (
        <View className="flex-1 items-center px-6 pb-6">
          {/* watch face */}
          <Pressable
            onPress={tapBeat}
            style={{ marginTop: 40 }}
          >
            <Animated.View
              className="items-center justify-center"
              style={{
                width: 240,
                height: 240,
                borderRadius: 120,
                backgroundColor: '#FFFFFF',
                borderWidth: done ? 2 : 1,
                borderColor: done ? ORANGE : '#ECE9E4',
                transform: [{ scale: pulse }],
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <View
                style={{
                  width: done ? 22 : 18,
                  height: done ? 22 : 18,
                  borderRadius: 11,
                  backgroundColor: ORANGE,
                }}
              />
            </Animated.View>
          </Pressable>

          <Text className="font-display" style={{ marginTop: 36, fontSize: 56, color: DARK, lineHeight: 56 }}>
            {beats}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 14, color: done ? GREEN : MUTED }} className={done ? 'font-sans-bold' : ''}>
            {done ? 'done' : 'beats'}
          </Text>

          {done ? (
            <Pressable
              onPress={() => setPhase('checkin')}
              className="rounded-full items-center"
              style={{ marginTop: 'auto', width: '100%', paddingVertical: 16, backgroundColor: '#143109' }}
            >
              <Text className="font-sans-bold text-white" style={{ fontSize: 16 }}>
                Continue →
              </Text>
            </Pressable>
          ) : (
            <Text className="text-center" style={{ marginTop: 'auto', fontSize: 13, color: MUTED }}>
              Tap the circle each time you feel a beat.
            </Text>
          )}
        </View>
      )}

      {phase === 'checkin' && (
        <View className="items-center px-6" style={{ paddingTop: 40 }}>
          <View
            className="items-center justify-center"
            style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(91,170,46,0.18)' }}
          >
            <Check size={32} color={GREEN} strokeWidth={2.4} />
          </View>

          <Text className="font-display" style={{ marginTop: 24, fontSize: 22, color: DARK }}>
            Release your hand.
          </Text>
          <Text style={{ marginTop: 10, fontSize: 15, color: DARK }}>How does it feel now?</Text>

          <View className="flex-row" style={{ marginTop: 28, gap: 14, width: '100%' }}>
            <Pressable
              onPress={() => finish(true)}
              className="flex-1 items-center rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E3DE', paddingVertical: 20, gap: 8 }}
            >
              <ThumbsUp size={32} color={GREEN} strokeWidth={1.8} />
              <Text className="font-sans-bold" style={{ fontSize: 14, color: DARK }}>
                Calmer
              </Text>
            </Pressable>
            <Pressable
              onPress={() => finish(false)}
              className="flex-1 items-center rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E3DE', paddingVertical: 20, gap: 8 }}
            >
              <ThumbsDown size={32} color={ORANGE} strokeWidth={1.8} />
              <Text className="font-sans-bold" style={{ fontSize: 14, color: DARK }}>
                Same
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

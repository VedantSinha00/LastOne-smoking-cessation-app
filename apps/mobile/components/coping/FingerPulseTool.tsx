import React, { useRef, useState } from 'react'
import { View, Text, Pressable, Animated } from 'react-native'
import { X } from 'lucide-react-native'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Finger Pulse Press — bespoke runner for PHY-01 (data_model_id finger_pulse),
 * ported from the Lovable `FingerPulsePressGame`. A grounding/interoception task:
 * find your pulse, then tap the circle for each heartbeat you feel until you reach
 * the target. Counting your own pulse pulls attention inward and rides out the peak.
 *
 * Replaces the generic PhysicalTool for this tool only (routed in ToolRunner).
 */
interface Props {
  tool: CopingTool
  onDone: () => void
}

type Phase = 'intro' | 'counting' | 'complete'
const TARGET = 10
const ORANGE = '#F15025'
const ORANGE_HALO = '#FCE0D7'
const DARK = '#143109'

export const FingerPulseTool: React.FC<Props> = ({ tool, onDone }) => {
  const [phase, setPhase] = useState<Phase>('intro')
  const [beats, setBeats] = useState(0)
  const pulse = useRef(new Animated.Value(1)).current

  const tapBeat = () => {
    // a quick pulse animation on each tap
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 110, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start()
    setBeats((b) => {
      const next = b + 1
      if (next >= TARGET) setPhase('complete')
      return next
    })
  }

  return (
    <View className="flex-1 bg-secondary">
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
              GROUND YOURSELF
            </Text>
          </View>
          <View
            className="mt-12"
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: ORANGE }}
          />
          <Text
            className="text-muted-foreground text-center mt-9"
            style={{ fontSize: 15, lineHeight: 22, maxWidth: 260 }}
          >
            Press your right index finger on your left wrist, over your pulse.
          </Text>
          <Pressable
            onPress={() => {
              setBeats(0)
              setPhase('counting')
            }}
            className="rounded-full mt-auto mb-12 w-full max-w-[260px] py-4 items-center active:opacity-90"
            style={{ backgroundColor: DARK }}
          >
            <Text className="text-white font-sans-bold text-base">I found it</Text>
          </Pressable>
        </View>
      ) : phase === 'complete' ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-foreground font-display text-2xl text-center">That&apos;s the reset.</Text>
          <Text className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
            You just held your attention on one quiet thing for {TARGET} beats. The urge had to wait.
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
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted-foreground text-sm mb-10">
            Tap for each beat you feel.
          </Text>
          <Pressable onPress={tapBeat}>
            <Animated.View
              className="items-center justify-center"
              style={{
                width: 224,
                height: 224,
                borderRadius: 112,
                backgroundColor: ORANGE_HALO,
                borderWidth: 4,
                borderColor: ORANGE,
                transform: [{ scale: pulse }],
              }}
            >
              <Text className="font-display" style={{ fontSize: 72, color: ORANGE }}>
                {beats}
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">of {TARGET} beats</Text>
            </Animated.View>
          </Pressable>
          <Text className="text-muted-foreground text-xs mt-10">Steady. No rush.</Text>
        </View>
      )}
    </View>
  )
}

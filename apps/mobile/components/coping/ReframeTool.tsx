import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Reframing tools (cognitive_reframe category) — REF-01..04 from the design.
 * A single guided reflective flow: a short intro, then the tool's steps shown one
 * at a time, with an optional free-text reflection on the final step (e.g. Future
 * Self Letter). Purely client-side — no AI, no persistence beyond the tool_score
 * check-in the runner hands off to via onDone().
 *
 * Routed by data_model_id from ToolRunner. Content keyed here so a single screen
 * serves all four.
 */
interface Props {
  tool: CopingTool
  onDone: () => void
  /** Completing the reflection reports here (helped) so it feeds tool_score and
   *  skips the caller's generic check-in. Falls back to onDone() when absent. */
  onComplete?: (helped: boolean) => void
}

interface ReframeContent {
  badge: string
  intro: string
  steps: string[]
  /** When set, the final step shows a text box with this placeholder. */
  writePrompt?: string
}

const CONTENT: Record<string, ReframeContent> = {
  urge_surfing: {
    badge: 'RIDE THE WAVE',
    intro: 'A craving is a wave — it rises, peaks, and falls. You just have to stay on the board.',
    steps: [
      'Notice the urge. Where do you feel it?',
      'Describe its shape and intensity, like a weather report.',
      'Watch it rise — and start to fall.',
      'Let it pass. It always does.',
    ],
  },
  future_self_letter: {
    badge: 'WHO YOU’RE BECOMING',
    intro: 'You, one year smoke-free, knows something you don’t yet. Let them tell you.',
    steps: [
      'Picture yourself one year from now, smoke-free.',
      'What would they tell you about this exact moment?',
      'Write three lines from them to you.',
    ],
    writePrompt: 'Dear me,…',
  },
  cost_reframe: {
    badge: 'WHAT IT REALLY COSTS',
    intro: 'This cigarette has a price tag. Make it visible and the autopilot breaks.',
    steps: [
      'Estimate what this pack costs.',
      'Picture what that money buys this week instead.',
      'Choose: the pack, or that.',
    ],
  },
  name_the_trigger: {
    badge: 'NAME IT',
    intro: 'A trigger you can name is a trigger you can manage. Naming reduces its grip.',
    steps: [
      'Pause for a breath.',
      'Ask: what triggered this — stress, boredom, social, after-meal?',
      'Name it in one word.',
      'Now move on.',
    ],
  },
}

const PRIMARY = '#7FC200'

export const ReframeTool: React.FC<Props> = ({ tool, onDone, onComplete }) => {
  const finish = () => (onComplete ? onComplete(true) : onDone())
  const insets = useSafeAreaInsets()
  const content = CONTENT[tool.data_model_id]
  const [started, setStarted] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [note, setNote] = useState('')

  // Unknown reframe tool (shouldn't happen) — fall back to a gentle done screen.
  if (!content) {
    return (
      <View className="flex-1 bg-secondary items-center justify-center px-8" style={{ paddingTop: insets.top }}>
        <Text className="text-foreground font-display text-xl text-center">{tool.name}</Text>
        <Pressable onPress={onDone} className="rounded-full mt-8 px-8 py-4" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-primary-foreground font-sans-bold">Done</Text>
        </Pressable>
      </View>
    )
  }

  const isLastStep = stepIdx === content.steps.length - 1
  const showWrite = content.writePrompt && isLastStep

  const Header = (
    <View className="h-14 flex-row items-center justify-between px-5">
      <Text className="text-foreground font-display text-base">{tool.name}</Text>
      <Pressable onPress={onDone} accessibilityLabel="Close" hitSlop={12}>
        <X size={20} color="#76706C" strokeWidth={2} />
      </Pressable>
    </View>
  )

  if (!started) {
    return (
      <View className="flex-1 bg-secondary">
        {Header}
        <View className="flex-1 items-center px-8">
          <View className="rounded-full px-4 py-2 mt-6 bg-primary/15">
            <Text className="text-primary font-sans-bold text-[11px]" style={{ letterSpacing: 1.2 }}>
              {content.badge}
            </Text>
          </View>
          <Text
            className="text-foreground font-display text-center mt-8"
            style={{ fontSize: 24, lineHeight: 30, maxWidth: 300 }}
          >
            {content.intro}
          </Text>
          <Pressable
            onPress={() => setStarted(true)}
            className="rounded-full mt-auto mb-12 px-8 py-4 active:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            <Text className="text-primary-foreground font-sans-bold text-base">Begin</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
      {Header}
      <ScrollView contentContainerClassName="flex-grow px-8 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mt-4">
          Step {stepIdx + 1} of {content.steps.length}
        </Text>
        <Text
          className="text-foreground font-display mt-3"
          style={{ fontSize: 24, lineHeight: 31 }}
        >
          {content.steps[stepIdx]}
        </Text>

        {showWrite && (
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={content.writePrompt}
            placeholderTextColor="#A8A29E"
            multiline
            className="bg-card border border-border rounded-3xl p-4 mt-6 text-foreground text-base"
            style={{ minHeight: 140, textAlignVertical: 'top' }}
          />
        )}

        <View className="mt-auto pt-10">
          <Pressable
            onPress={() => (isLastStep ? finish() : setStepIdx((i) => i + 1))}
            className="rounded-full py-4 items-center active:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            <Text className="text-primary-foreground font-sans-bold text-base">
              {isLastStep ? 'How are you now?' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

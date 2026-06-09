import React from 'react'
import { View, Text, Pressable } from 'react-native'

export type Stk3Choice = 'didnt_smoke' | 'treat_as_break' | 'did_smoke'

interface ReturnModalLongProps {
  daysMissed: number
  onResolve: (choice: Stk3Choice) => void
}

/**
 * STK-3 — Return Flow, Long Absence (5+ days). Streak Spec §5.
 * Full-screen, gates home entirely: no dismiss, no skip, no back. The streak was
 * already auto-paused at Day 5 of inactivity. Three options; write logic lands in
 * lib/streak.ts (Step 10) — this component only collects intent.
 */
const OPTIONS: { key: Stk3Choice; label: string; hint: string }[] = [
  { key: 'didnt_smoke', label: "I didn't smoke", hint: 'Full credit for the days you were away.' },
  { key: 'treat_as_break', label: 'Treat it as a break', hint: 'Reset the streak and pick up from today.' },
  { key: 'did_smoke', label: 'I did smoke on some days', hint: 'No judgment — we reset and resume.' },
]

export const ReturnModalLong: React.FC<ReturnModalLongProps> = ({
  daysMissed,
  onResolve,
}) => {
  return (
    <View className="flex-1 bg-zinc-950 px-6 justify-center">
      <Text className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-2">
        It&apos;s been a while
      </Text>
      <Text className="text-white text-2xl font-extrabold mb-1">
        You&apos;ve been away {daysMissed} days.
      </Text>
      <Text className="text-zinc-400 text-base mb-8 leading-relaxed">
        We paused your streak so nothing was lost. Where do you want to pick up?
      </Text>

      <View className="gap-3">
        {OPTIONS.map((o) => (
          <Pressable
            key={o.key}
            onPress={() => onResolve(o.key)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 active:bg-zinc-850"
          >
            <Text className="text-white text-base font-semibold">{o.label}</Text>
            <Text className="text-zinc-500 text-xs mt-1 leading-relaxed">{o.hint}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

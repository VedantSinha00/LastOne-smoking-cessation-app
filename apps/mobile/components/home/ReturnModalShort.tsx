import React from 'react'
import { View, Text, Pressable } from 'react-native'

export type Stk2Choice = 'didnt_smoke' | 'one_or_two' | 'smoked_regularly'

interface ReturnModalShortProps {
  daysMissed: number
  onResolve: (choice: Stk2Choice) => void
}

/**
 * STK-2 — Return Modal, Short Absence (1–4 days). Streak Spec §5.
 * Gates the home screen entirely: no dismiss, no skip, no back. The user must
 * pick one of three options. Write logic (add days / consume freeze / break
 * streak) lands in lib/streak.ts (Step 10); this component only collects intent.
 */
const OPTIONS: { key: Stk2Choice; label: string; hint: string }[] = [
  { key: 'didnt_smoke', label: "I didn't smoke", hint: 'Credit those days to your streak.' },
  { key: 'one_or_two', label: 'I had one or two', hint: "We'll use a freeze if you have one." },
  { key: 'smoked_regularly', label: 'I smoked regularly', hint: 'No judgment — we reset and keep going.' },
]

export const ReturnModalShort: React.FC<ReturnModalShortProps> = ({
  daysMissed,
  onResolve,
}) => {
  return (
    <View className="flex-1 bg-zinc-950 px-6 justify-center">
      <Text className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-2">
        Welcome back
      </Text>
      <Text className="text-white text-2xl font-extrabold mb-1">
        You were away for {daysMissed} {daysMissed === 1 ? 'day' : 'days'}.
      </Text>
      <Text className="text-zinc-400 text-base mb-8 leading-relaxed">
        How did those days go? This keeps your streak honest.
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

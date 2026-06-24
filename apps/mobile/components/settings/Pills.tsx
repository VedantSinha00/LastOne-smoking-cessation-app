import React from 'react'
import { View, Text, Pressable } from 'react-native'

/** A wrap of selectable pills — ported from the Lovable ProfileScreen `Pills`:
 *  rounded-full, primary fill when active, muted outline otherwise. The design's
 *  literal tokens (px-3.5 py-1.5 text-xs) render too small/under-padded on
 *  device — web buttons carry more effective height — so we size up a step
 *  (text-sm, py-2, px-4) to match the design's visual weight. Generic over the
 *  option value so callers keep their typed enums. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`rounded-full border px-4 py-2 active:opacity-80 ${
              active ? 'bg-primary border-primary' : 'bg-card border-border'
            }`}
          >
            <Text
              className={`text-sm ${
                active
                  ? 'text-primary-foreground font-sans-semibold'
                  : 'text-muted-foreground font-sans-medium'
              }`}
            >
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

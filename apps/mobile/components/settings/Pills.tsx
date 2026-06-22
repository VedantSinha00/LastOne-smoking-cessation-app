import React from 'react'
import { View, Text, Pressable } from 'react-native'

/** A wrap of small selectable pills — ported from the Lovable ProfileScreen
 *  `Pills`: rounded-full, primary fill when active, muted outline otherwise.
 *  Generic over the option value so callers keep their typed enums. */
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
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`rounded-full border px-3.5 py-1.5 active:opacity-80 ${
              active ? 'bg-primary border-primary' : 'bg-card border-border'
            }`}
          >
            <Text
              className={`text-xs font-sans-medium ${
                active ? 'text-primary-foreground' : 'text-muted-foreground'
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

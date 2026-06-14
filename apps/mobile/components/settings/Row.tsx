import React from 'react'
import { View, Text, Pressable } from 'react-native'

interface RowProps {
  label: string
  value?: string
  /** Tappable rows show a chevron and navigate; read-only rows don't (§5 Flow 1). */
  onPress?: () => void
  /** Tints the label (Delete Account). */
  danger?: boolean
}

/** One PROF-01 settings row: label left, value + chevron right. Generous
 *  vertical padding + a two-line layout for editable rows keeps the value from
 *  crowding the label. */
export const Row: React.FC<RowProps> = ({ label, value, onPress, danger }) => {
  const body = (
    <View className="flex-row items-center justify-between py-4 min-h-[56px]">
      <View className="flex-1 pr-3">
        <Text
          className={`text-base ${danger ? 'text-destructive font-sans-bold' : 'text-foreground font-sans-medium'}`}
        >
          {label}
        </Text>
        {value !== undefined && (
          <Text className="text-muted-foreground text-sm mt-0.5" numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {onPress && <Text className="text-muted-foreground text-xl">›</Text>}
    </View>
  )
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-60">
        {body}
      </Pressable>
    )
  }
  return body
}

/** Section wrapper: label + a card holding the rows with hairline dividers. */
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View>
    <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2.5 ml-1">
      {title}
    </Text>
    <View className="bg-card border border-border rounded-3xl px-5 divide-y divide-border">
      {children}
    </View>
  </View>
)

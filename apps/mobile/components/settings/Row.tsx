import React from 'react'
import { View, Text, Pressable } from 'react-native'

interface RowProps {
  label: string
  value?: string
  /** Tappable rows show a chevron and navigate; read-only rows don't (§5 Flow 1). */
  onPress?: () => void
  /** Tints the label (Delete Account). */
  danger?: boolean
  /** Highlights the value in primary green + semibold (design's "Best streak"). */
  valueAccent?: boolean
}

/** One PROF-01 settings row. Ported to the Lovable ProfileScreen row: each row
 *  is its OWN floating rounded card (border + bg-card) with spacing between rows
 *  — not a grouped list with dividers. Single line: label left, value + chevron
 *  right (matching the design). */
export const Row: React.FC<RowProps> = ({ label, value, onPress, danger, valueAccent }) => {
  const body = (
    <View
      className={`flex-row items-center justify-between rounded-2xl bg-card border px-4 py-3.5 mb-2 ${
        danger ? 'border-destructive/40' : 'border-border'
      }`}
    >
      <Text
        className={`flex-shrink text-sm ${danger ? 'text-destructive font-sans-bold' : 'text-foreground font-sans-medium'}`}
      >
        {label}
      </Text>
      <View className="flex-row items-center pl-3" style={{ gap: 6 }}>
        {value !== undefined && (
          <Text
            className={
              valueAccent
                ? 'text-primary text-sm font-sans-semibold'
                : 'text-muted-foreground text-sm'
            }
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
        {onPress && !danger && <Text className="text-muted-foreground text-xl">›</Text>}
      </View>
    </View>
  )
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-[0.97]">
        {body}
      </Pressable>
    )
  }
  return body
}

/** Section wrapper: an uppercase label above a stack of standalone Row cards
 *  (rows carry their own card chrome + spacing, matching the design). */
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View>
    <Text className="text-muted-foreground text-[10px] font-sans-semibold uppercase tracking-[0.18em] mb-3 ml-1">
      {title}
    </Text>
    {children}
  </View>
)

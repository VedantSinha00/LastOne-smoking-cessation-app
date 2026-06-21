import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { ScreenHeader } from '../ui/ScreenHeader'
import type { BreakdownRow } from '../../lib/insights'

/**
 * A ranked distribution view used by the Insights Explore destinations that map
 * to spec data (Triggers / People / Places). Renders a labelled bar per token
 * with its share of the total, plus an empty state when nothing's been logged.
 *
 * Pure presentation — the caller supplies pre-aggregated rows (lib/insights
 * triggerBreakdown / socialBreakdown / locationBreakdown) and a label resolver.
 */
interface Props {
  title: string
  /** short caption under the title, e.g. "What sets off your cravings" */
  caption: string
  rows: BreakdownRow[]
  total: number
  /** maps a stored token to its display label (falls back to the raw key) */
  labelFor: (key: string) => string
  /** copy shown when no rows exist yet */
  emptyText: string
  onBack: () => void
}

export const BreakdownView: React.FC<Props> = ({
  title,
  caption,
  rows,
  total,
  labelFor,
  emptyText,
  onBack,
}) => {
  const max = rows.length > 0 ? rows[0].count : 0
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={title} onBack={onBack} />
      <ScrollView className="flex-1" contentContainerClassName="p-5 gap-4 pb-12">
        {rows.length === 0 ? (
          <View className="bg-card border border-border rounded-3xl p-5">
            <Text className="text-muted-foreground text-sm leading-relaxed">{emptyText}</Text>
          </View>
        ) : (
          <>
            <Text className="text-muted-foreground text-sm leading-relaxed px-1">{caption}</Text>
            <View className="bg-card border border-border rounded-3xl p-5" style={{ gap: 16 }}>
              {rows.map((r) => {
                const fill = max > 0 ? r.count / max : 0
                return (
                  <View key={r.key} style={{ gap: 6 }}>
                    <View className="flex-row justify-between items-baseline">
                      <Text className="text-foreground text-[15px]">{labelFor(r.key)}</Text>
                      <Text className="text-muted-foreground text-sm">{Math.round(r.pct * 100)}%</Text>
                    </View>
                    <View className="h-2 rounded-full bg-muted overflow-hidden">
                      <View
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(4, fill * 100)}%` }}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
            <Text className="text-muted-foreground text-xs text-center mt-1">
              Based on {total} logged {total === 1 ? 'entry' : 'entries'}.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  )
}

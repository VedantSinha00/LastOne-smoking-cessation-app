import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import {
  Zap,
  Frown,
  Users,
  User,
  Heart,
  Coffee,
  Sun,
  Laptop,
  Sparkles,
  Home,
  Briefcase,
  Car,
  HelpCircle,
  MapPin,
} from 'lucide-react-native'
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

const KEY_ICONS: Record<string, any> = {
  // Triggers
  stress: Zap,
  boredom: Frown,
  social: Users,
  after_meal: Coffee,
  morning: Sun,
  alcohol: Sparkles,
  study_work: Laptop,
  anxiety: HelpCircle,
  celebration: Sparkles,
  craving: Zap,

  // Locations
  home: Home,
  work: Briefcase,
  outside: MapPin,
  tapri: Coffee,
  car: Car,
  party: Sparkles,

  // Social
  alone: User,
  friends: Users,
  family: Heart,
  colleagues: Briefcase,
  strangers: Users,
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
  const lowerTitle = title.toLowerCase()
  const isTriggers = lowerTitle.includes('trigger')
  const isPeople = lowerTitle.includes('people')

  const EmptyIcon = isTriggers ? Zap : isPeople ? Users : MapPin
  const emptyColor = isTriggers ? '#F15025' : isPeople ? '#7FC200' : '#268255'
  const emptyBg = isTriggers ? '#FFF1EB' : isPeople ? '#F3F8E6' : '#E6F4D6'

  const defaultRowIcon = isTriggers ? Zap : isPeople ? Users : MapPin

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={title} onBack={onBack} />
      <ScrollView className="flex-1" contentContainerClassName="p-5 gap-4 pb-12">
        {rows.length === 0 ? (
          <View className="bg-card border border-border rounded-3xl p-8 items-center justify-center">
            <View className="h-16 w-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: emptyBg }}>
              <EmptyIcon size={32} color={emptyColor} strokeWidth={2} />
            </View>
            <Text className="text-foreground font-display text-lg text-center mb-2">
              No data logged yet
            </Text>
            <Text className="text-muted-foreground text-sm text-center leading-relaxed px-2">
              {emptyText}
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-muted-foreground text-sm leading-relaxed px-1">{caption}</Text>
            <View className="bg-card border border-border rounded-3xl p-5" style={{ gap: 18 }}>
              {rows.map((r) => {
                const fill = max > 0 ? r.count / max : 0
                const RowIcon = KEY_ICONS[r.key] ?? defaultRowIcon
                return (
                  <View key={r.key} className="flex-row items-center" style={{ gap: 12 }}>
                    <View className="h-9 w-9 rounded-xl items-center justify-center bg-muted">
                      <RowIcon size={16} color="#76706C" strokeWidth={2} />
                    </View>
                    <View className="flex-1" style={{ gap: 4 }}>
                      <View className="flex-row justify-between items-baseline">
                        <Text className="text-foreground font-sans-medium text-[15px]">{labelFor(r.key)}</Text>
                        <Text className="text-muted-foreground text-sm font-sans-bold">{Math.round(r.pct * 100)}%</Text>
                      </View>
                      <View className="h-2 rounded-full bg-muted overflow-hidden">
                        <View
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(4, fill * 100)}%` }}
                        />
                      </View>
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

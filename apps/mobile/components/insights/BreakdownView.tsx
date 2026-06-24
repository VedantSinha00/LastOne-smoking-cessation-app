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
 * Ranked distribution for the Insights Explore destinations that map to spec data
 * (Triggers / People / Places). `BreakdownInline` is the reusable body (rows +
 * caption + empty state) — used both inline on the hub (expandable pill) and by
 * the full-screen `BreakdownView` wrapper. One source of truth for the row visual.
 */
interface InlineProps {
  caption: string
  rows: BreakdownRow[]
  total: number
  /** maps a stored token to its display label (falls back to the raw key) */
  labelFor: (key: string) => string
  /** copy shown when no rows exist yet */
  emptyText: string
  /** which icon family to fall back to for unknown keys / the empty state */
  kind: 'triggers' | 'people' | 'places'
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

const KIND_FALLBACK = {
  triggers: { Icon: Zap, color: '#F15025', bg: '#FFF1EB' },
  people: { Icon: Users, color: '#7FC200', bg: '#F3F8E6' },
  places: { Icon: MapPin, color: '#268255', bg: '#E6F4D6' },
} as const

export const BreakdownInline: React.FC<InlineProps> = ({
  caption,
  rows,
  total,
  labelFor,
  emptyText,
  kind,
}) => {
  const max = rows.length > 0 ? rows[0].count : 0
  const fb = KIND_FALLBACK[kind]

  if (rows.length === 0) {
    return (
      <View className="items-center justify-center py-4">
        <View className="h-14 w-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: fb.bg }}>
          <fb.Icon size={28} color={fb.color} strokeWidth={2} />
        </View>
        <Text className="text-foreground font-display text-base text-center mb-1.5">
          No data logged yet
        </Text>
        <Text className="text-muted-foreground text-sm text-center leading-relaxed px-2">
          {emptyText}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ gap: 16 }}>
      <Text className="text-muted-foreground text-sm leading-relaxed">{caption}</Text>
      <View style={{ gap: 18 }}>
        {rows.map((r) => {
          const fill = max > 0 ? r.count / max : 0
          const RowIcon = KEY_ICONS[r.key] ?? fb.Icon
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
                  <View className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, fill * 100)}%` }} />
                </View>
              </View>
            </View>
          )
        })}
      </View>
      <Text className="text-muted-foreground text-xs text-center">
        Based on {total} logged {total === 1 ? 'entry' : 'entries'}.
      </Text>
    </View>
  )
}

// ── Full-screen wrapper (kept for any callers that still navigate) ────────────
interface Props extends InlineProps {
  title: string
  onBack: () => void
}

export const BreakdownView: React.FC<Props> = ({ title, onBack, ...inline }) => (
  <View className="flex-1 bg-background">
    <ScreenHeader title={title} onBack={onBack} />
    <ScrollView className="flex-1" contentContainerClassName="p-5 gap-4 pb-12">
      <BreakdownInline {...inline} />
    </ScrollView>
  </View>
)

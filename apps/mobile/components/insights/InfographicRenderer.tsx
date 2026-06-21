import React from 'react'
import { View, Text } from 'react-native'
import { Flame, Bell, Clock } from 'lucide-react-native'
import type {
  InfographicSpec,
  InfographicBarRow,
  InfographicWindowRow,
  InfographicSplitSide,
} from '../../lib/insightInfographic'

/**
 * Renders an InfographicSpec using a finite set of chart primitives. One switch
 * on `spec.kind` — adding a new graphic kind = add a branch here + the variant in
 * lib/insightInfographic. Cards stay generic; they never reference a primitive.
 */
export const InfographicRenderer: React.FC<{ spec: InfographicSpec }> = ({ spec }) => {
  switch (spec.kind) {
    case 'bars':
      return <BarsChart title={spec.title} rows={spec.rows} />
    case 'windows':
      return <WindowsChart title={spec.title} rows={spec.rows} />
    case 'split':
      return <SplitChart title={spec.title} left={spec.left} right={spec.right} />
    default:
      return null
  }
}

// shared section title
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text className="text-muted-foreground text-[11px] font-sans-bold uppercase tracking-wider">
    {children}
  </Text>
)

// ── Primitive: horizontal distribution bars ──────────────────────────────────
// Hierarchy: the leading row (rank 0) is emphasised — full-strength green bar,
// bold label, larger percent. Subsequent rows recede (muted bar + label) so the
// eye lands on what dominates rather than reading a flat list.
const BarsChart: React.FC<{ title: string; rows: InfographicBarRow[] }> = ({ title, rows }) => {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1
  return (
    <View style={{ gap: 16 }}>
      <SectionTitle>{title}</SectionTitle>
      <View style={{ gap: 18 }}>
        {rows.map((r, i) => {
          const lead = i === 0
          const barColor = r.color ?? (lead ? '#7FC200' : '#C8E59A')
          return (
            <View key={r.label} style={{ gap: 8 }}>
              <View className="flex-row justify-between items-center">
                <Text
                  className={lead ? 'text-foreground font-sans-bold' : 'text-muted-foreground font-sans-medium'}
                  style={{ fontSize: lead ? 15 : 13, lineHeight: lead ? 20 : 18 }}
                >
                  {r.label}
                </Text>
                <Text
                  className={lead ? 'text-foreground font-sans-bold' : 'text-muted-foreground'}
                  style={{ fontSize: lead ? 15 : 12, lineHeight: lead ? 20 : 16 }}
                >
                  {r.display}
                </Text>
              </View>
              <View
                className="rounded-full overflow-hidden"
                style={{ height: lead ? 10 : 8, backgroundColor: '#EFEDEA' }}
              >
                <View
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(4, (r.value / max) * 100)}%`, backgroundColor: barColor }}
                />
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// ── Primitive: time-window rows ──────────────────────────────────────────────
// Colour-banded by intensity tone (matches the design's CravingsView windows).
const WINDOW_TONE: Record<InfographicWindowRow['tone'], { bg: string; fg: string }> = {
  high: { bg: '#FFF0EB', fg: '#F15025' },
  medium: { bg: '#FAEEDA', fg: '#633806' },
  low: { bg: '#F0F9E6', fg: '#27500A' },
}
const WindowsChart: React.FC<{ title: string; rows: InfographicWindowRow[] }> = ({ title, rows }) => (
  <View style={{ gap: 16 }}>
    <SectionTitle>{title}</SectionTitle>
    <View style={{ gap: 10 }}>
      {rows.map((r) => {
        const tone = WINDOW_TONE[r.tone]
        const Icon = r.tone === 'high' ? Flame : r.tone === 'medium' ? Bell : Clock
        return (
          <View
            key={r.label}
            className="flex-row items-center rounded-xl"
            style={{ backgroundColor: tone.bg, paddingVertical: 12, paddingHorizontal: 16, gap: 10 }}
          >
            <Icon size={16} color={tone.fg} strokeWidth={2.5} />
            <View className="flex-1 flex-row items-center justify-between">
              <Text className="font-sans-bold" style={{ fontSize: 14, color: tone.fg }}>
                {r.label}
              </Text>
              <Text style={{ fontSize: 12, color: tone.fg, opacity: 0.85 }}>{r.caption}</Text>
            </View>
          </View>
        )
      })}
    </View>
  </View>
)

// ── Primitive: two-number split (e.g. beaten vs smoked) ──────────────────────
const SplitChart: React.FC<{
  title: string
  left: InfographicSplitSide
  right: InfographicSplitSide
}> = ({ title, left, right }) => (
  <View style={{ gap: 16 }}>
    <SectionTitle>{title}</SectionTitle>
    <View className="flex-row" style={{ gap: 12 }}>
      <View
        className="flex-1 rounded-2xl items-center justify-center p-4 border border-border bg-card"
        style={{
          shadowColor: '#15110D',
          shadowOpacity: 0.03,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <Text className="font-sans-bold" style={{ fontSize: 32, color: left.color, letterSpacing: -0.5 }}>
          {left.value}
        </Text>
        <Text className="text-muted-foreground text-[11px] font-sans-bold uppercase tracking-wider mt-1">
          {left.label}
        </Text>
      </View>
      <View
        className="flex-1 rounded-2xl items-center justify-center p-4 border border-border bg-card"
        style={{
          shadowColor: '#15110D',
          shadowOpacity: 0.03,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <Text className="font-sans-bold" style={{ fontSize: 32, color: right.color, letterSpacing: -0.5 }}>
          {right.value}
        </Text>
        <Text className="text-muted-foreground text-[11px] font-sans-bold uppercase tracking-wider mt-1">
          {right.label}
        </Text>
      </View>
    </View>
  </View>
)

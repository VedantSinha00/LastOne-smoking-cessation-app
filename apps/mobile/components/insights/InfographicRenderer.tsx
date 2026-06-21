import React from 'react'
import { View, Text } from 'react-native'
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
        return (
          <View
            key={r.label}
            className="flex-row items-center justify-between rounded-xl"
            style={{ backgroundColor: tone.bg, paddingVertical: 12, paddingHorizontal: 16 }}
          >
            <Text className="font-sans-bold" style={{ fontSize: 14, color: tone.fg }}>
              {r.label}
            </Text>
            <Text style={{ fontSize: 12, color: tone.fg }}>{r.caption}</Text>
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
    <View className="flex-row">
      <SplitSide side={left} divider />
      <SplitSide side={right} />
    </View>
  </View>
)
const SplitSide: React.FC<{ side: InfographicSplitSide; divider?: boolean }> = ({ side, divider }) => (
  <View
    className="flex-1 items-center"
    style={divider ? { borderRightWidth: 1, borderRightColor: '#E8E8E8' } : undefined}
  >
    <Text className="font-sans-bold" style={{ fontSize: 44, lineHeight: 48, color: side.color }}>
      {side.value}
    </Text>
    <Text className="text-muted-foreground" style={{ fontSize: 13, marginTop: 4 }}>
      {side.label}
    </Text>
  </View>
)

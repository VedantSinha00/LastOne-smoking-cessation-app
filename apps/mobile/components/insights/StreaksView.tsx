import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { ScreenHeader } from '../ui/ScreenHeader'
import { SectionLabel } from '../ui/SectionLabel'

/**
 * Streaks — the design's StreaksView ported: current/best stats, a month
 * calendar (smoke-free / slip / today / future), and a history summary. All real:
 * stats from streak_record, slip days from the slip logs, smoke-free derived from
 * the quit date (any past day on/after quit that wasn't a slip).
 */
interface Props {
  currentStreak: number
  bestStreak: number
  totalSmokeFree: number
  /** local yyyy-MM-dd quit date (start of the smoke-free window), or null */
  quitDate: string | null
  /** set of local yyyy-MM-dd dates that had a slip */
  slipDays: Set<string>
  onBack: () => void
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type CellTone = 'today' | 'future' | 'slip' | 'smokefree' | 'prequit'

export const StreaksView: React.FC<Props> = ({
  currentStreak,
  bestStreak,
  totalSmokeFree,
  quitDate,
  slipDays,
  onBack,
}) => {
  const now = new Date()
  const todayKey = ymd(now)
  // Month being viewed (1st of month). Defaults to the current month.
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))

  const year = month.getFullYear()
  const monthIdx = month.getMonth()
  const firstWeekday = new Date(year, monthIdx, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIdx, d))

  const toneOf = (d: Date): CellTone => {
    const key = ymd(d)
    if (key === todayKey) return 'today'
    if (d.getTime() > now.getTime()) return 'future'
    if (slipDays.has(key)) return 'slip'
    if (quitDate && key >= quitDate) return 'smokefree'
    return 'prequit'
  }

  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && monthIdx < now.getMonth())
  const stepMonth = (delta: number) => setMonth(new Date(year, monthIdx + delta, 1))

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Streaks" onBack={onBack} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}>
        {/* Right now — current + best */}
        <SectionLabel>Right now</SectionLabel>
        <View className="flex-row" style={cardStyle}>
          <View className="flex-1 items-center" style={{ borderRightWidth: 1, borderRightColor: '#E8E8E8' }}>
            <Text style={{ fontSize: 12, color: '#888888' }}>Current streak</Text>
            <Text className="text-primary font-sans-bold" style={{ fontSize: 52, lineHeight: 56, marginTop: 4 }}>
              {currentStreak}
            </Text>
            <Text style={{ fontSize: 13, color: '#888888', marginTop: 4 }}>days</Text>
          </View>
          <View className="flex-1 items-center">
            <Text style={{ fontSize: 12, color: '#888888' }}>Best streak</Text>
            <Text className="font-sans-bold" style={{ fontSize: 52, lineHeight: 56, marginTop: 4, color: '#0D0D0D' }}>
              {bestStreak}
            </Text>
            <Text style={{ fontSize: 13, color: '#888888', marginTop: 4 }}>days</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={{ marginTop: 28 }}>
          <SectionLabel>{`${MONTHS[monthIdx]} ${year}`}</SectionLabel>
          <View style={cardStyle}>
            <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
              <Pressable onPress={() => stepMonth(-1)} hitSlop={10}>
                <ChevronLeft size={20} color="#AAAAAA" strokeWidth={2} />
              </Pressable>
              <Text className="font-sans-bold" style={{ fontSize: 15, color: '#0D0D0D' }}>
                {`${MONTHS[monthIdx]} ${year}`}
              </Text>
              <Pressable onPress={() => canGoNext && stepMonth(1)} hitSlop={10} disabled={!canGoNext}>
                <ChevronRight size={20} color={canGoNext ? '#AAAAAA' : '#E8E8E8'} strokeWidth={2} />
              </Pressable>
            </View>

            <View className="flex-row" style={{ marginBottom: 6 }}>
              {DAY_LABELS.map((d, i) => (
                <Text key={i} className="flex-1 text-center" style={{ fontSize: 11, color: '#AAAAAA' }}>
                  {d}
                </Text>
              ))}
            </View>

            {/* weeks */}
            <View style={{ gap: 4 }}>
              {chunk(cells, 7).map((week, wi) => (
                <View key={wi} className="flex-row" style={{ gap: 4 }}>
                  {week.map((d, di) => (
                    <DayCell key={di} date={d} tone={d ? toneOf(d) : null} />
                  ))}
                </View>
              ))}
            </View>

            {/* legend */}
            <View className="flex-row justify-center" style={{ gap: 16, marginTop: 12 }}>
              <Legend color="#84C524" label="Smoke-free" />
              <Legend color="#FCEBEB" border="#F09595" label="Slip" />
              <Legend color="#143109" label="Today" />
            </View>
          </View>
        </View>

        {/* History */}
        <View style={{ marginTop: 28 }}>
          <SectionLabel>History</SectionLabel>
          <View style={cardStyle}>
            <HistoryRow label="Current streak" value={`${currentStreak} days`} first />
            <HistoryRow label="Best streak" value={`${bestStreak} days`} />
            <HistoryRow label="Total smoke-free days" value={`${totalSmokeFree} days`} />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ── pieces ───────────────────────────────────────────────────────────────────
const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const

const CELL_STYLE: Record<CellTone, { bg: string; fg: string; bold?: boolean; border?: string }> = {
  today: { bg: '#143109', fg: '#FFFFFF', bold: true },
  future: { bg: 'transparent', fg: '#BBBBBB' },
  slip: { bg: '#FCEBEB', fg: '#A32D2D', border: '#F09595' },
  smokefree: { bg: '#84C524', fg: '#FFFFFF' },
  prequit: { bg: 'transparent', fg: '#BBBBBB' },
}

const DayCell: React.FC<{ date: Date | null; tone: CellTone | null }> = ({ date, tone }) => {
  if (!date || !tone) return <View className="flex-1" style={{ aspectRatio: 1 }} />
  const s = CELL_STYLE[tone]
  return (
    <View
      className="flex-1 items-center justify-center rounded-full"
      style={{
        aspectRatio: 1,
        backgroundColor: s.bg,
        ...(s.border ? { borderWidth: 1, borderColor: s.border } : null),
      }}
    >
      <Text style={{ fontSize: 12, color: s.fg, fontWeight: s.bold ? '700' : '500' }}>
        {date.getDate()}
      </Text>
    </View>
  )
}

const Legend: React.FC<{ color: string; border?: string; label: string }> = ({ color, border, label }) => (
  <View className="flex-row items-center" style={{ gap: 6 }}>
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        ...(border ? { borderWidth: 1, borderColor: border } : null),
      }}
    />
    <Text style={{ fontSize: 11, color: '#888888' }}>{label}</Text>
  </View>
)

const HistoryRow: React.FC<{ label: string; value: string; first?: boolean }> = ({ label, value, first }) => (
  <View
    className="flex-row items-center justify-between"
    style={{ paddingVertical: 12, ...(first ? null : { borderTopWidth: 1, borderTopColor: '#E8E8E8' }) }}
  >
    <Text className="font-sans-bold" style={{ fontSize: 14, color: '#0D0D0D' }}>{label}</Text>
    <Text style={{ fontSize: 13, color: '#888888' }}>{value}</Text>
  </View>
)

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

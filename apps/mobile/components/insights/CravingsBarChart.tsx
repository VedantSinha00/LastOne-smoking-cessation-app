import React from 'react'
import { View, Text } from 'react-native'
import Svg, { Rect } from 'react-native-svg'

/**
 * "Cravings This Week" bar chart — ported from the Lovable InsightsScreen chart,
 * rebuilt in react-native-svg (the design used recharts/web). Bars are colour-
 * graded by relative height (calm green → orange → red for the hardest day), and
 * the hardest day is called out below. Data is real (metrics.weeklyCravings).
 */
interface Props {
  data: { dayLabel: string; dayFull: string; count: number }[]
}

// low → high intensity colour ramp (design's calm-green → orange → red)
function barColor(ratio: number): string {
  if (ratio >= 0.85) return '#F15025' // hardest — craving orange/red
  if (ratio >= 0.6) return '#E19100' // warning amber
  if (ratio >= 0.35) return '#7FC200' // primary green
  return '#CDE7A6' // calm light green
}

export const CravingsBarChart: React.FC<Props> = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.count))
  const hardest = data.reduce((a, b) => (b.count > a.count ? b : a), data[0])

  const W = 320
  const H = 150
  const gap = 12
  const barW = (W - gap * (data.length - 1)) / data.length

  return (
    <View className="bg-card border border-border rounded-3xl p-5">
      <View style={{ height: H + 24 }}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet">
          {data.map((d, i) => {
            const ratio = d.count / max
            const barH = Math.max(6, ratio * (H - 10))
            const x = i * (barW + gap)
            const y = H - barH
            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={barColor(ratio)}
              />
            )
          })}
        </Svg>
        {/* day labels */}
        <View className="flex-row justify-between mt-2" style={{ width: '100%' }}>
          {data.map((d, i) => (
            <Text key={i} className="text-muted-foreground text-xs text-center" style={{ flex: 1 }}>
              {d.dayLabel}
            </Text>
          ))}
        </View>
      </View>

      {hardest && hardest.count > 0 && (
        <Text className="text-muted-foreground text-sm text-center mt-3 leading-relaxed">
          {hardest.dayFull} was your hardest day this week.
        </Text>
      )}
    </View>
  )
}

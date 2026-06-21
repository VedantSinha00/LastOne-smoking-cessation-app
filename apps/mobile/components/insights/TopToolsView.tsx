import React from 'react'
import { View, Text, ScrollView, StyleSheet, type ViewStyle } from 'react-native'
import { Wrench } from 'lucide-react-native'
import { ScreenHeader } from '../ui/ScreenHeader'
import { SectionLabel } from '../ui/SectionLabel'
import type { ToolStats } from '../../lib/insights'

// RN translation of the design's `cardStyle` (white, radius 16, padding 20, soft
// shadow). iOS uses shadow*, Android uses elevation — both approximate the
// design's `0px 2px 12px rgba(0,0,0,0.07)`.
const designCard: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  ...StyleSheet.flatten({
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  }),
}

/**
 * Top tools — the design's ToolStatsView ported 1:1: a 5-section dashboard
 * (summary, most used, effectiveness bars, used-most-after chips, best-tool hero).
 * All metrics are real (lib/insights toolStats): uses from tool_selected, the
 * effectiveness % from tool_helpful ("thumbs up"), triggers from triggers[].
 */
interface Props {
  stats: ToolStats
  /** tool_id -> display name (falls back to the id) */
  labelFor: (tool: string) => string
  /** tool_id -> "BRE-01 · Breathing" style sub-label */
  subFor: (tool: string) => string
  /** trigger token -> display label */
  triggerLabel: (key: string) => string
  onBack: () => void
}

export const TopToolsView: React.FC<Props> = ({ stats, labelFor, subFor, triggerLabel, onBack }) => {
  const { triedCount, totalToolCount, totalUses, mostUsed, effectiveness, topTriggers, bestTool } =
    stats
  const progressPct = totalToolCount > 0 ? Math.round((triedCount / totalToolCount) * 100) : 0

  if (mostUsed.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Top tools" onBack={onBack} />
        <ScrollView className="flex-1" contentContainerClassName="p-5 gap-4 pb-12">
          <View className="bg-card border border-border rounded-3xl p-5">
            <Text className="text-muted-foreground text-sm leading-relaxed">
              Once you start using a coping tool when a craving hits, you{'’'}ll see which ones
              work best for you here.
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Top tools" onBack={onBack} />
      {/* contentContainer: design container is `padding: "0 20px", marginTop: 8` */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}>
        {/* Summary card — design: bg #F0F9E6, radius 16, padding 16x18 */}
        <View style={{ backgroundColor: '#F0F9E6', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18 }}>
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text className="font-sans-bold" style={{ fontSize: 16, lineHeight: 22, color: '#143109' }}>
                {triedCount} of {totalToolCount} tools tried
              </Text>
              <Text style={{ fontSize: 12, lineHeight: 17, color: '#27500A', marginTop: 2 }}>
                Try more during calm moments
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-sans-bold" style={{ fontSize: 22, lineHeight: 28, color: '#143109' }}>
                {totalUses}×
              </Text>
              <Text style={{ fontSize: 11, lineHeight: 15, color: '#27500A' }}>total uses</Text>
            </View>
          </View>
          <View
            className="rounded-full overflow-hidden"
            style={{ marginTop: 12, height: 4, backgroundColor: '#D4F075' }}
          >
            <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#143109' }} />
          </View>
        </View>

        {/* Most used — design: cardStyle (white, radius 16, padding 20), rows padding 12x0 */}
        <View style={{ marginTop: 24 }}>
          <SectionLabel>Most used</SectionLabel>
          <View style={designCard}>
            {mostUsed.slice(0, 4).map((r, i) => (
              <View
                key={r.tool}
                className="flex-row items-center justify-between"
                style={{ paddingVertical: 12, ...(i > 0 ? { borderTopWidth: 1, borderTopColor: '#E8E8E8' } : null) }}
              >
                <View className="flex-1 pr-3">
                  <Text className="font-sans-bold" style={{ fontSize: 15, lineHeight: 21, color: '#0D0D0D' }}>
                    {labelFor(r.tool)}
                  </Text>
                  <Text style={{ fontSize: 12, lineHeight: 17, marginTop: 2, color: '#888888' }}>
                    {subFor(r.tool)}
                  </Text>
                </View>
                <Text className="font-sans-bold" style={{ fontSize: 15, lineHeight: 21, color: '#84C524' }}>
                  {r.uses}× <Text className="font-sans" style={{ fontSize: 12, color: '#888888' }}>used</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Effectiveness — design: rows gap 16, bar h4 #E8E8E8 / fill #84C524 */}
        {effectiveness.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <SectionLabel>Effectiveness</SectionLabel>
            <View style={designCard}>
              <View style={{ gap: 16 }}>
                {effectiveness.map((e) => {
                  const pct = Math.round((e.helpfulRate ?? 0) * 100)
                  return (
                    <View key={e.tool}>
                      <View className="flex-row justify-between items-center" style={{ marginBottom: 6 }}>
                        <Text className="font-sans-bold" style={{ fontSize: 14, color: '#0D0D0D' }}>{labelFor(e.tool)}</Text>
                        <Text className="font-sans-bold" style={{ fontSize: 13, color: '#0D0D0D' }}>{pct}%</Text>
                      </View>
                      <View className="rounded-full overflow-hidden" style={{ height: 4, backgroundColor: '#E8E8E8' }}>
                        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#84C524' }} />
                      </View>
                    </View>
                  )
                })}
              </View>
              <Text style={{ marginTop: 14, fontSize: 11, color: '#AAAAAA' }}>
                Based on thumbs up after each tool.
              </Text>
            </View>
          </View>
        )}

        {/* Used most after — design: intro 13px #555, chips bg #F0EFED radius full padding 6x14 */}
        {topTriggers.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <SectionLabel>Used most after</SectionLabel>
            <View style={designCard}>
              <Text style={{ marginBottom: 12, fontSize: 13, lineHeight: 19, color: '#555555' }}>
                Triggers that most commonly preceded your SOS use.
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {topTriggers.map((t) => (
                  <View key={t} className="rounded-full" style={{ backgroundColor: '#F0EFED', paddingVertical: 6, paddingHorizontal: 14 }}>
                    <Text className="font-sans-medium" style={{ fontSize: 13, lineHeight: 18, color: '#0D0D0D' }}>
                      {triggerLabel(t)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Your best tool — design: circle 56 #E6F4D6, name 16/700 #0D0D0D, sub 12 #888, link 13/600 #84C524 */}
        {bestTool && (
          <View style={{ marginTop: 24 }}>
            <SectionLabel>Your best tool</SectionLabel>
            <View className="flex-row items-center" style={{ ...designCard, gap: 14 }}>
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 56, height: 56, backgroundColor: '#E6F4D6' }}
              >
                <Wrench size={22} color="#27500A" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold" style={{ fontSize: 16, lineHeight: 22, color: '#0D0D0D' }}>
                  {labelFor(bestTool.tool)}
                </Text>
                <Text style={{ fontSize: 12, lineHeight: 17, marginTop: 2, color: '#888888' }}>
                  Works {Math.round((bestTool.helpfulRate ?? 0) * 100)}% of the time for you
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

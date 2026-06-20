import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import type { Database } from '../../types/database'
import { TOOL_CONTENT } from '../../lib/toolContent'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Tool intro / detail screen — ported from the Lovable `ToolDetailView`. Shown
 * when a tool is tapped, before the exercise runs:
 *   TopBar (name + back) → family-coloured hero (〜 + name + "ID · family · duration")
 *   → quick-stats card (Best for / Context / Used by you) → How it works → Steps
 *   → "Try it now" button.
 *
 * Best for / Context / Used-by-you derive from real data; How-it-works + Steps come
 * from TOOL_CONTENT (ported design copy, keyed by data_model_id). If a tool has no
 * content entry yet, those two sections are simply omitted.
 */
interface Props {
  tool: CopingTool
  /** Family colours: bg (hero), fg (hero/accent text). */
  bg: string
  fg: string
  familyLabel: string
  /** user_tool_scores.total_uses for "Used by you" (0 if none). */
  totalUses: number
  onTryIt: () => void
  onBack: () => void
}

const GREEN = '#84C524'

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)} min`
}

function bestFor(tool: CopingTool): string {
  if (tool.intensity_min === tool.intensity_max) return `Intensity ${tool.intensity_max}`
  return `Intensity ${tool.intensity_min}-${tool.intensity_max}`
}

function formatContext(context: string[] | null): string {
  if (!context || context.length === 0) return 'Anywhere'
  const c = context[0]
  return c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')
}

const StatRow: React.FC<{ label: string; value: string; valueColor: string; first?: boolean }> = ({
  label,
  value,
  valueColor,
  first,
}) => (
  <View
    className="flex-row items-center justify-between"
    style={{
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderTopWidth: first ? 0 : 1,
      borderTopColor: '#E8E8E8',
    }}
  >
    <Text style={{ fontSize: 14, color: '#0D0D0D' }}>{label}</Text>
    <Text className="font-sans-bold" style={{ fontSize: 14, color: valueColor }}>
      {value}
    </Text>
  </View>
)

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text
    className="font-sans-medium"
    style={{ fontSize: 11, color: '#AAAAAA', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}
  >
    {children}
  </Text>
)

export const ToolIntroScreen: React.FC<Props> = ({
  tool,
  bg,
  fg,
  familyLabel,
  totalUses,
  onTryIt,
  onBack,
}) => {
  const insets = useSafeAreaInsets()
  const content = TOOL_CONTENT[tool.data_model_id]

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* TopBar */}
      <View className="h-14 flex-row items-center justify-center px-5">
        <Pressable onPress={onBack} hitSlop={12} style={{ position: 'absolute', left: 20 }} accessibilityLabel="Back">
          <ArrowLeft size={22} color="#0D0D0D" strokeWidth={2} />
        </Pressable>
        <Text className="font-display" style={{ fontSize: 16, color: '#0D0D0D' }} numberOfLines={1}>
          {tool.name}
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-12" contentContainerStyle={{ paddingTop: 8 }}>
        {/* Hero */}
        <View style={{ backgroundColor: bg, borderRadius: 16, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 28, marginBottom: 8, color: fg }}>〜</Text>
          <Text className="font-sans-bold" style={{ fontSize: 22, color: fg }}>
            {tool.name}
          </Text>
          <Text className="font-sans-medium" style={{ fontSize: 13, color: fg, marginTop: 4 }}>
            {tool.tool_id} · {familyLabel} · {formatDuration(tool.duration_seconds)}
          </Text>
        </View>

        {/* Quick stats */}
        <View className="bg-card" style={{ borderRadius: 16, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <StatRow label="Best for" value={bestFor(tool)} valueColor="#AAAAAA" first />
          <StatRow label="Context" value={formatContext(tool.context)} valueColor="#AAAAAA" />
          <StatRow label="Used by you" value={`${totalUses} ${totalUses === 1 ? 'time' : 'times'}`} valueColor={GREEN} />
        </View>

        {/* How it works */}
        {content?.howItWorks ? (
          <View style={{ marginTop: 20 }}>
            <SectionLabel>How it works</SectionLabel>
            <Text style={{ fontSize: 14, color: '#555555', lineHeight: 22 }}>{content.howItWorks}</Text>
          </View>
        ) : null}

        {/* Steps */}
        {content?.steps?.length ? (
          <View style={{ marginTop: 20 }}>
            <SectionLabel>Steps</SectionLabel>
            <View style={{ gap: 6 }}>
              {content.steps.map((s, i) => (
                <View key={i} className="flex-row" style={{ gap: 8 }}>
                  <Text style={{ fontSize: 14, color: '#0D0D0D' }}>{i + 1}.</Text>
                  <Text style={{ fontSize: 14, color: '#0D0D0D', flex: 1, lineHeight: 20 }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Try it now */}
        <Pressable
          onPress={onTryIt}
          className="rounded-2xl items-center"
          style={{ marginTop: 24, paddingVertical: 16, backgroundColor: '#143109' }}
        >
          <Text className="font-sans-bold text-white" style={{ fontSize: 16 }}>
            Try it now
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

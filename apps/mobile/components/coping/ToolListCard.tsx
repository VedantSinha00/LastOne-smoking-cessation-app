import React from 'react'
import { View, Text, Pressable } from 'react-native'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * A single tool row in a family's tool list — ported from the Lovable `ToolCard`
 * (InsightsScreen): a family-coloured circle, the tool name, a "duration · context"
 * sub-line, an intensity row of 5 dots (filled to intensity_max in the family
 * colour), and a right-side chip showing the tool ID — or "Library" (grey) for
 * library-only tools. White card, rounded-16, soft shadow.
 *
 * All values are real coping_tools fields: name, duration_seconds, context[],
 * intensity_max, tool_id, library_only. Tapping runs the tool via the parent.
 */
interface Props {
  tool: CopingTool
  /** Family circle / filled-dot colours, + chip bg/text. */
  bg: string
  dot: string
  /** Chip text colour (family fg). */
  fg: string
  onPress: () => void
}

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  if (seconds < 60) return `${seconds}s`
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}

function formatContext(context: string[] | null): string {
  if (!context || context.length === 0) return 'Anywhere'
  const c = context[0]
  return c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')
}

export const ToolListCard: React.FC<Props> = ({ tool, bg, dot, fg, onPress }) => {
  const meta = [formatDuration(tool.duration_seconds), formatContext(tool.context)]
    .filter(Boolean)
    .join(' · ')

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-card active:opacity-90"
      style={{
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* family-coloured circle */}
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bg }} />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-sans-bold" style={{ fontSize: 15, color: '#0D0D0D' }} numberOfLines={2}>
          {tool.name}
        </Text>
        <Text style={{ fontSize: 12, color: '#888888', marginTop: 2 }} numberOfLines={1}>
          {meta}
        </Text>
        {/* intensity dots — filled to intensity_max in the family colour */}
        <View className="flex-row" style={{ gap: 4, marginTop: 6 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i < tool.intensity_max ? dot : '#E0E0E0',
              }}
            />
          ))}
        </View>
      </View>

      {/* Right chip — tool ID, or grey "Library" for library-only tools (design). */}
      <View
        style={{
          flexShrink: 0,
          borderRadius: 9999,
          paddingVertical: 5,
          paddingHorizontal: 10,
          backgroundColor: tool.library_only ? '#E8E8E8' : bg,
        }}
      >
        <Text
          className="font-sans-bold"
          style={{ fontSize: 11, color: tool.library_only ? '#888888' : fg }}
        >
          {tool.library_only ? 'Library' : tool.tool_id}
        </Text>
      </View>
    </Pressable>
  )
}

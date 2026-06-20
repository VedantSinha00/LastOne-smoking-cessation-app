import React from 'react'
import { View, Text, Pressable } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import type { Database } from '../../types/database'

type CopingTool = Database['public']['Tables']['coping_tools']['Row']

/**
 * Tool-family catalog grid — ported from the Lovable InsightsScreen "All tools"
 * view: a 2-column grid of large rounded family cards (family-coloured, decorative
 * concentric-ring SVG, family name + count). Tapping a family drills into its
 * tool list (handled by the parent). Games routes to the existing /games hub.
 *
 * Maps our real schema families (breathing/physical/mini_games/cognitive_reframe)
 * to the design's family presentation. AI Chat is a "coming soon" card.
 */
export type FamilyKey =
  | 'breathing'
  | 'physical'
  | 'mini_games'
  | 'cognitive_reframe'
  | 'ai_chat'
  | 'content_cards'

interface FamilyDef {
  key: FamilyKey
  label: string
  unit: string
  bg: string
  fg: string
  dot: string
  /** Matches a tool to this family (none for ai_chat / games-routed). */
  match?: (t: CopingTool) => boolean
  comingSoon?: boolean
}

// Colours from the design's FAMILY_COLORS (lovable tools.ts).
const FAMILIES: FamilyDef[] = [
  { key: 'breathing', label: 'Breathing', unit: 'practices', bg: '#E6F4D6', fg: '#27500A', dot: '#84C524', match: (t) => t.family === 'breathing' },
  { key: 'physical', label: 'Physical', unit: 'resets', bg: '#FFE5DC', fg: '#A32D2D', dot: '#F15025', match: (t) => t.family === 'physical' },
  // Explicit line break after the hyphen so "games" never splits mid-word.
  { key: 'mini_games', label: 'Mini-\ngames', unit: 'games', bg: '#DCEBFB', fg: '#1F5A9E', dot: '#378ADD', match: (t) => t.family === 'mini_games' },
  { key: 'cognitive_reframe', label: 'Reframing', unit: 'exercises', bg: '#F3E8FF', fg: '#5B21B6', dot: '#8B5CF6', match: (t) => t.category === 'cognitive_reframe' },
  { key: 'ai_chat', label: 'AI Chat', unit: 'coming soon', bg: '#FFF3D6', fg: '#7A4F00', dot: '#E0A52B', comingSoon: true },
  { key: 'content_cards', label: 'Content Cards', unit: 'coming soon', bg: '#FFE0EC', fg: '#9D174D', dot: '#EC4899', comingSoon: true },
]

const FamilyCard: React.FC<{ def: FamilyDef; count: number; onPress: () => void }> = ({
  def,
  count,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={{ width: '48%', aspectRatio: 1 / 1.05, borderRadius: 28, backgroundColor: def.bg, paddingVertical: 18, paddingHorizontal: 16, overflow: 'hidden', justifyContent: 'space-between' }}
    className="active:opacity-90"
  >
    {/* decorative concentric rings (design): anchored to the bottom-left, sweeping
        wide across the card. preserveAspectRatio="none" stretches the square viewBox
        to the card's full (non-square) size, matching the web SVG. */}
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 200 200"
      preserveAspectRatio="none"
      style={{ position: 'absolute', top: 0, left: 0, opacity: 0.35 }}
    >
      {[40, 70, 100, 130, 160].map((r) => (
        <Circle key={r} cx="40" cy="200" r={r} fill="none" stroke={def.dot} strokeWidth="1" />
      ))}
    </Svg>
    <Text
      className="font-display"
      style={{ fontSize: 24, lineHeight: 27, color: def.fg }}
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
    >
      {def.label}
    </Text>
    <Text className="font-sans-medium" style={{ fontSize: 13, color: def.fg, opacity: 0.75 }}>
      {def.comingSoon ? def.unit : `${count} ${def.unit}`}
    </Text>
  </Pressable>
)

interface Props {
  tools: CopingTool[]
  onSelectFamily: (key: FamilyKey) => void
}

export const ToolFamilyGrid: React.FC<Props> = ({ tools, onSelectFamily }) => (
  <View className="flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
    {FAMILIES.map((def) => {
      const count = def.match ? tools.filter(def.match).length : 0
      return (
        <FamilyCard
          key={def.key}
          def={def}
          count={count}
          onPress={() => onSelectFamily(def.key)}
        />
      )
    })}
  </View>
)

export { FAMILIES }
export type { FamilyDef }

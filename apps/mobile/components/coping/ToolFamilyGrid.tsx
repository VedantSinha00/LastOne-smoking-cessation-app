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
  { key: 'mini_games', label: 'Mini-games', unit: 'games', bg: '#DCEBFB', fg: '#1F5A9E', dot: '#378ADD', match: (t) => t.family === 'mini_games' },
  { key: 'cognitive_reframe', label: 'Reframing', unit: 'exercises', bg: '#F3E8FF', fg: '#5B21B6', dot: '#8B5CF6', match: (t) => t.category === 'cognitive_reframe' },
  { key: 'ai_chat', label: 'AI Chat', unit: 'coming soon', bg: '#FFF3D6', fg: '#7A4F00', dot: '#E0A52B', comingSoon: true },
  { key: 'content_cards', label: 'Content Cards', unit: 'coming soon', bg: '#FFE0EC', fg: '#9D174D', dot: '#EC4899', comingSoon: true },
]

/**
 * Format a family label onto two lines at its natural break (hyphen or space),
 * keeping each token whole — "Mini-games" → "Mini-\ngames", "Content Cards" →
 * "Content\nCards". Single-word labels pass through (they can't break mid-word and
 * shrink to fit via adjustsFontSizeToFit on narrow screens).
 */
function twoLineLabel(label: string): string {
  if (label.includes('-')) return label.replace('-', '-\n')
  if (label.includes(' ')) return label.replace(' ', '\n')
  return label
}

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
    {/* Decorative concentric rings. The SVG fills the WHOLE card via absolute
        inset:0 so the arcs reach the actual bottom edge. viewBox 100×100 stretched
        (preserveAspectRatio none); origin bottom-left (cx20, cy110). Outermost
        radius 81 ≈ dist from origin to the bottom-right corner (100,100):
        √(80²+10²)=80.6 — so the largest ring just touches that corner once.
        strokeWidth 1.0 (~30% thinner than before). */}
    <Svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      // Opacity on the wrapper (design applies it here, not per-circle) with the
      // stroke at full c.dot strength.
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.6 }}
    >
      {[17, 33, 49, 65, 81].map((r) => (
        <Circle key={r} cx="20" cy="110" r={r} fill="none" stroke={def.dot} strokeWidth="1" />
      ))}
    </Svg>
    {/* Title — Playfair Display 600 @ 26/lineHeight 27 (design exact). Labels with
        a natural break (hyphen/space) are split into explicit lines at that point
        so a token never breaks mid-word; single long words (Breathing/Reframing)
        shrink via adjustsFontSizeToFit on narrow screens. Fixed 2-line box. */}
    <View style={{ height: 56, justifyContent: 'flex-start' }}>
      <Text
        className="font-serif"
        style={{ fontSize: 26, lineHeight: 27, color: def.fg }}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {twoLineLabel(def.label)}
      </Text>
    </View>
    {/* Count text sits OVER the rings (transparent bg) but lifted off the very
        bottom (marginBottom) so it overlays the spread-out arcs rather than the
        dense origin point — keeps the rings visible behind/around it. */}
    <Text
      className="font-sans-medium"
      style={{ fontSize: 13, color: def.fg, opacity: 0.75, marginBottom: 10 }}
    >
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

import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { faceGlyph, type MemoryCard } from '../../lib/games'
import type { GameCardSkin } from '../../types/database'

interface Props {
  cards: MemoryCard[]
  grid: '3x4' | '4x4'
  skin: GameCardSkin
  /** Card ids currently face-up (selected this turn). */
  flipped: number[]
  /** Card ids permanently matched. */
  matched: number[]
  /** Tapping a face-down, unmatched card. Ignored while two are flipped. */
  onFlip: (id: number) => void
  /** Cover faces (Memory 2P handoff) — render all cards as backs, no taps. */
  covered?: boolean
}

// Design card colours (Lovable MemoryGame): matched/flipped use the game green,
// default is a clean white card with a soft grey border, face shown when up.
const GREEN = '#84C524'
const GREEN_BG = 'rgba(132,197,36,0.18)'
const GREY_BORDER = '#E8E8E8'

/**
 * Shared Memory card grid (Memory 1P + 2P), reskinned to the Lovable design:
 * square cards, rounded-14, matched/flipped = green, default = white + grey
 * border. 3×4 = 3 cols, 4×4 = 4 cols. Logic unchanged — a card shows its face
 * when flipped or matched; match is by faceId, identity is the position id.
 */
export const MemoryBoard: React.FC<Props> = ({
  cards,
  grid,
  skin,
  flipped,
  matched,
  onFlip,
  covered = false,
}) => {
  const cols = grid === '4x4' ? 4 : 3
  const lockTurn = flipped.length >= 2
  const basis = cols === 4 ? '22%' : '29%'

  return (
    <View className="flex-row flex-wrap justify-center" style={{ gap: 12 }}>
      {cards.map((card) => {
        const isUp = !covered && (flipped.includes(card.id) || matched.includes(card.id))
        const isMatched = matched.includes(card.id)
        const isFlipped = !isMatched && isUp
        return (
          <Pressable
            key={card.id}
            disabled={covered || isUp || lockTurn}
            onPress={() => onFlip(card.id)}
            style={{
              width: basis,
              aspectRatio: 1,
              borderRadius: 14,
              borderWidth: 2,
              backgroundColor: isMatched || isFlipped ? GREEN_BG : '#FFFFFF',
              borderColor: isMatched || isFlipped ? GREEN : GREY_BORDER,
            }}
            className="items-center justify-center active:opacity-90"
          >
            <Text style={{ fontSize: 30 }}>{isUp ? faceGlyph(card.faceId, skin) : ''}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

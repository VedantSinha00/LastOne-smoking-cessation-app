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

/**
 * Shared Memory card grid (Memory 1P + 2P). 3×4 = 3 cols, 4×4 = 4 cols.
 * A card shows its face when flipped or matched; matched cards dim slightly.
 * Match is by faceId but identity is the position id (§8 image-bug fallback).
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

  return (
    <View className="flex-row flex-wrap justify-center" style={{ gap: 10 }}>
      {cards.map((card) => {
        const isUp = !covered && (flipped.includes(card.id) || matched.includes(card.id))
        const isMatched = matched.includes(card.id)
        // Square cells sized to fit the column count within a phone width.
        const basis = cols === 4 ? '21%' : '28%'
        return (
          <Pressable
            key={card.id}
            disabled={covered || isUp || lockTurn}
            onPress={() => onFlip(card.id)}
            style={{ width: basis, aspectRatio: 0.78 }}
            className={`rounded-2xl items-center justify-center border ${
              isUp
                ? isMatched
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-card border-primary'
                : 'bg-primary border-primary/30 active:opacity-80'
            }`}
          >
            <Text className="text-3xl">
              {isUp ? faceGlyph(card.faceId, skin) : ''}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

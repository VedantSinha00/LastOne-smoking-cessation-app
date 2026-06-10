import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native'
import { useContentCarousel } from '../../hooks/useContentCarousel'

// Home wraps content in p-6 (24px each side). Size each card so one fills the screen
// with the next peeking out — the peek signals the row is horizontally scrollable.
const HOME_PADDING = 24
const PEEK = 36
const CARD_WIDTH = Dimensions.get('window').width - HOME_PADDING * 2 - PEEK

/**
 * Home content carousel — Content Cards §3.1. A horizontal row of the day's scheduled
 * cards. Renders nothing (collapses) when there are no eligible cards (§4 — never show
 * an empty card state). Replaces ContentCarouselPlaceholder.
 */
export const ContentCarousel: React.FC = () => {
  const { cards, isLoading } = useContentCarousel()

  if (isLoading) {
    return (
      <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
          For you today
        </Text>
        <ActivityIndicator color="#f59e0b" />
      </View>
    )
  }

  // §4 — no eligible cards → render nothing rather than an empty state.
  if (!cards.length) return null

  return (
    <View>
      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 px-1">
        For you today
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 pr-2"
      >
        {cards.map(({ card, body }) => (
          <View
            key={card.card_id}
            style={{ width: CARD_WIDTH }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md"
          >
            <Text className="text-amber-500/90 text-[11px] font-bold uppercase tracking-wider">
              {card.pill_tag}
            </Text>
            <Text className="text-white text-base font-extrabold mt-1.5 leading-snug">
              {card.title}
            </Text>
            <Text className="text-zinc-400 text-sm mt-2 leading-relaxed">{body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

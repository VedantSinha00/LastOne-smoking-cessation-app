import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native'
import { useContentCarousel } from '../../hooks/useContentCarousel'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'

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
      <Card>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          For you today
        </Text>
        <ActivityIndicator color="#7FC200" />
      </Card>
    )
  }

  // §4 — no eligible cards → render nothing rather than an empty state.
  if (!cards.length) return null

  return (
    <View>
      <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2 px-1">
        For you today
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 pr-2"
      >
        {cards.map(({ card, body }) => (
          <Card key={card.card_id} style={{ width: CARD_WIDTH }}>
            <Chip label={card.pill_tag} variant="muted" />
            <Text className="text-foreground font-display text-base mt-1.5 leading-snug">
              {card.title}
            </Text>
            <Text className="text-muted-foreground text-sm mt-2 leading-relaxed">{body}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  )
}

import React, { useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native'
import { useContentCarousel } from '../../hooks/useContentCarousel'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { ContentCardReader } from './ContentCardReader'

// Home wraps content in px-5 (20px each side). Size each card so one fills the screen
// with the next peeking out — the peek signals the row is horizontally scrollable.
// A smaller peek = wider card (cards bumped ~20% larger per design feedback).
const HOME_PADDING = 20
const PEEK = 24
const CARD_WIDTH = Dimensions.get('window').width - HOME_PADDING * 2 - PEEK

/**
 * Home content carousel — Content Cards §3.1. A horizontal row of the day's scheduled
 * cards. Renders nothing (collapses) when there are no eligible cards (§4 — never show
 * an empty card state). Replaces ContentCarouselPlaceholder.
 */
export const ContentCarousel: React.FC = () => {
  const { cards, isLoading } = useContentCarousel()
  const [openCard, setOpenCard] = useState<{ pillTag: string; title: string; body: string } | null>(
    null,
  )

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
      {/* The soft card shadow extends ~14px below/around the card; the horizontal
          ScrollView clips its content box, so we give the content container vertical
          padding (and negative margins to keep the row visually flush) so shadows
          render fully instead of being cut at the scroll edge. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingRight: 8 }}
        style={{ marginVertical: -8, overflow: 'visible' }}
      >
        {cards.map(({ card, body }) => (
          <Card
            key={card.card_id}
            elevation="soft"
            onPress={() => setOpenCard({ pillTag: card.pill_tag, title: card.title, body })}
            style={{ width: CARD_WIDTH, minHeight: 188 }}
            className="p-6"
          >
            <Chip label={card.pill_tag} variant="muted" />
            <Text
              className="text-foreground font-display mt-4 tracking-tight"
              style={{ fontSize: 20, lineHeight: 24 }}
            >
              {card.title}
            </Text>
            <Text className="text-muted-foreground text-[15px] mt-3 leading-relaxed" numberOfLines={3}>
              {body}
            </Text>
            <Text
              className="text-foreground/60 font-sans-bold mt-auto pt-4 text-center"
              style={{ fontSize: 10, letterSpacing: 1.8 }}
            >
              TAP TO READ MORE
            </Text>
          </Card>
        ))}
      </ScrollView>

      <ContentCardReader
        visible={openCard !== null}
        onClose={() => setOpenCard(null)}
        pillTag={openCard?.pillTag ?? ''}
        title={openCard?.title ?? ''}
        body={openCard?.body ?? ''}
      />
    </View>
  )
}

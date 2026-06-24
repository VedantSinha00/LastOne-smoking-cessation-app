import React, { useMemo, useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Alert, Animated, PanResponder, StyleSheet } from 'react-native'
import { Search, X, Trash2 } from 'lucide-react-native'
import { ScreenHeader } from '../ui/ScreenHeader'
import { journalEntries, type LogRow } from '../../lib/insights'

/**
 * Journal — the design's JournalView ported on real data: the user's Quick Note
 * logs (log_type='note') listed newest-first with All / This week / This month
 * filters. Each card shows the note text, a relative date, and the optional mood.
 * "+ Add a note" opens the Quick Note flow (Flow D).
 */
interface Props {
  logs: LogRow[]
  onBack: () => void
  onAddNote: () => void
  /** Delete a journal note by its log_id (via the delete_note_log RPC). */
  onDelete: (logId: string) => void
}

type Filter = 'all' | 'week' | 'month'
const TABS: [Filter, string][] = [
  ['all', 'All'],
  ['week', 'This week'],
  ['month', 'This month'],
]

const MOOD_EMOJI = ['😞', '🙁', '😐', '🙂', '😄'] // 1–5

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const

const getMoodBadge = (mood: number) => {
  const configs = [
    { bg: '#FFF0EB', border: '#FFE5DC', text: 'Struggling', color: '#F15025' }, // 1
    { bg: '#FFF0EB', border: '#FFE5DC', text: 'Struggling', color: '#F15025' }, // 2
    { bg: '#F7F5F1', border: '#E9E7E5', text: 'Neutral', color: '#76706C' },    // 3
    { bg: '#F0F9E6', border: '#E6F4D6', text: 'Good', color: '#4E9A52' },       // 4
    { bg: '#F0F9E6', border: '#E6F4D6', text: 'Great', color: '#4E9A52' },      // 5
  ]
  const config = configs[mood - 1] || configs[2]
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: config.bg,
        borderWidth: 1,
        borderColor: config.border,
        borderRadius: 9999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13, lineHeight: 16 }}>{MOOD_EMOJI[mood - 1]}</Text>
      <Text className="font-sans-medium" style={{ fontSize: 10, color: config.color, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 14 }}>
        {config.text}
      </Text>
    </View>
  )
}

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft: () => void
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onSwipeLeft }) => {
  const translateX = useRef(new Animated.Value(0)).current

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 8
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -80) {
          onSwipeLeft()
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start()
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start()
      },
    })
  ).current

  return (
    <View style={{ overflow: 'hidden', borderRadius: 16 }}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#FFECEC',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 24,
            borderRadius: 16,
          },
        ]}
      >
        <Trash2 size={22} color="#F51B3D" strokeWidth={2} />
      </View>
      <Animated.View
        style={{
          transform: [{ translateX }],
        }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  )
}

function relativeDate(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const time = d
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()
    .replace(' ', '')
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (dayDiff === 0) return `Today, ${time}`
  if (dayDiff === 1) return `Yesterday, ${time}`
  if (dayDiff < 7) return `${dayDiff} days ago, ${time}`
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export const JournalView: React.FC<Props> = ({ logs, onBack, onAddNote, onDelete }) => {
  const [filter, setFilter] = useState<Filter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const confirmDelete = (logId: string) =>
    Alert.alert('Delete note?', 'This note will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(logId) },
    ])

  const entries = useMemo(() => journalEntries(logs, filter), [logs, filter])

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase().trim()
    return entries.filter((e) => e.text.toLowerCase().includes(q))
  }, [entries, searchQuery])

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Journal" onBack={onBack} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}>
        {/* Filter tabs */}
        <View className="flex-row" style={{ gap: 8, marginBottom: 16 }}>
          {TABS.map(([key, label]) => {
            const active = filter === key
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                className="rounded-full"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: active ? '#84C524' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: active ? '#84C524' : '#E8E8E8',
                }}
              >
                <Text className="font-sans-medium" style={{ fontSize: 13, color: active ? '#FFFFFF' : '#888888' }}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Dynamic Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E9E7E5',
            paddingHorizontal: 12,
            height: 44,
            marginBottom: 20,
          }}
        >
          <Search size={18} color="#76706C" style={{ marginRight: 8 }} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              color: '#15110D',
              fontFamily: 'DMSans_400Regular',
              paddingVertical: 0,
            }}
            placeholder="Search your journal notes..."
            placeholderTextColor="#76706C"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <X size={18} color="#76706C" />
            </Pressable>
          )}
        </View>

        {filteredEntries.length === 0 ? (
          <View style={cardStyle} className="items-center justify-center p-8">
            <Text className="text-foreground font-display text-base text-center mb-1.5">
              {searchQuery ? 'No matching notes' : 'No notes yet'}
            </Text>
            <Text className="text-muted-foreground text-sm text-center leading-relaxed px-2">
              {searchQuery
                ? 'Try searching for something else or clear the search query.'
                : "Capture a thought from the Log button and it'll show up here."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredEntries.map((e) => (
              <SwipeableCard key={e.logId} onSwipeLeft={() => confirmDelete(e.logId)}>
                <View style={cardStyle}>
                  <View className="flex-row items-center justify-between" style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, color: '#BBBBBB' }}>{relativeDate(e.timestamp)}</Text>
                    {e.mood != null && e.mood >= 1 && e.mood <= 5 && getMoodBadge(e.mood)}
                  </View>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: '#0D0D0D' }}>{e.text}</Text>
                </View>
              </SwipeableCard>
            ))}
          </View>
        )}

        {/* + Add a note → opens Quick Note (Flow D) */}
        <Pressable
          onPress={onAddNote}
          className="active:opacity-80"
          style={{
            marginTop: 16,
            backgroundColor: '#FFFFFF',
            borderWidth: 1.5,
            borderColor: '#E8E8E8',
            borderStyle: 'dashed',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <Text className="font-sans-medium" style={{ fontSize: 14, color: '#888888' }}>
            + Add a note
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

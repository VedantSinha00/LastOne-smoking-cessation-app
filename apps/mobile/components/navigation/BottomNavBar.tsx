import React from 'react'
import { View, Pressable } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, BarChart3, Heart, Plus, Users, Sparkle } from 'lucide-react-native'

/**
 * Presentational bottom nav bar — the design's 5-slot layout
 * (Home · Community · [+] · Insights · Tools) with the raised near-black center
 * Log button. Extracted from the tabs layout so it can ALSO render on the
 * profile-flow category screens (Your Journey / Preferences / Find Support /
 * Privacy), which live in the settings stack — a sibling of the tabs navigator
 * with no tab bar of its own.
 *
 * Navigation is plain `router` to the canonical tab Hrefs, so it works from any
 * navigator. `activeKey` highlights a slot; on the settings category screens we
 * pass none (you're in Profile, which isn't a slot), so the bar reads neutral.
 */
const ACTIVE = '#15110D' // foreground
const INACTIVE = '#76706C' // muted-foreground

type SlotKey = 'index' | 'community' | 'insights' | 'tools'
type Slot = { key: SlotKey; label: string; href: Href; Icon: typeof Home; twinkle?: boolean }

const LEFT: Slot[] = [
  { key: 'index', label: 'Home', href: '/(tabs)', Icon: Home },
  { key: 'community', label: 'Community', href: '/(tabs)/community', Icon: Users },
]
const RIGHT: Slot[] = [
  { key: 'insights', label: 'Insights', href: '/(tabs)/insights', Icon: BarChart3 },
  { key: 'tools', label: 'Tools', href: '/(tabs)/tools', Icon: Heart, twinkle: true },
]

export const BottomNavBar: React.FC<{ activeKey?: SlotKey }> = ({ activeKey }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const renderSlot = ({ key, label, href, Icon, twinkle }: Slot) => {
    const isFocused = key === activeKey
    const tint = isFocused ? ACTIVE : INACTIVE
    return (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => router.navigate(href)}
        className="flex-1 h-full items-center justify-center"
      >
        <View style={{ width: 21, height: 21, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={21} color={tint} strokeWidth={isFocused ? 2.5 : 2.0} />
          {twinkle && (
            <>
              <Sparkle
                size={9}
                color={tint}
                fill={tint}
                strokeWidth={1.5}
                style={{ position: 'absolute', top: -4, right: -5 }}
              />
              <Sparkle
                size={6}
                color={tint}
                fill={tint}
                strokeWidth={1.5}
                style={{ position: 'absolute', bottom: -2, left: -5 }}
              />
            </>
          )}
        </View>
      </Pressable>
    )
  }

  return (
    <View
      className="flex-row items-center bg-background border-t border-border"
      style={{ height: 62 + insets.bottom, paddingBottom: insets.bottom, overflow: 'visible' }}
    >
      {LEFT.map(renderSlot)}

      {/* Raised center Log button — opens the log half-sheet. */}
      <View className="items-center justify-center" style={{ width: 72, overflow: 'visible' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log"
          onPress={() => router.push('/(modals)/log')}
          hitSlop={{ top: 32, bottom: 8, left: 8, right: 8 }}
          className="w-14 h-14 rounded-full bg-foreground items-center justify-center active:scale-95"
          style={{
            marginTop: -32,
            shadowColor: '#15110D',
            shadowOpacity: 0.2,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Plus size={24} color="#FBFAF9" strokeWidth={2.5} />
        </Pressable>
      </View>

      {RIGHT.map(renderSlot)}
    </View>
  )
}

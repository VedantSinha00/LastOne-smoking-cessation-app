import React from 'react'
import { View, Text, Pressable, ScrollView, BackHandler } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { TopBar } from '../home/TopBar'
import { SosFab } from '../sos/sos-fab'
import { BottomNavBar } from '../navigation/BottomNavBar'

/** Shared chrome for a settings edit screen: the pinned LastOne TopBar, then a
 *  small uppercase eyebrow back-link (matching the Lovable ProfileScreen
 *  SubHeader) + scroll body. The TopBar stays in place across the whole Profile
 *  flow.
 *
 *  Back pops exactly ONE screen (router.back) so a leaf reached via a category
 *  sub-screen (profile → Your Journey → Cig per day) returns to the category,
 *  not all the way to the profile root — jumping straight to root skipped the
 *  category screen. Falls back to the profile root only if there's nothing to
 *  pop (e.g. entered via a deep link with no stack).
 *
 *  `footer` renders pinned to the bottom of the screen, OUTSIDE the scroll area
 *  (e.g. a Cancel button that should sit at the screen bottom regardless of how
 *  short the content is).
 *
 *  `showSos` mounts the persistent SOS FAB. It's opt-in because SOS belongs on
 *  passive/browsing screens (the category menus: Your Journey, Preferences, Find
 *  Support, Privacy), NOT on focused leaf edit forms where it's just clutter. Do
 *  not combine with `footer` — the FAB would overlap a pinned bottom button.
 *
 *  `showNav` mounts the bottom nav bar, pinned at the screen bottom. Same opt-in
 *  line as `showSos`: the browsing category screens keep the user oriented in the
 *  app and one tap from any tab; the focused leaf edit forms / decision screens
 *  drop it so editing feels modal. The SOS FAB already positions itself one nav-
 *  bar height up, so it sits correctly above the bar. */
export const EditScreen: React.FC<{
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  showSos?: boolean
  showNav?: boolean
}> = ({ title, children, footer, showSos, showNav }) => {
  const router = useRouter()
  const goBack = () => {
    // Category screens (showNav) are always entered from the Profile root, and
    // the nav bar can tangle the back stack (a slot jump leaves Home below the
    // settings push). So send their back explicitly to the Profile root rather
    // than popping. Leaf edit screens pop one level (back to their category).
    if (showNav) {
      router.navigate('/(tabs)/profile')
    } else if (router.canGoBack()) {
      router.back()
    } else {
      router.navigate('/(tabs)/profile')
    }
  }

  // Hardware/gesture back on a category screen must also land on the Profile
  // root, not pop the (possibly Home-rooted) stack. Intercept only while showNav
  // is set and the screen is focused; leaf screens keep default pop behaviour.
  useFocusEffect(
    React.useCallback(() => {
      if (!showNav) return
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.navigate('/(tabs)/profile')
        return true // handled — prevent the default pop
      })
      return () => sub.remove()
    }, [showNav, router]),
  )
  return (
    <View className="flex-1 bg-background">
      <TopBar inProfile />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={goBack}
          hitSlop={12}
          className="flex-row items-center mb-4 active:opacity-60"
          style={{ gap: 6 }}
        >
          <ChevronLeft size={14} color="#76706C" strokeWidth={2.5} />
          <Text className="text-muted-foreground text-[11px] font-sans-semibold uppercase tracking-[0.18em]">
            {title}
          </Text>
        </Pressable>
        {children}
        {/* Spacer so the last content clears the pinned nav bar (≈62px). */}
        {showNav && <View style={{ height: 72 }} />}
      </ScrollView>
      {footer != null && <View className="px-6 pt-3 pb-8 bg-background">{footer}</View>}
      {showSos && <SosFab />}
      {showNav && <BottomNavBar />}
    </View>
  )
}

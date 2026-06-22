import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { TopBar } from '../home/TopBar'
import { SosFab } from '../sos/sos-fab'

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
 *  not combine with `footer` — the FAB would overlap a pinned bottom button. */
export const EditScreen: React.FC<{
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  showSos?: boolean
}> = ({ title, children, footer, showSos }) => {
  const router = useRouter()
  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.navigate('/(tabs)/profile')
  }
  return (
    <View className="flex-1 bg-background">
      <TopBar inProfile />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-6 pt-2 pb-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={goBack}
          hitSlop={12}
          className="flex-row items-center mb-2 active:opacity-60"
          style={{ gap: 6 }}
        >
          <ChevronLeft size={14} color="#76706C" strokeWidth={2.5} />
          <Text className="text-muted-foreground text-[11px] font-sans-bold uppercase tracking-[0.18em]">
            {title}
          </Text>
        </Pressable>
        {children}
      </ScrollView>
      {footer != null && <View className="px-6 pt-3 pb-8 bg-background">{footer}</View>}
      {showSos && <SosFab />}
    </View>
  )
}

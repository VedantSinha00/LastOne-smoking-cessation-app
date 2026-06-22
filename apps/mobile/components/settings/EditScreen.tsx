import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { TopBar } from '../home/TopBar'

/** Shared chrome for a settings edit screen: the pinned LastOne TopBar, then a
 *  small uppercase eyebrow back-link (matching the Lovable ProfileScreen
 *  SubHeader) + scroll body. The TopBar stays in place across the whole Profile
 *  flow. Back targets the Profile tab explicitly: these screens are pushed from
 *  the settings group (a sibling of the tabs), so a plain back() pops out to
 *  Home — navigate() lands reliably on PROF-01 instead (same fix as goals).
 *
 *  `footer` renders pinned to the bottom of the screen, OUTSIDE the scroll area
 *  (e.g. a Cancel button that should sit at the screen bottom regardless of how
 *  short the content is). */
export const EditScreen: React.FC<{
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}> = ({ title, children, footer }) => {
  const router = useRouter()
  return (
    <View className="flex-1 bg-background">
      <TopBar inProfile />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.navigate('/(tabs)/profile')}
          hitSlop={12}
          className="flex-row items-center mb-4 active:opacity-60"
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
    </View>
  )
}

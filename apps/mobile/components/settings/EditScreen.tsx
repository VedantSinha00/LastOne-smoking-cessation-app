import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'

/** Shared chrome for a settings edit screen: back arrow + title + scroll body.
 *  Back targets the Profile tab explicitly: these screens are pushed from the
 *  settings group (a sibling of the tabs), so a plain back() pops out to Home —
 *  navigate() lands reliably on PROF-01 instead (same fix as the goals stack). */
export const EditScreen: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const router = useRouter()
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-3 mb-2">
        <Pressable onPress={() => router.navigate('/(tabs)/profile')} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl flex-1">{title}</Text>
      </View>
      {children}
    </ScrollView>
  )
}

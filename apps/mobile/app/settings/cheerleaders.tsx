import React from 'react'
import { View, Text } from 'react-native'
import { Users } from 'lucide-react-native'
import { EditScreen } from '../../components/settings/EditScreen'

/**
 * Settings → Your Cheerleaders. Community (V2) — "coming soon" placeholder,
 * consistent with the Community nav tab. No social backend yet.
 */
export default function CheerleadersSettings() {
  return (
    <EditScreen title="Your Cheerleaders">
      <View className="items-center px-4 pt-8">
        <View className="h-16 w-16 rounded-full bg-secondary border border-border items-center justify-center">
          <Users size={26} color="#76706C" strokeWidth={1.8} />
        </View>
        <Text className="text-foreground font-display mt-5 text-center" style={{ fontSize: 18 }}>
          People rooting for you
        </Text>
        <Text className="text-muted-foreground text-[15px] mt-2 text-center leading-relaxed">
          Cheerleaders get notified when you hit milestones — and never see your slip data. Coming soon.
        </Text>
        <View className="mt-5 rounded-full bg-secondary px-4 py-1.5">
          <Text className="text-muted-foreground text-xs font-sans-medium uppercase tracking-wider">
            Coming soon
          </Text>
        </View>
      </View>
    </EditScreen>
  )
}

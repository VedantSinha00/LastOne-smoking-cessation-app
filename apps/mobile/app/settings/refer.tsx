import React from 'react'
import { View, Text } from 'react-native'
import { UserPlus } from 'lucide-react-native'
import { EditScreen } from '../../components/settings/EditScreen'

/**
 * Settings → Refer & Invite. Community (V2) — "coming soon" placeholder,
 * consistent with the Community nav tab. No referral backend yet.
 */
export default function ReferSettings() {
  return (
    <EditScreen title="Refer & Invite">
      <View className="items-center px-4 pt-8">
        <View className="h-16 w-16 rounded-full bg-secondary border border-border items-center justify-center">
          <UserPlus size={26} color="#76706C" strokeWidth={1.8} />
        </View>
        <Text className="text-foreground font-display mt-5 text-center" style={{ fontSize: 18 }}>
          Bring someone along
        </Text>
        <Text className="text-muted-foreground text-[15px] mt-2 text-center leading-relaxed">
          Quitting with a friend works better than going alone. Sharing and invites are coming soon.
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

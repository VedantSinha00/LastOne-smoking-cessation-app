import React from 'react'
import { View, Text, Pressable, Share, Alert } from 'react-native'
import { EditScreen } from '../../components/settings/EditScreen'

/**
 * Settings → Refer & Invite. Ported from the Lovable ProfileScreen ReferScreen:
 * a green hero card + a working "Share LastOne" button (native share sheet).
 *
 * The design's "Your Quit Ons" list is mock social data needing a referral
 * backend the app doesn't have, so it's omitted. Sharing itself needs no backend
 * — it's the RN Share API. The app isn't published, so the message is text-only
 * (no store link).
 */
const SHARE_MESSAGE =
  "I'm quitting smoking with LastOne — it's helping me beat cravings one at a time. Want to quit together?"

export default function ReferSettings() {
  const onShare = async () => {
    try {
      await Share.share({ message: SHARE_MESSAGE })
    } catch (e: any) {
      Alert.alert("Couldn't share", e?.message ?? 'Please try again.')
    }
  }

  return (
    <EditScreen title="Refer & Invite" showSos showNav>
      <View
        className="rounded-3xl bg-primary/15 border border-primary/30 p-6 items-center"
        style={{ marginTop: 4 }}
      >
        <Text className="text-foreground font-display text-center" style={{ fontSize: 18 }}>
          Bring someone along.
        </Text>
        <Text className="text-muted-foreground text-center mt-1.5" style={{ fontSize: 14, lineHeight: 21 }}>
          Quitting with a friend works better than going alone.
        </Text>
        <Pressable
          onPress={onShare}
          className="bg-primary rounded-full mt-5 active:opacity-90"
          style={{ paddingVertical: 12, paddingHorizontal: 22 }}
        >
          <Text className="text-primary-foreground font-sans-bold" style={{ fontSize: 14 }}>
            Share LastOne
          </Text>
        </Pressable>
      </View>
    </EditScreen>
  )
}

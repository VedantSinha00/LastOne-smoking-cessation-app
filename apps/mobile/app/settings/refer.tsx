import React from 'react'
import { View, Text, Pressable, Share } from 'react-native'
import { EditScreen } from '../../components/settings/EditScreen'
import { useToast } from '../../hooks/useToast'

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
  "I'm quitting smoking with LastOne — it's helping me beat cravings one at a time. " +
  "It's still in development (not published yet), but I'll let you know the moment it's out so we can quit together."

export default function ReferSettings() {
  const toast = useToast()
  const onShare = async () => {
    try {
      await Share.share({ message: SHARE_MESSAGE })
    } catch (e: any) {
      toast.show(e?.message ?? "Couldn't share. Please try again.", { variant: 'error' })
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

      {/* Honest note: no install link to share yet, since the app isn't live. */}
      <Text
        className="text-muted-foreground text-center"
        style={{ fontSize: 12, lineHeight: 18, marginTop: 16, paddingHorizontal: 12 }}
      >
        LastOne is still in development and isn&apos;t published yet, so there&apos;s no
        download link to send. Sharing spreads the word for now — invites come once
        it&apos;s live.
      </Text>
    </EditScreen>
  )
}

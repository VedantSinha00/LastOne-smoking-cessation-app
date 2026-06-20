import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'

/**
 * Shared in-body screen header: a back arrow + title, padded below the status-bar
 * safe-area inset so the arrow is reachable (not tucked under the notch / status
 * bar). `onBack` is explicit so each screen decides where "back" goes — important
 * because router.back() on hidden tab routes (e.g. /progress) can pop to the wrong
 * tab rather than the expected parent.
 */
interface Props {
  title: string
  onBack: () => void
}

export const ScreenHeader: React.FC<Props> = ({ title, onBack }) => {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top }} className="bg-background px-5">
      <View className="h-14 flex-row items-center">
        <Pressable onPress={onBack} accessibilityLabel="Back" hitSlop={12} className="pr-3 active:opacity-60">
          <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
        </Pressable>
        <Text className="text-foreground font-display flex-1" style={{ fontSize: 22, letterSpacing: -0.3 }}>
          {title}
        </Text>
      </View>
    </View>
  )
}

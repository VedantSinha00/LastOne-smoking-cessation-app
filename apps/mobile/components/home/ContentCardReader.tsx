import React from "react";
import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

/**
 * Full-screen content reader — ported from the Lovable `TodayFullCard`
 * (lovable-design-reference/src/components/lastone/TodayCard.tsx). Opens when a
 * carousel card is tapped: a green surface-accent gradient sheet with a drag
 * handle, the card's pill + title, and the (scrollable) body, plus a close button.
 *
 * Content note: our content_cards only carry the short `body_copy` we already
 * show on the card face — there is no separate long-form article field. So the
 * reader shows that same resolved body, not a longer article (product decision
 * 2026-06-20). The design's "Go deeper with AI" button is omitted while AI Chat
 * is deferred. Read-time is dropped (no field; the design's was mock).
 *
 * Gradient stops come from the design's --gradient-surface-accent
 * (surface-accent.from #67AC5F → surface-accent.to #268255).
 */
interface ContentCardReaderProps {
  visible: boolean;
  onClose: () => void;
  pillTag: string;
  title: string;
  body: string;
}

const FG = "#F9FDF6"; // surface-accent-foreground

export const ContentCardReader: React.FC<ContentCardReaderProps> = ({
  visible,
  onClose,
  pillTag,
  title,
  body,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* dim backdrop above the sheet */}
      <Pressable className="flex-1 bg-foreground/40" onPress={onClose} />

      <View className="absolute inset-x-0 bottom-0" style={{ top: 32 }}>
        <LinearGradient
          colors={["#67AC5F", "#268255"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={{ flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" }}
        >
          {/* drag handle */}
          <View className="items-center pt-3">
            <View style={{ height: 5, width: 48, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.3)" }} />
          </View>

          <ScrollView
            className="px-6"
            contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 48 }}
            showsVerticalScrollIndicator={false}
          >
            {/* header row: pill + close */}
            <View className="flex-row items-center justify-between">
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: "#CEF17B" }}>
                <Text className="text-[10px] font-sans-bold" style={{ color: "#084734" }}>
                  {pillTag}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-9 w-9 rounded-full items-center justify-center active:opacity-80"
                style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
              >
                <X size={16} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* title */}
            <Text
              className="font-display mt-6"
              style={{ fontSize: 30, lineHeight: 33, letterSpacing: -0.5, color: FG }}
            >
              {title}
            </Text>

            {/* body — the resolved card body (no long-form field in our data) */}
            <Text
              className="mt-7"
              style={{ fontSize: 16, lineHeight: 26, color: "rgba(249,253,246,0.9)" }}
            >
              {body}
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

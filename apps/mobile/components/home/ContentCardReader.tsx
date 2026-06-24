import React from "react";
import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

/**
 * Full-screen content reader — ported from the Lovable `TodayFullCard`
 * (lovable-design-reference/src/components/lastone/TodayCard.tsx). Opens when a
 * carousel card is tapped: a green surface-accent sheet with a drag handle, the
 * card's pill + title, and the (scrollable) body, plus a close button.
 *
 * Content note: our content_cards only carry the short `body_copy` we already
 * show on the card face — there is no separate long-form article field. So the
 * reader shows that same resolved body, not a longer article (product decision
 * 2026-06-20). The design's "Go deeper with AI" button is omitted while AI Chat
 * is deferred. Read-time is dropped (no field; the design's was mock).
 *
 * Gradient: the design uses a CSS linear-gradient (--gradient-surface-accent,
 * #67AC5F → #268255). To avoid the native expo-linear-gradient module (which the
 * current dev build wasn't compiled with), this approximates it with a solid base
 * (the lighter "from" green) plus a darkening overlay anchored to the bottom —
 * close enough for now; swap to a true LinearGradient at the next dev-build
 * rebuild (see UI_PASS_DECISION_LOG). Stops: from #67AC5F, to #268255.
 */
interface ContentCardReaderProps {
  visible: boolean;
  onClose: () => void;
  pillTag: string;
  title: string;
  body: string;
}

const FG = "#F9FDF6"; // surface-accent-foreground
const FROM = "#67AC5F"; // gradient start (lighter)
const TO = "#268255"; // gradient end (darker)

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

      <View
        className="absolute inset-x-0 bottom-0"
        style={{
          top: 32,
          backgroundColor: FROM,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          overflow: "hidden",
        }}
      >
        {/* Faux vertical gradient: a darker "to" green fading in over the bottom
            two-thirds, approximating the design's surface-accent gradient without
            the native LinearGradient module. */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "70%", backgroundColor: TO, opacity: 0.55 }}
        />
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "35%", backgroundColor: TO, opacity: 0.5 }}
        />

        <View style={{ flex: 1 }}>
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
        </View>
      </View>
    </Modal>
  );
};

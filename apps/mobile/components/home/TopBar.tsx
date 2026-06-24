import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "lucide-react-native";

/**
 * Top app bar — ported from the Lovable design's `TopBar`
 * (lovable-design-reference/src/components/lastone/TopBar.tsx).
 *
 * Design: a light, translucent header pinned to the top with the "LastOne."
 * wordmark (Space Grotesk, primary-green full-stop) and a profile button. The
 * web version is `position: fixed` with a blur; in RN we render it inline at
 * the top of the screen and pad for the status-bar safe-area inset so it reads
 * as the same header.
 *
 *   ┌─────────────────────────────────────────┐
 *   │ LastOne.                            [👤] │
 *   └─────────────────────────────────────────┘
 *
 * The profile button → /profile (real route). The design's notifications bell
 * was dropped: it was a no-op placeholder with no notifications surface behind
 * it (logic-wins: no dead controls).
 *
 * `inProfile` keeps the bar pinned across the Profile flow (it renders in each
 * Profile screen's chrome so it never disappears as you drill into sub-screens).
 * There, the profile icon is hidden — you're already in Profile, so the control
 * is redundant — leaving just the wordmark.
 */
export const TopBar: React.FC<{ inProfile?: boolean }> = ({ inProfile = false }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-background px-5"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-14 flex-row items-center justify-between">
        {/* Wordmark — "LastOne" + primary-green dot. Doubles as a Home button:
            tapping it returns to the Home tab (handy from the Profile flow). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home"
          onPress={() => router.navigate("/(tabs)")}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Text
            className="text-foreground font-display"
            style={{ fontSize: 17, letterSpacing: -0.3 }}
          >
            LastOne<Text className="text-primary">.</Text>
          </Text>
        </Pressable>

        <View className="flex-row items-center" style={{ gap: 8 }}>
          {/* Profile — hidden inside the Profile flow (redundant there) */}
          {!inProfile && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              onPress={() => router.push("/profile")}
              className="h-9 w-9 rounded-full border border-border bg-card items-center justify-center active:bg-secondary"
            >
              <User size={16} color="#15110D" strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

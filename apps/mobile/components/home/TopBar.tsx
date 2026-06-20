import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, User } from "lucide-react-native";

/**
 * Top app bar — ported from the Lovable design's `TopBar`
 * (lovable-design-reference/src/components/lastone/TopBar.tsx).
 *
 * Design: a light, translucent header pinned to the top with the "LastOne."
 * wordmark (Space Grotesk, primary-green full-stop), a notifications bell with
 * an unread dot, and a profile button. The web version is `position: fixed`
 * with a blur; in RN we render it inline at the top of the screen and pad for
 * the status-bar safe-area inset so it reads as the same header.
 *
 *   ┌─────────────────────────────────────────┐
 *   │ LastOne.                       [🔔] [👤] │
 *   └─────────────────────────────────────────┘
 *
 * `hasUnread` toggles the small primary dot on the bell. Both buttons are
 * wired to placeholders for now: profile → /profile (real route); the bell is
 * a no-op until a notifications surface exists (logic-wins: no fake screen).
 */
interface TopBarProps {
  hasUnread?: boolean;
  onPressBell?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ hasUnread = true, onPressBell }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-background px-5"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-14 flex-row items-center justify-between">
        {/* Wordmark — "LastOne" + primary-green dot */}
        <Text
          className="text-foreground font-display"
          style={{ fontSize: 17, letterSpacing: -0.3 }}
        >
          LastOne<Text className="text-primary">.</Text>
        </Text>

        <View className="flex-row items-center" style={{ gap: 8 }}>
          {/* Notifications */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={onPressBell}
            className="h-9 w-9 rounded-full border border-border bg-card items-center justify-center active:bg-secondary"
          >
            <Bell size={16} color="#15110D" strokeWidth={2} />
            {hasUnread && (
              <View
                className="absolute rounded-full bg-primary"
                style={{ top: 8, right: 8, height: 6, width: 6 }}
              />
            )}
          </Pressable>

          {/* Profile */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            onPress={() => router.push("/profile")}
            className="h-9 w-9 rounded-full border border-border bg-card items-center justify-center active:bg-secondary"
          >
            <User size={16} color="#15110D" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

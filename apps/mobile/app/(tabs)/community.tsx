import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users } from "lucide-react-native";

/**
 * Community (COMM) — V2 feature (Home Spec §P5). Shipped now only as a
 * "coming soon" destination so the design's five-slot bottom nav has a real
 * page behind its Community slot instead of an alert popup. No data, no route
 * fan-out yet — replaced wholesale when Community is actually built.
 */
export default function Community() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      {/* Centered title — same size as Insights / All tools (22). */}
      <Text className="text-foreground font-display text-center" style={{ fontSize: 22 }}>
        Community
      </Text>

      <View className="flex-1 items-center justify-center px-8">
        <View className="w-16 h-16 rounded-full bg-secondary border border-border items-center justify-center">
          <Users size={28} color="#76706C" strokeWidth={1.8} />
        </View>

        <Text className="text-muted-foreground text-[15px] mt-6 text-center leading-relaxed">
          Connect with others on the same journey — share wins, lean on each other
          through cravings, and quit together.
        </Text>

        <View className="mt-5 rounded-full bg-secondary px-4 py-1.5">
          <Text className="text-muted-foreground text-xs font-sans-medium uppercase tracking-wider">
            Coming soon
          </Text>
        </View>
      </View>
    </View>
  );
}

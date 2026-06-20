import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { exitToHome } from "../../lib/navigation";

/**
 * Log half-sheet (Architecture Guide §9.1 / Logging Spec §1.1). Opened by the Log
 * FAB. Four options route to the four flows. Tapping the backdrop dismisses.
 */

interface LogOption {
  route: "/(modals)/log-a" | "/(modals)/log-b" | "/(modals)/log-c" | "/(modals)/log-d";
  emoji: string;
  title: string;
  subtitle: string;
}

const OPTIONS: LogOption[] = [
  { route: "/(modals)/log-a", emoji: "🌊", title: "I'm having a craving", subtitle: "Log how strong it is" },
  { route: "/(modals)/log-b", emoji: "💪", title: "I resisted a craving", subtitle: "Mark the win" },
  { route: "/(modals)/log-c", emoji: "🚬", title: "I smoked", subtitle: "No judgment — just data" },
  { route: "/(modals)/log-d", emoji: "📝", title: "Quick note", subtitle: "Jot down a thought" },
];

export default function LogSheet() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-end bg-black/60">
      {/* Backdrop — tap to dismiss back to Home (not the tab beneath the modal) */}
      <Pressable className="absolute inset-0" onPress={exitToHome} />

      <View className="bg-card rounded-t-3xl border-t border-border px-5 pt-3 pb-8">
        <View className="self-center w-10 h-1.5 rounded-full bg-border mb-5" />
        <Text className="text-foreground font-display text-lg mb-4 px-1">What's happening?</Text>

        <View className="gap-2">
          {OPTIONS.map((o) => (
            <Pressable
              key={o.route}
              onPress={() => router.replace(o.route)}
              className="flex-row items-center bg-background border border-border rounded-3xl p-4 active:bg-muted"
            >
              <Text className="text-2xl mr-4">{o.emoji}</Text>
              <View className="flex-1">
                <Text className="text-foreground text-base font-sans-bold">{o.title}</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">{o.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

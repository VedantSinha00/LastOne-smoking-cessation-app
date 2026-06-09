import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

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
      {/* Backdrop — tap to dismiss */}
      <Pressable className="absolute inset-0" onPress={() => router.back()} />

      <View className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800 px-5 pt-3 pb-8">
        <View className="self-center w-10 h-1.5 rounded-full bg-zinc-700 mb-5" />
        <Text className="text-white text-lg font-bold mb-4 px-1">What's happening?</Text>

        <View className="gap-2">
          {OPTIONS.map((o) => (
            <Pressable
              key={o.route}
              onPress={() => router.replace(o.route)}
              className="flex-row items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-4 active:bg-zinc-800"
            >
              <Text className="text-2xl mr-4">{o.emoji}</Text>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">{o.title}</Text>
                <Text className="text-zinc-500 text-xs mt-0.5">{o.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

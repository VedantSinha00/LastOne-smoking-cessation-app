import React from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";

/**
 * Persistent Log FAB — Architecture Guide §8.5. Rendered in the tab layout so it
 * stays available across all tabs. Sits above the SOS FAB (bottom-right). Opens
 * the log entry sheet; the four-flow routing (A/B/C/D) lands in Step 9.
 */
export const LogFab: React.FC = () => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/(modals)/log")}
      className="absolute bottom-24 right-6 w-16 h-16 bg-amber-500 rounded-full justify-center items-center shadow-xl active:bg-amber-600 z-50 elevation-5"
    >
      <Text className="text-zinc-950 font-black text-2xl">+</Text>
    </Pressable>
  );
};

import React from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";

/**
 * Daily Check-In card — Home Spec §E / Logging Spec §8. Tapping opens Flow A
 * (Craving Log). The caller decides visibility (Stage 1+ and not-yet-satisfied);
 * this component is presentational.
 */
export const DailyCheckInCard: React.FC = () => {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/(modals)/log-a")}
      className="bg-zinc-900 border border-amber-900/40 rounded-2xl p-6 shadow-md active:bg-zinc-850"
    >
      <Text className="text-white text-base font-bold">Daily check-in</Text>
      <Text className="text-zinc-400 text-sm mt-1 leading-relaxed">
        Take a moment to log how today is going before it ends.
      </Text>
    </Pressable>
  );
};

import React from "react";
import { View, Text } from "react-native";

interface StreakCardProps {
  days: number;
  stageName: string;
}

export const StreakCard: React.FC<StreakCardProps> = ({ days, stageName }) => {
  return (
    <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex-row justify-between items-center shadow-lg">
      <View>
        <Text className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Current Streak</Text>
        <Text className="text-white text-4xl font-extrabold mt-1">{days} {days === 1 ? "Day" : "Days"}</Text>
        <Text className="text-zinc-500 text-xs mt-1">Stage: {stageName}</Text>
      </View>
      <View className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 items-center justify-center">
        <Text className="text-amber-500 text-2xl font-bold">🔥</Text>
      </View>
    </View>
  );
};

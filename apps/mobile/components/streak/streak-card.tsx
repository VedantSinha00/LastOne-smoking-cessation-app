import React from "react";
import { View, Text } from "react-native";

interface StreakCardProps {
  days: number;
  stageName: string;
}

export const StreakCard: React.FC<StreakCardProps> = ({ days, stageName }) => {
  return (
    <View className="bg-card border border-border p-6 rounded-3xl flex-row justify-between items-center">
      <View>
        <Text className="text-muted-foreground text-sm font-sans-medium uppercase tracking-wider">Current Streak</Text>
        <Text className="text-foreground font-display text-4xl mt-1">{days} {days === 1 ? "Day" : "Days"}</Text>
        <Text className="text-muted-foreground text-xs mt-1">Stage: {stageName}</Text>
      </View>
      <View className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 items-center justify-center">
        <Text className="text-2xl">🔥</Text>
      </View>
    </View>
  );
};

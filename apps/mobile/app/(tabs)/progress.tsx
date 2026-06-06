import React from "react";
import { View, Text, ScrollView } from "react-native";

export default function Progress() {
  const baseline = 10;
  const costPerPack = 15;
  const cigCost = costPerPack / 20;

  const daysQuit = 5;
  const totalAvoided = baseline * daysQuit;
  const moneySaved = totalAvoided * cigCost;

  return (
    <ScrollView className="flex-1 bg-zinc-950 p-6">
      <View className="mb-6">
        <Text className="text-zinc-500 text-sm font-medium">Your Progress</Text>
        <Text className="text-white text-2xl font-extrabold">Healthy Achievements</Text>
      </View>

      <View className="flex-row gap-4 mb-6">
        <View className="flex-1 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Avoided</Text>
          <Text className="text-amber-500 text-3xl font-extrabold mt-1">{totalAvoided}</Text>
          <Text className="text-zinc-400 text-xs mt-1">Cigarettes</Text>
        </View>

        <View className="flex-1 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Saved</Text>
          <Text className="text-emerald-500 text-3xl font-extrabold mt-1">${moneySaved.toFixed(2)}</Text>
          <Text className="text-zinc-400 text-xs mt-1">Est. Dollars</Text>
        </View>
      </View>

      <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <Text className="text-white text-lg font-bold mb-4">Health Improvements</Text>
        
        <View className="space-y-4">
          <View className="flex-row items-center mt-2">
            <Text className="text-2xl mr-3">❤️</Text>
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">Pulse and Blood Pressure</Text>
              <Text className="text-zinc-400 text-xs">Returned to normal baseline (Achieved)</Text>
            </View>
          </View>

          <View className="flex-row items-center mt-4">
            <Text className="text-2xl mr-3">💨</Text>
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">Carbon Monoxide Level</Text>
              <Text className="text-zinc-400 text-xs">Dropped to normal range (Achieved)</Text>
            </View>
          </View>

          <View className="flex-row items-center mt-4">
            <Text className="text-2xl mr-3">🏃</Text>
            <View className="flex-1">
              <Text className="text-zinc-400 text-sm font-semibold">Lung Function & Stamina</Text>
              <Text className="text-zinc-500 text-xs">Expected improvement in 2-3 weeks (Ongoing)</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

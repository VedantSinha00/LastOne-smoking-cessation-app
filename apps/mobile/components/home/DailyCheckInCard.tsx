import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";

/**
 * Daily Check-In card — Home Spec §E / Logging Spec §8.
 *
 * Visual design follows Lovable's DailyCheckInCard: a "TODAY · How are you doing?"
 * header with an optional Day-N pill, and two actions —
 *   • "All good today"  → green primary; marks the day satisfied (a no-craving day)
 *   • "Check in →"       → outlined secondary; opens Flow A (Craving Log)
 * On confirm it briefly shows Lovable's success state before the parent unmounts it
 * (Home hides the card once the check-in is satisfied).
 *
 * Structure follows the code/spec: satisfaction is the device-local flag owned by
 * useDailyCheckIn; the parent decides visibility (Stage 1+, not-yet-satisfied).
 */
export const DailyCheckInCard: React.FC<{ dayCount?: number }> = ({ dayCount }) => {
  const router = useRouter();
  const { markSatisfied } = useDailyCheckIn();
  const [confirmed, setConfirmed] = useState(false);

  const handleAllGood = async () => {
    setConfirmed(true);
    await markSatisfied();
    // Home re-reads the flag on focus/foreground and unmounts the card; the brief
    // confirmed state here mirrors Lovable's success moment in the meantime.
  };

  if (confirmed) {
    return (
      <View className="bg-primary/10 border border-primary/30 rounded-3xl p-7 items-center">
        <View className="w-11 h-11 rounded-full bg-primary items-center justify-center mb-3.5">
          <Check size={24} color="#FFFFFF" strokeWidth={3} />
        </View>
        <Text className="text-foreground font-display text-xl">
          {typeof dayCount === "number" ? `Day ${dayCount}. Clean.` : "Logged. Clean."}
        </Text>
        <Text className="text-success font-sans-medium text-sm mt-1">
          Streak +1. See you tomorrow.
        </Text>
      </View>
    );
  }

  return (
    <Card>
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <SectionLabel>Today</SectionLabel>
          <Text className="text-foreground font-display text-[17px]">How are you doing?</Text>
        </View>
        {typeof dayCount === "number" && (
          <View className="bg-primary/15 rounded-full px-2.5 py-1">
            <Text className="text-foreground font-sans-bold text-[11px]">Day {dayCount}</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-2.5">
        <Pressable
          onPress={handleAllGood}
          className="flex-1 h-11 rounded-xl bg-primary items-center justify-center active:opacity-90"
        >
          <Text className="text-primary-foreground font-sans-bold text-sm">All good today</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(modals)/log-a")}
          className="flex-1 h-11 rounded-xl bg-card border-[1.5px] border-foreground items-center justify-center active:bg-muted"
        >
          <Text className="text-foreground font-sans-bold text-sm">Check in →</Text>
        </Pressable>
      </View>
    </Card>
  );
};

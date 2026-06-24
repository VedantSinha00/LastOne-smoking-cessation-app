import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { useAuth } from "../../hooks/useAuth";
import { confirmSmokeFreeDay } from "../../lib/streak";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";

/** How long the success ("Day N. Clean.") state lingers before the card dismisses. */
const SUCCESS_LINGER_MS = 1800;

/**
 * Daily Check-In card — Home Spec §E / Logging Spec §8.
 *
 * Visual design follows Lovable's DailyCheckInCard: a "TODAY · How are you doing?"
 * header with an optional Day-N pill, and two actions —
 *   • "All good today"  → green primary; marks the day satisfied (a no-craving day)
 *   • "Check in →"       → outlined secondary; opens Flow A (Craving Log)
 * On confirm it shows Lovable's success state briefly, then calls onSatisfied so the
 * parent re-reads the flag and unmounts the card (Home hides it once satisfied).
 *
 * Structure follows the code/spec: satisfaction is the device-local flag owned by
 * useDailyCheckIn; the parent decides visibility (Stage 1+, not-yet-satisfied).
 */
export const DailyCheckInCard: React.FC<{
  dayCount?: number;
  /** Fired after the success state has shown, so the parent can dismiss the card. */
  onSatisfied?: () => void;
}> = ({ dayCount, onSatisfied }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { markSatisfied } = useDailyCheckIn();
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAllGood = async () => {
    setConfirmed(true);
    // "All good today" is a no-craving daily confirmation (Streak Spec §B2 —
    // confirmSmokeFreeDay's three callers are Flow B, daily check-in, SOS 'Better').
    // No log row: there was no event. But it MUST advance the streak day, else the
    // "Streak +1" copy lies and the next-day return modal misfires off a stale
    // last_confirmed_date. Idempotent per day + respects pause.
    if (user) {
      try {
        await confirmSmokeFreeDay(user.id, "log");
        queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
      } catch {
        // Best-effort: the local satisfied flag below still dismisses the card.
      }
    }
    await markSatisfied();
    // Show the success moment, then tell Home to re-read the flag and unmount us.
    // (The card and Home hold separate useDailyCheckIn instances, so marking here
    //  doesn't update Home's copy on its own — the callback bridges that.)
    timerRef.current = setTimeout(() => onSatisfied?.(), SUCCESS_LINGER_MS);
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

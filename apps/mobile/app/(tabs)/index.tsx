import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { StreakCard } from "../../components/streak/streak-card";
import { supabase } from "../../lib/supabase";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    supabase.auth.getSession()
      .then(() => setConnectionStatus("connected"))
      .catch(() => setConnectionStatus("error"));
  }, []);

  // DEV ONLY: re-walk onboarding without re-authenticating. Flips
  // onboarding_complete=false and routes back to OB-01 (stays signed in, so OB-05
  // auto-skips). Existing quit_attempts/streak rows are kept and reused.
  const handleRestartOnboarding = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_complete: false }).eq("id", user.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) });
    router.replace("/onboarding");
  };

  const streakDays = 5; // Placeholder value
  const stageNames = [
    "Stage 1: Acute Withdrawal",
    "Stage 2: Habit Rebuilding",
    "Stage 3: Growth",
    "Stage 4: Maintenance",
    "Stage 5: Integration"
  ];
  const currentStageName = stageNames[0];

  return (
    <ScrollView className="flex-1 bg-zinc-950 p-6">
      <View className="mb-6 flex-row justify-between items-center">
        <View>
          <Text className="text-zinc-500 text-sm font-medium">Welcome back,</Text>
          <Text className="text-white text-2xl font-extrabold">{user?.email?.split("@")[0] || "Friend"}</Text>
        </View>
        <View className="flex-row items-center bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-850">
          <View className={`w-2 h-2 rounded-full mr-1.5 ${
            connectionStatus === "connected" ? "bg-emerald-500" :
            connectionStatus === "error" ? "bg-red-500" : "bg-amber-500"
          }`} />
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
            {connectionStatus === "connected" ? "Connected" :
             connectionStatus === "error" ? "Failed" : "Checking"}
          </Text>
        </View>
      </View>

      <StreakCard days={streakDays} stageName={currentStageName} />

      <View className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
        <Text className="text-white text-lg font-bold mb-2">Your Focus Today</Text>
        <Text className="text-zinc-400 text-sm leading-relaxed">
          You are currently building baseline profile data. Continue using the "Log" option to record your cravings. If cravings get too intense, use the red SOS coping suite button in the bottom right.
        </Text>
      </View>

      {__DEV__ && (
        <Pressable
          onPress={handleRestartOnboarding}
          className="mt-8 border border-amber-800 rounded-2xl p-4 items-center active:bg-zinc-900"
        >
          <Text className="text-amber-500 text-sm font-semibold">DEV · Restart onboarding</Text>
          <Text className="text-zinc-600 text-xs mt-1 text-center leading-relaxed">
            Resets onboarding_complete and returns to OB-01. Stays signed in; keeps your data.
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

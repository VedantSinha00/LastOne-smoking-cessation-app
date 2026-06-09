import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useStage } from "../../hooks/useStage";
import { useStreakRecord } from "../../hooks/useStreakRecord";
import { useReturnModal } from "../../hooks/useReturnModal";
import { supabase } from "../../lib/supabase";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";
import { Greeting } from "../../components/home/Greeting";
import { StreakBar } from "../../components/home/StreakBar";
import { HealthMilestonesCard } from "../../components/home/HealthMilestonesCard";
import {
  ProgressDashboardPlaceholder,
  DailyCheckInPlaceholder,
  ContentCarouselPlaceholder,
  InsightsPreviewPlaceholder,
} from "../../components/home/placeholders";
import { ReturnModalShort, type Stk2Choice } from "../../components/home/ReturnModalShort";
import { ReturnModalLong, type Stk3Choice } from "../../components/home/ReturnModalLong";
import { DevPanel } from "../../components/home/DevPanel";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { stage, quitDate, isLoading: stageLoading } = useStage();
  const { data: streak, isLoading: streakLoading } = useStreakRecord();
  const returnModal = useReturnModal();

  // Step 8 gates home on a return modal but the per-option WRITE logic arrives in
  // Step 10 (lib/streak.ts). Until then, resolving locally lets the modal be
  // exercised on-device without trapping the user behind an unwritten mutation.
  const [returnResolved, setReturnResolved] = useState(false);

  const handleResolveReturn = (_choice: Stk2Choice | Stk3Choice) => {
    // Step 10: route _choice through lib/streak.ts (add days / consume freeze /
    // break streak), then invalidate the streak query. For now, just clear the gate.
    setReturnResolved(true);
    queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(user?.id ?? "") });
  };

  // DEV ONLY: re-walk onboarding without re-authenticating. Flips
  // onboarding_complete=false and routes back to OB-01 (stays signed in, so OB-05
  // auto-skips). Existing quit_attempts/streak rows are kept and reused.
  const handleRestartOnboarding = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_complete: false }).eq("id", user.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) });
    router.replace("/onboarding");
  };

  // ── Loading gate ──────────────────────────────────────────────────────────
  if (stageLoading || streakLoading || returnModal.isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator color="#f59e0b" />
      </View>
    );
  }

  // ── Return-modal gate (Home Spec §8 / Streak Spec §5) ──────────────────────
  // Fires before home renders. No dismiss, no skip.
  if (!returnResolved && returnModal.type === "stk2") {
    return (
      <ReturnModalShort daysMissed={returnModal.daysMissed} onResolve={handleResolveReturn} />
    );
  }
  if (!returnResolved && returnModal.type === "stk3") {
    return (
      <ReturnModalLong daysMissed={returnModal.daysMissed} onResolve={handleResolveReturn} />
    );
  }

  // ── Home (HOME-1) — scroll order per Home Spec §P6 ─────────────────────────
  const showDailyCheckIn = stage !== 0; // Not shown in Stage 0 (Home Spec §E)

  return (
    <ScrollView className="flex-1 bg-zinc-950 p-6" contentContainerClassName="gap-5 pb-12">
      {/* 1 — Greeting */}
      <Greeting firstName={profile?.first_name} />

      {/* 2 — Streak Bar */}
      <StreakBar stage={stage} streak={streak} />

      {/* 3 — Coping Surface Card: conditional on alert_level=2 (Step 16, Insights) */}

      {/* 4 — Progress Dashboard */}
      <ProgressDashboardPlaceholder />

      {/* 5 — Daily Check-In (hidden in Stage 0) */}
      {showDailyCheckIn && <DailyCheckInPlaceholder />}

      {/* 6 — Content Carousel */}
      <ContentCarouselPlaceholder />

      {/* 7 — Insights Preview */}
      <InsightsPreviewPlaceholder />

      {/* 8 — Health Milestones */}
      <HealthMilestonesCard
        stage={stage}
        quitDate={quitDate}
        onPress={() => router.push("/progress")}
      />

      {__DEV__ && (
        <>
          <DevPanel onUnlockReturnGate={() => setReturnResolved(false)} />
          <Pressable
            onPress={handleRestartOnboarding}
            className="border border-amber-800 rounded-2xl p-4 items-center active:bg-zinc-900"
          >
            <Text className="text-amber-500 text-sm font-semibold">DEV · Restart onboarding</Text>
            <Text className="text-zinc-600 text-xs mt-1 text-center leading-relaxed">
              Resets onboarding_complete and returns to OB-01. Stays signed in; keeps your data.
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

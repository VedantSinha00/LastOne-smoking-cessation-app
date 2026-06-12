import React, { useEffect, useState } from "react";
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
import { resolveStk2, resolveStk3 } from "../../lib/returnModal";
import { checkFreezePeriodAdvance } from "../../lib/streak";
import { Greeting } from "../../components/home/Greeting";
import { StreakBar } from "../../components/home/StreakBar";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { HealthMilestonesCard } from "../../components/home/HealthMilestonesCard";
import { CopingSurfaceCard } from "../../components/home/CopingSurfaceCard";
import { InsightsPreview } from "../../components/home/InsightsPreview";
import { ProgressDashboard } from "../../components/home/ProgressDashboard";
import { ContentCarousel } from "../../components/home/ContentCarousel";
import { SavingsMilestoneCard } from "../../components/home/SavingsMilestoneCard";
import { DailyCheckInCard } from "../../components/home/DailyCheckInCard";
import { GivingUpCard } from "../../components/home/GivingUpCard";
import { SupportSetupPromptCard } from "../../components/home/SupportSetupPromptCard";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { useGivingUpTrigger } from "../../hooks/useGivingUpTrigger";
import { ReturnModalShort, type Stk2Choice } from "../../components/home/ReturnModalShort";
import { ReturnModalLong, type Stk3Choice } from "../../components/home/ReturnModalLong";
import { DevPanel } from "../../components/home/DevPanel";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { stage, daysSinceQuit, quitDate, isLoading: stageLoading } = useStage();
  const { data: streak, isLoading: streakLoading } = useStreakRecord();
  const returnModal = useReturnModal();
  const { satisfied: checkInSatisfied, refresh: refreshCheckIn } = useDailyCheckIn();
  const givingUp = useGivingUpTrigger();

  // Return-modal gate. The option handlers apply the real streak writes
  // (lib/returnModal) then clear the gate so home renders with fresh values.
  const [returnResolved, setReturnResolved] = useState(false);

  const refreshStreak = () => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
    // Prefix invalidation so the dashboard's allAttempts read refreshes too — the
    // return-modal resolution can move the quit attempt, which moves the counters.
    queryClient.invalidateQueries({ queryKey: ["quit_attempt"] });
  };

  const handleResolveStk2 = async (choice: Stk2Choice) => {
    if (user) await resolveStk2(user.id, choice, returnModal.daysMissed);
    refreshStreak();
    setReturnResolved(true);
  };

  const handleResolveStk3 = async (choice: Stk3Choice) => {
    if (user) await resolveStk3(user.id, choice, returnModal.daysMissed);
    refreshStreak();
    setReturnResolved(true);
  };

  // Freeze-period advance runs once on app open when a quit date is set
  // (Streak Spec §B2 — Day 15/29/91 boundaries). Idempotent; no-op if not crossed.
  useEffect(() => {
    if (user && quitDate) {
      checkFreezePeriodAdvance(user.id, quitDate).then((advanced) => {
        if (advanced) refreshStreak();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, quitDate]);

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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7FC200" />
      </View>
    );
  }

  // ── Return-modal gate (Home Spec §8 / Streak Spec §5) ──────────────────────
  // Fires before home renders. No dismiss, no skip.
  if (!returnResolved && returnModal.type === "stk2") {
    return (
      <ReturnModalShort daysMissed={returnModal.daysMissed} onResolve={handleResolveStk2} />
    );
  }
  if (!returnResolved && returnModal.type === "stk3") {
    return (
      <ReturnModalLong daysMissed={returnModal.daysMissed} onResolve={handleResolveStk3} />
    );
  }

  // ── Home (HOME-1) — scroll order per Home Spec §P6 ─────────────────────────
  // Daily check-in: Stage 1+ only (Home Spec §E), hidden once satisfied for the day.
  // GU-1 takes priority over it for the session when both are due (GU Spec §8) —
  // the day still counts as engaged without resolving the check-in.
  const showDailyCheckIn = stage !== 0 && !checkInSatisfied && !givingUp.showCard;
  // "Day N" framing only makes sense once the quit streak exists (Stage 1+).
  // At Stage 0 (pre-quit) we omit it so the greeting/card don't read "Day 0".
  const dayCount = stage === 0 ? undefined : daysSinceQuit;

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-6" contentContainerClassName="gap-7 pb-12">
      {/* 1 — Greeting */}
      <Greeting firstName={profile?.first_name} dayCount={dayCount} />

      {/* 2 — Streak Bar */}
      <View>
        <SectionLabel>Streaks</SectionLabel>
        <StreakBar stage={stage} streak={streak} />
      </View>

      {/* 3 — Coping Surface Card: renders only at alert_level=2 (Insights §B2.8) */}
      <CopingSurfaceCard />

      {/* 4 — Progress Dashboard */}
      <View>
        <SectionLabel>Progress</SectionLabel>
        <ProgressDashboard stage={stage} />
      </View>

      {/* 4b — Savings milestone celebration (inline, fires once per threshold) */}
      <SavingsMilestoneCard />

      {/* 5 — GU-1 trigger card (replaces the check-in this session when due),
            else Daily Check-In (Stage 1+, until satisfied) */}
      <GivingUpCard />
      {showDailyCheckIn && (
        <DailyCheckInCard dayCount={dayCount} onSatisfied={refreshCheckIn} />
      )}

      {/* 6 — Content Carousel */}
      <ContentCarousel />

      {/* 7 — Insights Preview */}
      <InsightsPreview />

      {/* 7b — One-time Stage-2 support person setup prompt (GU §B2, low priority) */}
      <SupportSetupPromptCard />

      {/* 8 — Health Milestones */}
      <HealthMilestonesCard
        stage={stage}
        quitDate={quitDate}
        onPress={() => router.push("/progress")}
      />

      {__DEV__ && (
        <>
          <DevPanel
            onUnlockReturnGate={() => setReturnResolved(false)}
            onResetCheckIn={refreshCheckIn}
          />
          <Pressable
            onPress={handleRestartOnboarding}
            className="border border-border rounded-2xl p-4 items-center active:bg-muted"
          >
            <Text className="text-craving text-sm font-sans-bold">DEV · Restart onboarding</Text>
            <Text className="text-muted-foreground text-xs mt-1 text-center leading-relaxed">
              Resets onboarding_complete and returns to OB-01. Stays signed in; keeps your data.
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

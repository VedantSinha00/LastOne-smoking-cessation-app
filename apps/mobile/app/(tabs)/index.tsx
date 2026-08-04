import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useStage } from "../../hooks/useStage";
import { useStreakRecord } from "../../hooks/useStreakRecord";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";
import { checkFreezePeriodAdvance } from "../../lib/streak";
import { TopBar } from "../../components/home/TopBar";
import { Greeting } from "../../components/home/Greeting";
import { StreakBar } from "../../components/home/StreakBar";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { HealthMilestonesAccordion } from "../../components/home/HealthMilestonesAccordion";
import { CopingSurfaceCard } from "../../components/home/CopingSurfaceCard";
import { InsightsPreview } from "../../components/home/InsightsPreview";
import { ProgressDashboard } from "../../components/home/ProgressDashboard";
import { ContentCarousel } from "../../components/home/ContentCarousel";
import { SavingsMilestoneCard } from "../../components/home/SavingsMilestoneCard";
import { HomePersonalGoalCard } from "../../components/home/HomePersonalGoalCard";
import { DailyCheckInCard } from "../../components/home/DailyCheckInCard";
import { GivingUpCard } from "../../components/home/GivingUpCard";
import { SupportSetupPromptCard } from "../../components/home/SupportSetupPromptCard";
import { GameStreakNudgeCard } from "../../components/home/GameStreakNudgeCard";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { useGivingUpTrigger } from "../../hooks/useGivingUpTrigger";

export default function Home() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { stage, daysSinceQuit, quitDate, isLoading: stageLoading } = useStage();
  const { data: streak, isLoading: streakLoading } = useStreakRecord();
  const { satisfied: checkInSatisfied, refresh: refreshCheckIn } = useDailyCheckIn();
  const givingUp = useGivingUpTrigger();

  // The return-modal gate now lives in app/(tabs)/_layout.tsx (components/home/
  // ReturnGate), wrapping the whole tab tree — gating it here left the tab bar,
  // the "+" Log FAB and the SOS FAB tappable alongside the modal.
  const [showStreakHome, setShowStreakHome] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('show_streak_home').then((val) => {
        if (val !== null) setShowStreakHome(val === 'true');
      });
    }, [])
  );

  const refreshStreak = () => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
    // Prefix invalidation so the dashboard's allAttempts read refreshes too — the
    // return-modal resolution can move the quit attempt, which moves the counters.
    queryClient.invalidateQueries({ queryKey: ["quit_attempt"] });
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

  // ── Loading gate ──────────────────────────────────────────────────────────
  if (stageLoading || streakLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7FC200" />
      </View>
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
    <View className="flex-1 bg-background">
      {/* Top app bar — wordmark + bell + profile (design TopBar) */}
      <TopBar />

      <ScrollView className="flex-1 bg-background px-5 pt-2" contentContainerClassName="gap-7 pb-12">
      {/*
        Home scroll order — design-led, reconciled with the Home Spec per-section
        (user calls 2026-06-20, see [[project_home_design_vs_spec]]):
          1 Greeting · 2 Content (Today) · 3 Streak Bar · 4 Coping (cond.) ·
          5 Daily Check-In · 6 Progress (+savings, goals) · 7 Insights Preview ·
          8 Health Milestones.
        Design wins on: content-first (Today above Streak), Check-In before
        Progress. Spec wins on: Insights at 7 (before Health Milestones).
      */}

      {/* 1 — Greeting (subline intentionally omitted — design preference) */}
      <Greeting firstName={profile?.first_name} />

      {/* 2 — Content Carousel (design leads with today's content above the streak) */}
      <ContentCarousel />

      {/* 3 — Streak Bar */}
      {showStreakHome && (
        <View>
          <SectionLabel>Streaks</SectionLabel>
          <StreakBar stage={stage} streak={streak} />
        </View>
      )}

      {/* 4 — Coping Surface Card: renders only at alert_level=2 (Insights §B2.8) */}
      <CopingSurfaceCard />

      {/* 5 — Daily Check-In (design places it before Progress). GU-1 trigger card
            takes priority and replaces the check-in this session when due. */}
      <GivingUpCard />
      {showDailyCheckIn && (
        <DailyCheckInCard dayCount={dayCount} onSatisfied={refreshCheckIn} />
      )}

      {/* 6 — Progress Dashboard */}
      <View>
        <SectionLabel>Progress</SectionLabel>
        <ProgressDashboard stage={stage} />
      </View>

      {/* 6b — Savings milestone celebration (inline, fires once per threshold) */}
      <SavingsMilestoneCard />

      {/* 6c — Personal Goals (design Home section; top active goal, taps to /goals) */}
      <HomePersonalGoalCard />

      {/* 7 — Insights Preview (spec position: before Health Milestones) */}
      <View>
        <SectionLabel>Recent Insights</SectionLabel>
        <InsightsPreview />
      </View>

      {/* 7b — One-time Stage-2 support person setup prompt (GU §B2, low priority) */}
      <SupportSetupPromptCard />

      {/* 7c — Stage-4 mini-game re-engagement nudge (MiniGames §B2, max 2 lifetime) */}
      <GameStreakNudgeCard />

      {/* 8 — Health Milestones — full staged accordion inline on Home (design 1:1) */}
      <HealthMilestonesAccordion />
      </ScrollView>
    </View>
  );
}

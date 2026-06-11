import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import * as Notifications from "expo-notifications";
import { format, subDays, differenceInCalendarDays, parseISO } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { queryClient } from "../../lib/queryClient";
import { deriveStage } from "../../lib/stage";
import { FREEZE_MATRIX } from "../../lib/streak";
import { reconcileNotifications } from "../../lib/notifications";
import { pauseStreak, resumeStreak } from "../../lib/streak";
import type { DependencyLevel } from "../../types/database";

/**
 * DEV-ONLY verification panel (Phase 3 + 4). Drives the test state — quit_date,
 * streak, return modal, freezes, slip pattern — by tapping, instead of SQL.
 *
 * Design rule (added Phase 4): every button leaves a SELF-CONSISTENT state and
 * refreshes the dashboard. The Stage buttons are the source of truth for the quit
 * attempt: each routes through syncStreakToQuitDate(), which sets streak_record
 * (days, stage, freeze_period, freeze_stock) to values that AGREE with the quit_date
 * and the FREEZE_MATRIX — so the StreakBar, the Progress Dashboard, and the stage
 * system never disagree, and freezes are never written to an off-matrix value.
 *
 * Delete this whole component before release (Step 21).
 *
 * Date math mirrors the hooks:
 *   useStage:       quit_attempts.quit_date → null=0, 1d=1, 10d=3
 *   useReturnModal: daysMissed = calendarDays(today, last_confirmed) − 1
 *                   last_confirmed 2d ago → daysMissed 1 → STK-2
 *                   last_confirmed 6d ago → daysMissed 5 → STK-3
 */

interface DevPanelProps {
  /** Reset the home screen's local return-modal gate so the modal re-fires. */
  onUnlockReturnGate: () => void;
  /** Tell Home to re-read the daily-check-in flag after we clear it (in-memory state). */
  onResetCheckIn?: () => void;
}

const todayISO = () => format(new Date(), "yyyy-MM-dd");
const daysAgoISO = (n: number) => format(subDays(new Date(), n), "yyyy-MM-dd");

/** freeze_period for a given days-since-quit (Streak Spec §2: Day 15/29/91 boundaries). */
const periodForDays = (days: number): 0 | 1 | 2 | 3 =>
  days >= 91 ? 3 : days >= 29 ? 2 : days >= 15 ? 1 : 0;

export const DevPanel: React.FC<DevPanelProps> = ({ onUnlockReturnGate, onResetCheckIn }) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refreshAll = async () => {
    if (!user) return;
    // Prefix invalidation so BOTH attempt reads (currentAttempt + the dashboard's
    // allAttempts) and the whole logs subtree + streak refresh together. content_cards
    // is included so the savings-milestone card (derives money from attempts/slips)
    // recomputes when a stage button changes the quit_date.
    await queryClient.invalidateQueries({ queryKey: ["quit_attempt"] });
    await queryClient.invalidateQueries({ queryKey: ["logs", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["streak_record", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["content_cards"] });
  };

  /**
   * Write a fully self-consistent streak_record for a target quit_date. This is the
   * one place streak state is derived, so every button that moves the quit attempt
   * produces matching days/stage/freeze values. freeze_stock comes from the matrix
   * for the user's dependency_level at the period the quit_date falls in — never a
   * hard-coded guess (the old hard-coded "2" was the source of freeze flicker).
   */
  const syncStreakToQuitDate = async (quitDate: string | null) => {
    if (!user) return { days: 0, stage: 0 as ReturnType<typeof deriveStage>, freeze: 0 };
    const days = quitDate ? Math.max(0, differenceInCalendarDays(new Date(), parseISO(quitDate))) : 0;
    const stage = deriveStage(quitDate);
    const period = periodForDays(days);

    // Read dependency_level so freeze allocation matches the real matrix.
    const { data: streak } = await supabase
      .from("streak_record")
      .select("dependency_level")
      .eq("user_id", user.id)
      .maybeSingle();
    const dep: DependencyLevel = streak?.dependency_level ?? "light";
    const freeze = FREEZE_MATRIX[dep][period];

    await supabase
      .from("streak_record")
      .update({
        current_streak_days: days,
        lifetime_smoke_free_days: days,
        longest_streak_ever: days,
        smoke_free_days_in_attempt: days,
        active_days_in_attempt: days,
        freeze_period: period,
        freeze_max_current_period: freeze,
        freeze_stock: freeze,
        current_stage: stage,
        streak_status: "active",
        // last_confirmed yesterday (or today pre-quit) so the next confirm increments.
        last_confirmed_date: days > 0 ? daysAgoISO(1) : todayISO(),
        streak_start_date: quitDate ?? todayISO(),
        paused_at: null,
      })
      .eq("user_id", user.id)
      .throwOnError();

    return { days, stage, freeze };
  };

  /** Set quit_date on the open attempt AND sync streak_record to match (source of truth). */
  const setQuitDate = async (label: string, value: string | null) => {
    if (!user) return;
    setBusy(label);
    try {
      await supabase
        .from("quit_attempts")
        .update({ quit_date: value })
        .eq("user_id", user.id)
        .is("ended_at", null)
        .throwOnError();

      const { days, stage, freeze } = await syncStreakToQuitDate(value);
      await refreshAll();
      setLastResult(`quit_date → ${value ?? "null"} · streak ${days}d · stage ${stage} · freezes ${freeze} (${label})`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Set last_confirmed_date, then unlock the gate so the return modal re-fires. */
  const setLastConfirmed = async (label: string, value: string) => {
    if (!user) return;
    setBusy(label);
    try {
      await supabase
        .from("streak_record")
        .update({ last_confirmed_date: value })
        .eq("user_id", user.id)
        .throwOnError();
      await refreshAll();
      onUnlockReturnGate();
      const missed = Math.max(0, differenceInCalendarDays(new Date(), parseISO(value)) - 1);
      setLastResult(`last_confirmed → ${value} · daysMissed ${missed} (${label})`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Override freeze_stock only (to test slip freeze vs break with freeze=0). */
  const setFreezeStock = async (label: string, value: number) => {
    if (!user) return;
    setBusy(label);
    try {
      await supabase.from("streak_record").update({ freeze_stock: value }).eq("user_id", user.id).throwOnError();
      await refreshAll();
      setLastResult(`freeze_stock → ${value} (${label})`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Set slip_state.red_flag_count + clear last_slip_date (to reach the C3 restart nudge). */
  const setRedFlag = async (label: string, value: number) => {
    if (!user) return;
    setBusy(label);
    try {
      await supabase
        .from("slip_state")
        .update({ red_flag_count: value, last_slip_date: daysAgoISO(1) })
        .eq("user_id", user.id)
        .throwOnError();
      await refreshAll();
      setLastResult(`red_flag_count → ${value}, last_slip = yesterday (${label})`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /**
   * Reset the user's activity state to a clean slate WITHOUT touching onboarding
   * (profiles) or the quit attempt. Re-syncs streak to the open attempt's quit_date
   * so nothing desyncs. NOTE: the `log` table has no client DELETE policy (RLS allows
   * INSERT/SELECT/UPDATE only), so log rows are NOT cleared here — run the SQL snippet.
   */
  const resetActivityData = async (label: string) => {
    if (!user) return;
    setBusy(label);
    try {
      const uid = user.id;
      const { data: open } = await supabase
        .from("quit_attempts")
        .select("quit_date")
        .eq("user_id", uid)
        .is("ended_at", null)
        .maybeSingle();

      // Delete what the client may (NOT log — RLS blocks it).
      await supabase.from("user_card_history").delete().eq("user_id", uid).throwOnError();
      await supabase.from("user_tool_scores").delete().eq("user_id", uid).throwOnError();

      // Streak re-synced to quit_date (consistent stage + matrix freezes).
      const { days, stage } = await syncStreakToQuitDate(open?.quit_date ?? null);

      await supabase
        .from("slip_state")
        .update({ red_flag_count: 0, last_slip_date: null, pattern_window_open: false })
        .eq("user_id", uid)
        .throwOnError();
      await supabase
        .from("user_sos_state")
        .update({ failed_sos_count: 0, consecutive_sos_successes: 0, window_started_at: null })
        .eq("user_id", uid)
        .throwOnError();

      await AsyncStorage.removeItem(`daily_checkin_satisfied:${uid}`);
      await queryClient.invalidateQueries();
      setLastResult(
        `reset: cards/tools cleared, slip/SOS zeroed, streak synced to ${days}d/stage ${stage}. ` +
          `NOTE: log rows NOT cleared — run the SQL snippet for that.`,
      );
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Clear today's daily-check-in flag so the card reappears (AsyncStorage, not DB). */
  const resetDailyCheckIn = async (label: string) => {
    if (!user) return;
    setBusy(label);
    try {
      await AsyncStorage.removeItem(`daily_checkin_satisfied:${user.id}`);
      onResetCheckIn?.(); // re-read Home's in-memory flag so the card reappears now
      setLastResult(`daily check-in flag cleared — card should reappear (${label})`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  // ── Phase 5 (Notifications) verification ──────────────────────────────────

  /** Re-run the app-open reconcile so scheduling reflects the current quit_date/
   *  stage/pause without a relaunch (after tapping a Stage button above). */
  const reconcileNow = async (label: string) => {
    if (!user) return;
    setBusy(label);
    try {
      await reconcileNotifications(user.id);
      setLastResult(`reconcileNotifications ran (${label})`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Dump every OS-scheduled notification so check-in / milestone / pause schedules
   *  are observable without waiting for their real fire times. */
  const dumpScheduled = async (label: string) => {
    setBusy(label);
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      if (scheduled.length === 0) {
        setLastResult("scheduled: (none)");
        return;
      }
      const lines = scheduled.map((s) => {
        const type = (s.content.data?.type as string) ?? "?";
        const trig: any = s.trigger;
        let when = "";
        if (trig?.type === "date" && trig.value) when = new Date(trig.value).toLocaleString();
        else if (trig?.type === "daily") when = `daily ${trig.hour}:${String(trig.minute).padStart(2, "0")}`;
        else if (trig?.dateComponents) when = `daily ${trig.dateComponents.hour}:00`;
        else when = JSON.stringify(trig).slice(0, 40);
        return `• ${type} — ${when}`;
      });
      setLastResult(`scheduled (${scheduled.length}):\n${lines.join("\n")}`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Pause the streak → schedules the N-PAU track (then Dump to confirm 4 entries). */
  const pauseNow = async (label: string) => {
    if (!user) return;
    setBusy(label);
    try {
      await pauseStreak(user.id);
      await refreshAll();
      setLastResult("paused → N-PAU track scheduled. Tap 'Dump scheduled' to confirm.");
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Toggle profiles.notifications_enabled, then reconcile so the effect is immediate.
   *  enabled=false → reconcile cancels/schedules nothing (Dump should be empty). */
  const setNotificationsEnabled = async (label: string, value: boolean) => {
    if (!user) return;
    setBusy(label);
    try {
      await supabase
        .from("profiles")
        .update({ notifications_enabled: value })
        .eq("id", user.id)
        .throwOnError();
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      await reconcileNotifications(user.id);
      setLastResult(`notifications_enabled → ${value}, reconciled. Tap 'Dump scheduled'.`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Set notification_state.effective_tier, then reconcile. on_demand → only the
   *  on_demand-eligible milestones (N-CON-01–06) survive; N-CON-07–12 + N-STK-01 drop. */
  const setEffectiveTier = async (label: string, tier: "app_decides" | "on_demand") => {
    if (!user) return;
    setBusy(label);
    try {
      await supabase
        .from("notification_state")
        .update({ effective_tier: tier })
        .eq("user_id", user.id)
        .throwOnError();
      await reconcileNotifications(user.id);
      setLastResult(`effective_tier → ${tier}, reconciled. Tap 'Dump scheduled'.`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Resume the streak → cancels the N-PAU track (then Dump to confirm they're gone). */
  const resumeNow = async (label: string) => {
    if (!user) return;
    setBusy(label);
    try {
      await resumeStreak(user.id);
      await refreshAll();
      setLastResult("resumed → N-PAU cancelled. Tap 'Dump scheduled' to confirm.");
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      disabled={busy !== null}
      className="bg-secondary border border-border rounded-xl px-3 py-2.5 active:bg-muted"
    >
      <Text className="text-foreground text-xs font-sans-bold text-center">
        {busy === label ? "…" : label}
      </Text>
    </Pressable>
  );

  return (
    <View className="border border-purple-800/60 rounded-2xl p-4 mt-2">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-purple-400 text-xs font-bold uppercase tracking-wider">
          DEV · Phase 3+4 verify
        </Text>
        {busy && <ActivityIndicator size="small" color="#a855f7" />}
      </View>

      <Text className="text-muted-foreground text-[11px] mb-1.5">Stage (sets quit_date + syncs streak & freezes)</Text>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1"><Btn label="Stage 0 (clear)" onPress={() => setQuitDate("Stage 0 (clear)", null)} /></View>
        <View className="flex-1"><Btn label="Stage 1 (1d)" onPress={() => setQuitDate("Stage 1 (1d)", daysAgoISO(1))} /></View>
        <View className="flex-1"><Btn label="Stage 3 (10d)" onPress={() => setQuitDate("Stage 3 (10d)", daysAgoISO(10))} /></View>
      </View>

      <Text className="text-muted-foreground text-[11px] mb-1.5">Return modal (sets last_confirmed → re-fires)</Text>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1"><Btn label="None (today)" onPress={() => setLastConfirmed("None (today)", todayISO())} /></View>
        <View className="flex-1"><Btn label="STK-2 (missed 1)" onPress={() => setLastConfirmed("STK-2 (missed 1)", daysAgoISO(2))} /></View>
        <View className="flex-1"><Btn label="STK-3 (missed 5)" onPress={() => setLastConfirmed("STK-3 (missed 5)", daysAgoISO(6))} /></View>
      </View>

      <Text className="text-muted-foreground text-[11px] mb-1.5">Freeze stock override (slip freeze vs break)</Text>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1"><Btn label="freeze = 2" onPress={() => setFreezeStock("freeze = 2", 2)} /></View>
        <View className="flex-1"><Btn label="freeze = 0" onPress={() => setFreezeStock("freeze = 0", 0)} /></View>
      </View>

      <Text className="text-muted-foreground text-[11px] mb-1.5">Slip pattern (red_flag → C3 nudge)</Text>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1"><Btn label="red_flag = 0" onPress={() => setRedFlag("red_flag = 0", 0)} /></View>
        <View className="flex-1"><Btn label="red_flag = 2" onPress={() => setRedFlag("red_flag = 2", 2)} /></View>
      </View>

      <Text className="text-muted-foreground text-[11px] mb-1.5">Reset (for repeat testing)</Text>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1"><Btn label="Reset check-in flag" onPress={() => resetDailyCheckIn("Reset check-in flag")} /></View>
      </View>

      <Text className="text-muted-foreground text-[11px] mb-1.5">
        Phase 5 — Notifications (set a Stage above, then Reconcile, then Dump)
      </Text>
      <View className="flex-row gap-2 mb-2">
        <View className="flex-1"><Btn label="Reconcile now" onPress={() => reconcileNow("Reconcile now")} /></View>
        <View className="flex-1"><Btn label="Dump scheduled" onPress={() => dumpScheduled("Dump scheduled")} /></View>
      </View>
      <View className="flex-row gap-2 mb-2">
        <View className="flex-1"><Btn label="Pause (→N-PAU)" onPress={() => pauseNow("Pause (→N-PAU)")} /></View>
        <View className="flex-1"><Btn label="Resume (cancel)" onPress={() => resumeNow("Resume (cancel)")} /></View>
      </View>
      <View className="flex-row gap-2 mb-2">
        <View className="flex-1"><Btn label="notif OFF" onPress={() => setNotificationsEnabled("notif OFF", false)} /></View>
        <View className="flex-1"><Btn label="notif ON" onPress={() => setNotificationsEnabled("notif ON", true)} /></View>
      </View>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1"><Btn label="tier on_demand" onPress={() => setEffectiveTier("tier on_demand", "on_demand")} /></View>
        <View className="flex-1"><Btn label="tier app_decides" onPress={() => setEffectiveTier("tier app_decides", "app_decides")} /></View>
      </View>

      <Text className="text-muted-foreground text-[11px] mb-1.5">
        Reset activity (keeps onboarding + quit_date). Logs need SQL — see note.
      </Text>
      <Pressable
        onPress={() => resetActivityData("Wipe activity")}
        disabled={busy !== null}
        className="border border-red-800/70 rounded-xl px-3 py-2.5 active:bg-red-950/40"
      >
        <Text className="text-destructive text-xs font-semibold text-center">
          {busy === "Wipe activity" ? "…" : "Reset cards / tools / slip / SOS (sync streak)"}
        </Text>
      </Pressable>

      {lastResult && (
        <Text className="text-muted-foreground text-[10px] mt-3 leading-relaxed">{lastResult}</Text>
      )}
    </View>
  );
};

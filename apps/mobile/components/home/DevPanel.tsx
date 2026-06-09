import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { format, subDays } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";

/**
 * DEV-ONLY verification panel for the Step 8 checklist. Lets the tester drive
 * quit_date (stage) and last_confirmed_date (return modal) by tapping, instead
 * of hand-editing SQL. Delete this whole component when Step 8 is signed off.
 *
 * Date math mirrors the hooks:
 *   useStage:        reads quit_attempts.quit_date → null=0, yesterday=1, 10d=3
 *   useReturnModal:  daysMissed = calendarDays(today, last_confirmed) − 1
 *                    last_confirmed 2d ago → daysMissed 1 → STK-2
 *                    last_confirmed 6d ago → daysMissed 5 → STK-3
 *                    last_confirmed today  → daysMissed 0 → none
 */

interface DevPanelProps {
  /** Reset the home screen's local return-modal gate so the modal re-fires. */
  onUnlockReturnGate: () => void;
}

const todayISO = () => format(new Date(), "yyyy-MM-dd");
const daysAgoISO = (n: number) => format(subDays(new Date(), n), "yyyy-MM-dd");

export const DevPanel: React.FC<DevPanelProps> = ({ onUnlockReturnGate }) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refreshAll = async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.currentAttempt(user.id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
  };

  /** Set quit_date on the open attempt (ended_at IS NULL). */
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
      await refreshAll();
      setLastResult(`quit_date → ${value ?? "null"} (${label})`);
    } catch (e: any) {
      setLastResult(`ERROR: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  /** Set last_confirmed_date on the streak record, then unlock the gate so the modal re-fires. */
  const setLastConfirmed = async (label: string, value: string) => {
    if (!user) return;
    setBusy(label);
    try {
      await supabase
        .from("streak_record")
        .update({ last_confirmed_date: value })
        .eq("user_id", user.id)
        .throwOnError();
      onUnlockReturnGate();
      await refreshAll();
      setLastResult(`last_confirmed_date → ${value} (${label})`);
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
      className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 active:bg-zinc-800"
    >
      <Text className="text-zinc-200 text-xs font-semibold text-center">
        {busy === label ? "…" : label}
      </Text>
    </Pressable>
  );

  return (
    <View className="border border-purple-800/60 rounded-2xl p-4 mt-2">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-purple-400 text-xs font-bold uppercase tracking-wider">
          DEV · Step 8 verify
        </Text>
        {busy && <ActivityIndicator size="small" color="#a855f7" />}
      </View>

      <Text className="text-zinc-500 text-[11px] mb-1.5">Stage (quit_date)</Text>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1"><Btn label="Stage 0 (clear)" onPress={() => setQuitDate("Stage 0 (clear)", null)} /></View>
        <View className="flex-1"><Btn label="Stage 1 (1d ago)" onPress={() => setQuitDate("Stage 1 (1d ago)", daysAgoISO(1))} /></View>
        <View className="flex-1"><Btn label="Stage 3 (10d ago)" onPress={() => setQuitDate("Stage 3 (10d ago)", daysAgoISO(10))} /></View>
      </View>

      <Text className="text-zinc-500 text-[11px] mb-1.5">Return modal (last_confirmed_date)</Text>
      <View className="flex-row gap-2">
        <View className="flex-1"><Btn label="None (today)" onPress={() => setLastConfirmed("None (today)", todayISO())} /></View>
        <View className="flex-1"><Btn label="STK-2 (2d ago)" onPress={() => setLastConfirmed("STK-2 (2d ago)", daysAgoISO(2))} /></View>
        <View className="flex-1"><Btn label="STK-3 (6d ago)" onPress={() => setLastConfirmed("STK-3 (6d ago)", daysAgoISO(6))} /></View>
      </View>

      {lastResult && (
        <Text className="text-zinc-600 text-[10px] mt-3 leading-relaxed">{lastResult}</Text>
      )}
    </View>
  );
};

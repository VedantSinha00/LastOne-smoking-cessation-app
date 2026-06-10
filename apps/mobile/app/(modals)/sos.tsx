import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useSosSelection } from "../../hooks/useSosSelection";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { ToolRunner } from "../../components/coping/ToolRunner";
import { Button } from "../../components/ui/button";
import { queryKeys } from "../../lib/queryKeys";
import { WHAT_HELPED_TOKENS } from "../../lib/logOptions";
import {
  updateToolScore,
  recordSosOutcome,
  getSosEscalationLevel,
  resetSosWindow,
  type SosEscalationLevel,
} from "../../lib/sos";
import { confirmSmokeFreeDay } from "../../lib/streak";
import type { CravingContext } from "../../lib/sosTool";
import type { Database } from "../../types/database";

type CopingTool = Database["public"]["Tables"]["coping_tools"]["Row"];
type Screen = "GATE" | "SOS1" | "SOS2" | "SOS3";

/**
 * SOS Flow (Coping Tools §06 / Logging Spec §6).
 * GATE: context gate — "Around people / On my own" — feeds the selection waterfall.
 * SOS-1: three waterfall-selected tools (escalation ladder applied — §8.1).
 * SOS-2: tool runner, duration tracked → updateLog tool_duration_seconds.
 * SOS-3: skippable check-in. Better → +1 + confirmSmokeFreeDay; Same → -1; I smoked
 *        → compressed Flow C. Outcome recorded into user_sos_state (§B2).
 */
export default function SosModal() {
  const router = useRouter();
  const { user } = useAuth();
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const { markSatisfied } = useDailyCheckIn();
  const qc = useQueryClient();

  const [screen, setScreen] = useState<Screen>("GATE");
  const [context, setContext] = useState<CravingContext>("unknown");
  const [tool, setTool] = useState<CopingTool | null>(null);
  const [escalation, setEscalation] = useState<SosEscalationLevel>(0);
  const [processing, setProcessing] = useState(false); // guards the check-in buttons
  const logIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const [whatHelped, setWhatHelped] = useState<string[]>([]);

  // Waterfall runs once context is chosen. Intensity is unknown here (SOS triggered
  // without an intensity log) — the cold-start "unknown" column handles that.
  const { data: tools, isLoading } = useSosSelection(
    { context },
    screen !== "GATE",
  );

  // Read escalation level when we leave the gate (§8.1 ladder).
  useEffect(() => {
    if (screen === "SOS1" && user) {
      getSosEscalationLevel(user.id).then(setEscalation);
    }
  }, [screen, user]);

  const chooseContext = (c: CravingContext) => {
    setContext(c);
    setScreen("SOS1");
  };

  // SOS-1 commit — log entry created at tool selection.
  const selectTool = async (t: CopingTool) => {
    setTool(t);
    startedAtRef.current = Date.now();
    setScreen("SOS2");
    try {
      const row = await createLog.mutateAsync({
        log_type: "sos",
        entry_method: "sos",
        tool_selected: t.tool_id,
      });
      logIdRef.current = row.log_id;
    } catch {
      /* Non-fatal; the tool still runs. */
    }
  };

  const finishTool = async () => {
    const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_duration_seconds: seconds } });
    }
    setProcessing(false); // fresh check-in is tappable
    setScreen("SOS3");
  };

  // ── SOS-3 outcomes ──────────────────────────────────────────────────────────
  const skip = async () => {
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: null, post_tool_state: null } });
    }
    router.back();
  };

  const better = async () => {
    if (processing) return;
    setProcessing(true);
    if (!user) return router.back();
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: true, post_tool_state: "better", what_helped: whatHelped.length ? whatHelped : null } });
    }
    if (tool) await updateToolScore(user.id, tool.tool_id, +1, "better");
    await recordSosOutcome(user.id, "better");
    await confirmSmokeFreeDay(user.id, "sos");
    await markSatisfied();
    qc.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
    router.back();
  };

  const same = async () => {
    if (processing) return;
    setProcessing(true);
    if (!user) return router.back();
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: false, post_tool_state: "same" } });
    }
    if (tool) await updateToolScore(user.id, tool.tool_id, -1, "same");
    await recordSosOutcome(user.id, "same");
    // Re-read escalation so the next surface reflects the new failed_sos_count (§8.1).
    setEscalation(await getSosEscalationLevel(user.id));
    setProcessing(false); // returns to the tool list — re-enable for the next session
    setScreen("SOS1"); // 'Try another tool?'
  };

  const smoked = async () => {
    if (processing) return;
    setProcessing(true);
    if (user) {
      if (logIdRef.current) {
        await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: false, post_tool_state: "smoked" } });
      }
      await recordSosOutcome(user.id, "smoked");
    }
    // Compressed Flow C — slip log handles acknowledgement + support.
    router.replace("/(modals)/log-c");
  };

  // DEV ONLY: the escalation placeholder cards aren't yet tappable into a real tool
  // (Step 18), so there's no way to drive failed_sos_count past level 1 by hand. This
  // simulates one more failed SOS session so the 2→3 ladder transition is testable.
  const devSimulateFailure = async () => {
    if (!user || processing) return;
    setProcessing(true);
    await recordSosOutcome(user.id, "same");
    setEscalation(await getSosEscalationLevel(user.id));
    setProcessing(false);
  };

  // DEV ONLY: clear the failed-SOS window so escalation drops back to level 0 (normal
  // waterfall), so the 0→1→2 progression can be re-tested from scratch.
  const devResetEscalation = async () => {
    if (!user || processing) return;
    setProcessing(true);
    await resetSosWindow(user.id);
    setEscalation(0);
    setProcessing(false);
  };

  // ── Context gate ────────────────────────────────────────────────────────────
  if (screen === "GATE") {
    return (
      <View className="flex-1 bg-zinc-950 px-6 py-8 justify-center">
        <View className="flex-row justify-end mb-4">
          <Pressable onPress={() => router.back()} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Text className="text-zinc-400 text-sm">Exit</Text>
          </Pressable>
        </View>
        <Text className="text-red-500 text-3xl font-black mb-2">Ride it out</Text>
        <Text className="text-zinc-400 text-base mb-10 leading-relaxed">
          Where are you right now? This helps pick the right thing to do.
        </Text>
        <View className="gap-3">
          <Pressable onPress={() => chooseContext("public")} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 active:bg-zinc-800">
            <Text className="text-white text-lg font-bold text-center">Around people</Text>
          </Pressable>
          <Pressable onPress={() => chooseContext("private")} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 active:bg-zinc-800">
            <Text className="text-white text-lg font-bold text-center">On my own</Text>
          </Pressable>
          <Pressable onPress={() => chooseContext("unknown")} className="p-3 active:opacity-70">
            <Text className="text-zinc-500 text-sm text-center">Skip — just show me something</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── SOS-1 — Tool Selection (with escalation ladder) ─────────────────────────
  if (screen === "SOS1") {
    return (
      <ScrollView className="flex-1 bg-zinc-950 px-6 py-8" contentContainerClassName="pb-12">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-red-500 text-2xl font-black">Ride it out</Text>
          <Pressable onPress={() => router.back()} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Text className="text-zinc-400 text-sm">Exit</Text>
          </Pressable>
        </View>
        <Text className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Pick one. Cravings peak and pass in a few minutes — let&apos;s get you through it.
        </Text>

        {/* Escalation level 2 (3+ failures): suspend the waterfall, escalation only (§8.1). */}
        {escalation === 2 ? (
          <EscalationOnly />
        ) : isLoading ? (
          <ActivityIndicator color="#ef4444" className="mt-8" />
        ) : !tools?.length ? (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <Text className="text-zinc-400 text-sm leading-relaxed">
              No coping tools are available right now.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {/* Level 1 (2 failures): Call a Friend pinned to slot 1, tools fill 2–3. */}
            {escalation === 1 && <CallAFriendCard />}
            {tools.map((t) => (
              <Pressable
                key={t.tool_id}
                onPress={() => selectTool(t)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 active:bg-zinc-800"
              >
                <Text className="text-white font-semibold">{t.name}</Text>
                <Text className="text-zinc-500 text-xs mt-0.5">
                  {Math.round(t.duration_seconds / 60) || 1} min · {t.category.replace(/_/g, " ")}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* DEV ONLY — drive + reset the escalation ladder (no tappable escalation tool
            exists yet; that surfacing is Step 18). */}
        {__DEV__ && (
          <View className="mt-4 gap-2">
            {escalation > 0 && (
              <Pressable
                onPress={devSimulateFailure}
                disabled={processing}
                className="border border-purple-800/60 rounded-xl p-3 active:bg-purple-950/30"
              >
                <Text className="text-purple-400 text-xs font-semibold text-center">
                  DEV · Simulate another failed SOS (level {escalation})
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={devResetEscalation}
              disabled={processing}
              className="border border-purple-800/60 rounded-xl p-3 active:bg-purple-950/30"
            >
              <Text className="text-purple-400 text-xs font-semibold text-center">
                DEV · Reset escalation → level 0
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    );
  }

  // ── SOS-2 — Tool runner ──────────────────────────────────────────────────────
  if (screen === "SOS2") {
    if (!tool) {
      setScreen("SOS1");
      return null;
    }
    return <ToolRunner tool={tool} onDone={finishTool} />;
  }

  // ── SOS-3 — Post-Tool Check-in (skippable) ──────────────────────────────────
  return (
    <ScrollView className="flex-1 bg-zinc-950 px-6 py-8" contentContainerClassName="flex-grow">
      <View className="flex-row justify-end mb-2">
        <Pressable onPress={skip} className="px-3 py-1.5">
          <Text className="text-zinc-500 text-sm">Skip</Text>
        </Pressable>
      </View>
      <Text className="text-white text-2xl font-extrabold mb-1">How are you now?</Text>
      <Text className="text-zinc-400 text-sm mb-8">No wrong answer.</Text>

      <ChipMultiSelect
        label="What else helped? (optional)"
        options={WHAT_HELPED_TOKENS}
        selected={whatHelped}
        onChange={setWhatHelped}
        allowOther={false}
      />

      <View className={`gap-3 mt-6 ${processing ? "opacity-50" : ""}`}>
        <Pressable disabled={processing} onPress={better} className="bg-emerald-600/20 border border-emerald-600 rounded-2xl p-5 active:opacity-80">
          <Text className="text-emerald-400 font-bold text-center text-base">Better — the craving passed</Text>
        </Pressable>
        <Pressable disabled={processing} onPress={same} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 active:bg-zinc-800">
          <Text className="text-zinc-200 font-bold text-center text-base">About the same</Text>
        </Pressable>
        <Pressable disabled={processing} onPress={smoked} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 active:bg-zinc-800">
          <Text className="text-zinc-400 font-semibold text-center">I smoked</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/**
 * Escalation tools — Call a Friend + Quit Specialist Line. The escalation LADDER logic
 * lives here (Step 13), but the working dialler + the SecureStore contact number are
 * owned by Step 18 (Giving Up Support). For now these render as "coming soon"
 * placeholders so the surface is correct without inventing Step-18 plumbing.
 */
const CallAFriendCard: React.FC = () => (
  <View className="bg-zinc-900 border border-amber-700/50 rounded-2xl p-4">
    <Text className="text-amber-400 font-semibold">Call a friend</Text>
    <Text className="text-zinc-500 text-xs mt-0.5">Coming soon — reach someone who gets it.</Text>
  </View>
);

const EscalationOnly: React.FC = () => (
  <View className="gap-2">
    <Text className="text-zinc-400 text-sm mb-2 leading-relaxed">
      A few tools haven&apos;t landed it this time. That&apos;s okay — let&apos;s try a person, not a screen.
    </Text>
    <CallAFriendCard />
    <View className="bg-zinc-900 border border-amber-700/50 rounded-2xl p-4">
      <Text className="text-amber-400 font-semibold">Talk to a quit specialist</Text>
      <Text className="text-zinc-500 text-xs mt-0.5">Coming soon.</Text>
    </View>
  </View>
);

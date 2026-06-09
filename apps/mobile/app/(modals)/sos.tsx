import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useCopingTools, type RankedTool } from "../../hooks/useCopingTools";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { Button } from "../../components/ui/button";
import { queryKeys } from "../../lib/queryKeys";
import { WHAT_HELPED_TOKENS } from "../../lib/logOptions";
import { updateToolScore, checkSosEscalation } from "../../lib/sos";
import { confirmSmokeFreeDay } from "../../lib/streak";

type Screen = "SOS1" | "SOS2" | "SOS3";

/**
 * SOS Flow (Logging Spec §6 / Architecture Guide §9.8).
 * SOS-1: tool selection (commit point — createLog sos + tool_selected).
 * SOS-2: tool execution, duration tracked → updateLog tool_duration_seconds.
 * SOS-3: skippable post-tool check-in.
 *   Skip → tool_helpful/post_tool_state null (excluded from scoring).
 *   Better → +1 score, confirmSmokeFreeDay('sos'). Same → -1, checkSosEscalation.
 *   I smoked → compressed Flow C (route to slip log).
 */
export default function SosModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tools, isLoading } = useCopingTools();
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const { markSatisfied } = useDailyCheckIn();
  const qc = useQueryClient();

  const [screen, setScreen] = useState<Screen>("SOS1");
  const [tool, setTool] = useState<RankedTool | null>(null);
  const logIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const [whatHelped, setWhatHelped] = useState<string[]>([]);

  // SOS-1 commit — log entry created at tool selection.
  const selectTool = async (t: RankedTool) => {
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
      // Non-fatal; the tool still runs.
    }
  };

  const finishTool = async () => {
    const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_duration_seconds: seconds } });
    }
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
    if (!user) return router.back();
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: true, post_tool_state: "better", what_helped: whatHelped.length ? whatHelped : null } });
    }
    if (tool) await updateToolScore(user.id, tool.tool_id, +1, "better");
    await confirmSmokeFreeDay(user.id, "sos");
    await markSatisfied();
    qc.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
    router.back();
  };

  const same = async () => {
    if (!user) return router.back();
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: false, post_tool_state: "same" } });
    }
    if (tool) await updateToolScore(user.id, tool.tool_id, -1, "same");
    await checkSosEscalation(user.id); // escalation surfacing handled in GU (Step 18)
    setScreen("SOS1"); // 'Try another tool?'
  };

  const smoked = async () => {
    if (logIdRef.current) {
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: false, post_tool_state: "smoked" } });
    }
    // Compressed Flow C — slip log handles acknowledgement + support.
    router.replace("/(modals)/log-c");
  };

  // ── SOS-1 — Tool Selection ──────────────────────────────────────────────────
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

        {isLoading ? (
          <ActivityIndicator color="#ef4444" className="mt-8" />
        ) : !tools?.length ? (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <Text className="text-zinc-400 text-sm leading-relaxed">
              No coping tools are available yet. (The tool catalog needs seeding — see Step 9 DB setup.)
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {tools.map((t) => (
              <Pressable
                key={t.tool_id}
                onPress={() => selectTool(t)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 active:bg-zinc-800"
              >
                <Text className="text-white font-semibold">{t.name}</Text>
                <Text className="text-zinc-500 text-xs mt-0.5">
                  {Math.round(t.duration_seconds / 60)} min · {t.category.replace(/_/g, " ")}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // ── SOS-2 — Tool Execution ──────────────────────────────────────────────────
  if (screen === "SOS2") {
    return <ToolExecution tool={tool} onDone={finishTool} />;
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

      <View className="gap-3 mt-6">
        <Pressable onPress={better} className="bg-emerald-600/20 border border-emerald-600 rounded-2xl p-5 active:opacity-80">
          <Text className="text-emerald-400 font-bold text-center text-base">Better — the craving passed</Text>
        </Pressable>
        <Pressable onPress={same} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 active:bg-zinc-800">
          <Text className="text-zinc-200 font-bold text-center text-base">About the same</Text>
        </Pressable>
        <Pressable onPress={smoked} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 active:bg-zinc-800">
          <Text className="text-zinc-400 font-semibold text-center">I smoked</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/** SOS-2 — tool runner. Breathing tools get the 4-4-4 timer; others a simple timer. */
function ToolExecution({ tool, onDone }: { tool: RankedTool | null; onDone: () => void }) {
  const isBreathing = tool?.family === "breathing" || tool?.category === "breathing";
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    if (!isBreathing) return;
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 1) return prev - 1;
        setPhase((p) => (p === "inhale" ? "hold" : p === "hold" ? "exhale" : "inhale"));
        return 4;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isBreathing]);

  return (
    <View className="flex-1 bg-zinc-950 px-6 py-8 items-center justify-center">
      <Text className="text-white text-xl font-bold text-center mb-2">{tool?.name ?? "Coping tool"}</Text>
      {isBreathing ? (
        <>
          <View className="w-48 h-48 rounded-full bg-red-600/10 border-4 border-red-600 items-center justify-center my-10">
            <Text className="text-white text-2xl font-bold capitalize">{phase}</Text>
            <Text className="text-zinc-400 text-3xl font-extrabold mt-1">{seconds}s</Text>
          </View>
          <Text className="text-zinc-500 text-sm text-center mb-10 leading-relaxed">
            Follow the rhythm. Breathe in for 4, hold for 4, out for 4.
          </Text>
        </>
      ) : (
        <Text className="text-zinc-400 text-base text-center my-10 leading-relaxed px-4">
          Take the next few minutes for this. When you&apos;re done, let us know how you feel.
        </Text>
      )}
      <Button title="I'm done" onPress={onDone} className="w-full" />
    </View>
  );
}

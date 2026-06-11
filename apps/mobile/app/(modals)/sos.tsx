import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Wind, Activity, Puzzle, Shuffle, ChevronRight, ThumbsUp, ThumbsDown, Check } from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useSosSelection } from "../../hooks/useSosSelection";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { ToolRunner } from "../../components/coping/ToolRunner";
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
import type { Database, ToolFamily } from "../../types/database";

type CopingTool = Database["public"]["Tables"]["coping_tools"]["Row"];
type Screen = "GATE" | "SOS1" | "SOS2" | "SOS3" | "SUCCESS";

const CRAVING = "#F15025";

/**
 * Soft drop shadow for the SOS-1 / gate popup cards. Matches Lovable's
 * `0 30px 80px rgba(0,0,0,0.35)` — a large, diffuse spread so the card edge reads
 * soft/floating rather than hard-cut against the dim.
 */
const POPUP_SHADOW = {
  shadowColor: "#000000",
  shadowOpacity: 0.35,
  shadowRadius: 80,
  shadowOffset: { width: 0, height: 30 },
  elevation: 24,
} as const;

// Card width matches Lovable (≤368, shrinks on narrow screens). Numeric scroll cap
// (≈82% of screen height) — NOT a percentage maxHeight on the card, and NOT
// overflow:hidden, both of which silently zero out the card's width on RN Fabric.
const SCREEN = Dimensions.get("window");
const POPUP_WIDTH = Math.min(368, SCREEN.width - 40);
const POPUP_SCROLL_MAX = Math.round(SCREEN.height * 0.82);

/** Lovable maps each tool family to a circular orange line icon (SOS-1 cards). */
function ToolFamilyIcon({ family }: { family: ToolFamily }) {
  const Icon = family === "breathing" ? Wind : family === "mini_games" ? Puzzle : Activity;
  return <Icon size={22} color={CRAVING} strokeWidth={1.8} />;
}

/**
 * Popup header: compact orange "SOS" pill + 36px grey round close — matching
 * Lovable's exact chrome (badge padding 7×14, 13px bold; close #F0EFED circle).
 */
function SosHeader({ onClose }: { onClose: () => void }) {
  return (
    <View className="flex-row justify-between items-center" style={{ marginBottom: 22 }}>
      <View
        className="bg-craving rounded-full"
        style={{ paddingVertical: 7, paddingHorizontal: 14, alignSelf: "flex-start" }}
      >
        <Text className="text-white font-sans-bold" style={{ fontSize: 13, letterSpacing: 1.5 }}>
          SOS
        </Text>
      </View>
      <Pressable
        onPress={onClose}
        className="items-center justify-center active:opacity-70"
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0EFED" }}
      >
        <Text style={{ fontSize: 20, lineHeight: 22, color: "#666666" }}>×</Text>
      </Pressable>
    </View>
  );
}

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
  const { data: profile } = useProfile();
  const firstName = profile?.first_name?.trim() || null;
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
  // Tools already shown this session — fed to the waterfall so "Show me other things"
  // surfaces a different valid trio. Cleared (wrap-around) when the pool runs dry.
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  // Waterfall runs once context is chosen. Intensity is unknown here (SOS triggered
  // without an intensity log) — the cold-start "unknown" column handles that.
  const { data: tools, isLoading } = useSosSelection(
    { context },
    screen !== "GATE",
    excludeIds,
  );

  // SOS-1 shuffle — exclude the current trio so the next re-rank shows different
  // tools; if excluding would leave too few to pick from, wrap back to the full set.
  const shuffle = () => {
    const current = (tools ?? []).map((t) => t.tool_id);
    setExcludeIds((prev) => {
      const next = [...new Set([...prev, ...current])];
      return next.length >= 9 ? [] : next; // 12-tool catalogue → reset before exhaustion
    });
  };

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
    // Show the celebratory success screen (Lovable) rather than closing straight away.
    setProcessing(false);
    setScreen("SUCCESS");
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

  // ── Context gate (spec: two large tap targets) — Lovable popup-over-home look ──
  if (screen === "GATE") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(13,13,13,0.45)" }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => router.back()} />
        <View
          className="px-6 pt-6 pb-6"
          style={{ width: POPUP_WIDTH, backgroundColor: "#FFFFFF", borderRadius: 28, ...POPUP_SHADOW }}
        >
          <SosHeader onClose={() => router.back()} />
          <Text className="text-foreground font-sans-bold mb-3" style={{ fontSize: 22, lineHeight: 27 }}>
            Where are you right now?
          </Text>
          <Text className="text-muted-foreground mb-6" style={{ fontSize: 13, lineHeight: 20 }}>
            This picks the right thing to do — pick one, that&apos;s all.
          </Text>
          <View className="gap-3">
            <Pressable onPress={() => chooseContext("public")} className="bg-card border border-border rounded-2xl p-5 active:bg-muted">
              <Text className="text-foreground text-base font-sans-bold text-center">Around people</Text>
            </Pressable>
            <Pressable onPress={() => chooseContext("private")} className="bg-card border border-border rounded-2xl p-5 active:bg-muted">
              <Text className="text-foreground text-base font-sans-bold text-center">On my own</Text>
            </Pressable>
            <Pressable onPress={() => chooseContext("unknown")} className="p-2 active:opacity-70">
              <Text className="text-muted-foreground text-[13px] text-center">Skip — just show me something</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── SOS-1 — Tool Selection: centered popup card over dimmed home (Lovable) ─────
  if (screen === "SOS1") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(13,13,13,0.45)" }}>
        {/* Tap the dim backdrop to dismiss. */}
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => router.back()} />
        <View style={{ width: POPUP_WIDTH, backgroundColor: "#FFFFFF", borderRadius: 28, ...POPUP_SHADOW }}>
          {/* Numeric maxHeight on the ScrollView (not the card) so it scrolls only for
              long lists, without the Fabric width-collapse from % maxHeight / overflow. */}
          <ScrollView
            style={{ flexGrow: 0, maxHeight: POPUP_SCROLL_MAX, borderRadius: 28 }}
            contentContainerClassName="px-6 pt-6 pb-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Orange SOS badge + grey round close (Lovable chrome). */}
            <SosHeader onClose={() => router.back()} />

            <Text
              className="text-foreground font-sans-bold mb-3"
              style={{ fontSize: 22, lineHeight: 27 }}
            >
              {firstName ? `Hey ${firstName} — what'll work right now?` : "What'll work right now?"}
            </Text>
            <Text
              className="text-muted-foreground mb-6"
              style={{ fontSize: 13, lineHeight: 20 }}
            >
              Pick one — that&apos;s all. Cravings peak and pass in a few minutes.
            </Text>

            {/* Escalation level 2 (3+ failures): suspend the waterfall, escalation only (§8.1). */}
            {escalation === 2 ? (
              <EscalationOnly />
            ) : isLoading ? (
              <ActivityIndicator color="#F15025" className="mt-8" />
            ) : !tools?.length ? (
              <View className="bg-card border border-border rounded-2xl p-6">
                <Text className="text-muted-foreground text-sm leading-relaxed">
                  No coping tools are available right now.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {/* Level 1 (2 failures): Call a Friend pinned to slot 1, tools fill 2–3. */}
                {escalation === 1 && <CallAFriendCard />}
                {tools.map((t) => (
                  <Pressable
                    key={t.tool_id}
                    onPress={() => selectTool(t)}
                    className="bg-card flex-row items-center active:bg-muted"
                    // Uniform card styling: 1px border, 16 radius, 17×18 padding (no
                    // per-slot accent — every tool reads the same).
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 16,
                      paddingVertical: 17,
                      paddingHorizontal: 18,
                    }}
                  >
                    <View
                      className="rounded-full items-center justify-center"
                      style={{ width: 42, height: 42, marginRight: 14, backgroundColor: "rgba(241,80,37,0.15)" }}
                    >
                      <ToolFamilyIcon family={t.family} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-sans-bold" style={{ fontSize: 15, marginBottom: 4 }}>
                        {t.name}
                      </Text>
                      <Text className="text-muted-foreground" style={{ fontSize: 12 }}>
                        {Math.round(t.duration_seconds / 60) || 1} min · {t.category.replace(/_/g, " ")}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#D9D6D2" strokeWidth={2} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* "Show me other things that worked" — re-rolls to a different valid trio. */}
            {escalation !== 2 && (tools?.length ?? 0) > 0 && (
              <Pressable
                onPress={shuffle}
                className="mt-6 flex-row items-center justify-center active:opacity-60"
                style={{ minHeight: 28 }}
              >
                <Shuffle size={16} color="#76706C" strokeWidth={1.8} />
                <Text className="text-muted-foreground font-sans-medium text-[13px] ml-2.5">
                  Show me other things that worked
                </Text>
              </Pressable>
            )}

            {/* "It passed on its own — log it →" → the overcome log (Flow B / log-b). */}
            <View className="mt-5 pt-5 border-t border-border items-center">
              <Pressable onPress={() => router.replace("/(modals)/log-b")} className="active:opacity-60">
                <Text className="text-craving font-sans-medium text-[13px]">
                  It passed on its own — log it →
                </Text>
              </Pressable>
            </View>

            {/* DEV ONLY — drive + reset the escalation ladder (no tappable escalation tool
                exists yet; that surfacing is Step 18). */}
            {__DEV__ && (
              <View className="mt-6 gap-2">
                {escalation > 0 && (
                  <Pressable
                    onPress={devSimulateFailure}
                    disabled={processing}
                    className="border border-border rounded-xl p-3 active:bg-muted"
                  >
                    <Text className="text-muted-foreground text-xs font-semibold text-center">
                      DEV · Simulate another failed SOS (level {escalation})
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={devResetEscalation}
                  disabled={processing}
                  className="border border-border rounded-xl p-3 active:bg-muted"
                >
                  <Text className="text-muted-foreground text-xs font-semibold text-center">
                    DEV · Reset escalation → level 0
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── SOS-2 — Tool runner ──────────────────────────────────────────────────────
  if (screen === "SOS2") {
    if (!tool) {
      setScreen("SOS1");
      return null;
    }
    return <ToolRunner tool={tool} onDone={finishTool} accent="craving" />;
  }

  // ── SUCCESS — celebratory end screen after a "Better" check-in (Lovable) ──────
  if (screen === "SUCCESS") {
    return (
      <View className="flex-1 bg-secondary px-8 items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-6">
          <Check size={28} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Text className="text-foreground font-display text-2xl text-center mb-2.5">
          Craving beaten.
        </Text>
        <Text className="text-muted-foreground text-[15px] text-center leading-relaxed mb-10" style={{ maxWidth: 280 }}>
          You rode it out — that&apos;s one more time the urge didn&apos;t win. Each one rewires it a little.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="w-full rounded-2xl h-[52px] items-center justify-center bg-foreground active:opacity-90"
          style={{ maxWidth: 320 }}
        >
          <Text className="text-background font-sans-bold text-[15px]">Back to home</Text>
        </Pressable>
      </View>
    );
  }

  // ── SOS-3 — Post-Tool Check-in (skippable), Lovable two-card layout ───────────
  return (
    <ScrollView className="flex-1 bg-secondary px-6 py-8" contentContainerClassName="flex-grow">
      <View className="flex-row justify-end mb-2">
        <Pressable onPress={skip} className="px-3 py-1.5">
          <Text className="text-muted-foreground text-sm">Skip</Text>
        </Pressable>
      </View>
      <Text className="text-foreground font-display text-2xl mb-1">How are you feeling?</Text>
      <Text className="text-muted-foreground text-sm mb-8 leading-relaxed">
        Be honest — your feed gets smarter every time you tell it the truth.
      </Text>

      <ChipMultiSelect
        label="What else helped? (optional)"
        options={WHAT_HELPED_TOKENS}
        selected={whatHelped}
        onChange={setWhatHelped}
        allowOther={false}
      />

      {/* Two big icon cards (Lovable): Better (green) / Still there (orange). */}
      <View className={`flex-row gap-3 mt-6 ${processing ? "opacity-50" : ""}`}>
        <Pressable
          disabled={processing}
          onPress={better}
          className="flex-1 bg-card border-[1.5px] border-border rounded-2xl items-center active:opacity-80"
          style={{ paddingVertical: 24, paddingHorizontal: 16 }}
        >
          <ThumbsUp size={32} color="#7FC200" strokeWidth={1.8} />
          <Text className="text-foreground font-sans-bold text-[15px] mt-3">Better</Text>
        </Pressable>
        <Pressable
          disabled={processing}
          onPress={same}
          className="flex-1 bg-card border-[1.5px] border-border rounded-2xl items-center active:opacity-80"
          style={{ paddingVertical: 24, paddingHorizontal: 16 }}
        >
          <ThumbsDown size={32} color={CRAVING} strokeWidth={1.8} />
          <Text className="text-foreground font-sans-bold text-[15px] mt-3">Still there</Text>
        </Pressable>
      </View>

      {/* "I smoked" kept (spec: routes to the slip log) but de-emphasized per Lovable. */}
      <Pressable disabled={processing} onPress={smoked} className="mt-6 py-3 items-center active:opacity-60">
        <Text className="text-muted-foreground font-sans-medium text-sm">I smoked</Text>
      </Pressable>
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
  <View className="bg-accent border border-craving/40 rounded-3xl p-4">
    <Text className="text-craving font-sans-bold">Call a friend</Text>
    <Text className="text-muted-foreground text-xs mt-0.5">Coming soon — reach someone who gets it.</Text>
  </View>
);

const EscalationOnly: React.FC = () => (
  <View className="gap-2">
    <Text className="text-muted-foreground text-sm mb-2 leading-relaxed">
      A few tools haven&apos;t landed it this time. That&apos;s okay — let&apos;s try a person, not a screen.
    </Text>
    <CallAFriendCard />
    <View className="bg-accent border border-craving/40 rounded-3xl p-4">
      <Text className="text-craving font-sans-bold">Talk to a quit specialist</Text>
      <Text className="text-muted-foreground text-xs mt-0.5">Coming soon.</Text>
    </View>
  </View>
);

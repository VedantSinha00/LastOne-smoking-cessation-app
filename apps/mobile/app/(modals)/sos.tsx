import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions, Linking } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing, runOnJS } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Wind, Activity, Puzzle, Shuffle, ChevronRight, ThumbsUp, ThumbsDown, Check, ArrowLeft, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { exitToHome } from "../../lib/navigation";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useSosSelection, prefetchSosData } from "../../hooks/useSosSelection";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ToolRunner } from "../../components/coping/ToolRunner";
import { BlurBackdrop } from "../../components/ui/BlurBackdrop";
import { useToast } from "../../hooks/useToast";
import { FADE_IN_MS, FADE_OUT_MS, holdForText } from "../../lib/fadeTiming";
import { queryKeys } from "../../lib/queryKeys";
import {
  updateToolScore,
  recordSosOutcome,
  getSosEscalationLevel,
  type SosEscalationLevel,
} from "../../lib/sos";
import { confirmSmokeFreeDay } from "../../lib/streak";
import { supabase } from "../../lib/supabase";
import { useSupportPerson } from "../../hooks/useSupportPerson";
import { telUrl, RESOURCE_CARDS } from "../../lib/givingUp";
import type { CravingContext } from "../../lib/sosTool";
import type { Database, ToolFamily } from "../../types/database";

type CopingTool = Database["public"]["Tables"]["coping_tools"]["Row"];
type Screen = "GATE" | "SOS1" | "SOS2" | "SOS3" | "SUCCESS" | "POSTCALL";

const CRAVING = "#F15025";
// SOS-1 accent is GREEN ("you're safe / this is working"), not craving-orange —
// per Lovable SOSFlow SOS-1 (badge, tool-icon tints, first-card left border,
// bottom CTA). Bright pill green + dark green icon stroke.
const SOS_GREEN = "#84C524";
const SOS_GREEN_DARK = "#27500A";

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

/** Lovable maps each tool family to a circular GREEN line icon (SOS-1 cards). */
function ToolFamilyIcon({ family }: { family: ToolFamily }) {
  const Icon = family === "breathing" ? Wind : family === "mini_games" ? Puzzle : Activity;
  return <Icon size={22} color={SOS_GREEN_DARK} strokeWidth={1.8} />;
}

/**
 * Popup header: compact green "SOS" pill + 36px grey round close — matching
 * Lovable's exact chrome (badge #84C524, padding 7×14, 13px bold; close #F0EFED
 * circle). The SOS-1 accent is green ("you're safe / this is working"), not the
 * craving-orange used elsewhere — see Lovable SOSFlow SOS-1.
 */
function SosHeader({ onClose }: { onClose: () => void }) {
  return (
    <View className="flex-row justify-between items-center" style={{ marginBottom: 22 }}>
      <View
        className="rounded-full"
        style={{ backgroundColor: SOS_GREEN, paddingVertical: 7, paddingHorizontal: 14, alignSelf: "flex-start" }}
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
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { from } = useLocalSearchParams<{ from?: string }>();
  // Entered from Flow A "get help": skip the popup gate and show the design's
  // full-page A3 tool list instead of the centered popup card. Same data/logic.
  const fromFlowA = from === "flow_a";
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const firstName = profile?.first_name?.trim() || null;
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const { markSatisfied } = useDailyCheckIn();
  const qc = useQueryClient();

  const [screen, setScreen] = useState<Screen>(fromFlowA ? "SOS1" : "GATE");
  const [context, setContext] = useState<CravingContext>("unknown");
  const [tool, setTool] = useState<CopingTool | null>(null);
  const [escalation, setEscalation] = useState<SosEscalationLevel>(0);
  const [processing, setProcessing] = useState(false); // guards the check-in buttons
  const logIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
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

  // Warm the SOS data cache as soon as the modal mounts (while the user is still
  // on the context gate), so the tool list is ready the instant they pick one —
  // no network wait on the hot path. No-op if already cached + fresh.
  useEffect(() => {
    if (user) prefetchSosData(qc, user.id);
  }, [user, qc]);

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
      await updateLog.mutateAsync({ logId: logIdRef.current, patch: { tool_helpful: true, post_tool_state: "better", what_helped: null } });
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
    // The score just changed — drop the cached SOS data so the next ranking (we
    // return to SOS1) reflects it rather than the 5-min-cached scores.
    qc.invalidateQueries({ queryKey: queryKeys.sosData(user.id) });
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

  // ── SOS-1 — Tool Selection ───────────────────────────────────────────────────
  // Two visual variants of the SAME data/logic: from the SOS FAB it's a centered
  // popup card over the dimmed home (Lovable SOS-1); from Flow A "get help" it's
  // the design's full-page A3 layout ("These can help right now."). Tool list,
  // shuffle, selection, escalation and links are identical in both.
  if (screen === "SOS1") {
    const heading = fromFlowA ? (
      <>
        <Text className="text-foreground font-sans-bold mb-2.5" style={{ fontSize: 28, lineHeight: 32 }}>
          These can help right now.
        </Text>
        <Text className="text-muted-foreground mb-8" style={{ fontSize: 16, lineHeight: 24 }}>
          Picked for this moment. Try one.
        </Text>
      </>
    ) : (
      <>
        <Text className="text-foreground font-sans-bold mb-3" style={{ fontSize: 22, lineHeight: 27 }}>
          {firstName ? `Hey ${firstName} — what'll work right now?` : "What'll work right now?"}
        </Text>
        <Text className="text-muted-foreground mb-6" style={{ fontSize: 13, lineHeight: 20 }}>
          Pick one — that&apos;s all. Cravings peak and pass in a few minutes.
        </Text>
      </>
    );

    const body = (
      <>
        {!fromFlowA && <SosHeader onClose={() => router.back()} />}
        {heading}

        {/* Escalation level 2 (3+ failures): suspend the waterfall, escalation only (§8.1). */}
        {escalation === 2 ? (
          <EscalationOnly onCallPerson={() => setScreen("POSTCALL")} />
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
            {escalation === 1 && <CallAFriendCard onCallPerson={() => setScreen("POSTCALL")} />}
            {tools.map((t, idx) => (
              <Pressable
                key={t.tool_id}
                onPress={() => selectTool(t)}
                className="bg-card flex-row items-center active:bg-muted"
                // 1px border, 16 radius, 17×18 padding. The first (top-ranked)
                // tool gets a 3px green left border as the "best pick" accent
                // (Lovable SOS-1 slot 0).
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderLeftWidth: idx === 0 ? 3 : 1,
                  borderLeftColor: idx === 0 ? SOS_GREEN : "#E5E7EB",
                  borderRadius: 16,
                  paddingVertical: 17,
                  paddingHorizontal: 18,
                }}
              >
                <View
                  className="rounded-full items-center justify-center"
                  style={{ width: 42, height: 42, marginRight: 14, backgroundColor: "rgba(132,197,36,0.18)" }}
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
            <Text className="font-sans-medium text-[13px]" style={{ color: SOS_GREEN_DARK }}>
              It passed on its own — log it →
            </Text>
          </Pressable>
        </View>
      </>
    );

    // Flow A entry → full-page A3 layout (TopBar over secondary bg).
    if (fromFlowA) {
      return (
        <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-5" style={{ height: 56 }}>
            <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
              <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
            </Pressable>
            <Pressable onPress={() => exitToHome()} hitSlop={12} className="active:opacity-60">
              <X size={24} color="#888888" strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        </View>
      );
    }

    // Default (SOS FAB) → centered popup card over the blurred + dimmed home.
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Blur the home behind, then dim it; tapping the backdrop dismisses. */}
        <BlurBackdrop intensity={35} tint="dark" dim="rgba(13,13,13,0.2)" />
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => router.back()} />
        <View style={{ width: POPUP_WIDTH, backgroundColor: "#FFFFFF", borderRadius: 28, ...POPUP_SHADOW }}>
          {/* Numeric maxHeight on the ScrollView (not the card) so it scrolls only for
              long lists, without the Fabric width-collapse from % maxHeight / overflow. */}
          <ScrollView
            style={{ flexGrow: 0, maxHeight: POPUP_SCROLL_MAX, borderRadius: 28 }}
            contentContainerClassName="px-6 pt-6 pb-6"
            showsVerticalScrollIndicator={false}
          >
            {body}
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
    // hideOwnCheckIn: bespoke tools (Finger Pulse / Physiological Sigh) skip their
    // own end check-in here — SOS-3 below is the single shared check-in.
    return <ToolRunner tool={tool} onDone={finishTool} accent="craving" hideOwnCheckIn />;
  }

  // ── SUCCESS — celebratory end screen after a "Better" check-in (Lovable) ──────
  // No button: it fades in, holds long enough to read, then fades itself away and
  // dismisses the flow automatically (see SuccessScreen).
  if (screen === "SUCCESS") {
    return <SuccessScreen onDone={() => router.back()} />;
  }

  // ── GU-7 post-call log (inline) — after the SOS "Call [Name]" escalation ─────
  // The escalation call isn't a giving_up_event, so nothing is persisted here;
  // this is the same "how did that go?" close-out as GU-7, kept in-flow so it
  // never lands the user on a stale cross-modal screen.
  if (screen === "POSTCALL") {
    const finishPostCall = () => {
      router.back();
      toast.show("Good that you reached out.");
    };
    return (
      <View className="flex-1 bg-secondary px-8 justify-center">
        <Pressable onPress={() => router.back()} hitSlop={12} className="absolute top-14 right-6">
          <Text className="text-muted-foreground text-base">Skip</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl mb-8">How did that go?</Text>
        <View className="gap-3">
          {["Helped a lot", "Helped a little", "Didn't really help"].map((label) => (
            <Pressable
              key={label}
              onPress={finishPostCall}
              className="bg-card border-[1.5px] border-border rounded-2xl py-4 items-center active:bg-muted"
            >
              <Text className="text-foreground font-sans-bold text-[15px]">{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // ── SOS-3 — Post-Tool Check-in (skippable), Lovable two-card layout ───────────
  return (
    // Centered, minimal layout matching Lovable SOS-3: × top-right, centered
    // title + subtitle, two cards, then "Skip for now" at the bottom. The "I
    // smoked" link is kept (routes to the slip log) but de-emphasized.
    <View className="flex-1 bg-secondary">
      <Pressable onPress={skip} hitSlop={12} className="absolute right-5 active:opacity-60" style={{ top: 20, zIndex: 10 }}>
        <Text style={{ fontSize: 24, color: "#888888" }}>×</Text>
      </Pressable>

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-foreground font-sans-bold text-center mb-3" style={{ fontSize: 26, lineHeight: 31 }}>
          {firstName ? `How are you feeling, ${firstName}?` : "How are you feeling?"}
        </Text>
        <Text className="text-muted-foreground text-center mb-12" style={{ fontSize: 14, lineHeight: 21 }}>
          Be honest — your feed gets smarter every time you tell it the truth.
        </Text>

        {/* Two icon cards (Lovable): Better (green) / Still there (orange). */}
        <View className={`flex-row mb-10 ${processing ? "opacity-50" : ""}`} style={{ gap: 12, width: "100%", maxWidth: 320 }}>
          <Pressable
            disabled={processing}
            onPress={better}
            className="flex-1 bg-card border-[1.5px] border-border items-center active:opacity-80"
            style={{ borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16, gap: 12 }}
          >
            <ThumbsUp size={32} color="#84C524" strokeWidth={1.8} />
            <Text className="text-foreground font-sans-bold" style={{ fontSize: 15 }}>Better</Text>
          </Pressable>
          <Pressable
            disabled={processing}
            onPress={same}
            className="flex-1 bg-card border-[1.5px] border-border items-center active:opacity-80"
            style={{ borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16, gap: 12 }}
          >
            <ThumbsDown size={32} color={CRAVING} strokeWidth={1.8} />
            <Text className="text-foreground font-sans-bold" style={{ fontSize: 15 }}>Still there</Text>
          </Pressable>
        </View>

        {/* "I smoked" kept (spec: routes to the slip log) but de-emphasized. */}
        <Pressable disabled={processing} onPress={smoked} className="py-2 items-center active:opacity-60">
          <Text className="text-muted-foreground font-sans-medium text-sm">I smoked</Text>
        </Pressable>

        {/* Tier-3 escalation link (GU §B2 SOS integration) — silent conditional. */}
        <Tier3Link />
      </View>

      {/* "Skip for now" pinned near the bottom (Lovable). */}
      <Pressable onPress={skip} className="items-center pb-10 pt-2 active:opacity-60">
        <Text className="text-muted-foreground font-sans-medium" style={{ fontSize: 13 }}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

/**
 * SUCCESS end screen — no button. Fades in, holds long enough to read, then fades
 * the whole screen away and dismisses the flow (onDone). Timing: 0.5s in → 3s
 * hold → 3s out (≈6.5s total), so the user has ample time to read before it goes.
 */
// Body copy drives the hold (reading time scales with length) — see lib/fadeTiming.
const SUCCESS_BODY =
  "You rode it out — that's one more time the urge didn't win. Each one rewires it a little.";
const SUCCESS_HOLD = holdForText(SUCCESS_BODY);

const SuccessScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.ease) }),
      withDelay(
        SUCCESS_HOLD,
        withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.ease) }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      ),
    );
  }, [opacity, onDone]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View className="flex-1 bg-secondary px-8 items-center justify-center" style={style}>
      <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-6">
        <Check size={28} color="#FFFFFF" strokeWidth={2.5} />
      </View>
      <Text className="text-foreground font-display text-2xl text-center mb-2.5">
        Craving beaten.
      </Text>
      <Text className="text-muted-foreground text-[15px] text-center leading-relaxed" style={{ maxWidth: 280 }}>
        {SUCCESS_BODY}
      </Text>
    </Animated.View>
  );
};

/**
 * Escalation tools — Call a Friend + Quit Specialist Line (Step 13 ladder,
 * wired live in Step 18). Call a Friend dials the SecureStore support person
 * (or routes to setup when none is configured); the specialist line is the
 * GU-8 tobacco quitline (⚠ number must be team-verified pre-ship).
 */
const CallAFriendCard: React.FC<{ onCallPerson: () => void }> = ({ onCallPerson }) => {
  const router = useRouter();
  const { person, configured } = useSupportPerson();

  if (configured && person) {
    // Dial, then show the GU-7 post-call log INLINE in the SOS flow (parent
    // switches to its POSTCALL screen) — same follow-up as GU-6, but without a
    // cross-modal hop that left the user on a stale giving-up screen.
    const callPerson = async () => {
      try {
        await Linking.openURL(telUrl(person.phone));
      } catch {
        // Dial failed — still offer the follow-up rather than stranding the user.
      }
      onCallPerson();
    };
    return (
      <Pressable
        onPress={callPerson}
        className="bg-accent border border-craving/40 rounded-3xl p-4 active:opacity-80"
      >
        <Text className="text-craving font-sans-bold">Call {person.name}</Text>
        <Text className="text-muted-foreground text-xs mt-0.5">
          They know you&apos;re trying. Just say the word.
        </Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => router.push("/(modals)/support-person")}
      className="bg-accent border border-craving/40 rounded-3xl p-4 active:opacity-80"
    >
      <Text className="text-craving font-sans-bold">Call a friend</Text>
      <Text className="text-muted-foreground text-xs mt-0.5">
        Set up your support person — one person, two minutes.
      </Text>
    </Pressable>
  );
};

const EscalationOnly: React.FC<{ onCallPerson: () => void }> = ({ onCallPerson }) => {
  const router = useRouter();
  const quitline = RESOURCE_CARDS[0];
  // Professional resources have no post-call log in the spec (GU-8 has no
  // follow-up). Dial, then dismiss the SOS flow rather than stranding the user
  // on the escalation screen.
  const callQuitline = async () => {
    try {
      await Linking.openURL(telUrl(quitline.phone));
    } catch {
      // ignore — number unavailable
    }
    router.back();
  };
  return (
    <View className="gap-2">
      <Text className="text-muted-foreground text-sm mb-2 leading-relaxed">
        A few tools haven&apos;t landed it this time. That&apos;s okay — let&apos;s try a person, not a screen.
      </Text>
      <CallAFriendCard onCallPerson={onCallPerson} />
      <Pressable
        onPress={callQuitline}
        className="bg-accent border border-craving/40 rounded-3xl p-4 active:opacity-80"
      >
        <Text className="text-craving font-sans-bold">Talk to a quit specialist</Text>
        <Text className="text-muted-foreground text-xs mt-0.5">
          {quitline.organisation} — free, confidential. {quitline.phoneDisplay}
        </Text>
      </Pressable>
    </View>
  );
};

/**
 * Tier-3 surface on SOS-3 (GU Spec §B2): after 3+ SOS uses in 24h where 2+
 * ended "same"/"smoked", offer the professional resources route. Independent
 * of the Tier-1 trigger.
 */
const Tier3Link: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["sos_tier3", user?.id ?? ""],
    queryFn: async () => {
      const { data } = await supabase
        .from("log")
        .select("post_tool_state")
        .eq("user_id", user!.id)
        .eq("log_type", "sos")
        .gte("timestamp", subDays(new Date(), 1).toISOString())
        .throwOnError();
      return (data ?? []) as { post_tool_state: string | null }[];
    },
    enabled: !!user,
  });

  const rows = data ?? [];
  const struggling = rows.filter(
    (r) => r.post_tool_state === "same" || r.post_tool_state === "smoked",
  ).length;
  if (rows.length < 3 || struggling < 2) return null;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/(modals)/giving-up", params: { screen: "resources" } })
      }
      className="mt-4 py-2 items-center active:opacity-60"
    >
      <Text className="text-craving font-sans-bold text-sm">
        Talk to someone who&apos;s heard this before →
      </Text>
    </Pressable>
  );
};

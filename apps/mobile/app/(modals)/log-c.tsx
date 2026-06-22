import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, X, Plus, Minus, Check, ArrowLeft, AlertTriangle } from "lucide-react-native";
import { exitToHome } from "../../lib/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useStage } from "../../hooks/useStage";
import { useStreakRecord } from "../../hooks/useStreakRecord";
import { useInsights } from "../../hooks/useInsights";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { queryKeys } from "../../lib/queryKeys";
import { TRIGGER_TOKENS, CIGARETTE_COUNT_SENTINEL } from "../../lib/logOptions";
import { routeAfterSlip, type SlipType, type SlipRoute } from "../../lib/slipThreshold";
import { fullRelapse, pauseStreak, restartAttempt } from "../../lib/streak";

type Screen = "C1" | "C2" | "C3";

const SLIP_TYPES: { value: SlipType; label: string; hint: string }[] = [
  { value: "one_off", label: "Just a slip", hint: "A slip, not a setback." },
  { value: "few_days", label: "A few days of smoking", hint: "Let's get back on track." },
  { value: "return_to_smoking", label: "Been smoking again", hint: "We'll regroup from here." },
];

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
  borderWidth: 1,
  borderColor: "#E9E7E5",
} as const;

const sectionLabelStyle = {
  fontSize: 11,
  color: "#76706C",
  letterSpacing: 2,
  textTransform: "uppercase" as const,
  marginBottom: 14,
};

/**
 * Flow C — Slip Log (Logging Spec §4 / Architecture Guide §9.6).
 * C1: warm acknowledgement, no data. C2 (commit point): slip_type → createLog
 * slip → markSatisfied → routeAfterSlip. cigarette_count '5+' stored as 99.
 * return_to_smoking also calls fullRelapse (closes the attempt). C3: support copy.
 */
export default function LogC() {
  const { user } = useAuth();
  const { isPreQuit } = useStage();
  const { data: streakRecord } = useStreakRecord();
  const { metrics } = useInsights();
  const createLog = useCreateLog();
  const { markSatisfied } = useDailyCheckIn();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Streak length BEFORE this slip — captured once on mount so the "still winning"
  // card can say "after N smoke-free days" (the slip itself may reset it).
  const streakBeforeSlip = useRef<number | null>(null);
  if (streakBeforeSlip.current === null && streakRecord) {
    streakBeforeSlip.current = streakRecord.current_streak_days;
  }

  const [screen, setScreen] = useState<Screen>("C1");
  const [slipType, setSlipType] = useState<SlipType | null>(null);
  const [count, setCount] = useState<number | null>(1); // Default to 1 cigarette
  const [triggers, setTriggers] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [route, setRoute] = useState<SlipRoute>("warm");
  const logIdRef = useRef<string | null>(null);
  const [committing, setCommitting] = useState(false);

  const invalidateStreak = () => {
    if (!user) return;
    qc.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
    qc.invalidateQueries({ queryKey: queryKeys.slipState(user.id) });
    qc.invalidateQueries({ queryKey: ["quit_attempt"] });
  };

  const decrement = () => {
    if (count === null || count <= 1) return;
    if (count === CIGARETTE_COUNT_SENTINEL) {
      setCount(4);
    } else {
      setCount(count - 1);
    }
  };

  const increment = () => {
    if (count === null) {
      setCount(1);
    } else if (count >= 4) {
      setCount(CIGARETTE_COUNT_SENTINEL);
    } else {
      setCount(count + 1);
    }
  };

  // C2 commit — requires slip_type. Pre-quit: slip_type stays null (Logging §B4).
  const commitC2 = async (chosen: SlipType) => {
    if (!user) return;
    setCommitting(true);
    try {
      const row = await createLog.mutateAsync({
        log_type: "slip",
        entry_method: "fab",
        slip_type: isPreQuit ? null : chosen,
        cigarette_count: count,
        slip_triggers: triggers.length ? triggers : null,
        other_text: otherText.trim() || null,
        source: "flow_c",
      });
      logIdRef.current = row.log_id;
      await markSatisfied();

      // Streak/threshold side effects. Skipped entirely pre-quit (Logging §B4).
      if (!isPreQuit) {
        if (chosen === "return_to_smoking") {
          await fullRelapse(user.id);
        } else {
          setRoute(await routeAfterSlip(user.id, chosen));
        }
        invalidateStreak();
      }
      setScreen("C3");
    } catch (e: any) {
      Alert.alert("Couldn't save", e.message);
    } finally {
      setCommitting(false);
    }
  };

  // ── C1 — Acknowledgement (most tone-sensitive screen) ───────────────────────
  if (screen === "C1") {
    return (
      <View className="flex-1 bg-background px-6 justify-center" style={{ paddingTop: insets.top }}>
        {/* Top-Right Close Button */}
        <Pressable
          onPress={() => exitToHome()}
          style={{
            position: "absolute",
            top: insets.top + 16,
            right: 20,
            padding: 4,
          }}
          className="active:opacity-60"
        >
          <X size={26} color="#76706C" strokeWidth={2} />
        </Pressable>

        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: "#FFF8F6",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            alignSelf: "center",
          }}
        >
          <Heart size={32} color="#F15025" strokeWidth={2} />
        </View>

        <Text className="text-foreground font-display text-2xl mb-3 text-center">
          Thanks for being honest.
        </Text>
        <Text className="text-muted-foreground text-base leading-relaxed mb-10 text-center font-sans">
          That takes courage. One cigarette doesn't undo everything you've built. You're still in this.
        </Text>

        <Pressable
          onPress={() => setScreen("C2")}
          style={{
            backgroundColor: "#0F0D0B",
            borderRadius: 16,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
          className="active:opacity-90"
        >
          <Text className="text-white font-sans-bold" style={{ fontSize: 15 }}>
            Keep going →
          </Text>
        </Pressable>

        <Pressable onPress={() => exitToHome()} className="mt-4 py-2 items-center active:opacity-60">
          <Text className="text-muted-foreground text-sm font-sans-medium">Not now</Text>
        </Pressable>
      </View>
    );
  }

  // ── C2 — Context (slip_type required = commit) ──────────────────────────────
  if (screen === "C2") {
    const displayCount = count === CIGARETTE_COUNT_SENTINEL ? "5+" : String(count ?? 1);
    const unitText = (count ?? 1) === 1 ? "cigarette" : "cigarettes";

    return (
      <View className="flex-1 bg-background">
        {/* Custom Header */}
        <View style={{ paddingTop: insets.top }} className="bg-background px-5">
          <View className="h-14 flex-row items-center justify-between">
            <Pressable onPress={() => setScreen("C1")} accessibilityLabel="Back" hitSlop={12} className="pr-3 active:opacity-60">
              <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
            </Pressable>
            <Text className="text-foreground font-display text-lg" style={{ letterSpacing: -0.3 }}>
              Context
            </Text>
            <Pressable onPress={() => exitToHome()} accessibilityLabel="Close" hitSlop={12} className="pl-3 active:opacity-60">
              <X size={22} color="#76706C" strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-foreground font-display text-2xl mb-1">A little context helps.</Text>
          <Text className="text-muted-foreground text-sm mb-6 leading-relaxed">All optional except the first one.</Text>

          {/* Card 1: Slip Type Selection */}
          <View style={cardStyle} className="mb-4">
            <Text className="font-sans-bold" style={sectionLabelStyle}>
              WAS THIS A ONE-OFF?
            </Text>
            <View style={{ gap: 10 }}>
              {SLIP_TYPES.map((s) => {
                const active = slipType === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setSlipType(s.value)}
                    style={{
                      backgroundColor: active ? "#FFF0EB" : "#FFFFFF",
                      borderWidth: 1.5,
                      borderColor: active ? "#F15025" : "#E9E7E5",
                      borderRadius: 16,
                      padding: 16,
                    }}
                    className="active:opacity-90"
                  >
                    <Text
                      className="font-sans-bold"
                      style={{
                        fontSize: 15,
                        color: active ? "#F15025" : "#15110D",
                      }}
                    >
                      {s.label}
                    </Text>
                    <Text
                      className="font-sans"
                      style={{
                        fontSize: 12,
                        color: active ? "#A10C00" : "#76706C",
                        marginTop: 4,
                      }}
                    >
                      {s.hint}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Card 2: Cigarettes Counter */}
          <View style={cardStyle} className="mb-4">
            <Text className="font-sans-bold" style={sectionLabelStyle}>
              HOW MANY DID YOU SMOKE?
            </Text>
            <View className="flex-row items-center justify-between" style={{ marginTop: 8 }}>
              <Pressable
                onPress={decrement}
                disabled={count === null || count <= 1}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#F7F5F1",
                  borderWidth: 1,
                  borderColor: "#E9E7E5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                className="active:opacity-70"
              >
                <Minus size={20} color={(count === null || count <= 1) ? "#76706C" : "#15110D"} strokeWidth={2.5} />
              </Pressable>

              <View style={{ alignItems: "center" }}>
                <Text className="font-sans-bold" style={{ fontSize: 32, color: "#15110D" }}>
                  {displayCount}
                </Text>
                <Text className="font-sans" style={{ fontSize: 13, color: "#76706C", marginTop: 2 }}>
                  {unitText}
                </Text>
              </View>

              <Pressable
                onPress={increment}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#84C524",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                className="active:opacity-85"
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Card 3: Triggers */}
          <View style={cardStyle}>
            <ChipMultiSelect
              label="Anything set it off? (optional)"
              options={TRIGGER_TOKENS}
              selected={triggers}
              onChange={setTriggers}
              otherText={otherText}
              onOtherTextChange={setOtherText}
            />
          </View>
        </ScrollView>

        {/* Floating Continue Action Button */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: "#FBFAF9",
            borderTopWidth: 1,
            borderColor: "#E9E7E5",
          }}
        >
          <Pressable
            onPress={() => slipType && commitC2(slipType)}
            disabled={!slipType || committing}
            style={{
              backgroundColor: slipType ? "#0F0D0B" : "#E9E7E5",
              borderRadius: 16,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
            className="active:opacity-90"
          >
            <Text
              className="font-sans-bold"
              style={{
                fontSize: 15,
                color: slipType ? "#FFFFFF" : "#76706C",
              }}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── C3 Restart Nudge — pattern confirmed (Slip Threshold §4) ────────────────
  if (route === "restart_nudge") {
    const handleRestart = async () => {
      if (user) await restartAttempt(user.id);
      invalidateStreak();
      exitToHome();
    };
    const handleBreak = async () => {
      if (user) await pauseStreak(user.id);
      invalidateStreak();
      exitToHome();
    };
    return (
      <View className="flex-1 bg-background px-6 justify-center" style={{ paddingTop: insets.top }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: "#FFF0EB",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            alignSelf: "center",
          }}
        >
          <AlertTriangle size={32} color="#F15025" strokeWidth={2} />
        </View>

        <Text className="text-foreground font-display text-2xl mb-3 text-center">
          A few slips close together.
        </Text>
        <Text className="text-muted-foreground text-base leading-relaxed mb-10 text-center font-sans">
          That's a pattern worth paying attention to — not a failure. No pressure here, just three paths. Whichever feels right.
        </Text>

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={handleRestart}
            style={{
              backgroundColor: "#0F0D0B",
              borderRadius: 16,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
            className="active:opacity-90"
          >
            <Text className="text-white font-sans-bold" style={{ fontSize: 15 }}>
              Restart — fresh quit date
            </Text>
          </Pressable>

          <Pressable
            onPress={handleBreak}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1.5,
              borderColor: "#E9E7E5",
              borderRadius: 16,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
            className="active:opacity-90"
          >
            <Text className="text-foreground font-sans-bold" style={{ fontSize: 15 }}>
              Take a break
            </Text>
          </Pressable>

          <Pressable onPress={() => exitToHome()} className="py-3 items-center active:opacity-60">
            <Text className="text-muted-foreground text-sm font-sans-medium">
              Continue as I am
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── C3a — one-off slip "still winning" (design LoggingFlowC C3a) ────────────
  // Success rate + "one cigarette after N smoke-free days" + reassurance. All live
  // data; the freeze-applied line is intentionally omitted (a one-off slip only
  // sometimes consumes a freeze, so a blanket claim would be inaccurate).
  if (slipType === "one_off") {
    const successRate = metrics.resistanceRate != null ? `${Math.round(metrics.resistanceRate)}%` : null;
    const daysBefore = streakBeforeSlip.current;
    const cigs = count === CIGARETTE_COUNT_SENTINEL ? "5+" : count ?? 1;
    const cigWord = cigs === 1 ? "cigarette" : "cigarettes";
    return (
      <View className="flex-1 bg-background px-8 justify-center" style={{ paddingTop: insets.top }}>
        <Pressable
          onPress={() => exitToHome()}
          style={{ position: "absolute", top: insets.top + 16, right: 20, padding: 4 }}
          className="active:opacity-60"
        >
          <X size={26} color="#76706C" strokeWidth={2} />
        </Pressable>

        {/* Stat card */}
        <View style={{ ...cardStyle, padding: 24, marginBottom: 32, alignItems: "center" }}>
          {successRate ? (
            <>
              <Text className="font-sans-bold" style={{ fontSize: 56, lineHeight: 60, color: "#84C524" }}>
                {successRate}
              </Text>
              <Text className="font-sans" style={{ fontSize: 14, color: "#76706C", marginTop: 4 }}>
                success rate
              </Text>
              <View style={{ height: 1, backgroundColor: "#E9E7E5", alignSelf: "stretch", marginVertical: 16 }} />
            </>
          ) : null}
          <Text className="font-sans-medium text-center" style={{ fontSize: 14, color: "#15110D", lineHeight: 21 }}>
            {daysBefore != null && daysBefore > 0
              ? `${cigs === 1 ? "One" : cigs} ${cigWord} after ${daysBefore} smoke-free ${daysBefore === 1 ? "day" : "days"}.`
              : "One slip. Your progress is still here."}
          </Text>
        </View>

        <Text className="text-foreground font-display text-center" style={{ fontSize: 26, lineHeight: 31, marginBottom: 12 }}>
          You&apos;re still winning.
        </Text>
        <Text className="text-muted-foreground text-center font-sans" style={{ fontSize: 15, lineHeight: 24, marginBottom: 40 }}>
          A slip doesn&apos;t erase your progress. Everything you&apos;ve learned is still here.
        </Text>

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={() => router.replace("/progress")}
            style={{ backgroundColor: "#0F0D0B", borderRadius: 16, height: 52, alignItems: "center", justifyContent: "center" }}
            className="active:opacity-90"
          >
            <Text className="text-white font-sans-bold" style={{ fontSize: 15 }}>See what you&apos;ve gained</Text>
          </Pressable>
          <Pressable
            onPress={() => exitToHome()}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1.5,
              borderColor: "#E9E7E5",
              borderRadius: 16,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
            className="active:opacity-90"
          >
            <Text className="text-foreground font-sans-bold" style={{ fontSize: 15 }}>Good to go</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── C3 Warm — support response (varies by slip_type) ────────────────────────
  const c3 = supportCopy(slipType);
  return (
    <View className="flex-1 bg-background px-6 justify-center" style={{ paddingTop: insets.top }}>
      {/* Green circle checkmark */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#84C524",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          alignSelf: "center",
        }}
      >
        <Check size={28} color="#FFFFFF" strokeWidth={3} />
      </View>

      <Text className="text-foreground font-display text-2xl mb-3 text-center">
        {c3.title}
      </Text>
      <Text className="text-muted-foreground text-base leading-relaxed mb-10 text-center font-sans">
        {c3.body}
      </Text>

      <Pressable
        onPress={() => exitToHome()}
        style={{
          width: "100%",
          maxWidth: 320,
          backgroundColor: "#0F0D0B",
          borderRadius: 16,
          height: 52,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        }}
        className="active:opacity-90"
      >
        <Text className="text-white font-sans-bold" style={{ fontSize: 15 }}>
          Back to home
        </Text>
      </Pressable>
    </View>
  );
}

function supportCopy(slipType: SlipType | null): { title: string; body: string } {
  switch (slipType) {
    case "few_days":
      return {
        title: "A few rough days. That's okay.",
        body: "Momentum dipped, not disappeared. The data you just logged still counts toward understanding your patterns. Pick it back up when you're ready.",
      };
    case "return_to_smoking":
      return {
        title: "You showed up anyway.",
        body: "Telling the truth here is the hardest and most useful thing you can do. We'll meet you where you are — the next time you open the app, you'll find support tailored to a restart.",
      };
    case "one_off":
    default:
      return {
        title: "One slip. Not a failure.",
        body: "Slips are data, not defeat. You logged it, you're still here, and your progress so far is intact. Keep going.",
      };
  }
}

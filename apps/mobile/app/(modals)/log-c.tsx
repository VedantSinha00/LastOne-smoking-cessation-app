import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useStage } from "../../hooks/useStage";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { Button } from "../../components/ui/button";
import { TRIGGER_TOKENS, CIGARETTE_COUNT_SENTINEL } from "../../lib/logOptions";
import { routeAfterSlip, type SlipType } from "../../lib/slipThreshold";
import { fullRelapse } from "../../lib/streak";

type Screen = "C1" | "C2" | "C3";

const SLIP_TYPES: { value: SlipType; label: string; hint: string }[] = [
  { value: "one_off", label: "Just one (or a couple)", hint: "A slip, not a setback." },
  { value: "few_days", label: "A few days of smoking", hint: "Let's get back on track." },
  { value: "return_to_smoking", label: "Back to smoking regularly", hint: "We'll regroup from here." },
];

const COUNT_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: CIGARETTE_COUNT_SENTINEL, label: "5+" }, // stored as 99, never shown as 99
];

/**
 * Flow C — Slip Log (Logging Spec §4 / Architecture Guide §9.6).
 * C1: warm acknowledgement, no data. C2 (commit point): slip_type → createLog
 * slip → markSatisfied → routeAfterSlip. cigarette_count '5+' stored as 99.
 * return_to_smoking also calls fullRelapse (closes the attempt). C3: support copy.
 */
export default function LogC() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPreQuit } = useStage();
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const { markSatisfied } = useDailyCheckIn();

  const [screen, setScreen] = useState<Screen>("C1");
  const [slipType, setSlipType] = useState<SlipType | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const logIdRef = useRef<string | null>(null);
  const [committing, setCommitting] = useState(false);

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

      // Streak/threshold side effects (stubs until Steps 10/11). Skipped pre-quit.
      if (!isPreQuit) {
        if (chosen === "return_to_smoking") await fullRelapse(user.id);
        await routeAfterSlip(user.id, chosen);
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
      <View className="flex-1 bg-zinc-950 px-6 justify-center">
        <Text className="text-4xl mb-5">🌱</Text>
        <Text className="text-white text-2xl font-extrabold mb-3">Thanks for being honest.</Text>
        <Text className="text-zinc-400 text-base leading-relaxed mb-10">
          A slip isn&apos;t a failure — it&apos;s information. You&apos;re still in this, and logging
          it is exactly the right move. Let&apos;s note what happened.
        </Text>
        <Button title="Continue" onPress={() => setScreen("C2")} />
        <Pressable onPress={() => router.back()} className="mt-3 py-2 items-center">
          <Text className="text-zinc-600 text-sm">Not now</Text>
        </Pressable>
      </View>
    );
  }

  // ── C2 — Context (slip_type required = commit) ──────────────────────────────
  if (screen === "C2") {
    return (
      <ScrollView className="flex-1 bg-zinc-950 px-6 py-8" contentContainerClassName="pb-12">
        <Text className="text-white text-2xl font-extrabold mb-1">What happened?</Text>
        <Text className="text-zinc-400 text-sm mb-6 leading-relaxed">This shapes how we help next.</Text>

        <Text className="text-zinc-400 text-sm font-medium mb-3">How would you describe it?</Text>
        <View className="gap-2 mb-6">
          {SLIP_TYPES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => setSlipType(s.value)}
              className={`rounded-2xl p-4 border ${
                slipType === s.value ? "bg-amber-600/20 border-amber-600" : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <Text className="text-white font-semibold">{s.label}</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">{s.hint}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-zinc-400 text-sm font-medium mb-3">How many? (optional)</Text>
        <View className="flex-row gap-2 mb-2">
          {COUNT_OPTIONS.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCount(count === c.value ? null : c.value)}
              className={`flex-1 py-3 rounded-xl border ${
                count === c.value ? "bg-amber-600 border-amber-600" : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <Text className="text-white text-center font-bold">{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <ChipMultiSelect
          label="Anything set it off? (optional)"
          options={TRIGGER_TOKENS}
          selected={triggers}
          onChange={setTriggers}
          otherText={otherText}
          onOtherTextChange={setOtherText}
        />

        <Button
          title="Continue"
          onPress={() => slipType && commitC2(slipType)}
          disabled={!slipType}
          loading={committing}
          className="mt-6"
        />
      </ScrollView>
    );
  }

  // ── C3 — Support response (varies by slip_type) ─────────────────────────────
  const c3 = supportCopy(slipType);
  return (
    <View className="flex-1 bg-zinc-950 px-6 justify-center">
      <Text className="text-white text-2xl font-extrabold mb-3">{c3.title}</Text>
      <Text className="text-zinc-400 text-base leading-relaxed mb-10">{c3.body}</Text>
      <Button title="Back to home" onPress={() => router.back()} />
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

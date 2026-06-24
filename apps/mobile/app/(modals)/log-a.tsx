import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../hooks/useToast";
import { exitToHome } from "../../lib/navigation";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { TRIGGER_TOKENS, LOCATION_TOKENS, SOCIAL_TOKENS } from "../../lib/logOptions";

type Screen = "A1" | "A2";

const MUTED = "#888888";

/**
 * Flow A — Craving Log (Logging Spec §2 / Architecture Guide §9.4).
 * A1 (commit point): createLog craving + intensity → markSatisfied → A2.
 * A2 (optional): trigger/location/social chips + 'Other'. "I need help now"
 * routes to SOS with routed_to_sos = true.
 *
 * Two screens by spec (A1 + A2). The Lovable design's extra A1b/A3/A4 screens
 * contradict the spec (which routes all "get help" to the SOS overlay and needs
 * no confirmation screen), so only the VISUALS are ported here, not the extra
 * steps. Intensity stays a tap selector (spec allows "slider OR tap-based").
 */
const intensityLabels: Record<number, string> = {
  1: "Barely there",
  2: "Noticeable",
  3: "Strong",
  4: "Very strong",
  5: "Overwhelming",
};

export default function LogA() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const { markSatisfied } = useDailyCheckIn();

  const [screen, setScreen] = useState<Screen>("A1");
  const [intensity, setIntensity] = useState<number>(3);
  const logIdRef = useRef<string | null>(null);

  const [triggers, setTriggers] = useState<string[]>([]);
  const [location, setLocation] = useState<string[]>([]);
  const [social, setSocial] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  // A1 commit — create the craving log, capture id, satisfy daily check-in.
  const commitA1 = async (): Promise<string | null> => {
    if (logIdRef.current) return logIdRef.current;
    try {
      const row = await createLog.mutateAsync({
        log_type: "craving",
        entry_method: "fab",
        intensity,
      });
      logIdRef.current = row.log_id;
      await markSatisfied();
      return row.log_id;
    } catch (e: any) {
      toast.show(e.message ?? "Couldn't save. Please try again.", { variant: "error" });
      return null;
    }
  };

  const handleContinue = async () => {
    const id = await commitA1();
    if (id) setScreen("A2");
  };

  const handleSaveA2 = async () => {
    if (logIdRef.current) {
      await updateLog.mutateAsync({
        logId: logIdRef.current,
        patch: {
          triggers,
          location,
          social_context: social,
          other_text: otherText.trim() || null,
        },
      });
    }
    exitToHome();
  };

  const handleNeedHelp = async () => {
    const id = await commitA1();
    if (id) {
      await updateLog.mutateAsync({ logId: id, patch: { routed_to_sos: true } });
    }
    // from=flow_a → SOS opens straight on the full-page A3-style tool list
    // (design's "get help" layout), skipping the popup gate.
    router.replace("/(modals)/sos?from=flow_a");
  };

  // ── A1 — Intensity ───────────────────────────────────────────────────────────
  if (screen === "A1") {
    return (
      <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
        <TopBar onBack={() => exitToHome()} onClose={() => exitToHome()} />

        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text className="text-foreground font-sans-bold mb-2" style={{ fontSize: 26, lineHeight: 31 }}>
            How strong is this craving?
          </Text>
          <Text className="text-muted-foreground mb-10" style={{ fontSize: 16, lineHeight: 24 }}>
            Be honest. This helps us help you better.
          </Text>

          {/* Tap selector (spec allows tap-based) styled to the design. */}
          <View className="flex-row" style={{ gap: 8 }}>
            {[1, 2, 3, 4, 5].map((v) => {
              const active = intensity === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => setIntensity(v)}
                  className="flex-1 items-center justify-center rounded-2xl active:opacity-80"
                  style={{
                    paddingVertical: 18,
                    backgroundColor: active ? "#84C524" : "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: active ? "#84C524" : "#E8E8E8",
                  }}
                >
                  <Text className="font-sans-bold" style={{ fontSize: 20, color: active ? "#FFFFFF" : "#15110D" }}>
                    {v}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Big value + word label (design). */}
          <View className="items-center" style={{ marginTop: 40 }}>
            <View className="flex-row items-baseline">
              <Text className="text-foreground font-sans-bold" style={{ fontSize: 56, lineHeight: 56 }}>
                {intensity}
              </Text>
              <Text className="text-muted-foreground" style={{ fontSize: 24, marginLeft: 4 }}>/5</Text>
            </View>
            <Text className="text-muted-foreground font-sans-medium" style={{ fontSize: 16, marginTop: 10 }}>
              {intensityLabels[intensity]}
            </Text>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, paddingTop: 16 }}>
          <PrimaryButton label="Next" onPress={handleContinue} disabled={createLog.isPending} />
        </View>
      </View>
    );
  }

  // ── A2 — Context (optional) ──────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
      <TopBar onBack={() => setScreen("A1")} onClose={handleSaveA2} rightLabel="Context" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-foreground font-sans-bold mb-2" style={{ fontSize: 26, lineHeight: 31 }}>
          A little context.
        </Text>
        <Text className="text-muted-foreground mb-7" style={{ fontSize: 16, lineHeight: 24 }}>
          All optional. Answer what feels right.
        </Text>

        <ChipMultiSelect
          variant="card"
          label="What triggered it?"
          options={TRIGGER_TOKENS}
          selected={triggers}
          onChange={setTriggers}
          otherText={otherText}
          onOtherTextChange={setOtherText}
        />
        <ChipMultiSelect
          variant="card"
          label="Where were you?"
          options={LOCATION_TOKENS}
          selected={location}
          onChange={setLocation}
          allowOther={false}
        />
        <ChipMultiSelect
          variant="card"
          label="Who were you with?"
          options={SOCIAL_TOKENS}
          selected={social}
          onChange={setSocial}
          allowOther={false}
        />

        <Pressable onPress={handleNeedHelp} className="py-2 items-center active:opacity-60" style={{ marginTop: 4 }}>
          <Text className="font-sans-medium" style={{ fontSize: 13, color: "#F15025" }}>I need help now →</Text>
        </Pressable>
      </ScrollView>

      <View
        className="flex-row"
        style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, paddingTop: 16, gap: 10 }}
      >
        <SecondaryButton label="Save & done" onPress={handleSaveA2} style={{ flex: 1 }} disabled={updateLog.isPending} />
        <PrimaryButton label="Save & get help" onPress={handleNeedHelp} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function TopBar({ onBack, onClose, rightLabel }: { onBack: () => void; onClose: () => void; rightLabel?: string }) {
  return (
    <View className="flex-row items-center justify-between px-5" style={{ height: 56 }}>
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <Pressable onPress={onBack} hitSlop={12} className="active:opacity-60">
          <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
        </Pressable>
        {rightLabel && (
          <Text className="font-sans-medium" style={{ fontSize: 12, color: MUTED }}>{rightLabel}</Text>
        )}
      </View>
      <Pressable onPress={onClose} hitSlop={12} className="active:opacity-60">
        <X size={24} color={MUTED} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: any }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className="rounded-2xl h-[52px] items-center justify-center active:opacity-90"
      style={[{ backgroundColor: "#0F0D0B", opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Text className="font-sans-bold" style={{ fontSize: 15, color: "#FFFFFF" }}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: any }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className="rounded-2xl h-[52px] items-center justify-center bg-card active:opacity-80"
      style={[{ borderWidth: 1.5, borderColor: "#E8E8E8", opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Text className="font-sans-bold" style={{ fontSize: 15, color: "#15110D" }}>{label}</Text>
    </Pressable>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, X, ArrowLeft, Plus } from "lucide-react-native";
import { exitToHome } from "../../lib/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { queryKeys } from "../../lib/queryKeys";
import { WHAT_HELPED_TOKENS } from "../../lib/logOptions";
import { confirmSmokeFreeDay } from "../../lib/streak";

/**
 * Flow B — Overcome Log (Logging Spec §3 / Architecture Guide §9.5), ported to the
 * Lovable LoggingFlowB three-screen flow:
 *   B1  celebration ("Another one beaten" + pulsing check + "What helped?")
 *   B2  "What got you through?" — preset chips card + custom-chip card + Done
 *   B3  "Logged." confirmation → Back to home
 *
 * Logic (unchanged): the overcome log is committed optimistically on mount
 * (createLog → confirmSmokeFreeDay → markSatisfied), so the streak updates
 * immediately and Done never blocks on the network. "What helped" (preset values
 * + free-text) is attached via updateLog when the user reaches B2 and taps Done.
 */

const GREEN = "#84C524";
const GREEN_RING = "rgba(132,197,36,0.3)";
const MUTED = "#888888";

type Screen = "B1" | "B2" | "B3";

export default function LogB() {
  const { user } = useAuth();
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const { markSatisfied } = useDailyCheckIn();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const logIdRef = useRef<string | null>(null);
  const committedRef = useRef(false);
  // Resolves with the log_id once the optimistic commit lands, so a fast Done tap
  // can still attach "what helped" without blocking the UI on mount.
  const commitPromise = useRef<Promise<string | null> | null>(null);

  const [screen, setScreen] = useState<Screen>("B1");
  // Selected preset values (WHAT_HELPED_TOKENS .value) + selected custom strings.
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customChips, setCustomChips] = useState<string[]>([]);
  const [selectedCustom, setSelectedCustom] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  // Optimistic commit on mount — fire exactly once.
  useEffect(() => {
    if (committedRef.current || !user) return;
    committedRef.current = true;
    commitPromise.current = (async () => {
      try {
        const row = await createLog.mutateAsync({ log_type: "overcome", entry_method: "fab" });
        logIdRef.current = row.log_id;
        await confirmSmokeFreeDay(user.id, "log");
        await markSatisfied();
        qc.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
        return row.log_id;
      } catch {
        return null;
      }
    })();
  }, [user]);

  const togglePreset = (value: string) =>
    setSelectedPresets((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const toggleCustom = (label: string) =>
    setSelectedCustom((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label],
    );

  const addCustom = () => {
    const v = inputValue.trim();
    if (!v) return;
    if (!customChips.includes(v)) setCustomChips((prev) => [...prev, v]);
    if (!selectedCustom.includes(v)) setSelectedCustom((prev) => [...prev, v]);
    setInputValue("");
  };

  const removeCustom = (label: string) => {
    setCustomChips((prev) => prev.filter((c) => c !== label));
    setSelectedCustom((prev) => prev.filter((c) => c !== label));
  };

  // B2 Done — attach what-helped (preset values) + free text (selected customs),
  // then advance to the "Logged." confirmation.
  const handleDone = async () => {
    if (selectedPresets.length || selectedCustom.length) {
      const logId = logIdRef.current ?? (await commitPromise.current);
      if (logId) {
        await updateLog.mutateAsync({
          logId,
          patch: {
            what_helped: selectedPresets.length ? selectedPresets : null,
            other_text: selectedCustom.length ? selectedCustom.join(", ") : null,
          },
        });
      }
    }
    setScreen("B3");
  };

  // ── B1 — celebration ─────────────────────────────────────────────────────────
  if (screen === "B1") {
    return (
      <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
        <Pressable
          onPress={() => exitToHome()}
          hitSlop={12}
          className="absolute right-5 active:opacity-60"
          style={{ top: insets.top + 16, zIndex: 10 }}
        >
          <X size={26} color={MUTED} strokeWidth={2} />
        </Pressable>

        <View className="flex-1 items-center justify-center px-6">
          <PulsingCheck />
          <Text className="text-foreground font-sans-bold text-center mt-8 mb-3" style={{ fontSize: 28, lineHeight: 34 }}>
            Another one beaten.
          </Text>
          <Text className="text-muted-foreground text-center" style={{ fontSize: 15, lineHeight: 24, maxWidth: 260 }}>
            Every craving you beat makes the next one easier.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, paddingTop: 16 }}>
          <Pressable
            onPress={() => setScreen("B2")}
            className="bg-foreground rounded-2xl h-[52px] items-center justify-center active:opacity-90"
          >
            <Text className="text-background font-sans-bold" style={{ fontSize: 15 }}>What helped?</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── B3 — "Logged." confirmation ──────────────────────────────────────────────
  if (screen === "B3") {
    return (
      <View className="flex-1 bg-secondary items-center justify-center px-6" style={{ paddingTop: insets.top }}>
        <View
          className="items-center justify-center"
          style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: GREEN }}
        >
          <Check size={28} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Text className="text-foreground font-sans-bold text-center mt-6 mb-2.5" style={{ fontSize: 28 }}>
          Logged.
        </Text>
        <Text className="text-muted-foreground text-center" style={{ fontSize: 15, lineHeight: 24, maxWidth: 240, marginBottom: 40 }}>
          Keep going. You&apos;re building something real.
        </Text>
        <Pressable
          onPress={() => exitToHome()}
          className="bg-foreground rounded-2xl h-[52px] w-full items-center justify-center active:opacity-90"
          style={{ maxWidth: 320 }}
        >
          <Text className="text-background font-sans-bold" style={{ fontSize: 15 }}>Back to home</Text>
        </Pressable>
      </View>
    );
  }

  // ── B2 — "What got you through?" ─────────────────────────────────────────────
  return (
    <View className="flex-1 bg-secondary" style={{ paddingTop: insets.top }}>
      {/* Header: back + close */}
      <View className="flex-row items-center justify-between px-5" style={{ height: 56 }}>
        <Pressable onPress={() => setScreen("B1")} hitSlop={12} className="active:opacity-60">
          <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
        </Pressable>
        <Pressable onPress={() => exitToHome()} hitSlop={12} className="active:opacity-60">
          <X size={24} color={MUTED} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-foreground font-sans-bold mb-2" style={{ fontSize: 26, lineHeight: 31 }}>
          What got you through?
        </Text>
        <Text className="text-muted-foreground mb-7" style={{ fontSize: 14, lineHeight: 21 }}>
          Select everything that helped. This trains your personal toolkit.
        </Text>

        {/* WHAT HELPED? card — preset chips */}
        <View className="bg-card rounded-2xl p-5 mb-3" style={CARD_SHADOW}>
          <Text className="font-sans-medium mb-3.5" style={SECTION_LABEL}>WHAT HELPED?</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {WHAT_HELPED_TOKENS.map((t) => (
              <Chip key={t.value} label={t.label} selected={selectedPresets.includes(t.value)} onPress={() => togglePreset(t.value)} />
            ))}
          </View>
        </View>

        {/* OTHERS card — custom chip input */}
        <View className="bg-card rounded-2xl p-5" style={CARD_SHADOW}>
          <Text className="font-sans-medium mb-3.5" style={SECTION_LABEL}>OTHERS</Text>
          <Text className="text-muted-foreground mb-4" style={{ fontSize: 12, lineHeight: 18 }}>
            Type something specific to you. It&apos;ll be saved as your own chip.
          </Text>

          {customChips.length > 0 && (
            <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
              {customChips.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={selectedCustom.includes(c)}
                  onPress={() => toggleCustom(c)}
                  onRemove={() => removeCustom(c)}
                />
              ))}
            </View>
          )}

          <View className="flex-row items-center" style={{ gap: 10 }}>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={addCustom}
              returnKeyType="done"
              placeholder="e.g. Called my friend"
              placeholderTextColor="#A8A29E"
              className="flex-1 rounded-xl px-3.5 text-foreground"
              style={{
                height: 44,
                backgroundColor: "#F5F5F5",
                borderWidth: 1.5,
                borderColor: inputFocused ? GREEN : "#E8E8E8",
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={addCustom}
              className="items-center justify-center rounded-xl active:opacity-80"
              style={{ width: 44, height: 44, backgroundColor: GREEN }}
            >
              <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, paddingTop: 16 }}>
        <Pressable
          onPress={handleDone}
          disabled={updateLog.isPending}
          className="bg-foreground rounded-2xl h-[52px] items-center justify-center active:opacity-90"
          style={{ opacity: updateLog.isPending ? 0.6 : 1 }}
        >
          <Text className="text-background font-sans-bold" style={{ fontSize: 15 }}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: "#000000",
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

const SECTION_LABEL = {
  fontSize: 11,
  letterSpacing: 2,
  color: "#AAAAAA",
  textTransform: "uppercase",
} as const;

/** Pill chip — selected = filled green; optional × to remove a custom chip. */
const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void; onRemove?: () => void }> = ({
  label,
  selected,
  onPress,
  onRemove,
}) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center rounded-full active:opacity-80"
    style={{
      paddingVertical: 10,
      paddingHorizontal: 18,
      gap: 8,
      backgroundColor: selected ? GREEN : "#FFFFFF",
      borderWidth: 1.5,
      borderColor: selected ? GREEN : "#E8E8E8",
    }}
  >
    <Text className="font-sans-medium" style={{ fontSize: 14, color: selected ? "#FFFFFF" : "#15110D" }}>
      {label}
    </Text>
    {onRemove && (
      <Pressable onPress={onRemove} hitSlop={8}>
        <X size={14} color={selected ? "#FFFFFF" : MUTED} strokeWidth={2.5} />
      </Pressable>
    )}
  </Pressable>
);

/** B1 pulsing green check — a ring that scales/fades behind a solid check circle. */
const PulsingCheck: React.FC = () => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  return (
    <View style={{ width: 120, height: 120, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 2,
          borderColor: GREEN_RING,
          transform: [{ scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.15, 0.8] }) }],
          opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] }),
        }}
      />
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" }}>
        <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
      </View>
    </View>
  );
};

import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { exitToHome } from "../../lib/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { Button } from "../../components/ui/button";
import { queryKeys } from "../../lib/queryKeys";
import { WHAT_HELPED_TOKENS } from "../../lib/logOptions";
import { confirmSmokeFreeDay } from "../../lib/streak";

/**
 * Flow B — Overcome Log (Logging Spec §3 / Architecture Guide §9.5).
 * B1 (commit point, on mount): createLog overcome → confirmSmokeFreeDay('log')
 * → markSatisfied. Streak updates immediately. B2: optional "what helped" chips.
 * Exit after B1 = log committed + streak updated.
 */
export default function LogB() {
  const { user } = useAuth();
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const { markSatisfied } = useDailyCheckIn();
  const qc = useQueryClient();

  const logIdRef = useRef<string | null>(null);
  const committedRef = useRef(false);
  // Resolves with the log_id once the optimistic commit lands, so a fast Done tap
  // can still attach "what helped" without blocking the UI on mount.
  const commitPromise = useRef<Promise<string | null> | null>(null);
  const [whatHelped, setWhatHelped] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  // Optimistic commit on mount — fire exactly once. Done is enabled immediately;
  // these writes run in the background.
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
        // Even on failure we let the user out; nothing destructive committed.
        return null;
      }
    })();
  }, [user]);

  const handleSave = async () => {
    // Only "what helped" needs the committed log id. If the user picked chips,
    // wait for the in-flight commit (usually already done); otherwise exit now.
    if (whatHelped.length) {
      const logId = logIdRef.current ?? (await commitPromise.current);
      if (logId) {
        await updateLog.mutateAsync({
          logId,
          patch: { what_helped: whatHelped, other_text: otherText.trim() || null },
        });
      }
    }
    exitToHome();
  };

  return (
    <ScrollView
      className="flex-1 bg-background px-6 py-8"
      contentContainerClassName="pb-12"
      // First-tap buttons while the keyboard is up (chips' "Other" input).
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-8 mt-4">
        <Text className="text-5xl mb-3">💪</Text>
        <Text className="text-foreground font-display text-2xl text-center">That's a win.</Text>
        <Text className="text-muted-foreground text-sm mt-2 text-center leading-relaxed px-4">
          You rode it out. Your streak just moved — that craving doesn&apos;t count against you.
        </Text>
      </View>

      <ChipMultiSelect
        label="What helped? (optional)"
        options={WHAT_HELPED_TOKENS}
        selected={whatHelped}
        onChange={setWhatHelped}
        otherText={otherText}
        onOtherTextChange={setOtherText}
      />

      <Button title="Done" onPress={handleSave} loading={updateLog.isPending} className="mt-6" />
      <Pressable onPress={() => exitToHome()} className="mt-3 py-2 items-center">
        <Text className="text-muted-foreground text-sm">Skip</Text>
      </Pressable>
    </ScrollView>
  );
}

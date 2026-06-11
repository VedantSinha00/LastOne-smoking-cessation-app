import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useUpdateLog } from "../../hooks/useUpdateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { ChipMultiSelect } from "../../components/logging/chip-multi-select";
import { Button } from "../../components/ui/button";
import { TRIGGER_TOKENS, LOCATION_TOKENS, SOCIAL_TOKENS } from "../../lib/logOptions";

type Screen = "A1" | "A2";

/**
 * Flow A — Craving Log (Logging Spec §2 / Architecture Guide §9.4).
 * A1 (commit point): createLog craving + intensity → markSatisfied → A2.
 * A2 (optional): trigger/location/social chips + 'Other'. "I Need Help Now"
 * routes to SOS with routed_to_sos = true.
 */
export default function LogA() {
  const router = useRouter();
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
      Alert.alert("Couldn't save", e.message);
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
    router.back();
  };

  const handleNeedHelp = async () => {
    const id = await commitA1();
    if (id) {
      await updateLog.mutateAsync({ logId: id, patch: { routed_to_sos: true } });
    }
    router.replace("/(modals)/sos");
  };

  if (screen === "A1") {
    return (
      <ScrollView className="flex-1 bg-background px-6 py-8" contentContainerClassName="flex-grow">
        <Header onClose={() => router.back()} title="How strong is it?" />
        <Text className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Just the intensity for now. You can add detail next, or stop here.
        </Text>

        <View className="flex-row justify-between gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <Pressable
              key={v}
              onPress={() => setIntensity(v)}
              className={`flex-1 py-5 rounded-2xl border ${
                intensity === v ? "bg-primary border-primary" : "bg-card border-border"
              }`}
            >
              <Text className={`text-center text-xl font-sans-bold ${intensity === v ? "text-primary-foreground" : "text-foreground"}`}>{v}</Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row justify-between px-1 mb-10">
          <Text className="text-muted-foreground text-xs">Mild</Text>
          <Text className="text-muted-foreground text-xs">Intense</Text>
        </View>

        <Button title="Continue" onPress={handleContinue} loading={createLog.isPending} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background px-6 py-8" contentContainerClassName="pb-12">
      <Header onClose={handleSaveA2} title="What's going on?" />
      <Text className="text-muted-foreground text-sm mb-4 leading-relaxed">
        All optional — this helps spot your patterns.
      </Text>

      <ChipMultiSelect
        label="Triggers"
        options={TRIGGER_TOKENS}
        selected={triggers}
        onChange={setTriggers}
        otherText={otherText}
        onOtherTextChange={setOtherText}
      />
      <ChipMultiSelect label="Where are you?" options={LOCATION_TOKENS} selected={location} onChange={setLocation} allowOther={false} />
      <ChipMultiSelect label="Who's around?" options={SOCIAL_TOKENS} selected={social} onChange={setSocial} allowOther={false} />

      <Button title="Save" onPress={handleSaveA2} loading={updateLog.isPending} className="mt-6" />
      <Pressable onPress={handleNeedHelp} className="mt-4 py-3 items-center">
        <Text className="text-craving font-sans-bold">I need help now →</Text>
      </Pressable>
    </ScrollView>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-foreground font-display text-2xl flex-1 pr-3">{title}</Text>
      <Pressable onPress={onClose} className="px-3 py-1.5 bg-card border border-border rounded-lg">
        <Text className="text-muted-foreground text-sm">Close</Text>
      </Pressable>
    </View>
  );
}

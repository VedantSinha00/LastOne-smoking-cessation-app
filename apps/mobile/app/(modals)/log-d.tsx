import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ToastAndroid, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useStage } from "../../hooks/useStage";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";
import { Button } from "../../components/ui/button";

const MOODS = [
  { value: 1, emoji: "😞" },
  { value: 2, emoji: "🙁" },
  { value: 3, emoji: "😐" },
  { value: 4, emoji: "🙂" },
  { value: 5, emoji: "😄" },
];

/** Stage-aware placeholder prompts (Logging Spec §5.1). Rotates by day-of-week. */
const PROMPTS: Record<number, string[]> = {
  0: ["What usually sets it off?", "When's the hardest time of day?", "Who do you smoke with most?", "What do you think quitting will feel like?", "What are you looking forward to?"],
  1: ["What got you through today?", "What surprised you?", "What was the hardest moment?", "What's different about today?"],
  2: ["What do you do instead now?", "What still catches you off guard?", "What are you noticing?", "What's easier than you expected?"],
  3: ["What do you do instead now?", "What still catches you off guard?", "What are you noticing?", "What's easier than you expected?"],
  4: ["What's different about you now?", "What would you tell someone starting today?", "What do you not miss?", "What are you proud of?"],
  5: ["What's different about you now?", "What would you tell someone starting today?", "What do you not miss?", "What are you proud of?"],
};

function placeholderFor(stage: number): string {
  const set = PROMPTS[stage] ?? PROMPTS[0];
  return set[new Date().getDay() % set.length];
}

/**
 * Flow D — Quick Note (Logging Spec §5 / Architecture Guide §9.7).
 * No auto-commit. On Save: createLog note → markSatisfied → toast → back.
 * Cancel = no log written.
 */
export default function LogD() {
  const router = useRouter();
  const { stage } = useStage();
  const createLog = useCreateLog();
  const { markSatisfied } = useDailyCheckIn();

  const [text, setText] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [placeholder] = useState(() => placeholderFor(stage));

  const handleSave = async () => {
    if (!text.trim()) return;
    try {
      await createLog.mutateAsync({
        log_type: "note",
        entry_method: "fab",
        note_text: text.trim(),
        mood,
        has_photo: false, // photo capture deferred — not wired in V1 Step 9
      });
      await markSatisfied();
      if (Platform.OS === "android") ToastAndroid.show("Note saved", ToastAndroid.SHORT);
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save", e.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950 px-6 py-8" contentContainerClassName="pb-12">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-2xl font-extrabold">Quick note</Text>
        <Pressable onPress={() => router.back()} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
          <Text className="text-zinc-400 text-sm">Cancel</Text>
        </Pressable>
      </View>

      <TextInput
        className="bg-zinc-900 text-white px-4 py-3 rounded-2xl border border-zinc-800 h-32 text-base leading-relaxed"
        placeholder={placeholder}
        placeholderTextColor="#71717a"
        multiline
        maxLength={280}
        value={text}
        onChangeText={setText}
        textAlignVertical="top"
      />
      <Text className="text-zinc-600 text-xs text-right mt-1">{text.length}/280</Text>

      <Text className="text-zinc-400 text-sm font-medium mt-6 mb-3">How are you feeling? (optional)</Text>
      <View className="flex-row justify-between">
        {MOODS.map((m) => (
          <Pressable
            key={m.value}
            onPress={() => setMood(mood === m.value ? null : m.value)}
            className={`w-14 h-14 rounded-full items-center justify-center border ${
              mood === m.value ? "bg-amber-600/20 border-amber-600" : "bg-zinc-900 border-zinc-800"
            }`}
          >
            <Text className="text-2xl">{m.emoji}</Text>
          </Pressable>
        ))}
      </View>

      <Button title="Save note" onPress={handleSave} disabled={!text.trim()} loading={createLog.isPending} className="mt-8" />
    </ScrollView>
  );
}

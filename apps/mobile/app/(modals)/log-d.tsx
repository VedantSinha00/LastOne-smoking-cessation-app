import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ToastAndroid, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";
import { exitToHome } from "../../lib/navigation";
import { useStage } from "../../hooks/useStage";
import { useCreateLog } from "../../hooks/useCreateLog";
import { useDailyCheckIn } from "../../hooks/useDailyCheckIn";

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
 * Renders note input and mood picker, and shows a beautiful Saved confirmation
 * screen on success.
 */
export default function LogD() {
  const { stage } = useStage();
  const createLog = useCreateLog();
  const { markSatisfied } = useDailyCheckIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();

  // Launched from Journal: go back to the Journal sub-view. router.back() is
  // unreliable here — the modal's back target resolves to the tabs group's
  // default tab (Home), not Insights — so navigate explicitly with ?view=journal.
  // Launched from the Log menu (default): exit to Home (the picker replaced the stack).
  const exit = () => {
    if (from === "journal") {
      router.replace({ pathname: "/(tabs)/insights", params: { view: "journal" } });
    } else {
      exitToHome();
    }
  };

  const [text, setText] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [placeholder] = useState(() => placeholderFor(stage));
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    try {
      await createLog.mutateAsync({
        log_type: "note",
        entry_method: "fab",
        note_text: text.trim(),
        mood,
        has_photo: false, // photo capture deferred
      });
      await markSatisfied();
      if (Platform.OS === "android") ToastAndroid.show("Note saved", ToastAndroid.SHORT);
      setIsSaved(true);
    } catch (e: any) {
      Alert.alert("Couldn't save", e.message);
    }
  };

  // ---- Saved confirmation screen ----
  if (isSaved) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6" style={{ paddingTop: insets.top }}>
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
            shadowColor: "#84C524",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Check size={28} color="#FFFFFF" strokeWidth={3} />
        </View>

        <Text className="text-foreground font-display text-3xl text-center" style={{ marginBottom: 10 }}>
          Saved.
        </Text>

        <Text className="text-muted-foreground text-base text-center font-sans" style={{ marginBottom: 40, maxWidth: 240 }}>
          Good to get it out.
        </Text>

        <Pressable
          onPress={exit}
          style={{
            width: "100%",
            maxWidth: 320,
            backgroundColor: "#0F0D0B",
            borderRadius: 16,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
          className="active:opacity-90"
        >
          <Text className="text-white font-sans-bold" style={{ fontSize: 15 }}>
            Done
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---- Note writing screen ----
  return (
    <View className="flex-1 bg-background">
      {/* Top Bar with Inline Save */}
      <View style={{ paddingTop: insets.top }} className="bg-background px-5">
        <View className="h-14 flex-row items-center justify-between">
          <Pressable onPress={exit} accessibilityLabel="Cancel" hitSlop={12} className="pr-3 active:opacity-60">
            <ArrowLeft size={22} color="#15110D" strokeWidth={2} />
          </Pressable>
          <Text className="text-foreground font-display text-lg" style={{ letterSpacing: -0.3 }}>
            Quick note
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!text.trim() || createLog.isPending}
            style={{
              backgroundColor: text.trim() ? "#84C524" : "#E9E7E5",
              borderRadius: 9999,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
            className="active:opacity-85"
          >
            <Text
              className="font-sans-medium"
              style={{
                fontSize: 14,
                color: text.trim() ? "#FFFFFF" : "#76706C",
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Borderless Card Input */}
        <View className="bg-card border border-border rounded-3xl p-5" style={{ minHeight: 180 }}>
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: "#15110D",
              fontFamily: "DMSans_400Regular",
              lineHeight: 24,
              textAlignVertical: "top",
              minHeight: 120,
            }}
            placeholder={placeholder}
            placeholderTextColor="#76706C"
            multiline
            value={text}
            onChangeText={setText}
            autoFocus
          />
          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-border">
            <Text style={{ fontSize: 12, color: "#76706C" }}>
              {text.length} characters
            </Text>
            {text.length > 0 && (
              <Pressable onPress={() => setText("")} className="active:opacity-60">
                <Text style={{ fontSize: 13, color: "#76706C" }}>Clear</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Elegant Mood Selector Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#E9E7E5",
          }}
        >
          <Text className="font-sans-medium text-foreground text-sm" style={{ marginBottom: 12 }}>
            How are you feeling? <Text style={{ color: "#76706C", fontSize: 12 }}>(optional)</Text>
          </Text>
          <View className="flex-row justify-between">
            {MOODS.map((m) => {
              const active = mood === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setMood(mood === m.value ? null : m.value)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? "#84C524" : "#F7F5F1",
                    borderWidth: 1,
                    borderColor: active ? "#84C524" : "#E9E7E5",
                  }}
                  className="active:scale-95"
                >
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

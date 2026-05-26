import React, { useState } from "react";
import { View, Text, ScrollView, Alert, Pressable, TextInput, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { TriggerSelector } from "../../components/logging/trigger-selector";
import { Button } from "../../components/ui/button";

export default function LogModal() {
  const router = useRouter();
  const { user } = useAuth();

  const [intensity, setIntensity] = useState<number>(3);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [didSmoke, setDidSmoke] = useState<boolean>(false);
  const [cigarettesSmoked, setCigarettesSmoked] = useState<string>("1");
  const [context, setContext] = useState<string>("Stress");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSaveLog = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (didSmoke) {
        // Insert Slip record
        const { error } = await supabase.from("slips").insert([
          {
            user_id: user.id,
            intensity,
            context,
            cigarettes_smoked: parseInt(cigarettesSmoked) || 1,
            notes,
          },
        ]);
        if (error) throw error;
        Alert.alert("Logged", "Relapse/slip recorded. Stay strong, tomorrow is a new day.");
      } else {
        // Insert Craving log record
        const { error } = await supabase.from("craving_logs").insert([
          {
            user_id: user.id,
            intensity,
            context,
            triggers: selectedTriggers,
            notes,
          },
        ]);
        if (error) throw error;
        Alert.alert("Logged", "Craving logged successfully. Good job resisting!");
      }
      router.back();
    } catch (error: any) {
      Alert.alert("Error logging state", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950 px-6 py-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-2xl font-extrabold">Log Reflection</Text>
        <Pressable onPress={() => router.back()} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          <Text className="text-zinc-400 text-sm">Close</Text>
        </Pressable>
      </View>

      <View className="space-y-6">
        {/* Intensity Selector */}
        <View>
          <Text className="text-zinc-400 text-sm font-semibold mb-2">Craving Intensity: {intensity}/5</Text>
          <View className="flex-row justify-between gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <Pressable
                key={val}
                onPress={() => setIntensity(val)}
                className={`flex-1 py-3 rounded-xl border ${
                  intensity === val ? "bg-amber-600 border-amber-600" : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Text className="text-white text-center font-bold">{val}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Relapse/Slip Switch */}
        <View className="flex-row justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl mt-4">
          <View>
            <Text className="text-white font-semibold text-base">Did you smoke?</Text>
            <Text className="text-zinc-500 text-xs mt-0.5">Please be honest. No judgment here.</Text>
          </View>
          <Switch
            value={didSmoke}
            onValueChange={setDidSmoke}
            trackColor={{ false: "#27272a", true: "#ef4444" }}
            thumbColor="#fff"
          />
        </View>

        {/* Conditional Slider for Smoked count */}
        {didSmoke && (
          <View className="mt-4">
            <Text className="text-zinc-400 text-sm font-semibold mb-2">Number of Cigarettes Smoked</Text>
            <TextInput
              className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800 focus:border-red-500"
              placeholder="1"
              placeholderTextColor="#71717a"
              keyboardType="numeric"
              value={cigarettesSmoked}
              onChangeText={setCigarettesSmoked}
            />
          </View>
        )}

        {/* Triggers Selector */}
        {!didSmoke && (
          <View className="mt-4">
            <TriggerSelector selectedTriggers={selectedTriggers} onChange={setSelectedTriggers} />
          </View>
        )}

        {/* Context Selector */}
        <View className="mt-4">
          <Text className="text-zinc-400 text-sm font-semibold mb-2">Craving Context</Text>
          <View className="flex-row flex-wrap gap-2">
            {["Stress", "Boredom", "Social", "Routine", "Habitual"].map((ctx) => (
              <Pressable
                key={ctx}
                onPress={() => setContext(ctx)}
                className={`px-4 py-2 rounded-full border ${
                  context === ctx ? "bg-amber-600 border-amber-600" : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Text className="text-white text-xs">{ctx}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View className="mt-4">
          <Text className="text-zinc-400 text-sm font-semibold mb-2">Reflections / Feelings</Text>
          <TextInput
            className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800 h-24 focus:border-amber-500"
            placeholder="Write down what you were doing, who you were with, and how you felt..."
            placeholderTextColor="#71717a"
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <Button title="Save Log" onPress={handleSaveLog} loading={loading} className="mt-8 mb-12" />
      </View>
    </ScrollView>
  );
}

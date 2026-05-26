import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../components/ui/button";

export default function SosModal() {
  const router = useRouter();
  const [breathingStep, setBreathingStep] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [secondsLeft, setSecondsLeft] = useState<number>(4);

  useEffect(() => {
    if (breathingStep === "idle") return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (breathingStep === "inhale") {
            setBreathingStep("hold");
            return 4;
          } else if (breathingStep === "hold") {
            setBreathingStep("exhale");
            return 4;
          } else {
            setBreathingStep("inhale");
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingStep]);

  const handleStartBreathing = () => {
    setBreathingStep("inhale");
    setSecondsLeft(4);
  };

  const handleStopBreathing = () => {
    setBreathingStep("idle");
  };

  return (
    <ScrollView className="flex-1 bg-red-950/10 px-6 py-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-red-500 text-2xl font-black">SOS Emergency</Text>
        <Pressable onPress={() => router.back()} className="px-3 py-1 bg-red-900/30 border border-red-900/40 rounded-lg">
          <Text className="text-red-400 text-sm font-semibold">Exit</Text>
        </Pressable>
      </View>

      <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-6 items-center">
        <Text className="text-white text-lg font-bold text-center mb-2">4-4-4 Box Breathing</Text>
        <Text className="text-zinc-400 text-sm text-center mb-6">
          Calm your nervous system. Inhale, hold, and exhale to let the craving peak pass.
        </Text>

        {breathingStep === "idle" ? (
          <Button title="Start Breathing Reset" onPress={handleStartBreathing} className="bg-red-600 active:bg-red-700 w-full" />
        ) : (
          <View className="items-center w-full">
            <View className="w-40 h-40 rounded-full bg-red-600/10 border-4 border-red-600 items-center justify-center mb-6">
              <Text className="text-white text-xl font-bold capitalize">{breathingStep}</Text>
              <Text className="text-zinc-400 text-2xl font-extrabold mt-1">{secondsLeft}s</Text>
            </View>
            <Button title="Stop Exercise" onPress={handleStopBreathing} variant="secondary" className="w-full" />
          </View>
        )}
      </View>

      <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-12">
        <Text className="text-white text-lg font-bold mb-2">Quick Distractions</Text>
        <Text className="text-zinc-400 text-sm mb-4 leading-relaxed">
          Need a mental override? Engage in these quick exercises designed to shift focus immediately.
        </Text>
        
        <View className="space-y-3">
          <Pressable className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl active:bg-zinc-900">
            <Text className="text-white font-semibold">🧠 Memory Game</Text>
            <Text className="text-zinc-500 text-xs mt-1">Match patterns to occupy visual working memory (3 min).</Text>
          </Pressable>

          <Pressable className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl mt-3 active:bg-zinc-900">
            <Text className="text-white font-semibold">📞 Crisis Support</Text>
            <Text className="text-zinc-500 text-xs mt-1">Get in touch with an expert or supportive peer instantly.</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

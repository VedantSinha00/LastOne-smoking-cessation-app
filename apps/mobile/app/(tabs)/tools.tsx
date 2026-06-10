import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { queryKeys } from "../../lib/queryKeys";
import { ToolRunner } from "../../components/coping/ToolRunner";
import { updateToolScore } from "../../lib/sos";
import { Button } from "../../components/ui/button";
import type { Database } from "../../types/database";

type CopingTool = Database["public"]["Tables"]["coping_tools"]["Row"];

/** Library display sections (Coping Tools §1.2). AI Bot is a placeholder for now. */
const SECTIONS: { key: string; title: string; match: (t: CopingTool) => boolean }[] = [
  { key: "breathing", title: "Breathing Exercises", match: (t) => t.family === "breathing" },
  { key: "physical", title: "Physical Reset", match: (t) => t.family === "physical" },
  { key: "games", title: "Games & Puzzles", match: (t) => t.family === "mini_games" },
];

/**
 * Tools hub (Coping Tools §1.2 Layer 2 — explorative library). All 12 tools, browsable
 * by category in a calm state. Trying a tool here runs the same runner + check-in and
 * still feeds tool_score personalisation, but a LIBRARY session never touches
 * failed_sos_count / user_sos_state — that escalation counter is for real SOS only.
 */
export default function ToolsLibrary() {
  const { user } = useAuth();
  const [active, setActive] = useState<CopingTool | null>(null);
  const [checkIn, setCheckIn] = useState(false);

  const { data: tools, isLoading } = useQuery({
    queryKey: [...queryKeys.copingTools(), "library"],
    queryFn: async (): Promise<CopingTool[]> => {
      const { data } = await supabase.from("coping_tools").select("*").order("family").throwOnError();
      return (data ?? []) as CopingTool[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const startTool = (t: CopingTool) => {
    setActive(t);
    setCheckIn(false);
  };

  const score = async (delta: number) => {
    if (user && active) await updateToolScore(user.id, active.tool_id, delta, delta > 0 ? "better" : "same");
    setActive(null);
    setCheckIn(false);
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerClassName="p-6 gap-6 pb-12">
      <View>
        <Text className="text-zinc-500 text-sm font-medium">Coping Tools</Text>
        <Text className="text-white text-2xl font-extrabold">Try one anytime</Text>
        <Text className="text-zinc-500 text-xs mt-1 leading-relaxed">
          No craving needed. Get familiar with these now so they&apos;re ready when you need them.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#f59e0b" className="mt-6" />
      ) : (
        SECTIONS.map((section) => {
          const items = (tools ?? []).filter(section.match);
          if (!items.length) return null;
          return (
            <View key={section.key}>
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                {section.title}
              </Text>
              <View className="gap-2">
                {items.map((t) => (
                  <Pressable
                    key={t.tool_id}
                    onPress={() => startTool(t)}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 active:bg-zinc-800"
                  >
                    <Text className="text-white font-semibold">{t.name}</Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">
                      {Math.round(t.duration_seconds / 60) || 1} min · {t.category.replace(/_/g, " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })
      )}

      {/* AI Bot — coming soon placeholder (no backend yet). */}
      <View>
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">AI Bot</Text>
        <View className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <Text className="text-zinc-500 font-semibold">Talk it through</Text>
          <Text className="text-zinc-600 text-xs mt-0.5">Coming soon.</Text>
        </View>
      </View>

      {/* Tool runner overlay — library session (no escalation effects). */}
      <Modal visible={!!active} animationType="slide" onRequestClose={() => setActive(null)}>
        {active && !checkIn && <ToolRunner tool={active} onDone={() => setCheckIn(true)} />}
        {active && checkIn && (
          <View className="flex-1 bg-zinc-950 px-6 py-8 justify-center">
            <Text className="text-white text-2xl font-extrabold mb-1">How was that?</Text>
            <Text className="text-zinc-400 text-sm mb-8">Helps us learn what works for you.</Text>
            <View className="gap-3">
              <Pressable onPress={() => score(+1)} className="bg-emerald-600/20 border border-emerald-600 rounded-2xl p-5 active:opacity-80">
                <Text className="text-emerald-400 font-bold text-center text-base">That helped</Text>
              </Pressable>
              <Pressable onPress={() => score(-1)} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 active:bg-zinc-800">
                <Text className="text-zinc-200 font-bold text-center text-base">Not really</Text>
              </Pressable>
              <Button title="Close" variant="secondary" onPress={() => setActive(null)} className="mt-2" />
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { queryKeys } from "../../lib/queryKeys";
import { ToolRunner } from "../../components/coping/ToolRunner";
import { updateToolScore } from "../../lib/sos";
import { Button } from "../../components/ui/button";
import type { Database } from "../../types/database";

type CopingTool = Database["public"]["Tables"]["coping_tools"]["Row"];

/** Library display sections (Coping Tools §1.2). Games route to the dedicated
 *  hub (Step 19), so the library only lists breathing + physical as runnable
 *  tools here. AI Bot is a placeholder for now. */
const SECTIONS: { key: string; title: string; match: (t: CopingTool) => boolean }[] = [
  { key: "breathing", title: "Breathing Exercises", match: (t) => t.family === "breathing" },
  { key: "physical", title: "Physical Reset", match: (t) => t.family === "physical" },
  { key: "reframing", title: "Reframing", match: (t) => t.category === "cognitive_reframe" },
];

/**
 * Tools hub (Coping Tools §1.2 Layer 2 — explorative library). All 12 tools, browsable
 * by category in a calm state. Trying a tool here runs the same runner + check-in and
 * still feeds tool_score personalisation, but a LIBRARY session never touches
 * failed_sos_count / user_sos_state — that escalation counter is for real SOS only.
 */
export default function ToolsLibrary() {
  const { user } = useAuth();
  const router = useRouter();
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-6 pb-12">
      <View>
        <Text className="text-muted-foreground text-sm font-sans-medium">Coping Tools</Text>
        <Text className="text-foreground font-display text-2xl">Try one anytime</Text>
        <Text className="text-muted-foreground text-xs mt-1 leading-relaxed">
          No craving needed. Get familiar with these now so they&apos;re ready when you need them.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#7FC200" className="mt-6" />
      ) : (
        SECTIONS.map((section) => {
          const items = (tools ?? []).filter(section.match);
          if (!items.length) return null;
          return (
            <View key={section.key}>
              <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
                {section.title}
              </Text>
              <View className="gap-2">
                {items.map((t) => (
                  <Pressable
                    key={t.tool_id}
                    onPress={() => startTool(t)}
                    className="bg-card border border-border rounded-3xl p-4 active:bg-muted"
                  >
                    <Text className="text-foreground font-sans-bold">{t.name}</Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">
                      {Math.round(t.duration_seconds / 60) || 1} min · {t.category.replace(/_/g, " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })
      )}

      {/* Games & Puzzles → dedicated games hub (Step 19). */}
      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
          Games &amp; Puzzles
        </Text>
        <Pressable
          onPress={() => router.push("/games")}
          className="bg-card border border-border rounded-3xl p-4 active:bg-muted"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-foreground font-sans-bold">Distraction games</Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                Memory, Echo Tap, and 2-player — ride out a craving.
              </Text>
            </View>
            <Text className="text-primary font-display text-xl">→</Text>
          </View>
        </Pressable>
      </View>

      {/* AI Bot — coming soon placeholder (no backend yet). */}
      <View>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">AI Bot</Text>
        <View className="bg-muted border border-border rounded-3xl p-4">
          <Text className="text-muted-foreground font-sans-bold">Talk it through</Text>
          <Text className="text-muted-foreground text-xs mt-0.5">Coming soon.</Text>
        </View>
      </View>

      {/* Tool runner overlay — library session (no escalation effects).
          Bespoke tools (Finger Pulse / Physiological Sigh / Reframing) carry the
          design's own end check-in → they report via onComplete(helped) straight to
          score(), skipping the generic "How was that?" screen below. */}
      <Modal visible={!!active} animationType="slide" onRequestClose={() => setActive(null)}>
        {active && !checkIn && (
          <ToolRunner
            tool={active}
            onDone={() => setCheckIn(true)}
            onComplete={(helped) => score(helped ? +1 : -1)}
          />
        )}
        {active && checkIn && (
          <View className="flex-1 bg-background px-6 py-8 justify-center">
            <Text className="text-foreground font-display text-2xl mb-1">How was that?</Text>
            <Text className="text-muted-foreground text-sm mb-8">Helps us learn what works for you.</Text>
            <View className="gap-3">
              <Pressable onPress={() => score(+1)} className="bg-primary/15 border border-primary rounded-3xl p-5 active:opacity-80">
                <Text className="text-success font-sans-bold text-center text-base">That helped</Text>
              </Pressable>
              <Pressable onPress={() => score(-1)} className="bg-card border border-border rounded-3xl p-5 active:bg-muted">
                <Text className="text-foreground font-sans-bold text-center text-base">Not really</Text>
              </Pressable>
              <Button title="Close" variant="secondary" onPress={() => setActive(null)} className="mt-2" />
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

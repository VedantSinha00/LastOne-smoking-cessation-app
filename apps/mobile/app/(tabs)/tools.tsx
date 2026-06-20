import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { queryKeys } from "../../lib/queryKeys";
import { ToolRunner } from "../../components/coping/ToolRunner";
import { ToolFamilyGrid, FAMILIES, type FamilyKey } from "../../components/coping/ToolFamilyGrid";
import { updateToolScore } from "../../lib/sos";
import { Button } from "../../components/ui/button";
import type { Database } from "../../types/database";

type CopingTool = Database["public"]["Tables"]["coping_tools"]["Row"];

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
  const [family, setFamily] = useState<FamilyKey | null>(null);

  const onSelectFamily = (key: FamilyKey) => {
    if (key === "mini_games") {
      router.push("/games");
      return;
    }
    setFamily(key); // ai_chat shows its own coming-soon panel below
  };

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

  const selectedDef = family ? FAMILIES.find((f) => f.key === family) ?? null : null;
  const familyTools =
    selectedDef && selectedDef.match ? (tools ?? []).filter(selectedDef.match) : [];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-6 pb-12">
      {family === null ? (
        // ── Catalog: family-card grid (design "All tools") ──────────────────
        <>
          {/* Design TopBar — back ← on the left, centered title. (Tools is a tab,
              so back returns to the previous screen / Home.) */}
          <View className="h-14 flex-row items-center justify-between">
            <Pressable onPress={() => router.navigate("/(tabs)/")} hitSlop={12} style={{ width: 24 }}>
              <Text className="text-2xl" style={{ color: "#0D0D0D" }}>
                ←
              </Text>
            </Pressable>
            <Text className="font-display" style={{ fontSize: 16, color: "#0D0D0D" }}>
              All tools
            </Text>
            <View style={{ width: 24 }} />
          </View>
          {isLoading ? (
            <ActivityIndicator color="#7FC200" className="mt-6" />
          ) : (
            <ToolFamilyGrid tools={tools ?? []} onSelectFamily={onSelectFamily} />
          )}
        </>
      ) : (
        // ── Drilled into a family: its tool list (or AI coming-soon) ────────
        <>
          <Pressable onPress={() => setFamily(null)} hitSlop={8} className="active:opacity-60">
            <Text className="font-sans-bold" style={{ fontSize: 13, color: "#888888" }}>
              ← All categories
            </Text>
          </Pressable>
          <Text className="text-foreground font-display text-2xl">{selectedDef?.label}</Text>

          {selectedDef?.comingSoon ? (
            <View className="bg-muted border border-border rounded-3xl p-5">
              <Text className="text-muted-foreground font-sans-bold">
                {family === "ai_chat" ? "Talk it through" : "Bite-size reads"}
              </Text>
              <Text className="text-muted-foreground text-xs mt-1">
                {family === "ai_chat"
                  ? "A judgment-free AI coach for the moment — coming soon."
                  : "Short cards on what's happening in your body and mind — coming soon."}
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {familyTools.map((t) => (
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
          )}
        </>
      )}

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

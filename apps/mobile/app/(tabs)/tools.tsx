import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { queryKeys } from "../../lib/queryKeys";
import { ToolRunner } from "../../components/coping/ToolRunner";
import { ToolFamilyGrid, FAMILIES, type FamilyKey } from "../../components/coping/ToolFamilyGrid";
import { ToolListCard } from "../../components/coping/ToolListCard";
import { ToolIntroScreen } from "../../components/coping/ToolIntroScreen";
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
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<CopingTool | null>(null);
  const [checkIn, setCheckIn] = useState(false);
  const [family, setFamily] = useState<FamilyKey | null>(null);
  // The tool whose intro screen is showing (before the exercise runs).
  const [intro, setIntro] = useState<CopingTool | null>(null);

  const onSelectFamily = (key: FamilyKey) => {
    setFamily(key); // coming-soon families show their panel; mini_games lists games
  };

  // mini_games tools open their dedicated game screen; others run via ToolRunner.
  const GAME_ROUTES: Record<string, string> = {
    echo_tap: "/games/echo-tap",
    memory_1p: "/games/memory-1p",
    memory_2p: "/games/memory-2p",
    find_match_2p: "/games/memory-2p",
  };

  // Per-tool total_uses for the intro's "Used by you" line.
  const { data: toolUses } = useQuery({
    queryKey: ["tool_uses", user?.id ?? ""],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_tool_scores")
        .select("tool_id, total_uses")
        .eq("user_id", user!.id)
        .throwOnError();
      const map: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        map[r.tool_id] = r.total_uses;
      });
      return map;
    },
    enabled: !!user,
  });

  // Tapping a tool opens its INTRO screen first (design adds this step).
  const openTool = (t: CopingTool) => setIntro(t);

  // The intro's "Try it now" runs the actual exercise: route to the game, or open
  // the ToolRunner modal.
  const runIntroTool = () => {
    if (!intro) return;
    const route = GAME_ROUTES[intro.data_model_id];
    if (route) {
      setIntro(null);
      router.push(route as never);
    } else {
      startTool(intro);
      setIntro(null);
    }
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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 gap-6 pb-12"
      contentContainerStyle={{ paddingTop: insets.top + 8 }}
    >
      {/* "All tools" banner — shown on BOTH the catalog and the drilled-in family
          view. Back arrow (←) at the top-left goes straight to Home (design TopBar). */}
      <View className="h-8 flex-row items-center justify-center">
        <Pressable
          onPress={() => router.navigate("/(tabs)/")}
          hitSlop={12}
          accessibilityLabel="Back to home"
          style={{ position: "absolute", left: 0 }}
        >
          <Text className="text-2xl" style={{ color: "#0D0D0D" }}>
            ←
          </Text>
        </Pressable>
        <Text className="text-foreground font-display" style={{ fontSize: 22 }}>
          All tools
        </Text>
      </View>

      {family === null ? (
        // ── Catalog: family-card grid (design "All tools") ──────────────────
        <>
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
            <View>
              {/* Section header — "BREATHING · 4" (design) */}
              <Text
                className="font-sans-medium"
                style={{ fontSize: 11, color: "#AAAAAA", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}
              >
                {selectedDef?.label} · {familyTools.length}
              </Text>
              <View style={{ gap: 10 }}>
                {familyTools.map((t) => (
                  <ToolListCard
                    key={t.tool_id}
                    tool={t}
                    bg={selectedDef?.bg ?? "#EEEEEE"}
                    dot={selectedDef?.dot ?? "#999999"}
                    fg={selectedDef?.fg ?? "#555555"}
                    onPress={() => openTool(t)}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* Tool intro / detail screen — the design's extra step before the exercise.
          Opens on tap; "Try it now" runs the tool (game route or ToolRunner). */}
      <Modal visible={!!intro} animationType="slide" onRequestClose={() => setIntro(null)}>
        {intro &&
          (() => {
            const fam =
              FAMILIES.find((f) => (f.match ? f.match(intro) : false)) ?? null;
            return (
              <ToolIntroScreen
                tool={intro}
                bg={fam?.bg ?? "#EEEEEE"}
                fg={fam?.fg ?? "#555555"}
                familyLabel={fam?.label ?? intro.family}
                totalUses={toolUses?.[intro.tool_id] ?? 0}
                onTryIt={runIntroTool}
                onBack={() => setIntro(null)}
              />
            );
          })()}
      </Modal>

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

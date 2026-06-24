import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { useGoals } from "../../hooks/useGoals";
import { useAuth } from "../../hooks/useAuth";
import {
  dismissGoalPrompt,
  getGoalPromptDismiss,
  goalPromptVisible,
} from "../../lib/goals";

/**
 * Home "Personal Goals" card — ported from the Lovable `PersonalGoalCard`
 * (lovable-design-reference/src/components/lastone/PersonalGoalCard.tsx).
 *
 * Design: goal name + primary-green % badge, a thin progress bar, and a
 * "₹saved of ₹target" subline; the whole card taps through to /goals.
 *
 * Wired to real data (useGoals): shows the FIRST active goal. Goal amounts are
 * stored in rupees (lib/goals §header), so no paise conversion here. When there
 * are no active goals it shows a "set a personal goal" prompt that taps through
 * to /goals so the user can start one.
 */
const formatRupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const HomePersonalGoalCard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { active, isLoading } = useGoals();

  // Empty-state prompt visibility. Resolved from the device-side dismiss state
  // (lib/goals): hidden for a 4-day cooldown after each dismiss, permanently
  // after the 2nd. Only consulted when there are no active goals.
  const [promptEligible, setPromptEligible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (user && !isLoading && active.length === 0) {
      getGoalPromptDismiss(user.id).then((state) => {
        if (!cancelled) setPromptEligible(goalPromptVisible(state));
      });
    } else {
      setPromptEligible(false);
    }
    return () => {
      cancelled = true;
    };
  }, [user, isLoading, active.length]);

  if (isLoading) return null;

  // No active goals → invite the user to set one (unless dismissed/suppressed).
  if (active.length === 0) {
    if (!promptEligible) return null;

    const handleDismiss = () => {
      if (user) void dismissGoalPrompt(user.id);
      setPromptEligible(false);
    };

    return (
      <View>
        <SectionLabel>Personal Goals</SectionLabel>
        <View className="bg-card border border-border rounded-3xl p-5">
          <View className="flex-row items-start justify-between">
            <Text className="text-foreground font-sans-bold text-base flex-1 pr-3">
              Set a personal goal
            </Text>
            <Pressable onPress={handleDismiss} hitSlop={12}>
              <Text className="text-muted-foreground text-base">✕</Text>
            </Pressable>
          </View>
          <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
            Give your savings a destination. Something you actually want.
          </Text>
          <Pressable
            onPress={() => router.push("/goals")}
            className="mt-4 self-start rounded-xl bg-primary px-5 py-2.5 active:opacity-90"
            hitSlop={8}
          >
            <Text className="text-primary-foreground font-sans-bold text-sm">
              Set a goal →
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const goal = active[0];
  const target = Number(goal.target_amount);
  const saved = goal.derivedCurrentAmount;

  return (
    <View>
      <SectionLabel>Personal Goals</SectionLabel>
      <Card onPress={() => router.push("/goals")} className="p-6">
        <View className="flex-row items-baseline justify-between" style={{ gap: 12 }}>
          <Text
            className="text-foreground font-display flex-1"
            style={{ fontSize: 17, letterSpacing: -0.3 }}
            numberOfLines={1}
          >
            {goal.emoji ? `${goal.emoji} ` : ""}
            {goal.goal_name}
          </Text>
          <Text
            className="text-primary font-display"
            style={{ fontSize: 14 }}
          >
            {goal.progressLabel}
          </Text>
        </View>

        {/* progress bar */}
        <View className="mt-4 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.round(goal.barRatio * 100)}%` }}
          />
        </View>

        <Text className="text-xs text-muted-foreground mt-3">
          {formatRupees(saved)} of {formatRupees(target)}
        </Text>
      </Card>
    </View>
  );
};

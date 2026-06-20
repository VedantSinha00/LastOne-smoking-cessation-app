import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { useGoals } from "../../hooks/useGoals";

/**
 * Home "Personal Goals" card — ported from the Lovable `PersonalGoalCard`
 * (lovable-design-reference/src/components/lastone/PersonalGoalCard.tsx).
 *
 * Design: goal name + primary-green % badge, a thin progress bar, and a
 * "₹saved of ₹target" subline; the whole card taps through to /goals.
 *
 * Wired to real data (useGoals): shows the FIRST active goal. Goal amounts are
 * stored in rupees (lib/goals §header), so no paise conversion here. Renders
 * nothing when there are no active goals — Home stays clean rather than showing
 * an empty placeholder the design never specified.
 */
const formatRupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const HomePersonalGoalCard: React.FC = () => {
  const router = useRouter();
  const { active, isLoading } = useGoals();

  if (isLoading || active.length === 0) return null;

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

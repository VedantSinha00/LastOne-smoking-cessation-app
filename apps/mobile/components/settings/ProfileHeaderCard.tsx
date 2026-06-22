import React from "react";
import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { STAGE_NAMES, type Stage } from "../../lib/stage";

/**
 * Profile header card — ported from the Lovable `ProfileScreen` header
 * (avatar initial, name, stage badge, and a 3-stat row). Additive visual polish
 * on top of the existing PROF-01 settings root; wired entirely to data the root
 * already loads (no new queries). The design's "College student · Mumbai"
 * subline is mock with no backing field, so it is omitted rather than faked.
 */
interface ProfileHeaderCardProps {
  name: string;
  stage: Stage;
  smokeFreeDays: number | null;
  savedLabel: string;
}

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View className="flex-1 rounded-2xl bg-secondary border border-border px-3 py-3 items-center">
    <Text className="text-foreground font-display" style={{ fontSize: 18, lineHeight: 18 }}>
      {value}
    </Text>
    <Text className="text-muted-foreground text-[10px] uppercase tracking-wider mt-1">
      {label}
    </Text>
  </View>
);

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  name,
  stage,
  smokeFreeDays,
  savedLabel,
}) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Card className="p-5">
      <View className="flex-row items-center" style={{ gap: 16 }}>
        <View className="h-14 w-14 rounded-full bg-primary items-center justify-center">
          <Text className="text-primary-foreground font-display" style={{ fontSize: 20 }}>
            {initial}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-display" style={{ fontSize: 18, letterSpacing: -0.3 }}>
            {name}
          </Text>
          <View className="self-start mt-1.5 rounded-full bg-primary/15 px-2.5 py-0.5">
            <Text className="text-foreground text-[11px] font-sans-medium">{STAGE_NAMES[stage]}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row mt-4" style={{ gap: 8 }}>
        <Stat value={smokeFreeDays != null ? String(smokeFreeDays) : "—"} label="lifetime" />
        <Stat value={savedLabel} label="saved" />
      </View>
    </Card>
  );
};

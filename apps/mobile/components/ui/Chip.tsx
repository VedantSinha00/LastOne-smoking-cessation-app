import React from "react";
import { View, Text } from "react-native";

/**
 * Small rounded pill used for content categories ("Your body") and tags.
 * Ported from the Lovable design's pill pattern.
 *
 * Variants mirror the design's usage:
 *   - "body"  → dark-green bg with deep-green text (the "Your body" pill)
 *   - "dark"  → near-black chip with light text (.chip-dark)
 *   - "muted" → subtle neutral pill
 */
type ChipVariant = "body" | "dark" | "muted";

const STYLES: Record<ChipVariant, { bg: string; fg: string }> = {
  body: { bg: "#CEF17B", fg: "#084734" },
  dark: { bg: "#0F0D0B", fg: "#FAF8F5" },
  muted: { bg: "#F3F1EF", fg: "#76706C" },
};

export const Chip: React.FC<{ label: string; variant?: ChipVariant }> = ({
  label,
  variant = "muted",
}) => {
  const { bg, fg } = STYLES[variant];
  return (
    <View className="rounded-full px-2.5 py-1 self-start" style={{ backgroundColor: bg }}>
      <Text
        className="font-sans-medium"
        style={{ fontSize: 10, letterSpacing: 0.3, color: fg }}
      >
        {label}
      </Text>
    </View>
  );
};

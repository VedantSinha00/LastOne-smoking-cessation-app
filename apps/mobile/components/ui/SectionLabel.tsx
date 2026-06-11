import React from "react";
import { Text } from "react-native";

/**
 * Small uppercase eyebrow label above each section ("TODAY", "STREAKS",
 * "PROGRESS"). Ported from the Lovable `.section-label` utility:
 *   10px · weight 600 · 0.18em tracking · uppercase · muted-foreground.
 */
export const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <Text
    className={`text-muted-foreground font-sans-medium mb-3 ${className}`}
    style={{ fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase" }}
  >
    {children}
  </Text>
);

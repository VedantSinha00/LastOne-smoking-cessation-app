import React from "react";
import { View, Pressable, ViewProps } from "react-native";

/**
 * Base surface for content — ported from the Lovable design's card pattern
 * (rounded-3xl white surface, hairline border, soft shadow, generous padding).
 *
 * The design uses two shadow weights:
 *   - "card" → subtle resting elevation (StreaksCard, most cards)
 *   - "soft" → larger, used for hero/feature cards (TodayCard)
 *
 * RN shadows differ from CSS box-shadow, so these are close approximations of
 * the layered shadows in styles.css (--shadow-card / --shadow-soft).
 */
type Elevation = "card" | "soft" | "none";

const SHADOW: Record<Elevation, object> = {
  card: {
    shadowColor: "#15110D",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#15110D",
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  none: {},
};

interface CardProps extends ViewProps {
  elevation?: Elevation;
  /** When set, the card becomes pressable with a subtle press-scale (replaces the web hover). */
  onPress?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  elevation = "card",
  onPress,
  className = "",
  style,
  children,
  ...rest
}) => {
  const base = "rounded-3xl bg-card border border-border p-5";

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[SHADOW[elevation], style]}
        className={`${base} active:scale-[0.99] ${className}`}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[SHADOW[elevation], style]} className={`${base} ${className}`} {...rest}>
      {children}
    </View>
  );
};

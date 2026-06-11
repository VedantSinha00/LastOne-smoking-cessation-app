import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Primary action button — matched to the Lovable design system.
 *   primary   → lime-green fill, light label (the signature "All good today" button)
 *   secondary → white surface with a 1.5px near-black outline + dark label
 *               (the "Check in →" button)
 *   danger    → craving orange
 *
 * Shape mirrors Lovable: ~44px tall, 12px radius (rounded-xl), 600-weight label.
 * API is unchanged from the previous version so existing call sites keep working.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}) => {
  const inactive = loading || disabled;

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        // Lovable: white fill, 1.5px foreground outline, dark text.
        return "bg-card border-[1.5px] border-foreground active:bg-muted";
      case "danger":
        return "bg-craving active:opacity-90";
      default:
        return "bg-primary active:opacity-90";
    }
  };

  // primary/danger sit on saturated fills → light label; secondary → dark label
  const labelColor = variant === "secondary" ? "text-foreground" : "text-primary-foreground";
  const spinnerColor = variant === "secondary" ? "#15110D" : "#0D140B";

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      className={`py-3 px-6 rounded-xl flex-row justify-center items-center ${getVariantStyles()} ${
        disabled ? "opacity-40" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text className={`font-sans-bold text-center text-base ${labelColor}`}>{title}</Text>
      )}
    </Pressable>
  );
};

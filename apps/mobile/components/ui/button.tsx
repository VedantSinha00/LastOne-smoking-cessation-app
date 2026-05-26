import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  className = "",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return "bg-zinc-800 border border-zinc-700 active:bg-zinc-700";
      case "danger":
        return "bg-red-600 active:bg-red-700";
      default:
        return "bg-amber-600 active:bg-amber-700"; // Signature amber brand color
    }
  };

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      className={`py-3 px-6 rounded-xl flex-row justify-center items-center ${getVariantStyles()} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text className="text-white font-semibold text-center text-base">{title}</Text>
      )}
    </Pressable>
  );
};

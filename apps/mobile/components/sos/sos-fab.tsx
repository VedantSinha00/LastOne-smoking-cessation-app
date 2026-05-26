import React from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";

export const SosFab: React.FC = () => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/(modals)/sos")}
      className="absolute bottom-6 right-6 w-16 h-16 bg-red-600 rounded-full justify-center items-center shadow-xl active:bg-red-700 z-50 elevation-5"
    >
      <Text className="text-white font-black text-lg">SOS</Text>
    </Pressable>
  );
};

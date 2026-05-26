import React from "react";
import { View, Text, Pressable } from "react-native";

interface TriggerSelectorProps {
  selectedTriggers: string[];
  onChange: (triggers: string[]) => void;
}

const AVAILABLE_TRIGGERS = ["Stress", "Boredom", "Social/Friends", "After Meal", "Morning Routine", "Alcohol", "Anxiety"];

export const TriggerSelector: React.FC<TriggerSelectorProps> = ({ selectedTriggers, onChange }) => {
  const toggleTrigger = (trigger: string) => {
    if (selectedTriggers.includes(trigger)) {
      onChange(selectedTriggers.filter((t) => t !== trigger));
    } else {
      onChange([...selectedTriggers, trigger]);
    }
  };

  return (
    <View className="my-2">
      <Text className="text-zinc-400 text-sm font-medium mb-3">Select Triggers</Text>
      <View className="flex-row flex-wrap gap-2">
        {AVAILABLE_TRIGGERS.map((trigger) => {
          const isSelected = selectedTriggers.includes(trigger);
          return (
            <Pressable
              key={trigger}
              onPress={() => toggleTrigger(trigger)}
              className={`px-4 py-2 rounded-full border ${
                isSelected
                  ? "bg-amber-600 border-amber-600"
                  : "bg-zinc-950 border-zinc-800"
              } active:opacity-80`}
            >
              <Text className={`text-sm ${isSelected ? "text-white font-semibold" : "text-zinc-400"}`}>
                {trigger}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

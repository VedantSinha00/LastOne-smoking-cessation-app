import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Alert } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [baseline, setBaseline] = useState("10");
  const [cost, setCost] = useState("15");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        daily_baseline_cigarettes: parseInt(baseline) || 10,
        cost_per_pack: parseFloat(cost) || 15,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Error saving", error.message);
    } else {
      Alert.alert("Success", "Profile updated successfully.");
    }
    setSaving(false);
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950 p-6">
      <View className="mb-6">
        <Text className="text-zinc-500 text-sm font-medium">Settings</Text>
        <Text className="text-white text-2xl font-extrabold">Your Profile</Text>
      </View>

      <View className="space-y-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-6">
        <View>
          <Text className="text-zinc-400 text-sm font-semibold mb-2">Display Name</Text>
          <TextInput
            className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-zinc-800 focus:border-amber-500"
            placeholder="Username"
            placeholderTextColor="#71717a"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View className="mt-4">
          <Text className="text-zinc-400 text-sm font-semibold mb-2">Daily Baseline Cigarettes</Text>
          <TextInput
            className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-zinc-800 focus:border-amber-500"
            placeholder="10"
            placeholderTextColor="#71717a"
            keyboardType="numeric"
            value={baseline}
            onChangeText={setBaseline}
          />
        </View>

        <View className="mt-4">
          <Text className="text-zinc-400 text-sm font-semibold mb-2">Cost Per Pack ($)</Text>
          <TextInput
            className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-zinc-800 focus:border-amber-500"
            placeholder="15.00"
            placeholderTextColor="#71717a"
            keyboardType="numeric"
            value={cost}
            onChangeText={setCost}
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleSaveProfile}
          loading={saving}
          className="mt-6"
        />
      </View>

      <Button
        title="Sign Out"
        onPress={signOut}
        variant="danger"
        className="mb-12"
      />
    </ScrollView>
  );
}

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
    <ScrollView className="flex-1 bg-background p-6">
      <View className="mb-6">
        <Text className="text-muted-foreground text-sm font-sans-medium">Settings</Text>
        <Text className="text-foreground font-display text-2xl">Your Profile</Text>
      </View>

      <View className="space-y-4 bg-card border border-border p-6 rounded-3xl mb-6">
        <View>
          <Text className="text-muted-foreground text-sm font-sans-bold mb-2">Display Name</Text>
          <TextInput
            className="bg-input text-foreground px-4 py-3 rounded-xl border border-border"
            placeholder="Username"
            placeholderTextColor="#76706C"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View className="mt-4">
          <Text className="text-muted-foreground text-sm font-sans-bold mb-2">Daily Baseline Cigarettes</Text>
          <TextInput
            className="bg-input text-foreground px-4 py-3 rounded-xl border border-border"
            placeholder="10"
            placeholderTextColor="#76706C"
            keyboardType="numeric"
            value={baseline}
            onChangeText={setBaseline}
          />
        </View>

        <View className="mt-4">
          <Text className="text-muted-foreground text-sm font-sans-bold mb-2">Cost Per Pack ($)</Text>
          <TextInput
            className="bg-input text-foreground px-4 py-3 rounded-xl border border-border"
            placeholder="15.00"
            placeholderTextColor="#76706C"
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

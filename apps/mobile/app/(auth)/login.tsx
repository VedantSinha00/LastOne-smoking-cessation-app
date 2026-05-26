import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert, ScrollView } from "react-native";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    supabase.auth.getSession()
      .then(() => setConnectionStatus("connected"))
      .catch((err) => {
        console.error("Connection failed:", err);
        setConnectionStatus("error");
      });
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert("Error signing in", error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) Alert.alert("Error signing up", error.message);
    else Alert.alert("Success!", "Please check your email for confirmation link.");
    setLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950 px-6 py-12">
      <View className="flex-1 justify-center py-12">
        <View className="mb-10 items-center">
          <Text className="text-amber-500 text-5xl font-black">LastOne</Text>
          <Text className="text-zinc-400 text-base mt-2 text-center">
            Quit smoking on your terms. Real-time logging & emergency support.
          </Text>
          <View className="mt-4 flex-row items-center justify-center bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
            <View className={`w-2.5 h-2.5 rounded-full mr-2 ${
              connectionStatus === "connected" ? "bg-emerald-500" :
              connectionStatus === "error" ? "bg-red-500" : "bg-amber-500"
            }`} />
            <Text className="text-zinc-400 text-xs font-semibold">
              {connectionStatus === "connected" ? "Supabase Connected" :
               connectionStatus === "error" ? "Connection Failed" : "Checking Connection..."}
            </Text>
          </View>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-zinc-400 text-sm font-semibold mb-2">Email Address</Text>
            <TextInput
              className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800 focus:border-amber-500"
              placeholder="name@domain.com"
              placeholderTextColor="#71717a"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mt-4">
            <Text className="text-zinc-400 text-sm font-semibold mb-2">Password</Text>
            <TextInput
              className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800 focus:border-amber-500"
              placeholder="••••••••"
              placeholderTextColor="#71717a"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            className="mt-6"
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
            variant="secondary"
            loading={loading}
            className="mt-2"
          />
        </View>
      </View>
    </ScrollView>
  );
}

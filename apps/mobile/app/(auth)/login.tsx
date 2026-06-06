import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center px-6">
      <Text className="text-amber-500 text-5xl font-black mb-2">LastOne</Text>
      <Text className="text-zinc-400 text-base text-center mb-12">
        Your last cigarette starts here.
      </Text>

      <Pressable
        onPress={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-white rounded-2xl py-4 flex-row items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator color="#09090b" />
        ) : (
          <Text className="text-zinc-950 text-base font-semibold">Continue with Google</Text>
        )}
      </Pressable>
    </View>
  );
}

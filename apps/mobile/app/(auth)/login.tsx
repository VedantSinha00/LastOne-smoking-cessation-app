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
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-primary font-display text-5xl mb-2">LastOne</Text>
      <Text className="text-muted-foreground text-base text-center mb-12">
        Your last cigarette starts here.
      </Text>

      <Pressable
        onPress={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-card border border-border rounded-2xl py-4 flex-row items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator color="#15110D" />
        ) : (
          <Text className="text-foreground text-base font-sans-bold">Continue with Google</Text>
        )}
      </Pressable>
    </View>
  );
}

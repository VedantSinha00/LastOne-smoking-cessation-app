import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AuthProvider } from "../lib/auth-context";
import { useAuth } from "../hooks/useAuth";
import { queryClient } from "../lib/queryClient";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import "../global.css";

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const isReady = !authLoading && (!user || !profileLoading);

  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      // Not logged in — send to onboarding (guard prevents loop if already there)
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (!profile?.onboarding_complete) {
      // Logged in but onboarding incomplete — send to onboarding
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // Fully set up — if they somehow landed on onboarding, send to tabs
    if (inOnboarding) router.replace('/(tabs)');
  }, [isReady, user, profile?.onboarding_complete, segments[0]]);

  if (!isReady) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AuthProvider } from "../lib/auth-context";
import { useAuth } from "../hooks/useAuth";
import { queryClient } from "../lib/queryClient";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import { syncPushTokenIfGranted } from "../lib/notifications";
import "../global.css";

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const { data: profile, isLoading: profileLoading } = useQuery({
    // Dedicated key — see queryKeys.onboardingGate. A slim select() under the shared
    // `profile` key would otherwise cache a partial row (only onboarding_complete) and
    // starve useProfile/useDashboard of cigarettes_per_day/price_per_cigarette.
    queryKey: queryKeys.onboardingGate(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Backfill the Expo push token on launch when permission is already granted
  // (idempotent, best-effort, never prompts). Covers users who onboarded before
  // profiles.push_token existed or before a token could be fetched.
  useEffect(() => {
    if (user?.id) syncPushTokenIfGranted(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      // Not logged in — send to onboarding (guard prevents loop if already there)
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // Logged in: wait until the profile has loaded before choosing onboarding vs
    // tabs, so we don't bounce a user whose onboarding_complete isn't known yet.
    if (profileLoading) return;

    if (!profile?.onboarding_complete) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // Fully set up — if they somehow landed on onboarding, send to tabs
    if (inOnboarding) router.replace('/(tabs)');
  }, [authLoading, user, profileLoading, profile?.onboarding_complete, segments[0]]);

  // Only the INITIAL auth restore blocks rendering. Do NOT gate on profileLoading:
  // unmounting <Slot/> while a user signs in mid-onboarding destroys the in-memory
  // OnboardingContext and resets the flow to OB-01 (caused a sign-in loop).
  if (authLoading) {
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

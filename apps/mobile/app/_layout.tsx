import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator, InteractionManager } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import {
  useFonts,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { AuthProvider } from "../lib/auth-context";
import { LogSheetProvider } from "../hooks/useLogSheet";
import { ToastProvider } from "../hooks/useToast";
import { ConfirmProvider } from "../hooks/useConfirm";
import { UpdateBanner } from "../components/UpdateBanner";
import { useAuth } from "../hooks/useAuth";
import { queryClient } from "../lib/queryClient";
import { persistOptions } from "../lib/queryPersister";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import { syncPushTokenIfGranted, reconcileNotifications } from "../lib/notifications";
import { ensureNotificationChannels } from "../lib/notificationChannels";
import { handleNotificationResponse } from "../lib/notificationHandler";
import "../global.css";

// Hold the native splash until fonts + the initial auth restore are both ready,
// so startup shows a single held splash instead of two sequential JS spinners
// (and no blank gap between them). Called at module load, before first render.
SplashScreen.preventAutoHideAsync().catch(() => {
  // already prevented / unavailable — safe to ignore
});

// Foreground presentation (Architecture Guide §Step 15). Show the alert + play
// sound even when the app is open so scheduled milestones/check-ins are visible.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Create the Android notification channels (Milestones / Check-ins / Re-engagement)
// once at module load so scheduled notifications post to a named, branded channel
// instead of the OS default. Idempotent; no-op on iOS.
ensureNotificationChannels().catch(() => {});

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

  // On launch (authenticated): backfill the push token if already granted, and
  // reconcile the locally-scheduled notification set against current state
  // (quit date, stage, pause status). Both idempotent + best-effort. Deferred
  // until after the first screen's interactions/animations settle so this work
  // doesn't compete for the JS thread during initial render (faster first paint).
  useEffect(() => {
    if (!user?.id) return;
    const id = user.id;
    const task = InteractionManager.runAfterInteractions(() => {
      syncPushTokenIfGranted(id);
      reconcileNotifications(id);
    });
    return () => task.cancel();
  }, [user?.id]);

  // Route to the right screen when a notification is tapped, and mark it opened
  // (resets the auto-reduce counter — Notifications §B2.4).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(
        user?.id,
        response.notification.request.content.data as Record<string, unknown> | undefined,
        router,
      );
    });
    return () => sub.remove();
  }, [user?.id, router]);

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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#7FC200" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  // Load the design's display + body fonts before rendering any screen so text
  // never flashes in a fallback face. Tokens reference these family names in
  // tailwind.config.js (font-display / font-sans).
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  // Hide the native splash once fonts are ready. Keeping it up until this point
  // means the user sees the held splash instead of a JS spinner flash. (Auth
  // restore is fast/local; gating on fonts alone keeps the splash from lingering
  // if auth ever stalls. The brief auth spinner below covers that rare case.)
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Splash is still showing natively — render nothing rather than a spinner so
    // there's no flash between the splash and the first screen.
    return null;
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <AuthProvider>
        {/* Shared open/close state for the Log "+" picker overlay. Mounted at the
            root so any "+" (tab bar, settings nav bar) can open it; the overlay UI
            itself is rendered inside each screen tree that shows a bottom bar. */}
        <LogSheetProvider>
          {/* Branded in-app toast — any screen calls useToast().show(); the pill
              renders at root so it floats above all screens. */}
          <ToastProvider>
            {/* Branded confirmation dialog — any screen calls useConfirm() and
                awaits the user's choice; the modal renders at root above all
                screens, replacing native Alert.alert confirms. */}
            <ConfirmProvider>
              {/* Dark status-bar icons for the light theme background */}
              <StatusBar style="dark" />
              <RootLayoutNav />
              {/* OTA update prompt — checks for a new JS bundle on launch/foreground
                  and offers a one-tap restart when one is downloaded. No-ops in dev. */}
              <UpdateBanner />
            </ConfirmProvider>
          </ToastProvider>
        </LogSheetProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

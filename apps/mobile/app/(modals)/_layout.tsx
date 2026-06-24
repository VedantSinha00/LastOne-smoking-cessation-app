import { Stack } from "expo-router";

/**
 * Modal group (Architecture Guide §9.1) — all logging + SOS screens present as
 * modals over the tabs. log = half-sheet picker; log-a/b/c/d = the four flows;
 * sos = the SOS overlay.
 */
export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: false,
        contentStyle: { backgroundColor: "#FBFAF9" },
      }}
    >
      {/* The log "+" picker is NO LONGER a route — it renders as an in-tree overlay
          (components/log/LogSheetOverlay) so it can blur the live screen behind it.
          Only the four flows below remain real modal routes. */}
      <Stack.Screen name="log-a" />
      <Stack.Screen name="log-b" />
      <Stack.Screen name="log-c" />
      <Stack.Screen name="log-d" />
      {/* SOS-1 presents as a centered popup over the (dimmed) home, like Lovable;
          the later SOS screens render their own full-bleed background. Transparent
          presentation lets the scrim/dim show through behind SOS-1. */}
      <Stack.Screen name="sos" options={{ presentation: "transparentModal", animation: "fade" }} />
      {/* Step 18 — Giving Up experience (GU-2→8) + support person setup (GU-9/10). */}
      <Stack.Screen name="giving-up" />
      <Stack.Screen name="support-person" />
    </Stack>
  );
}

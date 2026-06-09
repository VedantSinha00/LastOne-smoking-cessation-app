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
        contentStyle: { backgroundColor: "#09090b" },
      }}
    >
      <Stack.Screen name="log" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="log-a" />
      <Stack.Screen name="log-b" />
      <Stack.Screen name="log-c" />
      <Stack.Screen name="log-d" />
      <Stack.Screen name="sos" options={{ presentation: "fullScreenModal" }} />
    </Stack>
  );
}

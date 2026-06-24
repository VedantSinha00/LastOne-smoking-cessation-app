import React, { useCallback, useEffect } from "react";
import { Pressable, Text, View, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import { Download } from "lucide-react-native";

/**
 * In-app OTA update prompt (EAS Update). Checks for a newer JS bundle on launch
 * and whenever the app returns to the foreground; when one is found it downloads
 * it in the background and shows a branded banner offering an immediate restart.
 *
 * Only active in a real build with updates enabled — it no-ops in Expo Go / the
 * dev client (Updates.isEnabled === false, __DEV__), so it never interferes with
 * development. Distribution flow + how to publish updates: see NOTES.md.
 *
 * Mounted once at the app root (app/_layout.tsx), above all screens.
 */
export const UpdateBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  // isUpdatePending → a new bundle has been downloaded and will run on reload.
  const { isUpdatePending: ready } = Updates.useUpdates();

  const checkAndFetch = useCallback(async () => {
    // Disabled in dev / Expo Go — there's no update server attached there.
    if (__DEV__ || !Updates.isEnabled) return;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync(); // download silently → flips isUpdatePending
      }
    } catch {
      // Network hiccup / no update server — silent; we retry on next foreground.
    }
  }, []);

  useEffect(() => {
    void checkAndFetch();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkAndFetch();
    });
    return () => sub.remove();
  }, [checkAndFetch]);

  // Show the banner only once a downloaded update is ready to apply, so the
  // restart is instant. (isUpdateAvailable alone means "found, not yet
  // downloaded" — checkAndFetch downloads it, which flips isUpdatePending.)
  if (!ready) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom + 90, // clear of the bottom nav / SOS FAB (matches toast)
        alignItems: "center",
        zIndex: 250,
        elevation: 250,
      }}
    >
      <Pressable
        onPress={() => Updates.reloadAsync()}
        style={{
          flexDirection: "row",
          alignItems: "center",
          maxWidth: "90%",
          backgroundColor: "#15110D", // foreground (near-black) — matches the toast pill
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 999,
          gap: 10,
          shadowColor: "#15110D",
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Download size={18} color="#A6E635" strokeWidth={2.5} />
        <Text
          className="font-sans-semibold"
          style={{ color: "#FEFBF8", fontSize: 14, flexShrink: 1 }}
        >
          Update ready
        </Text>
        <Text className="font-sans-bold" style={{ color: "#A6E635", fontSize: 14 }}>
          Restart
        </Text>
      </Pressable>
    </View>
  );
};

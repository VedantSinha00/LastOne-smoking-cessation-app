import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

/**
 * Persistent SOS / craving FAB — Architecture Guide §8.5 (reachable on every main
 * screen). Visual follows Lovable's CravingFAB: a 56px craving-orange circle that
 * floats clear above the bottom bar, with a pulsing halo ring.
 *
 * Lovable uses a CSS `pulse-ring` animation (an expanding, fading box-shadow).
 * RN has no animated box-shadow, so the ring is recreated with Reanimated: a halo
 * View behind the button loops scale-up + fade-out on the UI thread (2s, matching
 * Lovable's `pulse-ring 2s infinite`).
 */
const SIZE = 64;

export const SosFab: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Position driven by inline style (immune to NativeWind class purge/ordering).
  const bottom = 62 + insets.bottom + 40;
  const right = 28;

  // 0 → 1 loop drives the halo's scale + opacity.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1, // infinite
      false,
    );
  }, [progress]);

  const haloStyle = useAnimatedStyle(() => ({
    // Expand to ~1.65x then settle; fade from 0.5 → 0 over the first 70% (Lovable).
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.65]) }],
    opacity: interpolate(progress.value, [0, 0.7, 1], [0.5, 0, 0]),
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right,
        bottom,
        width: SIZE,
        height: SIZE,
        zIndex: 50,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Pulsing halo ring — absolutely centered on the button, fills the container
          and scales around its own center so it expands symmetrically. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: "#F15025", // craving
          },
          haloStyle,
        ]}
      />
      <Pressable
        onPress={() => router.push("/(modals)/sos")}
        className="bg-craving rounded-full justify-center items-center shadow-xl active:opacity-90 elevation-5"
        style={{ width: SIZE, height: SIZE }}
      >
        <Text
          className="text-white font-display"
          style={{ fontSize: 15, letterSpacing: 1.5 }}
        >
          SOS
        </Text>
      </Pressable>
    </View>
  );
};

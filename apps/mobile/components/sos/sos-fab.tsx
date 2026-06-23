import React, { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogSheet } from "../../hooks/useLogSheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

/**
 * Persistent SOS / craving FAB — Architecture Guide §8.5 (reachable on every main
 * screen). Visual follows Lovable's CravingFAB: a 56px craving-orange circle that
 * floats clear above the bottom bar, with a pulsing halo ring.
 *
 * Pulse cadence: each ring is a quick, consistent expand-and-fade (PULSE_MS). The
 * GAP between rings grows each cycle — total period 5s, 10s, 15s — then holds at
 * 15s indefinitely. So the halo is attention-grabbing at first and
 * settles into a calm, infrequent pulse over time, without the pulse itself ever
 * slowing down. (Reanimated ring on the UI thread; the growing gap is a JS timer.)
 *
 * Overlay-aware: the FAB is mounted on tab/browse screens that stay alive UNDER a
 * transparent modal (the log "+" sheet, the SOS popup itself). Without this, the
 * FAB would float on top of / beside that popup — nagging. So it self-hides
 * whenever a (modals) route is on top.
 */
const SIZE = 64;
const PULSE_MS = 2200; // duration of a single ring's expand-and-fade
const START_MS = 5000; // first full cycle (ring + gap)
const STEP_MS = 5000;
const MAX_MS = 15000;

export const SosFab: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { isOpen: logSheetOpen } = useLogSheet();
  // Hide the FAB while an overlay is on top rather than floating it over the popup.
  // Two cases: a (modals) route (the SOS popup itself, log-a..d flows), OR the log
  // "+" picker — now an in-tree overlay, not a route, so it isn't in `segments`.
  const overlayOpen = (segments as string[]).includes("(modals)") || logSheetOpen;

  // Position driven by inline style (immune to NativeWind class purge/ordering).
  const bottom = 62 + insets.bottom + 40;
  const right = 28;

  // 0 → 1 drives the halo's scale + opacity for a single snappy ring.
  const progress = useSharedValue(0);
  // Current full cycle period (ms) = ring + gap, bumped by STEP each cycle to MAX.
  const periodRef = useRef(START_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Fire one quick ring, then wait out the remainder of the current period
    // before the next — so the GAP grows while the ring stays a constant speed.
    const runCycle = () => {
      if (!mountedRef.current) return;
      progress.value = 0;
      progress.value = withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.ease) });

      // Next ring starts one full period after this one started (the ring's
      // PULSE_MS plays first, then dead time fills the rest of the period).
      const wait = periodRef.current;
      timerRef.current = setTimeout(() => {
        periodRef.current = Math.min(periodRef.current + STEP_MS, MAX_MS);
        runCycle();
      }, wait);
    };

    runCycle();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [progress]);

  const haloStyle = useAnimatedStyle(() => ({
    // Expand to ~1.65x then settle; fade from 0.5 → 0 over the first 70% (Lovable).
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.65]) }],
    opacity: interpolate(progress.value, [0, 0.7, 1], [0.5, 0, 0]),
  }));

  // Hidden while a modal/popup is on top (kept AFTER all hooks so hook order is
  // stable across renders).
  if (overlayOpen) return null;

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

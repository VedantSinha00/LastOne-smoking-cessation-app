import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, PanResponder, BackHandler } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurBackdrop } from "../ui/BlurBackdrop";
import { useLogSheet } from "../../hooks/useLogSheet";

/**
 * Log picker sheet — rendered as an in-place overlay (NOT a navigation route) so
 * the BlurBackdrop blurs the live screen behind it. (A transparent modal route
 * wipes the screen behind on Android, leaving nothing to blur.) Mounted as a
 * sibling of the screen content in (tabs)/_layout and the settings stack; it
 * paints over whatever screen is showing when the "+" is tapped.
 *
 * Styled to the design's LoggingFlowA "log-menu": a "Log" title, then a 2×2 grid
 * of square black-bordered option cards over the blurred/dimmed current screen.
 * Dismiss: drag the sheet down, tap the backdrop, or hardware back.
 */

interface LogOption {
  route: "/(modals)/log-a" | "/(modals)/log-b" | "/(modals)/log-c" | "/(modals)/log-d";
  title: string;
  subtitle: string;
}

const OPTIONS: LogOption[] = [
  { route: "/(modals)/log-a", title: "I feel like smoking", subtitle: "Work through it" },
  { route: "/(modals)/log-b", title: "I overcame a craving", subtitle: "That took strength" },
  { route: "/(modals)/log-c", title: "I smoked", subtitle: "No judgement" },
  { route: "/(modals)/log-d", title: "Quick note", subtitle: "Capture a thought" },
];

// Drag past this many px (or flick faster than this velocity) to dismiss.
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.2;

export function LogSheetOverlay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOpen, close } = useLogSheet();

  const translateY = useRef(new Animated.Value(0)).current;
  const springBack = () =>
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();

  // The overlay stays mounted and just toggles, so a previous drag offset would
  // persist into the next open. Reset it whenever the sheet opens. (The old route
  // remounted fresh each time, so this was free; now it's explicit.)
  useEffect(() => {
    if (isOpen) translateY.setValue(0);
  }, [isOpen, translateY]);

  // Hardware back closes the sheet instead of navigating the screen underneath —
  // restoring the dismiss-on-back behaviour the modal route gave us for free.
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, close]);

  // Pick an option: close the sheet, then push the real flow route.
  const pick = (route: LogOption["route"]) => {
    close();
    router.push(route);
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim only a deliberate downward drag. Capture-phase so the swipe is taken
      // before an option-card Pressable can swallow it (grab anywhere on the sheet),
      // while a plain tap (no vertical travel) still falls through to the card.
      onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          Animated.timing(translateY, { toValue: 600, duration: 180, useNativeDriver: true }).start(close);
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: springBack,
    })
  ).current;

  if (!isOpen) return null;

  return (
    <View
      // Absolute fill over the live screen. zIndex/elevation above the SOS FAB
      // (which is hidden anyway while the sheet is open, but be explicit).
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 100, elevation: 100 }}
    >
      {/* Blur + dim the live screen behind; the Pressable catches taps to dismiss. */}
      <BlurBackdrop intensity={35} tint="dark" dim="rgba(0,0,0,0.12)" />
      <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={close} />

      {/* Animated.View carries the slide; the inner plain View owns the drag (the
          config that reliably captures the gesture), wrapping the WHOLE sheet so
          the user can grab it anywhere. */}
      <Animated.View
        className="bg-card px-5 pt-3"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 + insets.bottom, transform: [{ translateY }] }}
      >
        <View {...panResponder.panHandlers}>
          <View className="self-center w-10 h-1 rounded-full bg-border" style={{ marginBottom: 20 }} />

          <View style={{ marginBottom: 20 }}>
            <Text className="text-foreground font-sans-bold" style={{ fontSize: 28, letterSpacing: -0.5 }}>
              Log
            </Text>
          </View>

          {/* 2×2 grid of square option cards (design: 2px black border, radius 20) */}
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {OPTIONS.map((o) => (
              <Pressable
                key={o.route}
                onPress={() => pick(o.route)}
                className="bg-card active:opacity-90"
                style={{
                  width: "47.5%",
                  aspectRatio: 1,
                  borderWidth: 2,
                  borderColor: "#0D0D0D",
                  borderRadius: 20,
                  padding: 22,
                  justifyContent: "center",
                }}
              >
                <Text className="font-sans-bold" style={{ fontSize: 18, lineHeight: 23, letterSpacing: -0.3, color: "#0D0D0D" }}>
                  {o.title}
                </Text>
                <Text className="font-sans-medium" style={{ fontSize: 14, marginTop: 6, color: "#888888" }}>
                  {o.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

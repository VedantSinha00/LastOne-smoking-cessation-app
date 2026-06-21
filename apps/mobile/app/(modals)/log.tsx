import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";

// expo-blur is a native module — guard the import so a build that doesn't yet have
// it (old dev build, before a rebuild) degrades to no blur instead of crashing.
let BlurView: React.ComponentType<{ intensity?: number; tint?: string; style?: any }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BlurView = require("expo-blur").BlurView;
} catch {
  BlurView = null;
}

/**
 * Log bottom-sheet (Architecture Guide §9.1 / Logging Spec §1.1), styled to the
 * design's LoggingFlowA "log-menu": a "Log" title + ×, then a 2×2 grid of square
 * black-bordered option cards over the dimmed current screen.
 *
 * Dismiss behaviour: the picker is pushed over whatever screen the user was on, so
 * tapping the backdrop / × just pops the picker (router.back) — returning them to
 * that exact screen, NOT forcing Home. (Exiting a *flow* after choosing an option
 * still uses exitToHome — that's separate, see lib/navigation.)
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

export default function LogSheet() {
  const router = useRouter();
  // Tap-outside / × → return to the screen the user was on when they tapped +.
  const dismiss = () => router.back();

  return (
    <View className="flex-1 justify-end">
      {/* Blurred + dimmed backdrop over the screen behind (design: blur + 0.35 dim).
          The Pressable layer catches taps to return to the previous screen.
          BlurView is null until a build includes the native module — dim still applies. */}
      {BlurView && (
        <BlurView intensity={20} tint="dark" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      )}
      <Pressable
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onPress={dismiss}
      />

      <View className="bg-card px-5 pt-3" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
        <View className="self-center w-10 h-1 rounded-full bg-border" style={{ marginBottom: 20 }} />

        <View className="flex-row items-center justify-between" style={{ marginBottom: 20 }}>
          <Text className="text-foreground font-sans-bold" style={{ fontSize: 28, letterSpacing: -0.5 }}>
            Log
          </Text>
          <Pressable onPress={dismiss} accessibilityLabel="Close" hitSlop={8} className="p-1">
            <X size={24} color="#888888" strokeWidth={2} />
          </Pressable>
        </View>

        {/* 2×2 grid of square option cards (design: 2px black border, radius 20) */}
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.route}
              onPress={() => router.replace(o.route)}
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
    </View>
  );
}

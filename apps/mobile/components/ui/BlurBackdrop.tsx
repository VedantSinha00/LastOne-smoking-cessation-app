import React from "react";
import { View, Platform } from "react-native";
import { BlurView } from "expo-blur";

/**
 * Full-screen blurred + dimmed backdrop for modal sheets/popups (design: blur the
 * screen behind, then a soft dim over it). Used by the Log "+" menu and the SOS
 * popup so the screen behind reads as frosted glass, not a flat grey panel.
 *
 * Why an error boundary instead of a native-module probe:
 * `expo-blur` registers only a native VIEW MANAGER ("ExpoBlurView"), not a native
 * MODULE — so `requireOptionalNativeModule("ExpoBlurView")` always returns null and
 * a module-registry guard can NEVER light up, leaving blur permanently off (the bug
 * this replaces). The only correct "is the native side present?" signal for a view
 * is whether it renders. So we just render <BlurView>; if the native view is truly
 * absent (a build without the module), render throws and the boundary falls back to
 * dim-only — no crash, and blur works whenever the module is in the build.
 */

interface Props {
  /** Blur strength (expo-blur intensity, 0–100). */
  intensity?: number;
  tint?: "dark" | "light" | "default";
  /** Dim colour painted over the blur (and the sole backdrop if blur is unavailable). */
  dim?: string;
}

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

class BlurErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Android's default blur method ('none') renders NOTHING — expo-blur only actually
// blurs on Android with the experimental 'dimezisBlurView' backend. iOS blurs
// natively and doesn't need (or want) the experimental path. Without this, the
// blur silently no-ops on Android and you get a flat dim — the bug this fixes.
const BLUR_METHOD = Platform.OS === "android" ? "dimezisBlurView" : "none";

export function BlurBackdrop({ intensity = 20, tint = "dark", dim = "rgba(0,0,0,0.35)" }: Props) {
  return (
    // pointerEvents="none" on both layers: the backdrop is purely visual — the
    // dismiss tap + sheet drag live in log.tsx/sos.tsx. Without this, the
    // full-screen BlurView/dim swallow touches before they reach those handlers.
    // pointerEvents="none" on both layers: the backdrop is purely visual — the
    // dismiss tap + sheet drag live in log.tsx/sos.tsx. Without this, the
    // full-screen BlurView/dim swallow touches before they reach those handlers.
    <BlurErrorBoundary fallback={<View pointerEvents="none" style={[FILL, { backgroundColor: dim }]} />}>
      <BlurView intensity={intensity} tint={tint} experimentalBlurMethod={BLUR_METHOD} pointerEvents="none" style={FILL} />
      <View pointerEvents="none" style={[FILL, { backgroundColor: dim }]} />
    </BlurErrorBoundary>
  );
}

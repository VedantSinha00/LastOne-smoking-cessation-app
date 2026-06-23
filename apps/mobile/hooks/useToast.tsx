import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Info } from "lucide-react-native";

/**
 * Branded in-app toast — replaces the default grey `ToastAndroid` pill with a
 * branded card (app fonts/colours, rounded, success icon) that fades in near the
 * bottom and auto-dismisses. Rendered once at the root so any screen can show one
 * via useToast().show(). Pattern mirrors hooks/useLogSheet.tsx.
 */
type ToastVariant = "success" | "info";
type ToastContextValue = {
  show: (message: string, opts?: { variant?: ToastVariant; durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_MS = 2600;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<ToastVariant>("success");
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ToastContextValue["show"]>((msg, opts) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVariant(opts?.variant ?? "success");
    setMessage(msg);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
    ]).start();
    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 12, duration: 200, useNativeDriver: true }),
      ]).start(() => setMessage(null));
    }, opts?.durationMs ?? DEFAULT_MS);
  }, [opacity, translateY]);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  const Icon = variant === "success" ? Check : Info;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message != null && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: insets.bottom + 90, // clear of the bottom nav / SOS FAB
            alignItems: "center",
            opacity,
            transform: [{ translateY }],
            zIndex: 200,
            elevation: 200,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              maxWidth: "86%",
              backgroundColor: "#15110D", // foreground (near-black)
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
            <Icon size={18} color="#A6E635" strokeWidth={2.5} />
            <Text className="font-sans-semibold" style={{ color: "#FEFBF8", fontSize: 14, flexShrink: 1 }}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

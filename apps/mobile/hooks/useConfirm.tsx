import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

/**
 * Branded in-app confirmation dialog — replaces the native `Alert.alert` confirm
 * popup (which renders raw OS chrome) with a card styled to the app's design
 * system. Rendered once at the root so any screen can request a confirmation via
 * useConfirm(); resolves a promise with the user's choice. Pattern mirrors
 * hooks/useToast.tsx and hooks/useLogSheet.tsx.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Retire this goal?', message: '…', confirmLabel: 'Retire', destructive: true })) {
 *     // proceed
 *   }
 */
export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Confirm button label. Default "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Default "Cancel". */
  cancelLabel?: string;
  /** Renders the confirm button in the destructive (craving) colour. */
  destructive?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  // Guards against a double-resolve if the user taps + the backdrop fires.
  const resolvedRef = useRef(false);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolvedRef.current = false;
      setDialog({ ...opts, resolve });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setDialog((current) => {
      if (current && !resolvedRef.current) {
        resolvedRef.current = true;
        current.resolve(value);
      }
      return null;
    });
  }, []);

  const confirmLabel = dialog?.confirmLabel ?? "Confirm";
  const cancelLabel = dialog?.cancelLabel ?? "Cancel";
  const destructive = dialog?.destructive ?? false;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        visible={dialog != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => settle(false)}
      >
        {/* Scrim — tapping outside cancels */}
        <Pressable
          onPress={() => settle(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(21,17,13,0.45)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          {/* Card. Stop propagation so taps inside don't dismiss. */}
          <Pressable
            onPress={() => {}}
            className="w-full bg-card border border-border rounded-3xl p-6"
            style={{
              maxWidth: 380,
              shadowColor: "#15110D",
              shadowOpacity: 0.18,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 14 },
              elevation: 12,
            }}
          >
            <Text
              className="text-foreground font-display"
              style={{ fontSize: 19, letterSpacing: -0.3 }}
            >
              {dialog?.title}
            </Text>
            {dialog?.message ? (
              <Text className="text-muted-foreground text-sm mt-2 leading-relaxed">
                {dialog.message}
              </Text>
            ) : null}

            <View className="flex-row justify-end items-center mt-6" style={{ gap: 8 }}>
              <Pressable
                onPress={() => settle(false)}
                className="rounded-xl px-5 py-2.5 active:bg-muted"
                hitSlop={6}
              >
                <Text className="text-foreground font-sans-bold text-sm">{cancelLabel}</Text>
              </Pressable>
              <Pressable
                onPress={() => settle(true)}
                className={`rounded-xl px-5 py-2.5 active:opacity-90 ${
                  destructive ? "bg-craving" : "bg-primary"
                }`}
                hitSlop={6}
              >
                <Text className="text-primary-foreground font-sans-bold text-sm">
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (ctx === undefined) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}

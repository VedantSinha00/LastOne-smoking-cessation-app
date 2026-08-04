import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useReturnModal } from "../../hooks/useReturnModal";
import { useToast } from "../../hooks/useToast";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";
import { resolveStk2, resolveStk3 } from "../../lib/returnModal";
import { ReturnModalShort, type Stk2Choice } from "./ReturnModalShort";
import { ReturnModalLong, type Stk3Choice } from "./ReturnModalLong";

/**
 * Return-modal gate (Streak Spec §5 / Architecture Guide §8.5).
 *
 * Mounted in app/(tabs)/_layout.tsx ABOVE <Tabs>, the SOS FAB and the log-sheet
 * overlay — not inside the Home screen. The spec requires the modal to gate the
 * app entirely ("no dismiss, no skip, no back"), and gating only Home's screen
 * body left the tab bar, the centre "+" Log FAB and the SOS FAB rendered as
 * siblings of the gated content: all three stayed visible and tappable, so any
 * user could walk straight past the modal into the logging flow with their
 * streak still unreconciled. (Observed in production data: a tester returning
 * from a 28-day absence produced six log rows while last_confirmed_date stayed
 * stale.)
 *
 * Renders children only once there is nothing to resolve.
 */
export const ReturnGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const returnModal = useReturnModal();
  const toast = useToast();

  const [resolved, setResolved] = useState(false);
  // In-flight guard: options stay mounted during the write, so an impatient
  // double-tap would otherwise fire the resolution twice.
  const [resolving, setResolving] = useState(false);

  const refreshStreak = () => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(user.id) });
    // Prefix invalidation so the dashboard's allAttempts read refreshes too — the
    // resolution can move the quit attempt, which moves the counters.
    queryClient.invalidateQueries({ queryKey: ["quit_attempt"] });
  };

  // The write must land before the gate lifts. A rejected write previously threw
  // straight out of the handler with no catch anywhere in the tree, skipping
  // setResolved(true) — the modal then re-rendered unchanged and the option read
  // as a dead button. Surface the failure and leave the options tappable to retry.
  const resolve = async (fn: () => Promise<void>, choice: string) => {
    if (!user || resolving) return;
    setResolving(true);
    try {
      await fn();
      refreshStreak();
      setResolved(true);
    } catch (e) {
      console.warn("Return-modal resolve failed", {
        choice,
        daysMissed: returnModal.daysMissed,
        error: e,
      });
      toast.show("Couldn't save that. Check your connection and try again.", {
        variant: "error",
      });
    } finally {
      setResolving(false);
    }
  };

  if (returnModal.isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7FC200" />
      </View>
    );
  }

  if (!resolved && returnModal.type === "stk2") {
    return (
      <ReturnModalShort
        daysMissed={returnModal.daysMissed}
        resolving={resolving}
        onResolve={(choice: Stk2Choice) =>
          resolve(() => resolveStk2(user!.id, choice, returnModal.daysMissed), choice)
        }
      />
    );
  }

  if (!resolved && returnModal.type === "stk3") {
    return (
      <ReturnModalLong
        daysMissed={returnModal.daysMissed}
        resolving={resolving}
        onResolve={(choice: Stk3Choice) =>
          resolve(() => resolveStk3(user!.id, choice, returnModal.daysMissed), choice)
        }
      />
    );
  }

  return <>{children}</>;
};

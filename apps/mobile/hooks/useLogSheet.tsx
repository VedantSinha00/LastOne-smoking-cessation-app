import React, { createContext, useCallback, useContext, useState } from "react";

/**
 * Shared open/close state for the Log "+" picker sheet.
 *
 * The picker used to be its own navigation route (`/(modals)/log`). On Android a
 * transparent modal route wipes the screen behind it, so expo-blur had nothing
 * live to blur (flat grey). To blur the real screen, the sheet now renders as an
 * in-place overlay INSIDE the screen's own view tree (see LogSheetOverlay). But
 * the trigger ("+") and the overlay live in different components — so they need a
 * tiny shared state to coordinate. This context is that state.
 *
 * Pattern mirrors hooks/useOnboarding.ts (the repo's established context style).
 */
type LogSheetContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const LogSheetContext = createContext<LogSheetContextValue | undefined>(undefined);

export const LogSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return React.createElement(LogSheetContext.Provider, { value: { isOpen, open, close } }, children);
};

export function useLogSheet(): LogSheetContextValue {
  const ctx = useContext(LogSheetContext);
  if (ctx === undefined) {
    throw new Error("useLogSheet must be used within a LogSheetProvider");
  }
  return ctx;
}

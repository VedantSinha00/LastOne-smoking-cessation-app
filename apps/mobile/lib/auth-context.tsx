import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { queryClient } from "./queryClient";

// Required for the OAuth redirect to close the browser tab on iOS/Android
WebBrowser.maybeCompleteAuthSession();

// Parse `a=1&b=2` (query or fragment) into a plain object. Manual parse — RN does
// not reliably ship URLSearchParams / URL fragment parsing.
function parseUrlParams(str: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of str.split('&')) {
    if (!pair) continue;
    const idx = pair.indexOf('=');
    const key = idx >= 0 ? pair.slice(0, idx) : pair;
    const val = idx >= 0 ? pair.slice(idx + 1) : '';
    try {
      out[decodeURIComponent(key)] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // INITIAL_SESSION fires from SecureStore (no network call) and replaces getSession().
    // Using onAuthStateChange as the single source of truth avoids a double state-update
    // that occurs when both getSession() and INITIAL_SESSION update the same state fields.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Redirect to the /onboarding route (where sign-in is initiated) rather than
    // '/'. The OS also delivers this redirect to expo-router as a deep link; if it
    // pointed at '/', the router would navigate to (tabs) and bounce back, which
    // remounts the onboarding tree and resets the flow to OB-01. Targeting the
    // current route makes that deep link a no-op.
    const redirectTo = Linking.createURL('/onboarding');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // skipBrowserRedirect: let expo-web-browser open the URL instead of supabase-js
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success' || !result.url) return;

    // Supabase returns EITHER a PKCE auth code (`?code=...`) OR an implicit-flow
    // token bundle in the URL fragment (`#access_token=...&refresh_token=...`).
    // Handle whichever we get so the session actually gets created.
    const url = result.url;
    const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
    const queryStr = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
    const q = parseUrlParams(queryStr);
    const f = parseUrlParams(fragment);

    if (q.code) {
      await supabase.auth.exchangeCodeForSession(q.code);
    } else if (f.access_token && f.refresh_token) {
      await supabase.auth.setSession({
        access_token: f.access_token,
        refresh_token: f.refresh_token,
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

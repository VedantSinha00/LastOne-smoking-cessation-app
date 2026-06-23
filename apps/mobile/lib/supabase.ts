import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

import { Database } from "../types/database";

// Custom storage adapter using Expo SecureStore for persistent, secure auth
// sessions.
//
// SecureStore warns/fails when a single value exceeds 2048 bytes — and the
// Supabase session (access + refresh JWTs + user) routinely does. An unreliable
// write means the session sometimes doesn't persist, so the next launch sees no
// user and bounces to onboarding (the intermittent sign-in loop). This adapter
// chunks any oversized value across multiple keys so no write exceeds the limit:
//   <key>          -> manifest: "__chunks__:<n>" when chunked, else the raw value
//   <key>.0..n-1   -> the value split into <=CHUNK_BYTES-byte pieces
const CHUNK_BYTES = 1800; // per-chunk byte budget, headroom under the 2048 limit
const CHUNK_PREFIX = "__chunks__:";

/** UTF-8 byte length of a string (TextEncoder is available in Hermes). */
function byteLength(s: string): number {
  try {
    return new TextEncoder().encode(s).length;
  } catch {
    return s.length; // ASCII fallback
  }
}

/**
 * Split a string into pieces each at most `maxBytes` UTF-8 bytes, never cutting
 * a multi-byte character. Returns the pieces in order (their concatenation
 * exactly reconstructs the input).
 */
function splitByBytes(value: string, maxBytes: number): string[] {
  const pieces: string[] = [];
  let start = 0;
  while (start < value.length) {
    let end = start;
    let bytes = 0;
    while (end < value.length) {
      const cp = value.codePointAt(end)!;
      const charLen = cp > 0xffff ? 2 : 1; // surrogate pair = 2 UTF-16 units
      const cpBytes = cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
      if (bytes + cpBytes > maxBytes) break;
      bytes += cpBytes;
      end += charLen;
    }
    if (end === start) end = start + 1; // safety: always make progress
    pieces.push(value.slice(start, end));
    start = end;
  }
  return pieces;
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const head = await SecureStore.getItemAsync(key);
      if (head === null) return null;
      if (!head.startsWith(CHUNK_PREFIX)) return head; // plain (or legacy) value

      const count = parseInt(head.slice(CHUNK_PREFIX.length), 10);
      if (!Number.isFinite(count) || count <= 0) return null;

      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        const part = await SecureStore.getItemAsync(`${key}.${i}`);
        if (part === null) return null; // a missing chunk = corrupt; treat as no session
        parts.push(part);
      }
      return parts.join("");
    } catch (error) {
      console.error("Error reading secure token:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Always clear any prior chunks first so a shrinking value can't leave
      // stale tail chunks behind that would corrupt a later read.
      await clearChunks(key);

      // Small enough to store directly (covers the common short-value case and
      // keeps the manifest format backward-compatible).
      if (byteLength(value) <= CHUNK_BYTES) {
        await SecureStore.setItemAsync(key, value);
        return;
      }

      const pieces = splitByBytes(value, CHUNK_BYTES);
      for (let i = 0; i < pieces.length; i++) {
        await SecureStore.setItemAsync(`${key}.${i}`, pieces[i]);
      }
      await SecureStore.setItemAsync(key, `${CHUNK_PREFIX}${pieces.length}`);
    } catch (error) {
      console.error("Error setting secure token:", error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await clearChunks(key);
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("Error deleting secure token:", error);
    }
  },
};

/** Delete any chunk keys (<key>.0, .1, ...) for a chunked value. */
async function clearChunks(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (!head?.startsWith(CHUNK_PREFIX)) return;
  const count = parseInt(head.slice(CHUNK_PREFIX.length), 10);
  if (!Number.isFinite(count)) return;
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${key}.${i}`);
  }
}

const PLACEHOLDER_URL = "https://placeholder-url.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;

// Misconfiguration guard. EXPO_PUBLIC_* vars are inlined AT BUILD TIME — a cloud
// (EAS) build that lacks them ships this placeholder and the app can't reach the
// backend (auth shows "address not found"). This is exactly how the first clean
// preview build broke (2026-06-24). We do NOT throw here — a module-load throw
// would hard-crash the app on launch, which is worse than a reachable error. We
// log LOUDLY instead, and escalate to console.error in release builds (where the
// old console.warn was invisible). To fix: register the vars with EAS
// (`eas env:list --environment preview`) and rebuild. See docs/REBUILD_CHECKLIST.md.
export const supabaseConfigInvalid =
  supabaseUrl === PLACEHOLDER_URL || supabaseAnonKey === PLACEHOLDER_KEY;

if (supabaseConfigInvalid) {
  const msg =
    "Supabase credentials are NOT configured — using a placeholder URL, so the " +
    "backend is unreachable. Set EXPO_PUBLIC_SUPABASE_URL and " +
    "EXPO_PUBLIC_SUPABASE_ANON_KEY (local .env for dev; EAS env vars for cloud builds).";
  // Release builds previously swallowed this (console.warn is invisible in a
  // shipped APK's default logs) — use console.error so it surfaces everywhere.
  if (__DEV__) console.warn(msg);
  else console.error(msg);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

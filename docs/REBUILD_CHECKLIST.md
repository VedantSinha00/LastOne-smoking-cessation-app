# Dev-build rebuild checklist

Things that are **coded/installed but only take full effect after a fresh EAS
dev build** (a JS reload via Metro is NOT enough — these touch native modules or
native config). Batch them so one rebuild covers everything.

**How to rebuild** (see memory `reference_eas_dev_build`):
```
cd apps/mobile
npx eas-cli@latest build --profile development --platform android --non-interactive --no-wait
```
Then install the new APK from the printed build URL, and restart Metro with:
```
& ".\node_modules\.bin\expo.cmd" start --dev-client --clear
```

---

## Pending items (do all in the next rebuild)

### 1. `expo-blur` — the Log "+" menu + SOS blur  ✅ DONE (no rebuild needed)
- **History:** `expo-blur` added in `616e116`; native module ships in every build
  since (June 23 APK `f71c0b3` onward).
- **Two bugs found 2026-06-23, both fixed:**
  1. **Android needs `experimentalBlurMethod`.** `expo-blur` renders NOTHING on
     Android with the default method (`'none'`) — only `'dimezisBlurView'` actually
     blurs. `components/ui/BlurBackdrop.tsx` now sets it per-platform.
  2. **A modal route can't blur the screen behind it on Android.** The "+" picker
     used to be a `transparentModal` route, which wipes the screen underneath →
     nothing to blur (flat grey). Fixed by making the picker an **in-tree overlay**
     (`components/log/LogSheetOverlay.tsx`) rendered as a sibling of the live screen
     content, toggled via `hooks/useLogSheet.tsx`, so BlurView samples real content.
- **Net:** `/(modals)/log` route removed; both "+" buttons (tab bar + settings nav
  bar) call `open()`; SOS popup keeps its own `transparentModal` (its blur was
  always over the dimmed home, which the SOS-1 popup paints itself).
- **Pure JS** — Metro reload picks it up; no rebuild required.

### 2. `expo-splash-screen` — faster/cleaner startup
- **Status:** package installed (`~31.0.13`) and now wired in `app/_layout.tsx`
  (`preventAutoHideAsync` + `hideAsync`). Calls are `.catch()`-guarded so they
  no-op safely if the native module isn't in the running build.
- **After rebuild:** native splash module guaranteed present → the held-splash
  behavior is reliable.
- **DONE (2026-06-24):** `expo-splash-screen` plugin added to `app.json` with the
  brand logo — image `./assets/splash-icon.png` (1024 transparent lungs logo),
  `imageWidth: 200`, `backgroundColor: #FFFFFF` (white, per design choice). Takes
  effect on the next EAS build (native config). Pairs with the launcher icon
  `./assets/icon.png` (1024, logo at 66% on white, Android-mask-safe). Clean
  transparent master kept at `./assets/logo-source.png`.

### 3. DM Sans + Space Grotesk 600 (SemiBold) weights
- **Status:** `DMSans_600SemiBold` + `SpaceGrotesk_600SemiBold` now imported and
  registered in `app/_layout.tsx` `useFonts`, with `font-sans-semibold` /
  `font-display-semibold` tokens in `tailwind.config.js`. Used across the profile
  settings screens (section labels, names, pills, Edit/Call/Delete actions) where
  the design is weight 600 — previously fell back to 700 (too heavy).
- **Why a rebuild:** new font faces are bundled assets; a Metro `--clear` reload
  alone won't register them. Until the rebuild, `font-sans-semibold` falls back to
  a system face (so those elements may look slightly off, not broken).
- **After rebuild:** the 600 faces load → semibold renders at the correct weight.

### 4. Android notification channels
- **Status:** `lib/notificationChannels.ts` creates Milestones / Check-ins /
  Re-engagement channels (brand light colour #7FC200, per-type importance +
  vibration); `ensureNotificationChannels()` runs at launch, and each scheduled
  notification attaches its `channelId`. Titles polished (milestones → "Milestone
  unlocked", check-in → "Daily check-in") so they don't just repeat the app name.
- **After rebuild:** channels register on Android; notifications post to the named
  branded channel instead of the OS default, and users can tune each type in OS
  settings. (No-op on iOS — channels are Android-only.)

---

## Notes
- Pure-JS changes (query defaults, settings row restyle, notification deferral,
  the blur/splash guards themselves, the React Query disk-persistence packages)
  do NOT need a rebuild — a Metro reload picks them up. BUT after the persist
  packages were `yarn add`ed, the next Metro start MUST use `--clear` (the
  `disableHierarchicalLookup` metro config won't resolve the new deps otherwise).
  AsyncStorage (the native dep persistence uses) was already in the build.
- The biggest cold-start cost is the dev-build bundle load itself; "true" startup
  speed should be judged on a `preview`/release build, not the dev build.

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

### 1. `expo-blur` — the Log menu blur
- **Status:** `expo-blur` added to `package.json` in commit `616e116`, used in
  `app/(modals)/log.tsx`, but the native module is NOT in the currently-installed
  APK → caused the "+" log menu to crash.
- **Mitigation already shipped:** the guard in `log.tsx` now checks
  `requireOptionalNativeModule('ExpoBlurView')` and degrades to **dim-only** (no
  blur) when the native side is absent, so it no longer crashes.
- **After rebuild:** the native module will be present → the guard lights up and
  the real blur renders automatically. No further code change needed.

### 2. `expo-splash-screen` — faster/cleaner startup
- **Status:** package installed (`~31.0.13`) and now wired in `app/_layout.tsx`
  (`preventAutoHideAsync` + `hideAsync`). Calls are `.catch()`-guarded so they
  no-op safely if the native module isn't in the running build.
- **After rebuild:** native splash module guaranteed present → the held-splash
  behavior is reliable.
- **STILL TODO at rebuild time (native config — not yet added):** add the splash
  config + plugin to `app.json` so the OS shows the brand splash *instantly on
  icon tap* (removes the blank gap before JS boots). Suggested:
  ```jsonc
  "plugins": [
    // ...existing...
    ["expo-splash-screen", {
      "backgroundColor": "#FBFAF9",
      "image": "./assets/<splash-image>.png",
      "imageWidth": 200
    }]
  ]
  ```
  (Confirm/author the splash asset path in `assets/` before adding.)

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

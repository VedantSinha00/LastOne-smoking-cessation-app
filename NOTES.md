# LastOne — Build Handoff Notes

_Last updated: 2026-06-14. Author: build sessions with Claude._

## TL;DR

**The application is built and works end-to-end.** All 21 steps of the architecture
guide (Phases 0–6) are implemented and device-verified on the Android dev build.
The codebase is the **foundation** — functional screens with real logic, data, and
flows. The **design team's UI** will be layered on top next.

This is **not** intended as a published product. So the "ship" work (App/Play Store
submission, paid developer accounts, push credentials, server Edge Functions) is
**not required** and has been skipped intentionally — see "Deliberately skipped".

## What's done (Phases 0–6)

| Phase | Steps | What |
| --- | --- | --- |
| 0 | 1–4 | Scaffold, Supabase, first run, connection test |
| 1 | 5–6 | DB migrations + RLS (23 tables), Auth (Google OAuth) |
| 2 | 7 | Onboarding flow |
| 3 | 8–11 | App shell + stage, Logging, Streak system, Slip threshold |
| 4 | 12–14 | Progress dashboard, Coping tools, Content cards |
| 5 | 15–16 | Notifications (local), Insights |
| 6 | 17–20 | Personal Goals, Giving Up Support, Mini-Games, Settings & Profile |

All merged to `main` through Phase 5; **Phase 6 is on branch
`feat/phase6-supporting-features`** (pushed, PR not yet opened/merged — you open/merge
PRs yourself).

## Picking back up (design pass)

- **Run the app:** from `apps/mobile`, `& ".\node_modules\.bin\expo.cmd" start --dev-client --clear`
  (the `--clear` matters after pulling new files). Then open the LastOne dev build on the phone.
  Do **not** use `npx expo` (Windows path bug).
- **Typecheck (the only gate — no eslint):** from `apps/mobile`, `node "..\..\node_modules\typescript\bin\tsc" --noEmit`.
- The UI is intentionally plain — it's meant to be replaced by the design team's
  (Lovable) screens. The logic/hooks/data layer underneath is what's load-bearing.

## Dev tools — KEEP THEM (for now)

On the **Home screen**, wrapped in `{__DEV__ && …}` (so they auto-hide in any
production build), there are two dev-only helpers in
`apps/mobile/components/home/DevPanel.tsx` + the home screen:

1. **DevPanel** — the big panel of test toggles, organized by phase:
   - Stage buttons (0/1/2/3/4) — set quit_date + sync streak/freezes
   - Return modal, freeze stock, slip pattern, check-in reset
   - Phase 5: reconcile/dump notifications, pause/resume, notif on/off, tier, seed insight logs, risk window
   - Step 17: causes-card clear/backdate, occasion-in-4d, clear goals
   - Step 18: seed slips / return-to-smoking, clear GU state, clear support person
   - Step 19: seed game streak, arm Stage-4 nudge, clear game data
2. **DEV · Restart onboarding** — re-walks onboarding without re-auth.

**These are needed to drive test states while wiring the new UI.** Leave them in.
They never ship (the `__DEV__` guard strips them from release builds). If you need a
test state that isn't a one-tap button yet, ask and it can be added then.

## Two optional items (only if wanted for a polished demo)

1. **Deploy the `delete_user_account` RPC.** The Delete Account button (Settings →
   Privacy & Account) calls a DB function that is **written but not deployed** to the
   live Supabase. Until deployed, that one button errors. Migration:
   `supabase/migrations/20260614000001_delete_user_account_rpc.sql`. Deploy with
   `npx supabase@latest db push` from the repo root. Everything else in Settings works.
2. **Echo Tap audio.** The mini-game uses vibration + visual pulses, no sound (real
   audio needs `expo-av`, which needs a fresh native build). Add at build-time if
   sound matters for the demo.

Neither is required for "the app is built and works".

## Deliberately skipped (publish-only — not needed for this project)

- App Store / Play Store submission; Apple Developer account; Firebase
- APNs / FCM push credentials → **server-sent** push notifications
  (local notifications already work in-app)
- `generate-insights` Edge Function + pg_cron + log webhook
  (insight generation already runs **client-side** in `lib/insights.ts`)
- `data-export` email job (Settings → Data Export is a UI-only stub: shows a
  confirmation toast, sends nothing)
- Supabase paid plan
- NGO URLs (`lib/causesCard.ts`) + helpline numbers (`lib/givingUp.ts`
  `RESOURCE_CARDS`) — provisional; would need real-world verification before public use

## Key project facts (so nothing surprises you later)

- **DB schema lives only on remote Supabase** (project `uvguxnyfezcdzsdlkqsy`). The
  original 23 tables have no `create table` migrations in the repo; only column-adds +
  seeds + RPCs are migration files. Probe columns with the anon key (RLS hides row
  values). Canonical schema doc: `docs/specs/v1.2 spec docs in markdown/LastOne_Data_Schema_V1.md`.
- **SOS contact (name + phone) is device-only (SecureStore), never on the server** —
  a hard security rule. Same single contact across Settings PROF-09, Giving Up Support,
  and SOS escalation.
- **`parse-product-url` Edge Function IS deployed** (Goals → paste a link). Amazon/Flipkart
  usually return a partial parse (name only, no price/image) — that's expected, not a bug.
- Architecture guide: `docs/specs/foundation/LastOne_Architecture_Guide.md`. Per-feature
  v1.2 specs: `docs/specs/v1.2 spec docs in markdown/`.

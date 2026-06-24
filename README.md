# LastOne — Smoking Cessation Behaviour-Change App

**LastOne** is a behaviour-change mobile app that helps young smokers quit — not by
shaming a broken streak, but through awareness, reflection, and personalised coping
tools. It treats quitting as a psychological and behavioural journey rather than a
counter that resets to zero.

> Built as a product-design and system-architecture exercise by a 3-member team
> (a doctor, a psychologist, and a product manager). This is a functional foundation
> and demo — not a published store product.

---

## The problem

Most cessation apps stop at streak tracking: a number that counts up, then brutally
resets the moment you slip. Research says quitting actually depends on **emotional
regulation, social context, and habit patterns** — the things a raw streak counter
ignores. A single slip becomes a reason to give up entirely.

## The approach

LastOne reframes the whole loop around **non-judgmental relapse handling** and
**personalised support**:

- **Stage-based quitting** — the journey is modelled in stages (0–4), not a binary
  "smoker / non-smoker". The app meets you where you are.
- **Two-layer coping system** — quick **SOS tools** for an active craving, plus a
  deeper **coping-tool library** (breathing, physical, mini-games, reframing) that
  learns which tools actually work for *you*.
- **Freeze-based relapse logic** — a slip doesn't nuke your progress. Freezes and a
  **slip threshold** absorb setbacks so one bad moment isn't the end.
- **Behaviour logging engine** — every craving and cigarette logged feeds a pattern
  model (time of day, trigger, occasion) instead of just a tally.
- **Personalised insights** — the app surfaces *your* patterns and nudges, generated
  from your own logged behaviour.
- **Health timeline & milestones** — concrete, body-based reasons to keep going.
- **Giving-up support** — when someone is on the edge of quitting *the quit*, a
  dedicated support flow (resources, a chosen support person, escalation) steps in.

## Feature set

| Area | What it does |
| --- | --- |
| **Onboarding** | Narrative, question-driven flow that sets quit date, stage, and personalisation |
| **Stage system** | Drives streak, freezes, and the home experience by stage 0–4 |
| **Logging** | Craving + cigarette logging with trigger / occasion / time capture |
| **Streak + slip threshold** | Streak with freeze absorption and a resumable, non-punitive slip/restart flow |
| **Progress dashboard** | Streak, savings, and milestone reference cards |
| **Coping tools** | Breathing, physical, mini-games, and reframing tools; scored on what works for the user |
| **SOS** | One-tap craving rescue, with an optional device-only support contact |
| **Content cards** | Cigarette-milestone-triggered educational cards |
| **Notifications** | Local notifications with quiet hours, tiers, and a quit-aware schedule |
| **Insights** | Client-side personalised insight generation from logged behaviour |
| **Personal goals** | Set goals; paste a product link to attach a reward (`parse-product-url`) |
| **Mini-games** | Distraction-category coping games (memory, echo-tap) with their own streak |
| **Settings & profile** | Quit date, journey, voice, quiet hours, privacy, data export, account deletion |

## My role — Product Manager

- Designed the system architecture
- Defined the feature logic (stages, coping layers, slip/freeze, personalisation)
- Led the UX flow design
- Coordinated with the medical and psychology experts on the team

---

## Tech stack

- **Mobile:** React Native + **Expo** (expo-router), **NativeWind** (Tailwind)
- **State/data:** TanStack Query with on-disk cache persistence
- **Backend:** **Supabase** (Postgres + RLS, Auth via Google OAuth, Edge Functions)
- **Type system:** TypeScript (typecheck is the build gate)
- **Design:** tokens ported from the team's Lovable design system

### Brand at a glance

- **Primary:** lime green `#7FC200` (glow `#9CD242`) — life, growth, the "go" of progress
- **Accent / craving:** warm orange `#F15025 → #FF7A3D` — the heat of a craving, an SOS surface
- **Surface:** warm off-white `#FBFAF9` background, white cards, near-black `#15110D` text
- **Type:** Space Grotesk (display), DM Sans (body), Playfair Display (tool titles)
- **Shape language:** soft, generous corners (20px base radius)

## Running it

From `apps/mobile` (Android dev build):

```bash
& ".\node_modules\.bin\expo.cmd" start --dev-client --clear
```

Typecheck (the only gate — no eslint), from `apps/mobile`:

```bash
node "..\..\node_modules\typescript\bin\tsc" --noEmit
```

> On Windows, use the `expo.cmd` path above — **not** `npx expo` (path bug).

## Repo layout

```
apps/mobile/         Expo app (app/, components/, hooks/, lib/, types/)
supabase/            Edge Functions + migrations (column-adds, seeds, RPCs)
docs/                Architecture guide + per-feature v1.2 specs + decision logs
lovable-design-reference/   The team's design system (visual reference)
NOTES.md             Build handoff notes (what's done, what's deliberately skipped)
```

## Status

All 21 steps of the architecture guide (Phases 0–6) are implemented and
device-verified on the Android dev build. Store submission, server-sent push, and
other publish-only work are **deliberately skipped** — this is a demo foundation.
See [NOTES.md](NOTES.md) for the full handoff.

## Docs

- Architecture guide: `docs/specs/foundation/LastOne_Architecture_Guide.md`
- Per-feature specs: `docs/specs/v1.2 spec docs in markdown/`

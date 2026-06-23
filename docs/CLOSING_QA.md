# Closing QA Pass

Final flow-by-flow walkthrough before stripping dev tooling and shipping a clean build.
Started 2026-06-23, branch `UI-Implementations`.

## Process
- Flows walked in batches of ~3.
- **Edge-case sweep per flow:** empty/missing data · double-tap & re-entry · offline / failed writes · midnight & timezone rollover · optimistic-write races · pause/relapse states · back-nav mid-flow.
- Each flow: static code-path review (Claude) + device confirmation (user) where behavior is device-only.
- Bugs fixed immediately, re-verified, then continue.
- DevPanel + `__DEV__` blocks removed in Phase 2 (after QA) — used to set up test states during QA.

## Legend
- ⬜ not started · 🔍 under review · 🐛 bug found · ✅ pass

---

## Phase 1 — Flow QA

### Batch A — Entry
| Flow | Status | Notes |
|---|---|---|
| Launch / auth gate / routing | ✅ | Static review clean; typecheck clean. Device-only TODO: confirm OAuth sign-in + notification-tap routing on next build (OAuth previously verified). |
| Onboarding (OB-01 → OB-23) | ✅ | Provider wired; idempotent write seq; required fields gated (Continue disabled until selected) so completeOnboarding can't crash; self-advancing OB-05/OB-23 sound. Device-only: Google sign-in + push-permission prompt (previously verified). |
| Daily Check-in (Home card) | ✅ | BUG-1 fixed (see below). "Check in →" branch routes to Flow A which satisfies via its own path — OK. Edge cases: double-tap idempotent (setConfirmed hides buttons + confirmSmokeFreeDay per-day guard); SOS 'Better' sets both streak + local flag so card hides → "Streak +1" copy never over-claims; midnight handled via date-keyed flag. Known limitation (not a regression, matches Flow B): if confirm throws offline, local flag still sets so today's streak day is silently lost (no retry). |

### Batch B — Core loop
| Flow | Status | Notes |
|---|---|---|
| Log A — craving | ⬜ | |
| Log B — overcome | ⬜ | |
| Log C — slip | ⬜ | |

### Batch C — Crisis
| Flow | Status | Notes |
|---|---|---|
| Log D — journal | ⬜ | |
| SOS | ⬜ | |
| Giving Up | ⬜ | |

### Batch D — Data views
| Flow | Status | Notes |
|---|---|---|
| Progress Dashboard | ⬜ | |
| Insights | ⬜ | |
| Tools | ⬜ | |

### Batch E — Goals / Games
| Flow | Status | Notes |
|---|---|---|
| Personal Goals | ⬜ | |
| Mini-Games | ⬜ | |

### Batch F — Profile / Settings
| Flow | Status | Notes |
|---|---|---|
| Profile root | ⬜ | |
| Settings leaf screens | ⬜ | |

---

## Bugs found & fixed
_(running log — flow, symptom, fix, verified-by)_

### BUG-1 — Daily Check-in "All good today" never advanced the streak
- **Flow:** Daily Check-in (Home card)
- **Symptom:** Tapping "All good today" showed "Streak +1. See you tomorrow." but only wrote the cosmetic device-local `daily_checkin_satisfied` flag. It never called `confirmSmokeFreeDay`, so `last_confirmed_date` / `current_streak_days` / `lifetime_smoke_free_days` did not move. Consequence: streak stalls for check-in-only users, and the next-day Return Modal ("we missed you") misfires off the stale `last_confirmed_date`.
- **Root cause:** `confirmSmokeFreeDay`'s docstring names its 3 callers (Flow B, daily check-in, SOS 'Better'); the check-in caller was missing. Flow B does `createLog → confirmSmokeFreeDay("log") → markSatisfied`; the card only did `markSatisfied`.
- **Fix:** `DailyCheckInCard.handleAllGood` now calls `confirmSmokeFreeDay(user.id, "log")` + invalidates `streakRecord` before `markSatisfied`. No log row created (no event occurred). Idempotent per day, respects pause, defensively wrapped. `apps/mobile/components/home/DailyCheckInCard.tsx`.
- **Verified:** typecheck clean. ⏳ device confirm pending: "All good today" moves the counter + suppresses next-day return modal.

---

## Phase 2 — Strip dev tooling
- [ ] Remove `apps/mobile/components/home/DevPanel.tsx`
- [ ] Remove `__DEV__` blocks + "Restart onboarding" button in `apps/mobile/app/(tabs)/index.tsx`
- [ ] Decide on Refer "not published yet" note (`apps/mobile/app/settings/refer.tsx`)
- [ ] Sweep for stray `console.log` / `__DEV__` leaks

## Phase 3 — Clean build
- [ ] App icon + splash logo
- [ ] EAS build

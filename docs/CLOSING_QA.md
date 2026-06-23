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
| Log A — craving | ✅ | commitA1 re-entry-guarded by logIdRef (no dup); Next disabled while pending; back A2→A1 safe; X on A1 leaves nothing logged (correct). |
| Log B — overcome | ✅ | optimistic commit fires once (committedRef); fast Done awaits commitPromise; offline → silent loss (known optimistic-design limitation, consistent w/ check-in). |
| Log C — slip | ✅ | BUG-2 + BUG-3 fixed (see below). Pre-quit skips side-effects; return_to_smoking→fullRelapse; route vs slipType render precedence correct. |

### Batch C — Crisis
| Flow | Status | Notes |
|---|---|---|
| Log D — journal | ✅ | Save disabled until text non-empty + while pending (no dup); mood optional; `from` param routes exit correctly (journal / settings-journal / home). |
| SOS | ✅ | All SOS-3 outcome handlers guarded by `processing`; `same` re-enables + returns to SOS1; `smoked`→slip (no SOS confirm to reverse); escalation 24h window expiry on read; tool-score/outcome writes best-effort (never block flow); `selectTool` re-entry creates a fresh sos log per attempt (correct). No bugs. |
| Giving Up | ✅ | evaluateGuTrigger gate ordering + condition precedence correct; resistance null-skips GU-3 (never shows 0); progress patches fire-and-forget; mid-flow exit leaves `dismissed_mid_flow` (spec-correct); registerShown/begin dismissal-count interaction nets to "max 3 no-tap sessions". useSupportPerson `configured`/`person` derive from one source (can't disagree). Defensive precall→resources fall-through if `person` goes null mid-flow — degrades gracefully, not a bug. No fixes. |

### Batch D — Data views
| Flow | Status | Notes |
|---|---|---|
| Progress Dashboard | ✅ | Read-only; memoized savings recalc via cache invalidation. savings.ts: paise integers (no float drift), smoke-free-days & cigarettes-smoked share the SAME attempt-window filter (deductions can't disagree), "5+"→5, all counters floor at 0, zero-states avoid "0 orders". Empty cpd/price → "set your scale" prompt. No bugs. |
| Insights | ✅ | Read-only derivation; resistanceRate null (not NaN) at 0 denominator; journal filters empty notes; feed-order snapshot holds while a card is read (by design). Micro-issue: expandCard could double-count engagement +2 on rapid double-tap — analytics-only, self-correcting, not fixed. No user-facing bugs. |
| Tools | ✅ | Library tool run calls ONLY updateToolScore — does NOT recordSosOutcome / getSosEscalation / confirmSmokeFreeDay / markSatisfied. Library use ≠ SOS use ≠ streak confirm, exactly per spec. No bugs. |

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

### BUG-2 — Flow C slip: retry after mid-sequence failure created a duplicate slip + double side-effects
- **Flow:** Log C (slip)
- **Symptom:** In `commitC2`, if `createLog` succeeded but a later step (`markSatisfied`/`routeAfterSlip`/`fullRelapse`) threw (network blip), the catch reset `committing` and left the user on C2. Tapping Continue again called `createLog` a 2nd time → **duplicate slip row**, and re-ran the freeze/break side-effects → **double freeze decrement or double red-flag count** (data corruption — `routeAfterSlip`'s consumeFreeze/breakStreak are not idempotent).
- **Fix:** `commitC2` is now resumable — reuses `logIdRef` if a row already exists (skips the duplicate insert) and gates side-effects behind a new `sideEffectsDoneRef` so they apply at most once across retries. `apps/mobile/app/(modals)/log-c.tsx`.
- **Verified:** typecheck clean.

### BUG-3 — Flow C restart nudge: double-tap fired restart/pause twice
- **Flow:** Log C (slip) → C3 restart nudge
- **Symptom:** `handleRestart`/`handleBreak` awaited a DB write before `exitToHome` with no in-flight guard. A double-tap fired `restartAttempt` twice, leaving a stray extra closed `quit_attempts` row (untidy; "one open attempt" invariant held but data was messy).
- **Fix:** added a `resolvingNudge` ref guard, matching the `committing`/`processing`/`isPending` pattern used elsewhere. `apps/mobile/app/(modals)/log-c.tsx`.
- **Verified:** typecheck clean.

---

## Phase 2 — Strip dev tooling
- [ ] Remove `apps/mobile/components/home/DevPanel.tsx`
- [ ] Remove `__DEV__` blocks + "Restart onboarding" button in `apps/mobile/app/(tabs)/index.tsx`
- [ ] Decide on Refer "not published yet" note (`apps/mobile/app/settings/refer.tsx`)
- [ ] Sweep for stray `console.log` / `__DEV__` leaks

## Phase 3 — Clean build
- [ ] App icon + splash logo
- [ ] EAS build

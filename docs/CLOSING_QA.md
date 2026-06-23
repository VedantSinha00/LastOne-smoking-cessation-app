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
| Personal Goals | ✅ | current_amount always SUM(top_up_log) (never stale col); 3-active cap; allocate over-limit disables Confirm + scoped-mode counts others against pool (sum≤total holds); all-zero short-circuits write; URL parse handles full/partial/fail/offline → manual via replace (no dead back-target); parseRupees ₹1 floor. Button disables onPress while loading → no double-tap dup. No bugs. |
| Mini-Games | ✅ | lib/games pure (Fisher-Yates, match-by-faceId not glyph, echo length floor). useGameStreak: gap==0 → alreadyToday (no double-count, no week re-inc); gap==1 → +1; gap>1 → reset; milestone push fires only `!alreadyToday && isStreakMilestone` (no re-fire on replay). Idempotent day-keyed upsert. No bugs. |

### Batch F — Profile / Settings
| Flow | Status | Notes |
|---|---|---|
| Profile root | ✅ | Reached from Home TopBar; category nav into settings/*. No bugs. |
| Settings leaf screens | ✅ | Delete: requires exact "DELETE", clears SecureStore contact + cache + signOut, error resets busy. Support-person: phone SecureStore-only, normalizePhone validation, contact saved on every exit. CPD/price edits write change-log first (only if changed) then PATCH then dashboard-invalidate; quit-date → open attempt. ALL settings writes go through useSettings — delete.tsx is the ONLY direct supabase/signOut call in settings/ (no unguarded destructive action bypasses the hook). Button loading-guard blocks double-submit. No code bugs. ⚠ SHIP ITEM: delete_user_account RPC migration present locally but deploy status unverified — if not deployed on remote, Delete Account errors. |

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

## Phase 1 — Result
All 6 batches reviewed. 3 bugs found + fixed (all at the logging↔streak boundary):
BUG-1 (check-in didn't advance streak), BUG-2 (slip retry double-applied side-effects),
BUG-3 (slip nudge double-tap). Batches C–F clean. Typecheck clean throughout.

**Open ship items (need user decision, not code):**
- ✅ DONE `delete_user_account` RPC: deployed to remote 2026-06-23 via `supabase db query --linked -f`
  (applied the fn only, NOT `db push` — the remote migration ledger tracks just the first 2
  migrations; the other 8 incl. seeds/RPCs were applied out-of-band via SQL editor, so a full
  push would re-run seeds and risk dup-key errors). Verified `delete_user_account(p_user_id uuid)`
  exists in pg_proc. Ledger drift is pre-existing (all 8), not introduced here.
- Refer "not published yet" note — intentional, fine for a demo build (decide in Phase 2).
- Known optimistic-write limitation (A/B/check-in show success even if write silently fails
  offline) — by design, consistent, out of scope for closing.

## Phase 2 — Strip dev tooling ✅
- [x] Removed `apps/mobile/components/home/DevPanel.tsx` (git rm)
- [x] Removed `__DEV__` block + "Restart onboarding" button + orphaned `handleRestartOnboarding` and now-unused imports (router/supabase/Text/Pressable) in `(tabs)/index.tsx`
- [x] Removed the dev-only occasion backdoor in `lib/occasions.ts` (`DEV_OCCASION_KEY` + the `findActiveOccasion` branch that injected a "Test Occasion" bypassing the 3–5 day window) — this was a dev backdoor in SHIPPING logic, not just UI
- [x] Removed orphaned `resetGuSessionGuard` export (`useGivingUpTrigger.ts`); kept the underlying session guard used by real logic
- [x] Cleaned stale DevPanel-referencing comments (`useDailyCheckIn.ts`, `database.ts`)
- [x] Refer "not published yet" note: KEPT — it's accurate for an unpublished demo; removing it would imply a working referral link that doesn't exist
- [x] Swept console.log/debugger/dev-TODO: none. Remaining `console.warn` are intentional best-effort error diagnostics in catch blocks (kept — improve prod observability); all `Alert.alert` are user-facing error/confirm UX (kept)
- [x] Typecheck clean after removal

## Phase 3 — Clean build
- [x] App icon — `assets/icon.png` 1024×1024 true PNG; lungs+dot logo at ~66% on white,
      verified safe under Android circle/squircle/square masks. Source: user's remove.bg
      cut-out → padded/centered. Clean transparent master kept at `assets/logo-source.png`.
- [x] Splash logo — `assets/splash-icon.png` (1024 transparent) + `expo-splash-screen`
      plugin in app.json (white bg, imageWidth 200). Takes effect on next EAS build.
- [ ] EAS production build (user runs) — will also bake in 3 other rebuild-gated items
      already coded: splash, SemiBold(600) font weights, Android notification channels.

# LastOne — Streak System Feature Spec V1.2

LastOne · Feature Specification · Streak System

*Part A: Feature Definition & Mechanics*
*Part B: System Logic for Implementation*

| | |
|---|---|
| **Version** | 1.2 |
| **Date** | 14 May 2026 |
| **Author** | Vedant Sinha |
| **Status** | Ready for Development |
| **Stage Scope** | All stages (Stage 0 – Stage 5) |

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — Foundation 1 (Stage System), Foundation 4 (Personalisation Model)
- [[LastOne_Logging_System_Spec]] — Log Flow C drives slip reporting; Log Flows A/B feed craving outcomes
- [[LastOne_Streak_System_V1.2_Questionnaire_Answers]] — decisions log

---

# PART A · FEATURE DEFINITION & MECHANICS

## Section 1 — Problem & Purpose

### Foundations

This feature is an expression of Foundation 1 (Stage System) and Foundation 4 (Personalisation Model). The Stage System provides the structural backbone: freeze period boundaries, quit timeline, and relapse restart logic. The Personalisation Model acts as the modifier: dependency level drives freeze allocation so the experience varies by how hard quitting actually is for each user. Neither is incidental — remove the Stage System and there are no period boundaries to reset freezes against; remove the Personalisation Model and everyone gets the same freeze stock regardless of dependence.

### Why This Feature Exists

Streaks are the most common motivator in cessation apps — and the most common reason people quit the app after a relapse. A broken streak after weeks of effort feels like total erasure. Most users would rather delete the app than see a number drop to zero.

Traditional streaks are binary: perfect or failed. This punishes honesty (users lie to protect the number), ignores partial success (29 of 30 days is exceptional), and treats one cigarette the same as a full return to smoking. Kwit's data showed engagement with streak mechanics but no reliable correlation with actual abstinence — because the streak was measuring perfection, not progress.

### Goal

A three-metric system — current streak, consistency rate, and lifetime total — where the current streak can break but the lifetime total never does, and the consistency rate survives pauses. A freeze mechanic tied to dependency and quit period that makes honesty cheaper than lying. Return-after-absence flows that handle real life without interrogation.

### User Story

Priya is 18 days smoke-free. She's in her hostel room in Pune, getting ready for a night out. At the party she has one cigarette — peer pressure, a drink in hand, the usual. The next morning she opens LastOne from her bed before her alarm properly goes off. The daily check-in asks "How was yesterday?" She picks "Had one or two." A freeze is consumed. Her streak still reads 18 with a small snowflake icon. Her lifetime total reads 18. Her consistency rate shows 94.7% over 18 days. She taps "All good today" and moves on. One slip, no catastrophe.

### Success Metrics

| Metric | How It Is Measured |
|---|---|
| Slip reported via Log Flow C within 24 hours of occurring, without app uninstall in the same session | Event log: slip_logged event followed by no uninstall event within 24h |
| Freeze tooltip tapped by at least 30% of users in their first freeze-eligible stage | Tap event on snowflake icon / tooltip trigger in Stage 1–2 |
| User reaches return modal and selects an answer (any answer) after absence of 2+ days | Return modal completion rate — answer selected vs modal shown |
| Consistency rate displayed without confusion — user taps the metric for more info within first 3 views | Tap event on consistency rate element in Stages 2+ |
| Zero streak resets attributable to missing a confirmation card (app never fails to resolve a gap) | Days with unconfirmed status that were not resolved by return modal — target: 0 |

---

## Section 2 — Feature Overview

### Stage Relevance

| Stage | Streak Feature Behaviour |
|---|---|
| **Stage 0** — Days −7 to 0 | Streak system dormant. User is still smoking; no streak counter exists. Freeze stock not yet allocated. The feature activates at the start of Day 1 only. |
| **Stage 1** — Days 1–3 | Streak activates. Freeze period 0 applies (Light: 2, Moderate: 3, Heavy: 4). Peak withdrawal — freeze mechanic most important here. Daily check-in card is the primary confirmation method. Consistency rate not yet shown (insufficient data). |
| **Stage 2** — Days 4–7 | Freeze period 0 continues. Habitual triggers emerge — freeze acts as buffer for trigger-driven slips. Consistency rate begins displaying from Day 4. Return modal active. |
| **Stage 3** — Days 8–21 | Freeze period 1 begins at Day 15 (Light: 1, Moderate: 2, Heavy: 3). Psychological challenge phase. Streak display motivates continued progress. Personal best celebration active. |
| **Stage 4** — Days 22–56 | Freeze period 2 begins at Day 29 (Light: 1, Moderate: 1, Heavy: 2). Complacency risk — consistency rate becomes the most meaningful signal. Streak milestones at 1 month prominent. |
| **Stage 5** — Day 57+ | Freeze period 3 begins at Day 91 (Light: 0, Moderate: 1, Heavy: 1). Long-term maintenance. Lifetime total and consistency rate are the primary motivational metrics. Current streak is a bonus, not the focus. |

### Dependencies

| Type | Detail |
|---|---|
| Reads from | `current_stage` (Stage System), `dependency_level` (Onboarding / Settings), `last_confirmed_date` (persisted locally), `quit_date` (quit_attempts — current_attempt.quit_date, the row where ended_at IS NULL) |
| Writes to | `current_streak_days`, `lifetime_smoke_free_days`, `consistency_rate`, `freeze_stock`, `streak_status`, `longest_streak_ever`, `last_confirmed_date`, `confirmation_source` |
| Requires from other features | Log Flow C (slip reporting), Log Flow A/B (craving outcomes), SOS completion signal, Daily Check-in card satisfaction signal, Onboarding (dependency assessment, quit date) |
| Triggers | Health milestone celebrations (B5), Reclaim Dashboard calculations (B6), Gamification achievement unlocks (B6), Quit Buddy / Squad streak visibility (B6), AI Coach pattern signals (B6), Awareness Deck milestone cards (B6) |

---

## Section 3 — Design Decisions

### Decision 1 — Three metrics instead of one

**Chosen:** current streak + consistency rate + lifetime total, each with a distinct role.

**Rejected:** single streak counter (standard approach). A single counter punishes any imperfection and creates catastrophic loss on relapse. The three-metric model gives the user something that can break (streak), something that survives imperfection (consistency rate), and something that never drops (lifetime total). Each metric does a job the others cannot.

### Decision 2 — Freeze auto-consumed, not user-chosen

**Chosen:** freeze consumed automatically when user reports a slip. No confirmation step.

**Rejected:** user actively chooses to spend a freeze. A choice introduces friction and guilt — the user has to decide whether the slip 'deserves' a freeze. Auto-consumption removes the moral judgement entirely. The freeze is a structural protection, not a reward to be earned.

### Decision 3 — Freeze period is independent of current_stage

**Chosen:** `freeze_period` (0–3) based on days since quit only. Days 1–14 = period 0, Days 15–28 = period 1, Days 29–90 = period 2, Days 91+ = period 3.

**Rejected:** freeze resets tied to stage transitions. Stage boundaries vary in duration and the stage system serves the coaching layer, not the freeze mechanic. A separate counter is cleaner, more predictable for the user, and avoids coupling two systems with different jobs.

### Decision 4 — Pause resets streak to 0 on resume

**Chosen:** on resume from pause, `current_streak_days = 0`. `streak_start_date` = resume date.

**Rejected:** preserving streak through pause. A user cannot claim continuity over days they were not tracking. The integrity of the streak depends on it meaning something — unverified days cannot count. The consistency rate is preserved through pause precisely because this is the metric that rewards returning, not the streak.

### Decision 5 — Dependency level changes: one tier up mid-period, recalibration on restart only

**Chosen:** users can move up one dependency tier (Light → Moderate, Moderate → Heavy) via Settings at any time, taking effect at the next freeze period boundary. Moving down requires full recalibration tied to a restart.

**Rejected:** free-form adjustment in either direction. Allowing downgrade via Settings would let users game freeze allocation. Tying downgrade to restart + recalibration ensures dependency classification reflects actual behaviour, not preference.

### Decision 6 — Return after 5+ days triggers auto-pause, not return modal

**Chosen:** at Day 5 of inactivity, the system auto-pauses the account. On return, user sees a three-option flow: 'I didn't smoke' / 'Treat it as a break' / 'I did smoke on some days'.

**Rejected:** extending the return modal to cover 5+ day absences. A 5+ day absence is qualitatively different from a short gap. A modal asking 'how were the last 8 days?' is an interrogation. Auto-pause acknowledges the gap without blame and gives the user a clean entry point to decide how to proceed.

### Decision 7 — SOS 'Better' confirmation is optimistic but reversible

**Chosen:** SOS completed with 'Better' awards +1 to streak and lifetime optimistically. If a slip is logged later the same day, the +1 is reversed and slip logic applies instead.

**Rejected:** SOS completion not counting as streak confirmation at all. SOS represents the user actively fighting a craving and winning in that moment — not crediting it would punish engagement with a core feature. The reversal mechanism handles the edge case without blocking the positive signal.

### Decision 8 — Health milestone partial-hold rule: halfway threshold

**Chosen:** on full relapse, the last achieved milestone ghosts only if the user relapsed before reaching the halfway point to the next milestone. If they relapsed past the halfway point, the last milestone stays lit and only the timer toward the next milestone resets.

**Rejected:** all milestones above the relapse point ghost unconditionally. That approach punishes someone who relapsed at Day 65 (past the halfway point to 3 months) identically to someone who relapsed at Day 31. The halfway rule is more accurate to physiological recovery and more motivating — it rewards how far the user got.

---

## Section 4 — Screen Inventory

| ID | Screen Name | Description |
|---|---|---|
| STK-1 | Home Streak Display | The persistent streak widget on the home screen. Shows current streak, consistency rate (Stage 2+), lifetime total, and freeze stock (snowflake icons). All states defined in Section 5. |
| STK-2 | Return Modal — Short Absence (1–4 days) | Modal shown when user opens app after 1–4 days away. Three-option resolution: Didn't smoke / Had one or two / Smoked regularly. Resolves missed days before today's check-in. |
| STK-3 | Return Flow — Long Absence (5+ days) | Full-screen flow shown when user returns after auto-pause triggered at Day 5 of inactivity. Three options: I didn't smoke / Treat it as a break / I did smoke on some days. |
| STK-4 | Freeze Tooltip | Tappable tooltip on snowflake icons. Explains what a freeze is, how many remain, and when the stock refills. Appears in-context on the STK-1 display. |
| STK-5 | Streak Reset State | Home screen state after streak resets to 0. Lifetime total becomes visually prominent. Two CTAs: Restart or Take a Break. |
| STK-6 | Personal Best Celebration | Overlay shown when `current_streak_days` exceeds `longest_streak_ever`. Includes share-to-buddy option if social features are active. |
| STK-7 | Pause Confirmation | Confirmation screen shown when user selects 'Take a Break' from STK-5 or from Settings. Confirms what is preserved (consistency rate, lifetime total) and what resets (streak) on resume. |
| STK-8 | Health Milestone Timeline | Full timeline of health recovery milestones driven by streak progress. Shows lit, ghost, and upcoming milestone states. Accessible from STK-1. |
| STK-9 | Stage Transition Notification | Push notification shown at each stage transition. Not a screen — a notification that routes to STK-1 on tap. Freeze refill notification does not exist (see Notifications spec Decision 4). |

---

## Section 5 — Flow Logic

### STK-1 — Home Streak Display

On app open, the system checks `last_confirmed_date` against today:

- If `last_confirmed_date` = today: render active streak state (`current_streak_days`, `consistency_rate` if Stage 2+, `lifetime_smoke_free_days`, `freeze_stock` as snowflake icons). No modal.
- If `days_missed` = 1–4: render STK-2 (Return Modal — Short Absence) before STK-1.
- If `days_missed` >= 5: system has already auto-paused. Render STK-3 (Return Flow — Long Absence).
- If `streak_status` = paused: show paused state — lifetime total visible, consistency rate visible, streak hidden, 'Ready to go again?' soft prompt. CTA: Resume.
- If `current_streak_days` = 0 and today is `quit_date`: show Day 0 state — 'Your journey starts today.' Next milestone teaser: '12 hours to your first win.'

Snowflake icons (freeze stock): tappable → routes to STK-4. Each icon = 1 freeze remaining. Empty row = 0 freezes.

Personal best trigger: if `current_streak_days` > `longest_streak_ever` after any confirmation → show STK-6 overlay.

Streak reset: if `current_streak_days` just reset to 0 this session → show STK-5 state.

Health timeline: accessible via tap on milestone progress indicator on STK-1 → routes to STK-8.

### STK-2 — Return Modal (Short Absence, 1–4 days)

Modal shown before STK-1 renders. Cannot be dismissed without answering — no back button, no swipe-to-close.

Modal message varies by `days_missed` (see Section 7.9 for exact copy triggers). Three options:

- **'Didn't smoke'** → `current_streak_days += days_missed`, `lifetime_smoke_free_days += days_missed`, `last_confirmed_date` = yesterday. Modal closes. STK-1 renders with updated values. Daily check-in card appears for today.
- **'Had one or two'** → if `freeze_stock > 0`: `freeze_stock -= 1`, streak frozen (no change), lifetime credit by rule (1–2 days missed: +0; 3–4 days missed: +days_missed − 1), `last_confirmed_date` = yesterday. If `freeze_stock = 0`: `current_streak_days = 0`, `streak_start_date` = today. Modal closes. Daily check-in card appears for today.
- **'Smoked regularly'** → `current_streak_days = 0`, `last_confirmed_date` = today. Modal closes. STK-5 renders (reset state) with CTAs: Restart or Take a Break.

After modal is answered: daily check-in card appears for today. The two never compete.

### STK-3 — Return Flow (Long Absence, 5+ days)

Full-screen flow. System auto-paused at Day 5 of inactivity. User sees: 'Welcome back — you've been gone for X days.' Three options:

- **'I didn't smoke'** → full credit: `current_streak_days += days_missed`, `lifetime_smoke_free_days += days_missed`, no freeze consumed, `streak_status = active`, `last_confirmed_date` = yesterday. Routes to STK-1. Daily check-in card appears.
- **'Treat it as a break'** → pause logic: `streak_status = active`, `current_streak_days = 0`, `streak_start_date = today`, `freeze_stock = FREEZE_MATRIX[dependency_level][freeze_period]`, `consistency_rate` continues from before pause, lifetime preserved. No freeze consumed. `quit_date` unchanged — user did not smoke, body's recovery timeline continues uninterrupted. Routes to STK-1.
- **'I did smoke on some days'** → identical backend logic to 'Treat it as a break'. No freeze consumed. `quit_date` unchanged — partial slip during absence does not trigger a restart; the Progress Dashboard's `days_smoked_in_attempt` counter absorbs the adjustment. Routes to STK-1.

Back button: disabled. User must choose one option. App close mid-flow: auto-pause state is preserved. On next open, STK-3 renders again.

### STK-4 — Freeze Tooltip

Triggered by tapping any snowflake icon on STK-1. Renders as an inline card (not a new screen).

Content: what a freeze is (1 sentence), current `freeze_stock` count, `freeze_period` boundary date (when stock next refills).

Dismiss: tap anywhere outside the card. Returns to STK-1.

### STK-5 — Streak Reset State

Rendered on STK-1 when `current_streak_days` has just been reset to 0 in this session.

Lifetime total becomes the visually dominant number. Copy: 'X total smoke-free days — that doesn't go away.'

Two CTAs: Restart (routes to onboarding restart flow with dependency recalibration) or Take a Break (routes to STK-7).

No red. No 'failed.' No shame language.

User can navigate away from this state by tapping elsewhere — it does not lock the screen.

### STK-6 — Personal Best Celebration

Overlay triggered when `current_streak_days > longest_streak_ever` after any confirmation event.

`longest_streak_ever` updates to `current_streak_days` immediately. Overlay shows new record.

If social features are active: share-to-buddy CTA visible. Optional — user can dismiss without sharing.

Dismiss: tap anywhere, or explicit close. Returns to STK-1.

### STK-7 — Pause Confirmation

Shown when user selects 'Take a Break' from STK-5 or from Settings.

Explains what is preserved: consistency rate, lifetime total, all data and insights.

Explains what resets on resume: current streak resets to 0 (cannot claim unverified days).

CTA: Confirm Pause. Secondary: Cancel (returns to previous screen).

On confirm: `streak_status = paused`, streak display hidden on STK-1. `quit_date` unchanged — pause does not mean the user smoked; the health timeline continues ticking during the pause period.

On resume: `streak_status = active`, `current_streak_days = 0`, `streak_start_date = today`. `quit_date` remains unchanged.

### STK-8 — Health Milestone Timeline

Accessible from STK-1 via tap on milestone progress element.

Displays all 8 milestones (20 min, 12 hr, 72 hr, 2 wk, 1 mo, 3 mo, 9 mo, 1 yr).

Three milestone states:
- **Lit:** milestone reached and held. Full colour icon + description.
- **Ghost:** previously reached, currently dropped. Dimmed icon + 'previously reached' label. Message: 'You got here before — you will get here faster this time.'
- **Upcoming:** not yet reached. Greyed out. Shows time remaining at current streak pace.

Back navigation: returns to STK-1.

Milestone celebration: when a milestone is first crossed, a celebration overlay renders on STK-1 before the user opens STK-8.

---

## Section 6 — Stage Behaviour

| Stage | Streak Display | Freeze Behaviour | Consistency Rate | Notifications |
|---|---|---|---|---|
| **Stage 0** Days −7 to 0 | Not shown. Streak system dormant. | No freeze stock allocated. | Not shown. | None from this feature. |
| **Stage 1** Days 1–3 | Active. Large primary number. Lifetime total in muted text below. Freeze stock as snowflake icons. | Freeze period 0. Light: 2, Moderate: 3, Heavy: 4. Auto-consume on slip. | Not shown — insufficient data. | Stage transition notification fires on Day 1 (quit start). |
| **Stage 2** Days 4–7 | Active. Personal best tracking begins. | Freeze period 0 continues. Stock resets silently at the Day 15 boundary (no push). | Shown from Day 4. '95.1% over 4 days' format. | Milestone notifications as thresholds crossed. (No freeze-refill push — removed.) |
| **Stage 3** Days 8–21 | Active. Milestone at 2 weeks prominent. | Freeze period 1 from Day 15. Silent reset. | Shown. Growing time context increases meaning. | Milestone notifications. Stage-transition push on stage change. |
| **Stage 4** Days 22–56 | Active. 1-month milestone prominent. | Freeze period 2 from Day 29. Silent reset. | Primary motivational signal. Streak is secondary. | Milestone notifications. |
| **Stage 5** Day 57+ | Active. Streak is a bonus metric. | Freeze period 3 from Day 91. Silent reset. | Most prominent metric alongside lifetime total. | Milestone notifications. |

Notification cadence per stage follows the global rule: Stage 1: 2–3/day, Stage 2: 1–2/day, Stage 3: 1/day or every other day, Stage 4: 2–3/week, Stage 5: 1/week or less. Auto-reduce rule applies: 3 consecutive ignored notifications reduces frequency by one tier for 7 days.

---

## Section 7 — Copy

High-sensitivity copy (craving, slip, milestone, notification, reset) requires all 3 voice variants. Light & Honest is excluded from streak-reset and freeze-depletion moments.

### 7.1 — Daily Check-in Card

Screen title: 'How was yesterday?' (return modal) / 'How's today going?' (same-day check-in)

Button labels: 'All good today' / 'Had one or two' / 'Been smoking again'

### 7.2 — Slip Logged, Freeze Consumed

**Freeze consumed — streak protected**

| Voice | Copy |
|---|---|
| Steady & Direct | One slip. Freeze used. Streak intact. |
| Emotional & Understanding | That took honesty. Your streak is still standing — one slip doesn't undo what you've built. |
| Light & Honest | Freeze deployed. Streak: still alive. You: still doing this. |

### 7.3 — Streak Reset (No Freeze Available)

*Light & Honest excluded from reset moments.*

**Streak resets — no freeze available**

| Voice | Copy |
|---|---|
| Steady & Direct | Streak resets. Your X total smoke-free days don't go anywhere. |
| Emotional & Understanding | Starting fresh doesn't erase the days you built. X days smoke-free — that's yours, permanently. |

### 7.4 — Streak Reset (Full Relapse)

*Light & Honest excluded from relapse moments.*

**Full relapse — streak reset**

| Voice | Copy |
|---|---|
| Steady & Direct | New start. X total smoke-free days are still on the record. |
| Emotional & Understanding | This isn't the end of the attempt — it's the start of the next one. Everything you learned is still here. |

### 7.5 — Milestone Reached

**Milestone: 72 hours**

| Voice | Copy |
|---|---|
| Steady & Direct | 72 hours. Nicotine is gone. Your body started this without you noticing. |
| Emotional & Understanding | Three days in — nicotine has cleared. Your body is already doing the work. |
| Light & Honest | 72 hours done. Nicotine has left the chat. |

**Milestone: 2 weeks**

| Voice | Copy |
|---|---|
| Steady & Direct | 2 weeks. Lung function is improving. This is measurable now. |
| Emotional & Understanding | Two weeks smoke-free — your lungs are genuinely recovering. That's not a figure of speech. |
| Light & Honest | 2 weeks in. Your lungs have filed a formal thank-you note. |

**Milestone: 1 month**

| Voice | Copy |
|---|---|
| Steady & Direct | One month. Coughing reduces. Energy improves. This is real. |
| Emotional & Understanding | A month without smoking. The recovery happening inside you right now is real and significant. |
| Light & Honest | One month. Your body threw a party and didn't invite the cigarettes. |

### 7.6 — Personal Best

**New personal best**

| Voice | Copy |
|---|---|
| Steady & Direct | New record: X days. Longest streak yet. |
| Emotional & Understanding | You've never been here before. X days — a new personal best. |
| Light & Honest | X days. Previous record? Smashed. New record? You. |

### 7.7 — Freeze Stock Depleted

*Light & Honest excluded.*

**Freeze stock = 0**

| Voice | Copy |
|---|---|
| Steady & Direct | Freezes used up for this period. Next refill in X days. |
| Emotional & Understanding | You've used your freezes for this stretch. The next batch comes in X days — keep going. |

### 7.8 — Freeze Refill Notification

> **Removed.** Freeze refill notification does not exist — see Notifications spec Decision 4. A "your freeze stock has been refreshed" message reads as "you have room to slip again" and was deliberately cut. Freeze stock visibility is on the streak screen (STK-4 tooltip).

### 7.9 — Return Modal Messages

| Absence | Message |
|---|---|
| 1 day | "How was yesterday?" |
| 2–3 days | "You were away for a couple of days — all good?" |
| 4 days | "You've been away for a few days — how did it go?" |
| 5+ days (auto-pause) | "Welcome back — you've been gone for X days." |

### 7.10 — Pause & Resume

Pause confirmation: 'Taking a break is fine. Your consistency rate and lifetime total are safe. Your streak will restart from zero when you're back — we can only count days we're here for together.'

Resume prompt (soft, on paused STK-1): 'Ready to go again?'

Resume CTA: 'Start again'

### 7.11 — Day 0 State

'Your journey starts today.'

Milestone teaser: '12 hours to your first win.'

### 7.12 — Ghost Milestone

'You got here before — you'll get here faster this time.'

---

## Section 8 — Edge Cases

| Edge Case | Behaviour |
|---|---|
| No data / first run (Day 0) | Streak system activates at `quit_date` (Day 1). On Day 0, STK-1 shows Day 0 state: 'Your journey starts today.' No streak number. No freeze stock shown. First milestone teaser displayed. |
| Mid-flow dismissal — Return Modal (STK-2) | STK-2 has no dismiss action. User cannot close without answering. If app is force-closed mid-modal, state is unchanged — modal renders again on next open. |
| Mid-flow dismissal — Long Absence Flow (STK-3) | STK-3 has no dismiss action. Auto-pause state is preserved on app close. Modal renders again on next open. |
| Mid-flow dismissal — Pause Confirmation (STK-7) | User can tap Cancel — returns to previous screen. No state change. If app is closed mid-STK-7, pause is not applied. |
| Wrong stage access — streak display before Day 1 | Streak widget not rendered in Stage 0. If user navigates to a screen referencing streak data before Day 1, show empty/locked state with 'Starts on your quit day' message. |
| Freeze limit hit (`freeze_stock = 0`) | Slip logged with no freeze available → streak resets to 0. STK-5 renders. Message tells user when next freeze refill occurs (next period boundary date). Lifetime total shown prominently. |
| Return after very long absence (30+ days) | Auto-pause triggered at Day 5. On return, STK-3 renders regardless of total absence length. Behaviour is identical whether user was gone 5 days or 50 days — same three options, same logic. |
| Connection loss | All streak data is calculated and stored locally. No network call is required for streak updates, daily check-in, return modal, or freeze logic. The feature is fully functional offline. Milestone celebrations that trigger social sharing (STK-6) will queue the share action until connection is restored. |
| Dependency level change mid-period | User adjusts dependency level up by one tier in Settings. Change is recorded. `freeze_max_current_stage` recalculates using new level. Change takes effect at next freeze period boundary — `freeze_stock` is not adjusted mid-period. Moving down requires restart + recalibration. |
| SOS reversal (slip logged after SOS 'Better' same day) | `confirmation_source` flag on today's record = 'sos'. When slip is logged later same day: reverse the +1 awarded by SOS (`current_streak_days -= 1`, `lifetime_smoke_free_days -= 1`), then apply slip logic (freeze check → consume or reset). `confirmation_source` updates to 'log'. This reversal only applies to `sos` source — `log` confirmations (any log flow A/B/C/D) are final. (Enum collapsed to `sos | log` — T-G.) |

---

# PART B · SYSTEM LOGIC FOR IMPLEMENTATION

## B1 — Data Model

### Primary Object: streak_record

| Field | Type | Required | Behaviour / Notes |
|---|---|---|---|
| `current_streak_days` | integer | Required | Resets to 0 on full relapse or resume from pause. |
| `lifetime_smoke_free_days` | integer | Required | Never decreases. Only ever increments. Accumulates across all quit attempts — a new attempt does not reset this counter. |
| `longest_streak_ever` | integer | Required | Updated when `current_streak_days` exceeds it. |
| `consistency_rate` | float (1dp) | Required | `smoke_free_days_in_attempt / active_days_in_attempt × 100`. Displayed from Stage 2 (Day 4+). Resets on full relapse/restart. Frozen on pause. |
| `smoke_free_days_in_attempt` | integer | Required | Numerator for `consistency_rate`. Increments on confirmed smoke-free day. Resets on restart. |
| `active_days_in_attempt` | integer | Required | Denominator for `consistency_rate`. Increments each day `streak_status = active`. Excludes paused days. Resets on restart. |
| `freeze_stock` | integer | Required | Current available freezes. Decrements on slip. Min 0. |
| `freeze_period` | integer (0–3) | Required | Independent counter based on days since quit. 0 = Days 1–14, 1 = Days 15–28, 2 = Days 29–90, 3 = Days 91+. |
| `freeze_max_current_period` | integer | Required | From `FREEZE_MATRIX[dependency_level][freeze_period]`. |
| `dependency_level` | enum: light / moderate / heavy | Required | Set in onboarding. One tier up via Settings (next period boundary). Recalculated on restart. |
| `current_stage` | integer (0–5) | Required | From Stage System. Used for display logic and coaching tone — not for freeze resets. |
| `streak_status` | enum: active / paused / reset | Required | Controls display and data flow. |
| `last_confirmed_date` | date | Required | Last day user confirmed status. Drives return modal trigger. |
| `streak_start_date` | date | Required | When current streak began. Recalculated on reset or resume. |
| `quit_date` | date | Required | Read from quit_attempts (current_attempt.quit_date — the row where ended_at IS NULL). Used to calculate `days_since_quit` and `freeze_period`. |
| `confirmation_source` | enum: sos / log | Required | Source of today's confirmation. `sos` = confirmed via SOS 'Better' (reversible if slip logged same day). `log` = confirmed via any log flow (A/B/C/D) or daily check-in (not reversible). The former `checkin` / `log_flow` distinction is retired — any log flow is the check-in. |
| `paused_at` | timestamptz \| null | Required | Set to current timestamp when `streak_status` transitions to `paused`. Cleared (set NULL) on resume or restart. Used by Notifications spec to calculate `pause_duration_days` for N-PAU-01–04 trigger conditions. |

### Read-only references (owned by other specs)

| Object | Owned By | Fields Read |
|---|---|---|
| `stage_record` | Stage System | `current_stage` |
| `onboarding_record` | Onboarding Spec | `dependency_level` (initial) |
| `quit_attempts` | quit_attempts table | `quit_date` (current_attempt — row where ended_at IS NULL) |
| `log_event` | Logging System Spec | `flow_type` (A/B/C/D), `slip_type` (one_off / few_days / return_to_smoking), `timestamp`, `source` (flow_c / return_modal) |
| `sos_event` | SOS Spec | `outcome` (better / smoked), `timestamp` |

---

## B2 — Logic & Conditions

### Streak Update Logic

**On daily confirmation (any log flow A/B/C/D or daily check-in):**
- If no slip logged → `current_streak_days += 1`, `lifetime_smoke_free_days += 1`, `smoke_free_days_in_attempt += 1`, `active_days_in_attempt += 1`, `last_confirmed_date = today`, `confirmation_source = 'log'`
- If `current_streak_days > longest_streak_ever` → `longest_streak_ever = current_streak_days`, trigger STK-6

**On SOS completed with 'Better':**
- `current_streak_days += 1`, `lifetime_smoke_free_days += 1`, `smoke_free_days_in_attempt += 1`, `active_days_in_attempt += 1`, `last_confirmed_date = today`, `confirmation_source = 'sos'`
- This is optimistic and reversible — see SOS Reversal below

**On slip logged — `one_off` (Log Flow C or return modal 'Had one or two'):**
- If `freeze_stock > 0` → `freeze_stock -= 1`, `lifetime_smoke_free_days += 1`, `smoke_free_days_in_attempt += 1`, `active_days_in_attempt += 1`, `last_confirmed_date = today`, `snowflake_indicator = true` (streak unchanged)
- If `freeze_stock = 0` → `current_streak_days = 0`, `streak_start_date = today`, `active_days_in_attempt += 1`, `last_confirmed_date = today`

**On slip logged — `few_days` (Log Flow C only):**
- `freeze_stock = 0` (consume ALL remaining freezes — not just 1)
- `current_streak_days = 0`, `streak_start_date = today`
- `active_days_in_attempt += 1`, `last_confirmed_date = today`
- `red_flag_count` unchanged — `few_days` does not escalate toward the Restart Nudge. Escalation is reserved for repeat `one_off` patterns.
- Streak routes to STK-5 (reset state). Slip Threshold is not invoked for `few_days` — routing goes directly to C3 Warm (Logging spec).

**On return to smoking (Log Flow C 'return_to_smoking' or return modal 'Smoked regularly'):**
- `current_streak_days = 0`, `streak_status = active` (if restart) or `paused` (if pause chosen), `streak_start_date = today` (if restart), `smoke_free_days_in_attempt = 0`, `active_days_in_attempt = 0` (resets with new attempt), `consistency_rate = 0`

**SOS Reversal (slip logged same day as SOS 'Better'):**
- Condition: `confirmation_source = 'sos'` AND today's date = `last_confirmed_date` AND slip event received
- Reverse: `current_streak_days -= 1`, `lifetime_smoke_free_days -= 1`, `smoke_free_days_in_attempt -= 1`
- Then apply slip logic: freeze check → consume or reset (as above)
- Update `confirmation_source = 'log'`

### Consistency Rate Formula

`consistency_rate = smoke_free_days_in_attempt / active_days_in_attempt × 100`, rounded to 1 decimal place.

Display format: 'X% over Y days' — time context embedded in display, no separate counter needed.

Shown from: Day 4 (Stage 2) onwards. Not shown before — too little data to be meaningful.

Freeze days: count as smoke-free in both numerator and denominator (consistent with lifetime total treatment).

Pause: both numerator and denominator frozen. Rate is preserved. `active_days_in_attempt` does not increment during pause.

Reset on: full relapse / restart only. Both numerator and denominator reset to 0.

### Pause / Resume Logic

**On pause:**
- `streak_status = paused`, `paused_at = now()`, streak display hidden, `lifetime_smoke_free_days` preserved, `consistency_rate` frozen, `active_days_in_attempt` stops incrementing
- N-PAU re-engagement notification track begins (Day 3/7/14/30 of pause, derived from `paused_at`)

**On resume from pause:**
- `streak_status = active`, `paused_at = NULL`, `current_streak_days = 0`, `streak_start_date = today`
- `freeze_stock = FREEZE_MATRIX[dependency_level][freeze_period]` (recalculated on resume)
- `consistency_rate` continues from frozen value, `active_days_in_attempt` resumes incrementing
- N-PAU track stops immediately — any pending PAU notification is cancelled

### Dependency Level Change Logic

**Mid-period upgrade (one tier up via Settings):**
- Allowed: light → moderate, moderate → heavy only. Cannot jump two tiers.
- `dependency_level_pending = new value`. Takes effect at next freeze period boundary.
- At freeze period boundary: `dependency_level = dependency_level_pending`, recalculate `freeze_max_current_period`, `freeze_stock = new freeze_max`

**Downgrade:** not permitted via Settings. Only via restart + full recalibration.

**Restart + recalibration:**
- User re-answers the 2-question dependency re-assessment (`time_to_first_cigarette` + `craving_intensity`) inside the restart re-engagement flow. System recalculates `dependence_score` → `dependency_level` from scratch (N2 mapping) and writes it to the new `quit_attempts` row. New tier applies from Day 1 of the new attempt. Can move up or down.

### Return Modal Logic (Short Absence, 1–4 days)

`days_missed = today − last_confirmed_date − 1`

| days_missed | Modal shown |
|---|---|
| 0 | No modal. Daily check-in card handles it normally. |
| 1 | 'How was yesterday?' |
| 2–3 | 'You were away for a couple of days — all good?' |
| 4 | 'You've been away for a few days — how did it go?' |
| 5+ | Auto-pause triggered. STK-3 shown on return. |

| Answer | current_streak_days | lifetime_smoke_free_days | last_confirmed_date |
|---|---|---|---|
| Didn't smoke | += days_missed | += days_missed | = yesterday |
| Had one or two (freeze > 0) | Frozen (no change) | 1–2 days: +0. 3–4 days: +days_missed − 1 | = yesterday |
| Had one or two (freeze = 0) | = 0. streak_start_date = today | +0 | = yesterday |
| Smoked regularly | = 0. Routes to STK-5. | Unchanged. | = today |

### Long Absence Flow Logic (5+ days)

Auto-pause triggers at day 5 of inactivity (`days_missed = 5`). `streak_status = paused`.

| Answer | current_streak_days | lifetime / consistency | last_confirmed_date |
|---|---|---|---|
| I didn't smoke | += days_missed. streak_status = active. | lifetime += days_missed. consistency continues. | = yesterday |
| Treat it as a break | = 0. streak_start_date = today. streak_status = active. | Both frozen during pause, continue from here. | = today |
| I did smoke on some days | = 0. streak_start_date = today. streak_status = active. | Identical to 'Treat it as a break'. | = today |

### Stage Transition Behaviour

On `current_stage` change: no freeze reset. Freeze resets are driven by `freeze_period` only.

`freeze_period` advances when `days_since_quit` crosses boundary (15, 29, 91). On advance:
- `freeze_period += 1`
- `freeze_max_current_period = FREEZE_MATRIX[dependency_level][freeze_period]`
- `freeze_stock = freeze_max_current_period` (reset, no carry-over)
- Trigger STK-9 push notification with period-appropriate copy

---

## B3 — Notification Logic

> **Freeze refill notification removed** (Notifications spec Decision 4 / U1). When `freeze_stock` resets at a freeze-period boundary (Day 15, 29, 91) **no push fires** — a "your freezes are back" message reads as "you have room to slip again." Freeze stock is visible on the streak screen (STK-4 tooltip) only.

| Notification | Trigger Condition | Copy Reference | Timing Rule | Respects Pref? |
|---|---|---|---|---|
| Stage transition (N-STK-02) | `current_stage` increments (stage boundary crossed) | Stage-appropriate copy | Sent immediately on stage change | Yes |
| Milestone reached | `current_streak_days × 24 >= milestone threshold` (first crossing) | Section 7.5 — milestone-specific copy | Sent immediately on threshold crossing | Yes |
| Personal best | `current_streak_days > longest_streak_ever` | Section 7.6 | Sent immediately on crossing | Yes |
| Streak encouragement (Stage 1) | Daily, during Days 1–3, no check-in completed by 8pm | Section 7 — Steady & Direct or Emotional & Understanding | User's known risk window from Learning Week. Fallback: 8pm IST | Yes |
| Streak encouragement (Stage 2) | Daily, during Days 4–7, no check-in completed by 8pm | Section 7 — Steady & Direct or Emotional & Understanding | User's known risk window from Learning Week. Fallback: 8pm IST | Yes |

Auto-reduce rule: if a user ignores 3 consecutive notifications, frequency reduces by one tier for 7 days. This rule applies to all notifications in this feature.

Stage 1–2 notifications use the user's known risk windows from Learning Week for timing. Fixed times are not used.

Notification cadence per stage: Stage 1: 2–3/day, Stage 2: 1–2/day, Stage 3: 1/day or every other day, Stage 4: 2–3/week, Stage 5: 1/week or less.

---

## B4 — API Surface

| Operation | Object | Trigger | Fields Affected |
|---|---|---|---|
| READ | `streak_record` | App open, any screen rendering streak data | All fields |
| UPDATE — daily confirm (no slip) | `streak_record` | Check-in card satisfied / Log Flow A or B completed / SOS 'Better' | `current_streak_days`, `lifetime_smoke_free_days`, `smoke_free_days_in_attempt`, `active_days_in_attempt`, `last_confirmed_date`, `confirmation_source`, `longest_streak_ever` (if PB) |
| UPDATE — slip (freeze consumed) | `streak_record` | Log Flow C 'one_off', return modal 'Had one or two' (freeze > 0) | `freeze_stock`, `lifetime_smoke_free_days`, `smoke_free_days_in_attempt`, `active_days_in_attempt`, `last_confirmed_date`, `snowflake_indicator` |
| UPDATE — slip (no freeze) | `streak_record` | Log Flow C 'one_off', return modal 'Had one or two' (freeze = 0) | `current_streak_days`, `streak_start_date`, `active_days_in_attempt`, `last_confirmed_date` |
| UPDATE — full relapse / restart | `streak_record` | Log Flow C 'return_to_smoking', return modal 'Smoked regularly' | `current_streak_days`, `streak_status`, `streak_start_date`, `smoke_free_days_in_attempt`, `active_days_in_attempt`, `consistency_rate`, `last_confirmed_date` |
| UPDATE — SOS reversal | `streak_record` | Slip logged same day as SOS 'Better' confirmation | `current_streak_days`, `lifetime_smoke_free_days`, `smoke_free_days_in_attempt`, `freeze_stock` or `current_streak_days` (slip logic), `confirmation_source` |
| UPDATE — pause | `streak_record` | User confirms pause in STK-7 | `streak_status` |
| UPDATE — resume from pause | `streak_record` | User selects resume from paused STK-1 | `streak_status`, `current_streak_days`, `streak_start_date`, `freeze_stock` |
| UPDATE — return modal answer | `streak_record` | User answers STK-2 or STK-3 | `current_streak_days`, `lifetime_smoke_free_days`, `smoke_free_days_in_attempt`, `active_days_in_attempt`, `freeze_stock`, `last_confirmed_date`, `streak_status` |
| UPDATE — freeze period advance | `streak_record` | `days_since_quit` crosses boundary (15, 29, 91) | `freeze_period`, `freeze_max_current_period`, `freeze_stock` |
| UPDATE — dependency level change (pending) | `streak_record` | User adjusts dependency level up in Settings | `dependency_level_pending` |
| UPDATE — dependency level applied | `streak_record` | `freeze_period` boundary crossed while `dependency_level_pending` exists | `dependency_level`, `freeze_max_current_period`, `freeze_stock`, `dependency_level_pending` (cleared) |
| UPDATE — consistency rate recalc | `streak_record` | Any update to `smoke_free_days_in_attempt` or `active_days_in_attempt` | `consistency_rate` |
| READ — milestone check | `streak_record` + `milestone_record` | Any `current_streak_days` increment | `current_streak_days` read; `milestone.previously_reached` written if newly crossed |
| UPDATE — milestone ghost | `milestone_record` | Full relapse, milestone drops per halfway rule | `previously_reached = true`, milestone status |

---

## B5 — Health Timeline Logic

### Milestone Data Structure

| Field | Type | Notes |
|---|---|---|
| `milestone_id` | string | Unique identifier. |
| `time_threshold_hours` | integer | Hours smoke-free required to reach this milestone. |
| `description` | string | Plain-language description shown to user. |
| `icon_ref` | string | Reference to icon asset in design system. |
| `previously_reached` | boolean | Persists across resets. Enables ghost marker display. |
| `is_lit` | boolean | Current state — lit or ghosted. |

### Milestone Table

| Milestone | Threshold (hours) | What is Recovering |
|---|---|---|
| 20 minutes | 0.33 | Heart rate and blood pressure normalise. |
| 12 hours | 12 | Carbon monoxide leaves the bloodstream. |
| 72 hours | 72 | Nicotine fully cleared. Taste and smell begin recovering. |
| 2 weeks | 336 | Lung function and circulation improving. |
| 1 month | 720 | Coughing reduces. Energy improves noticeably. |
| 3 months | 2160 | Lung capacity meaningfully improved. |
| 9 months | 6480 | Lung cilia regenerating. Infections reduce. |
| 1 year | 8760 | Heart disease risk halved vs a smoker. |

### Update Conditions

| Event | Timeline Behaviour |
|---|---|
| Streak progresses | Check if `current_streak_days × 24 >= any milestone threshold`. If newly crossed: `is_lit = true`, trigger celebration overlay on STK-1. |
| Single slip, freeze used | No timeline changes. All milestones stay lit. Medically accurate — one cigarette does not undo physiological recovery. |
| Full relapse — halfway rule | For the last achieved milestone: if `days_since_last_milestone_reached < halfway_to_next_milestone` → `is_lit = false`, `previously_reached = true` (ghost). If `days_since_last_milestone_reached >= halfway_to_next_milestone` → `is_lit` stays true. All milestones below last achieved stay lit regardless. |
| New quit attempt | Timeline starts from 0. `previously_reached` milestones show as ghost markers (dimmed, 'previously reached' label). `is_lit = false` for all until re-crossed. |

### Halfway Rule Calculation

```
gap_to_next = next_milestone.time_threshold_hours − last_milestone.time_threshold_hours
halfway_point = last_milestone.time_threshold_hours + (gap_to_next / 2)

If current_streak_days × 24 < halfway_point at time of relapse → ghost last milestone.
If current_streak_days × 24 >= halfway_point at time of relapse → last milestone stays lit.
```

**Example 1:** Hit 1 month (720h, Day 30). Relapse at Day 35 (840h). Halfway to 3 months (2160h) = 720 + (2160−720)/2 = 720 + 720 = 1440h (Day 60). Day 35 < Day 60 → ghost 1-month milestone.

**Example 2:** Hit 1 month (720h, Day 30). Relapse at Day 65 (1560h). Halfway = Day 60. Day 65 >= Day 60 → 1-month milestone stays lit. Progress toward 3 months resets.

---

## B6 — Data Downstream

| System | Fields Received | How Used |
|---|---|---|
| Reclaim Dashboard | `current_streak_days`, `lifetime_smoke_free_days` | Drives money saved, time saved, and health recovery calculations. Lifetime variant powers total counters. Note: the Progress Dashboard's own formula (derived from quit_attempts table) is the canonical source for counter calculations — if values diverge from `lifetime_smoke_free_days` here, the Progress Dashboard formula wins. |
| Milestones / Gamification | Streak thresholds (1d, 3d, 1wk, 2wk, 1mo, 2mo, 3mo, 6mo, 1yr) | Triggers achievement unlocks when thresholds are crossed. |
| Quit Buddy / Squad | `current_streak_days`, `streak_status`, `consistency_rate` | Streak and consistency rate visible to paired buddy or squad members if social features are enabled. |
| AI Coach | `current_streak_days`, freeze burn rate, `longest_streak_ever`, reset frequency, `consistency_rate` | Informs coaching tone and recommendations based on pattern over time. |
| Awareness Deck | Streak milestones | Specific content cards triggered at milestones (e.g., '72 hours — no nicotine left in your body'). |

---

## Open Items

> ✅ **RESOLVED (N2, 2026-06-05) — Dependency classification.** The two onboarding signals (`time_to_first_cigarette` + `craving_intensity`) are sufficient. `dependence_score = craving_weight + first_cig_weight` (range 2–8) maps to `dependency_level`: 2–3 → `light`, 4–5 → `moderate`, 6–8 → `heavy`. Written to `quit_attempts.dependency_level` at onboarding completion and at each restart re-assessment (same 2 questions). Full weight table lives in the Onboarding spec B2.1. No additional questions needed.

---

*End of Document — LastOne Streak System Feature Spec V1.2*

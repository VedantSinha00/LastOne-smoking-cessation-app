# LastOne — Onboarding Spec V1.2

| Field | Detail |
|---|---|
| Version | 1.2 |
| Date | May 2026 |
| Author | Anish (V1.0 base) + technical additions + product gap resolutions |
| Status | Ready for Development |
| Screen Prefix | OB |
| Total Screens | 22 maximum (OB-21 removed). Varies by intent and quit history. |
| Stage Scope | Pre-Stage 0 |

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Onboarding_Spec_V1_0]] — V1.0 base; full screen copy and Part A inventory live there; this V1.2 spec adds resolved product gaps, revised flows, and Part B system logic
- [[LastOne_Product_Foundations_V1]] — Foundation 4 (Personalisation Model) defines all data collected during onboarding; Foundation 1 (Stage System) defines Stage 0 entry on OB-23 completion
- [[LastOne_Settings_Profile_Spec_V1_2]] — PROF-02 (quit date editing) is the post-onboarding path for users who skip OB-20 or need to change their quit date; shares the `max(account_creation_date + 3, today)` minimum date constraint
- [[LastOne_ProgressDashboard_Spec]] — reads `cigarettes_per_day`, `price_per_cigarette` from `profiles`; `quit_date` from `quit_attempts` (A1/A3)
- [[LastOne_Streak_System_Spec_V1_2]] — reads `quit_date` from `quit_attempts` (open row) to trigger Stage 0 → Stage 1 transition
- [[LastOne_Content_Voice_Brief_V1_2]] — `voice_style` (deferred in B7) drives all high-sensitivity copy variant selection once collected

---

> **V1.2 scope:** All product gaps (P1–P6) resolved. OB-21 (learning period slider) removed. OB-20 updated to date picker. Intent options simplified to `quit` / `figuring_out`. `quit_date` nullable. Design decisions documented. Full notification copy added. Spec is Ready for Development.

See [[LastOne_Onboarding_Spec_V1_0]] for full screen copy and Part A inventory.

---

# PART A — SECTION 1: PROBLEM & PURPOSE

## 1.1 Problem Statement

The Indian college smoker (18–24) doesn't have a cessation tool built for their context. Most tools are Western and clinical — designed for older, heavier smokers who have already decided to quit. The college smoker is in a different position: smoking started socially, became habitual through hostel life, exam stress, and the tapri crowd. They know it's a problem. Most are somewhere between bothered and ready — not in denial, but not at a firm "I'm quitting today" either.

Existing apps have no entry point for this user. They assume commitment the moment you open them. LastOne's onboarding is the first time the product meets this person. It needs to feel like it understands them — not like a medical intake form — and it needs to work for both the user who is ready to act and the one who isn't sure yet but wants to do something that feels like progress.

---

## 1.3 User Stories

**Sajal — ready to act**

Sajal is in her third year at college. She's been smoking for about a year and a half — started at the tapri outside the hostel gate, now it's a fixed part of her day. Last month she did the math on what she was spending and it bothered her more than she expected. Her roommate has been calling it out too. She's not in crisis, she's just tired of the habit having this much pull on her. She downloads LastOne and goes through the whole flow. She picks a quit date. She's ready to try.

**Pulkit — figuring it out**

Pulkit is in his third year. He smokes 4–5 a day, more during exams. He doesn't think of himself as a smoker — it's just something he does. A friend mentioned LastOne and he downloaded it mostly out of curiosity. He's not ready to say "I'm quitting" but something in him wants to do something that feels like progress. He opens the app willing to answer questions. He's not willing to pick a quit date yet.

---

## 1.4 Success Metrics

Metrics specific to the onboarding flow. These measure whether the flow does its job — getting users through to a completed profile without friction or drop-off.

| Metric | Description |
|---|---|
| Onboarding completion rate | % of users who reach OB-23 and tap "Go to LastOne" |
| Screen drop-off distribution | % of users who exit at each screen — flags friction points in the flow |
| Quit date set rate | % of users who set a quit date during onboarding vs. using the skip button |
| Median time to complete | End-to-end time from OB-01 to OB-23 tap |
| Re-open and complete rate | % of users who exit mid-flow and return to finish |

---

# PART A — SECTION 3: DESIGN DECISIONS

> **DECISION: 3-section flow with buffer screens.**
> **Chosen:** Questions split into three sections separated by buffer screens (OB-09, OB-18).
> **Rationale:** Prevents the flow feeling like a medical intake form or interview. Buffer screens signal progress and reflect answers back to the user, so they feel the data is going somewhere meaningful rather than into a void.

> **DECISION: Hold mechanic on OB-22 instead of a simple tap.**
> **Chosen:** 3-second hold with fill animation.
> **Rationale:** Makes the commitment feel like a commitment rather than another button tap. Also breaks the interaction pattern — after 13 questions of selecting and tapping, the hold mechanic creates a distinct moment that holds attention and marks the weight of what the user is doing.

> **DECISION: Defer `voice_style` and `smoking_location` to post-onboarding.**
> **Chosen:** Both fields collected via post-onboarding modals and notifications, not during onboarding.
> **Rationale:** Keeps onboarding lean — only collects what is needed to start. Users cannot meaningfully choose a voice style before experiencing the app. Modals and notifications handle collection post-onboarding. Adding these questions to onboarding adds friction for marginal V1 gain.

> **DECISION: Date picker defaults to today + 7 days. Minimum is account_creation_date + 3 days. No maximum.**
> **Chosen:** 7-day default, 3-day minimum, no upper limit.
> **Rationale:** 7 days balances giving the user access to the product quickly while collecting enough data to personalise the experience. The 3-day minimum ensures a baseline of logging data exists before Stage 1 begins. No maximum — users can set a quit date as far out as they need, with a nudge system prompting those who haven't decided.

---

# PART A — SECTION 5: FLOW LOGIC

**Entry point:** App launch with `onboarding_complete = false` (new user, or account created but not completed).

**Back button default:** navigates to the previous screen. Session data for the current screen is not saved on back. Answers from prior screens are retained in session state.

**Mid-flow exit:** If user closes the app before OB-23, no data is written to the database. On re-open, flow restarts from OB-01. This is intentional — onboarding is short enough to redo, and zero partial state eliminates stale session edge cases.

---

### OB-01: Logo Screen

Auto-advances after 2 seconds. No user action.

| Event | Outcome |
|---|---|
| 2 seconds elapsed | → OB-02 |

---

### OB-02: Welcome Screen

| User Action | Outcome |
|---|---|
| Taps "Get Started" | → OB-03 |
| Hardware back / swipe back | App exits (nothing behind this screen) |

---

### OB-03: Intro Screen

| User Action | Outcome |
|---|---|
| Taps "Continue" | → OB-04 |
| Taps Back | → OB-02 |

---

### OB-04: Promise Screen

| User Action | Outcome |
|---|---|
| Taps "Continue" | → OB-05 |
| Taps Back | → OB-03 |

---

### OB-05: Create Account Screen

| User Action | Outcome |
|---|---|
| Taps "Continue with Google" | Google OAuth. On success: `user_id` set → OB-06. On failure: inline error, stay on OB-05. |
| Taps "Continue with Apple" | Apple OAuth. On success: `user_id` set → OB-06. On failure: inline error, stay on OB-05. |
| Fills email + password, taps "Create Account" | POST to Supabase auth. On success → OB-06. On error (duplicate email, weak password): inline error, stay on OB-05. |
| Taps "Already have an account? Sign in" | → Sign-in screen (outside onboarding flow). No account created. |
| Taps Back | → OB-04. No account created. |

---

### OB-06: Q1 — Name

| User Action | Outcome |
|---|---|
| Types name (≥1 character), taps "Continue" | Saves `first_name` to session. → OB-07 |
| Taps "Continue" with empty field | Button inactive. No action. |
| Taps Back | → OB-05. `first_name` not saved. |

---

### OB-07: Q2 — Age

| User Action | Outcome |
|---|---|
| Selects an option, taps "Continue" | Saves `age_range` to session. → OB-08 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-06. `age_range` not saved. |

---

### OB-08: Q3 — Life Stage

| User Action | Outcome |
|---|---|
| Selects an option, taps "Continue" | Saves `life_stage` to session. → OB-09 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-07. `life_stage` not saved. |

---

### OB-09: Buffer Screen 1

| User Action | Outcome |
|---|---|
| Taps "Let's go" | → OB-10 |
| Taps Back | → OB-08 |

---

### OB-10: Q4 — Intent

| User Action | Outcome |
|---|---|
| Selects an option, taps "Continue" | Saves `intent` to session. → OB-11 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-09. `intent` not saved. |

> Note: Intent options are `quit` and `figuring_out` only. `reduce` and `track` dropped in V1.2. Both intents follow the same flow through OB-19. `figuring_out` users have a skip option on OB-20 and bypass OB-22.

---

### OB-11: Q5 — Cigarettes per Day + Cost

| User Action | Outcome |
|---|---|
| Adjusts stepper and/or cost field, taps "Continue" | Saves `cigarettes_per_day` and `price_per_cigarette`. → OB-12 |
| Taps "Continue" without touching inputs | Saves defaults: `cigarettes_per_day = 5`, `price_per_cigarette = 15`. → OB-12 |
| Types value below 1 in stepper | Clamped to 1. |
| Taps Back | → OB-10. Values not saved. |

---

### OB-12: Q6 — Reasons for Smoking

| User Action | Outcome |
|---|---|
| Selects ≥1 option, taps "Continue" | Saves `smoking_reasons` array. → OB-13 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-11. `smoking_reasons` not saved. |

> Selectable options must cover the full canonical trigger vocabulary (N4) so `smoking_reasons` can join cleanly with Logging/Insights/Content Cards: `stress`, `boredom`, `social`, `habit`, `post_meal`, `post_chai`, `anxiety`, `celebration`, `focus`, plus an `other` catch-all chip. `post_chai` (chai/tapri) and the social/celebration options are India-context specific and should not be dropped from the UI.

---

### OB-13: Q7 — Trigger Timing

| User Action | Outcome |
|---|---|
| Selects ≥1 option, taps "Continue" | Saves `trigger_times` array. → OB-14 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-12. `trigger_times` not saved. |

---

### OB-14: Q8 — First Cigarette Timing

| User Action | Outcome |
|---|---|
| Selects an option, taps "Continue" | Saves `time_to_first_cigarette`. → OB-15 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-13. `time_to_first_cigarette` not saved. |

---

### OB-15: Q9 — Craving Intensity

| User Action | Outcome |
|---|---|
| Selects an option, taps "Continue" | Saves `craving_intensity`. → OB-16 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-14. `craving_intensity` not saved. |

---

### OB-16: Q10 — Quit History

| User Action | Outcome |
|---|---|
| Selects "Never, this is my first time", taps "Continue" | Saves `quit_attempts = never`. Sets `quit_struggles = null`. → OB-18 (OB-17 skipped) |
| Selects any other option, taps "Continue" | Saves `quit_attempts`. → OB-17 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-15. `quit_attempts` not saved. |

---

### OB-17: Q11 — Biggest Struggle (Conditional)

Only shown if `quit_attempts != never`.

| User Action | Outcome |
|---|---|
| Selects ≥1 option, taps "Continue" | Saves `quit_struggles` array. → OB-18 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-16. `quit_struggles` not saved. |

---

### OB-18: Buffer Screen 2

Headline: "Progress isn't linear. Every attempt that didn't work is part of getting this one right." No personalisation with `first_name` on this screen.

| User Action | Outcome |
|---|---|
| Taps "Continue" | → OB-19 |
| Taps Back | → OB-17 if it was shown; → OB-16 if OB-17 was skipped |

---

### OB-19: Q12 — Motivation

| User Action | Outcome |
|---|---|
| Selects an option, taps "Continue" | Saves `motivation`. → OB-20 |
| Taps "Continue" with no selection | Button inactive. No action. |
| Taps Back | → OB-18. `motivation` not saved. |

---

### OB-20: Q13 — Quit Date

Date picker. Default selection: today + 7 days. Minimum selectable date: account_creation_date + 3 days. No maximum. Skip button available for all users.

| User Action | Outcome |
|---|---|
| Selects a date, taps "Continue" | Saves `quit_date` to session. → OB-22 |
| Taps "I'm here to understand myself first" (skip button) | `quit_date` remains null. → OB-23 |
| Taps Back | → OB-19. `quit_date` not saved. |

---

### OB-22: Commitment Screen

| User Action | Outcome |
|---|---|
| Types into BLANK 1 | BLANK 1 filled. Hold button activates only when both blanks filled. |
| Types into BLANK 2 | BLANK 2 filled. Hold button activates only when both blanks filled. |
| Taps chip from Chip Set 1 | BLANK 1 filled with chip text. Overrides any typed text. |
| Taps chip from Chip Set 2 | BLANK 2 filled with chip text. Overrides any typed text. |
| Holds button for 3 full seconds (both blanks filled) | Saves `commitment_reason` and `commitment_identity` to session. → OB-23 |
| Releases hold before 3 seconds | Fill animation resets. Stay on OB-22. Nothing saved. |
| Taps hold button with either blank empty | No action. Button visually inactive. |
| Taps Back | → OB-20. Commitment values not saved. |

---

### OB-23: Post-Commitment Confirmation

Two variants based on whether user completed OB-22 (commitment) or skipped it via OB-20 skip button.

**`quit` users (came from OB-22):**
- Headline: "From here, everything changes."
- Subline: "Let's begin."
- Confirmation line: "[first_name] made a promise today."

**`figuring_out` users (came from OB-20 skip):**
- Headline: "You're here. That's where it starts."
- Subline: "Let's begin."
- Confirmation line: "[first_name] took the first step today."

| User Action | Outcome |
|---|---|
| Taps "Go to LastOne" | Writes all session fields to the `profiles` row (Schema A1); opens a `quit_attempts` row with `quit_date` (nullable) + `dependency_level` (A3); sets `onboarding_complete = true`. Stage 0 begins. → Home Screen. |
| Network unavailable on save | Silent retry. Spinner on button. Do not navigate until save confirmed. |
| Save succeeds after retry | → Home Screen. |
| Save fails permanently | Show error message. Stay on OB-23. Allow re-tap. |
| Taps Back (`quit` user) | → OB-22. `onboarding_profile` NOT written. |
| Taps Back (`figuring_out` user) | → OB-20. `onboarding_profile` NOT written. |

---

# PART A — SECTION 6: STAGE BEHAVIOUR

Onboarding is a pre-Stage 0 feature. It runs once, before any stage begins.

| Stage | Behaviour |
|---|---|
| Pre-Stage 0 (Onboarding) | Feature active. Full OB-01 → OB-23 flow. Completes by writing onboarding answers to `profiles`, opening the first `quit_attempts` row, and setting `onboarding_complete = true`. Stage 0 begins immediately on OB-23 CTA tap. |
| Stage 0 (Learning Week) | Feature inactive. `onboarding_complete = true`. User cannot re-enter the onboarding flow. Profile is read-only by other features from this point. |
| Stage 1 (First 72 Hours) | Feature inactive. |
| Stage 2 (Days 4–7) | Feature inactive. |
| Stage 3 (Weeks 2–3) | Feature inactive. |
| Stage 4 (Weeks 4–8) | Feature inactive. |
| Stage 5 (Months 3+) | Feature inactive. |
| After a slip-triggered restart | Onboarding does not repeat. The `profiles` row persists unchanged. A new `quit_attempts` row opens (old row closed). `quit_date` on the new row starts NULL — user sets it via the restart re-engagement flow (not this onboarding flow). New commitment overwrites previous `commitment_reason` and `commitment_identity` when set. |

---

# PART B — SYSTEM LOGIC

## B1. Data Model — onboarding fields (written to `profiles`)

Written once at OB-23. Required/optional markers added from V1.0.

> **Persistence (Schema A1):** there is **no separate `onboarding_profiles` table.** `onboarding_profile` is just the name for the bundle of answers collected during onboarding; on OB-23 they are written into the single canonical **`profiles`** table (which holds identity + prefs + onboarding answers). The fields below map onto `profiles` columns. Two fields below do **not** land on `profiles`: `quit_date` is written to a new **`quit_attempts`** row (open row, `ended_at IS NULL` — Schema A3), and `dependency_level` (derived from `dependence_score`, B2.1) is written to that same `quit_attempts` row, not `profiles`.

| Field | Type | Required | Source Screen | Notes |
|---|---|---|---|---|
| user_id | string | Yes | OB-05 | From Supabase auth |
| first_name | string | Yes | OB-06 | Min 1 character |
| age_range | enum | Yes | OB-07 | `under_16` \| `16_18` \| `18_22` \| `22_26` \| `26_plus` |
| life_stage | enum | Yes | OB-08 | `college_student` \| `final_year` \| `fresh_graduate` \| `working` |
| intent | enum | Yes | OB-10 | `quit` \| `figuring_out` |
| cigarettes_per_day | number | Yes | OB-11 | Min 1. Default 5. |
| price_per_cigarette | number | Yes | OB-11 | INR. Default 15. |
| smoking_reasons | array of enum | Yes | OB-12 | Canonical trigger vocabulary (N4), exact tokens: `stress` \| `boredom` \| `social` \| `habit` \| `post_meal` \| `post_chai` \| `anxiety` \| `celebration` \| `focus` \| `other`. Shared join key with Logging `triggers`, Insights `trigger_tag`, Content Cards `trigger_value` — must match exactly. |
| trigger_times | array of enum | Yes | OB-13 | `morning` \| `post_meal` \| `break` \| `study_work` \| `friends` \| `stress` \| `boredom` \| `late_night` |
| time_to_first_cigarette | enum | Yes | OB-14 | `within_5` \| `within_30` \| `within_60` \| `later` \| `not_daily` |
| craving_intensity | enum | Yes | OB-15 | `low` \| `medium` \| `high` \| `overwhelming` |
| quit_attempts | enum | Yes | OB-16 | `never` \| `one_two` \| `three_five` \| `five_plus` \| `lost_count` |
| quit_struggles | array of enum | No (nullable) | OB-17 | `social` \| `stress` \| `withdrawal` \| `weak_moments` \| `no_plan`. Null if `quit_attempts = never`. |
| motivation | enum | Yes | OB-19 | `health` \| `money` \| `others` \| `independence` \| `fitness` \| `wake_up_call` \| `no_reason` |
| quit_date | date | No (nullable) | OB-20 | User-selected. Null if user skipped OB-20. Min: account_creation_date + 3 days. No max. Default picker value: today + 7. |
| commitment_reason | string | No (nullable) | OB-22 | Contents of BLANK 1. Free text or chip. Null for `figuring_out` users who skipped OB-22. |
| commitment_identity | string | No (nullable) | OB-22 | Contents of BLANK 2. Free text or chip. Null for `figuring_out` users who skipped OB-22. |
| onboarding_complete | boolean | Yes (auto) | OB-23 | Set `true` on successful DB write. Default `false`. |
| created_at | timestamp | Yes (auto) | — | Set on insert. |

---

## B2. Derived Fields

Computed at query time, not stored.

| Derived Value | Formula | Used By |
|---|---|---|
| dependence_score | `craving_weight + first_cig_weight` (range: 2–8) | Profile classification, SOS defaults |
| smoker_profile | Based on `cigarettes_per_day` + `dependence_score` (see B2.2) | Content card filtering, coping tool priority |
| daily_cost | `cigarettes_per_day × price_per_cigarette` | Money saved counter |
| stage_0_start | `created_at` date | Stage system |
| stage_1_start | `quit_date` | Stage system trigger |

---

### B2.1 — dependence_score Weight Mapping

**craving_intensity:**

| Option | Enum value | Weight |
|---|---|---|
| Barely noticeable | `low` | 1 |
| Uncomfortable, but I push through | `medium` | 2 |
| Strong, hard to focus on anything else | `high` | 3 |
| I almost always end up giving in | `overwhelming` | 4 |

**time_to_first_cigarette:**

| Option | Enum value | Weight |
|---|---|---|
| Within 5 minutes | `within_5` | 4 |
| Within 30 minutes | `within_30` | 3 |
| Within an hour | `within_60` | 2 |
| Later in the day | `later` | 1 |
| I don't smoke every day | `not_daily` | 1 |

**Score formula and bands:**

```
dependence_score = craving_weight + first_cig_weight

Range: 2–8
  2–3 → low dependence   → dependency_level = 'light'
  4–5 → moderate dependence → dependency_level = 'moderate'
  6–8 → high dependence  → dependency_level = 'heavy'
```

> `dependency_level` is the canonical field written to `quit_attempts.dependency_level` on onboarding completion and on each restart re-assessment. Band names (low/moderate/high) are internal to this calculation only — the value stored and read by Streak is always `light | moderate | heavy`. The two re-assessment questions on restart are `craving_intensity` and `time_to_first_cigarette` (the only inputs to this score).

---

### B2.2 — smoker_profile Classification

```
IF cigarettes_per_day <= 5 AND dependence_score <= 4
  THEN smoker_profile = "social_occasional"

ELSE IF cigarettes_per_day <= 10 AND dependence_score <= 6
  THEN smoker_profile = "regular_light"

ELSE
  THEN smoker_profile = "regular_moderate_heavy"
```

---

### B2.3 — OB-17 Skip Logic

```
IF quit_attempts == "never"
  THEN skip OB-17, set quit_struggles = null, proceed to OB-18
ELSE
  THEN show OB-17
```

---

### B2.4 — Quit Date

```
quit_date = user-selected date from OB-20 date picker

Constraints:
  Minimum selectable date = account_creation_date + 3 days
  Maximum selectable date = none
  Default picker value    = today + 7 days (at time of OB-20 interaction)

If user taps skip button on OB-20:
  quit_date = null
  Stage 0 continues indefinitely until user sets a quit date manually
```

---

### B2.5 — Stage 0 → Stage 1 Transition

```
Background job (runs hourly):
  IF quit_date IS NOT NULL
  AND current_date >= quit_date
  AND onboarding_complete == true
    THEN end Stage 0, begin Stage 1

IF quit_date IS NULL:
  Stage 0 continues indefinitely.
  Transition triggers only once user sets a quit date and that date is reached.
```

---

### B2.6 — OB-22 Hold Mechanic

```
Hold button active IF:
  commitment_reason != "" AND commitment_identity != ""

On hold initiated:
  Start 3-second fill animation (left to right)

IF hold released before 3s:
  Reset animation. No save.

IF hold reaches 3s:
  Save commitment_reason and commitment_identity to session.
  Transition to OB-23.
```

---

## B3. Notification Logic

### N-OB-01 — Incomplete Onboarding Reminder

| Field | Value |
|---|---|
| Trigger | `user_id` exists AND `onboarding_complete = false` after 24 hours |
| Message | "Your profile is ready. Pick up where you left off." |
| Timing | 24 hours after account creation. Fires once only. |
| Respects notification preference | No — user has not set preferences yet. Only pre-preference notification in the flow. |
| Auto-reduce rule | Not applicable (single fire). |

---

### N-OB-02 — Stage 0 → Stage 1 Transition

| Field | Value |
|---|---|
| Trigger | Background job confirms `current_date >= quit_date` AND `onboarding_complete = true` |
| Timing | At user's highest-risk window from `trigger_times`. If no clear peak window, default 09:00 local time. |
| Respects notification preference | Yes |
| Auto-reduce rule | Not applicable (single fire — stage transition fires once). |

**Copy variants:**

| Voice | Title | Body |
|---|---|---|
| Steady & Direct | This is the day. | You set this date. Everything you've tracked leads here. LastOne is ready when you are. |
| Emotional & Understanding | Today's the day, [first_name]. | You've been preparing for this. We're here whenever you need us. |
| Light & Honest | Your quit date is here. | It might feel big — that's normal. Open the app when a craving hits. |

---

### N-OB-03 — Quit Date Nudge Series

Fires only for users where `quit_date IS NULL` AND `onboarding_complete = true`. Stops firing once user sets a quit date.

#### N-OB-03-W1 — Week 1 Nudge

| Field | Value |
|---|---|
| Trigger | `account_creation_date + 7 days` AND `quit_date IS NULL` |
| Timing | 09:00 local time |
| Respects notification preference | Yes |
| Fires | Once |

**Copy variants:**

| Voice | Title | Body |
|---|---|---|
| Steady & Direct | You've been tracking for a week. | LastOne has enough to work with. Ready to set a quit date? |
| Emotional & Understanding | A week in, [first_name]. | You've shown us your patterns. When you're ready, we can help you pick a date. |
| Light & Honest | One week of data. | We know your habits now. Setting a quit date gets easier from here. |

---

#### N-OB-03-W2 — Week 2 Nudge

| Field | Value |
|---|---|
| Trigger | `account_creation_date + 14 days` AND `quit_date IS NULL` |
| Timing | 09:00 local time |
| Respects notification preference | Yes |
| Fires | Once |

**Copy variants:**

| Voice | Title | Body |
|---|---|---|
| Steady & Direct | Two weeks of tracking, [first_name]. | You know your triggers. You know your patterns. You're more ready than you think. |
| Emotional & Understanding | Two weeks in, [first_name]. | You've put in the work. Two weeks of tracking means you know your habit better than most people ever do. You're more ready than you think. |
| Light & Honest | Two weeks down. | Still not sure you're ready? You probably are. You just can't see it yet. |

---

#### N-OB-03-R — Week 3+ Rotation Nudges

| Field | Value |
|---|---|
| Trigger | `account_creation_date + 21 days` AND `quit_date IS NULL`, then twice weekly |
| Timing | 09:00 local time |
| Respects notification preference | Yes |
| Rotation | 3 messages cycle in order (R1 → R2 → R3 → R1…) |
| Frequency | Twice per week |

**R1 — you've already been changing:**

| Voice | Title | Body |
|---|---|---|
| Steady & Direct | [X] weeks of tracking. | Tracking changes how you see your habit. A quit date makes that change official. |
| Emotional & Understanding | [X] weeks, [first_name]. | You've been shifting your relationship with cigarettes since you started. A quit date is just the next step. |
| Light & Honest | [X] weeks of paying attention. | Something's already shifting. A quit date puts a name on it. |

**R2 — there's no perfect moment:**

| Voice | Title | Body |
|---|---|---|
| Steady & Direct | [X] weeks, [first_name]. | There's no perfect time to quit. There's just the time you decide to start. |
| Emotional & Understanding | [X] weeks in. | It's easy to wait for the right moment. But the right moment usually needs a date attached to it. |
| Light & Honest | [X] weeks down. | Still waiting for the right time? Setting a date is usually what makes it feel right. |

**R3 — you don't need to be certain:**

| Voice | Title | Body |
|---|---|---|
| Steady & Direct | [X] weeks of tracking. | You don't need to be certain. You just need to be willing to try. |
| Emotional & Understanding | [X] weeks, [first_name]. | Not feeling 100% ready is normal. Most people who quit weren't sure either — they just started. |
| Light & Honest | [X] weeks in. | Nobody feels completely ready. That feeling doesn't go away — you just start anyway. |

---

### N-OB-04 — Eve of Quit Date

| Field | Value |
|---|---|
| Trigger | `quit_date - current_date = 1 day` AND `onboarding_complete = true` |
| Timing | 20:00 local time |
| Respects notification preference | Yes |
| Auto-reduce rule | Not applicable (single fire). |
| Copy | 3 voice variants below. |

**Copy variants:**

| Voice | Title | Body |
|---|---|---|
| Steady & Direct | Tomorrow is your quit date, [first_name]. | You've done the work. Tomorrow, you begin. |
| Emotional & Understanding | Tomorrow's the day, [first_name]. | You've been preparing for this. Whatever you're feeling tonight is okay. We'll be with you tomorrow. |
| Light & Honest | Big day tomorrow, [first_name]. | Your quit date is here. We'll take it one craving at a time. |

---

## B4. API Surface

All database operations via Supabase.

```
# Authentication (OB-05)
POST   /auth/signup
       Body: { email, password }
       Returns: { user_id, session }

POST   /auth/oauth
       Body: { provider: "google" | "apple" }
       Returns: { user_id, session }

# Onboarding profile (OB-23) — writes into the canonical `profiles` table (A1)
POST   /profiles               (or PATCH if the auth row was pre-created at OB-05)
       Body: all onboarding fields from B1 (mapped to profiles columns)
       Returns: { id, created_at }
       Notes: Called once only, on "Go to LastOne" tap. Retried silently on network failure.

POST   /quit_attempts          # opens the first attempt row (A3)
       Body: { user_id, quit_date (nullable), dependency_level, started_at, ended_at: null }
       Returns: { attempt_id }

# Onboarding status check (app launch)
GET    /profiles?id=:id
       Returns: { onboarding_complete: boolean }
       Notes: Called on every app launch to route user to onboarding or home screen.
```

Persistence (Schema A1/A3): onboarding answers persist on the single `profiles` table — there is no `onboarding_profiles` table. `quit_date` + `dependency_level` live on the `quit_attempts` row, not `profiles`.

---

## B5. Fields Referenced by Other Features

*(Unchanged from V1.0)*

| Feature | Fields Read |
|---|---|
| Money Saved Counter | `cigarettes_per_day`, `price_per_cigarette`, `quit_date` |
| SOS Tool Routing | `trigger_times`, `craving_intensity`, `smoking_reasons`, `smoker_profile` (derived) |
| Notification Timing | `trigger_times`, `quit_date` |
| Content Card Filtering | `life_stage`, `age_range`, `motivation`, `smoker_profile` (derived) |
| AI Chatbot System Prompt | `first_name`, `motivation`, `quit_attempts`, `commitment_reason`, `commitment_identity` |
| Home Carousel Boost | `motivation` |
| Coping Tool Priority | `quit_struggles`, `smoking_reasons`, `craving_intensity` |
| Stage System | `quit_date`, `stage_1_start` (derived) |

---

## B6. Edge Cases

*(V1.0 cases retained, two added)*

| Scenario | Behaviour |
|---|---|
| User exits mid-onboarding | Partial data not saved. On re-open, onboarding restarts from OB-01. Intentional — see Section 3 design decisions. |
| User skips name (empty field) | Continue button inactive until at least 1 character entered. |
| OB-22 blank left empty | Hold button visually inactive. Cannot proceed without both blanks filled. |
| User types custom text in commitment blank | Accepted freely. No validation. Chip selection overrides typed text if tapped after. |
| User skips OB-20 (taps skip button) | `quit_date` = null. User proceeds to OB-23 directly. Stage 0 continues indefinitely until quit date set manually. |
| OB-20 date picker not touched | Default value today + 7 days is used if user taps Continue without changing the picker. |
| Auth fails on OB-05 | Inline error. Onboarding does not proceed until account created. |
| Network drops during OB-23 save | Silent retry with spinner. Do not route home until save confirmed. |
| Save fails permanently on OB-23 | Show error message. Stay on OB-23. Allow re-tap. |
| User under 16 selected | Flag `age_range = under_16`. No content restriction in V1. Note for future moderation. |
| Returning user after slip restart | Onboarding does not repeat. `onboarding_profile` persists. User goes through the **restart re-engagement flow** (not this onboarding spec): (1) dependency re-assessed via 2 questions (`craving_intensity` + `time_to_first_cigarette`); (2) `smoking_reasons` and `trigger_times` shown pre-filled and editable; (3) quit date picker (min = restart_triggered_at + 3, no max, default today + 7). New `quit_attempts` row opens with user-chosen date and new `dependency_level`. Baseline confirmation nudge re-fires at Stage 0→1 entry of the new attempt. |

---

## B7. Account Setup — Deferred Questions

*(Unchanged from V1.0)*

| Question | Field | Powers |
|---|---|---|
| How many days in the last 30 did you smoke? | `smoking_frequency` | Profile classification refinement |
| What do you spend money on most? | `relatable_category` | Money saved counter equivalent |
| How would you like this app to talk to you? | `voice_style` | All high-sensitivity card rendering |
| Where do you usually smoke? | `smoking_location` | Public vs private SOS tool routing |


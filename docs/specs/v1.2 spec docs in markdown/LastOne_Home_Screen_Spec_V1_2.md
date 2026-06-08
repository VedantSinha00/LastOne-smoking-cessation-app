# LastOne — Home Screen Spec V1.2

| Field | Detail |
|---|---|
| Version | 1.2 |
| Date | May 2026 |
| Author | Vedant |
| Status | Ready for Development |
| Screen Prefix | HOME |
| Stage Scope | Stage 0 — Stage 5 |

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — Foundation 5 (Content Framework) defines the home carousel; Foundation 1 (Stage System) drives section visibility per stage
- [[LastOne_ProgressDashboard_Spec]] — progress counters section; spec maintained separately; home spec owns placement only
- [[LastOne_Streak_System_Spec_V1_2]] — streak bar and daily check-in card; spec maintained separately
- [[LastOne_Insights]] — Insights Preview Card on home links to the full Insights screen
- [[LastOne_PersonalGoals_Spec]] — personal goals progress is surfaced via the dashboard money-saved counter; Donate and Give Back may overlap (see P4)
- [[LastOne_Onboarding_Spec_V1_2]] — `onboarding_complete = true` is the entry condition for the home screen

---

# PART A — SECTION 1: PROBLEM & PURPOSE

## 1.1 Problem Statement

Cessation apps lose users on good days. When a user isn't craving — which is most of the time, especially after the first week — there's nothing pulling them back to the app. The product goes dark between emergencies, and without a daily reason to open it, the quit attempt loses its infrastructure. The home screen is the only surface that solves this. It has to be worth opening every day, not just during a craving.

The secondary challenge is that the home screen serves two states simultaneously: the user who opens the app to check in (a good day, 30-second visit) and the user who opens it in crisis (a craving moment, needs help in 2 taps). The layout must serve both without compromising either.

---

## 1.2 Foundation Reference

Primary: Foundation 5 (Content & Awareness Framework) — the content carousel on home is the main delivery channel for daily-relevant cards. Secondary: Foundation 4 (Personalisation Model) — determines which cards appear and in what order. Foundation 1 (Stage System) — controls section visibility and behaviour per stage.

---

## 1.3 User Stories

**Sajal — good day, Stage 1**

Sajal is in her hostel room after dinner on Day 4 of her quit attempt. She's not craving. She just wants to check in. The home screen shows her streak (4 days), the counters (₹180 saved, 20 cigarettes not smoked), and a content card with a health milestone she just hit. She reads it in 30 seconds and closes the app. Nothing required of her — just a small confirmation that it's working.

**Pulkit — Stage 0, figuring it out**

Pulkit is sitting at the tapri outside his hostel, opening the app for the fourth day in a row. He hasn't set a quit date. The home screen shows his logging streak and a content card surfacing a pattern from his data: "You usually smoke at 10pm — that's your peak window." He didn't know that. He didn't open the app looking for this — it was just waiting for him.

---

## 1.4 Success Metrics

| Metric | Description |
|---|---|
| Daily open rate | % of users who open the app at least once per day in the first 30 days |
| Carousel card engagement | % of home screen sessions where at least one content card is tapped to expand |
| SOS reachable in ≤ 2 taps | Structural: from home screen, SOS/craving action is always reachable in ≤ 2 taps |
| Stage 0 logging rate | % of Stage 0 users who log ≥ 1 cigarette on 5+ of their first 7 days — proxy for home retaining early-stage users |
| Median home session duration | Target: 20–60 seconds for check-in visits; confirms home works as a passive touchpoint |

---

# PART A — SECTION 2: FEATURE OVERVIEW

## 2.1 What This Feature Does

The home screen is the default landing view after onboarding. It is a vertically scrollable screen composed of persistent sections and conditional cards. It gives the user a fast daily read of where they stand (streak bar, progress counters), surfaces the most relevant content for today (content carousel), provides their daily check-in touchpoint, and links out to deeper features (Insights, Community).

---

## 2.2 Where It Lives

The `Home` tab — primary navigation. Default entry state on every app open after onboarding. Not navigated to; it is the starting point.

---

## 2.3 Stage Relevance

| Stage | Feature Status |
|---|---|
| Stage 0 (Learning Week) | All sections visible. Streak bar shows logging streak (not quit streak). Dashboard counters show Stage 0 preview state (zeroes + preview copy from DASH spec). Content carousel shows Stage 0-filtered cards. Daily Check-In card active (see P1 for Stage 0 behaviour). Insights Preview Card active once first log exists. Social/community sections hidden if V2. |
| Stage 1 (First 72 Hours) | Fully active. Counters begin accumulating. Streak bar shifts to quit streak. Content carousel updates to Stage 1 cards (withdrawal normalisation, early health milestones). |
| Stage 2 (Days 4–7) | Fully active. Carousel shifts toward pattern-based coaching cards. |
| Stage 3 (Weeks 2–3) | Fully active. Insights Preview richer. |
| Stage 4 (Weeks 4–8) | Fully active. |
| Stage 5 (Months 3+) | Fully active. Long-term maintenance cards in carousel. |

---

## 2.4 Dependencies

- **Requires:** `onboarding_complete = true` — entry condition for the home screen
- **Reads:** `current_streak`, `consistency_rate`, `freeze_stock` from Streak System
- **Reads:** `money_saved`, `time_reclaimed`, `cigarettes_not_smoked` from Progress Dashboard calculation engine
- **Reads:** `quit_date`, `intent`, `first_name`, `current_stage`, `motivation` from onboarding_profile / Stage System
- **Reads:** daily content cards from Content System (stage + personalisation filtered)
- **Reads:** top insight summary from Insights System (for preview card)
- **Reads:** next unearned milestone from Content Cards / Milestone System (for Health Milestones card countdown)
- **Writes:** none — home screen is read-only; all writes handled by features it links to
- **Triggered by:** `alert_level = 2` from Insights System — causes Coping Surface Card to render at scroll position 3

---

# PART A — SECTION 3: DESIGN DECISIONS

> **DECISION: Single vertical scroll. No sub-tabs within Home.**
> **Chosen:** One scrollable column of sections.
> **Rejected:** Tabbed layout within the Home tab (e.g. "Today" / "Progress" / "Social" sub-tabs).
> **Rationale:** Sub-tabs add a navigation decision to a screen users visit out of habit. A scroll doesn't require choosing — the user just sees what's there. Priority is communicated by vertical position, not by tab labels.

> **DECISION: Streak bar anchored at top.**
> **Chosen:** Streak display is the first content element after the greeting.
> **Rejected:** Streak buried further down the scroll or moved to the Profile tab.
> **Rationale:** The streak is the fastest read of "how am I doing." It anchors the session emotionally. A clean streak is a positive signal; a freeze icon or concern prompts attention. Everything else contextualises this number.

> **DECISION: Content carousel is inline, not behind a tap.**
> **Chosen:** Carousel cards are visible in the scroll without requiring a tap to reveal them.
> **Rejected:** A collapsed "Content" card that expands to show cards inside.
> **Rationale:** If content requires a deliberate tap to access, users in passive check-in mode never see it. The carousel must be in the scroll path to achieve its daily-awareness function.

> **DECISION: Home screen owns layout only. Feature specs own their component logic.**
> **Chosen:** Progress Dashboard, Streak System, and Insights each maintain their own specs. Home screen spec defines placement, scroll order, and composition only.
> **Rejected:** Each feature spec also documents its own placement on the home screen, giving this spec a lightweight "assembly" role only — but requiring every feature author to know home screen layout conventions.
> **Rationale:** Prevents spec sprawl. Feature teams can update their component without touching this spec. Changes to dashboard calculation logic don't require a home screen spec update.

---

# PART A — SECTION 4: SCREEN INVENTORY

| Screen ID | Screen Name & Description |
|---|---|
| HOME-1 | Home Tab — the main vertically scrollable view. Contains all sections in scroll order. Entry state on every post-onboarding app open. No separate navigation required. |

The home screen is a single scrollable screen (HOME-1) composed of the following sections.

| Scroll Position | Section | Name | Source Spec | V1 Status |
|---|---|---|---|---|
| 1 | A | Greeting | This spec | V1 |
| 2 | B | Streak Bar | [[LastOne_Streak_System_Spec_V1_2]] | V1 |
| 3 | — | Coping Surface Card | [[LastOne_Insights]] (B2.8) | V1 — conditional, alert_level = 2 only |
| 4 | C | Progress Dashboard | [[LastOne_ProgressDashboard_Spec]] | V1 |
| 5 | E | Daily Check-In Card | [[LastOne_Logging_System_Spec]] (Section 8) | V1 |
| 6 | D | Content Carousel | This spec (B2) | V1 |
| 7 | F | Insights Preview Card | [[LastOne_Insights]] | V1 |
| 8 | G | Health Milestones Card | [[LastOne_Content_Cards_V1]], [[LastOne_Streak_System_Spec_V1_2]] | V1 |

> **Excluded from V1 home screen:** Group / Friend Updates (Social Architecture — V2). Donate and Give Back lives inside [[LastOne_PersonalGoals_Spec]], not as a home screen section.

---

# PART A — SECTION 5: FLOW LOGIC

**Entry point:** App open with `onboarding_complete = true`.

---

## HOME-1: Home Tab

### Section A — Greeting

What the user sees: a time-aware greeting line at the very top of the screen.

| Time of Day | Copy |
|---|---|
| Morning (05:00–12:00) | Good morning, [first_name]. |
| Afternoon (12:00–17:00) | Hey [first_name]. |
| Evening (17:00–21:00) | Good evening, [first_name]. |
| Late night (21:00–05:00) | Hey [first_name]. |

No user action on this element.

---

### Section B — Streak Bar

What the user sees: current streak, lifetime total, freeze stock. Defined fully in [[LastOne_Streak_System_Spec_V1_2]]. In Stage 0, shows logging streak. In Stage 1+, shows quit streak.

| User Action | What Happens |
|---|---|
| Taps streak bar | → Streak detail screen (Streak System spec). Out of scope for this spec. |

---

### Coping Surface Card (Conditional — scroll position 3)

**Condition:** Renders only when `alert_level = 2` (Insights System has detected a high-confidence risk window for this user). Absent on all other app opens. Full detection logic owned by [[LastOne_Insights]] spec B2.8.

What the user sees: a quiet nudge card between the Streak Bar and the Progress Dashboard. Copy: "Need a moment?"

| User Action | What Happens |
|---|---|
| Taps card | → Coping tools surface (Layer 1 curated list). Exact routing defined in Insights spec B2.8. |
| Ignores (scrolls past) | Card remains in scroll for the session. No state change. |

---

### Section C — Progress Dashboard

What the user sees: three counter cards — Money Saved, Time Reclaimed, Cigarettes Not Smoked. Defined fully in [[LastOne_ProgressDashboard_Spec]]. In Stage 0, shows preview state (zeroes + preview copy). In Stage 1+, shows live accumulating counters.

| User Action | What Happens |
|---|---|
| Taps a counter card | → DASH-2: Expanded Counter View (Progress Dashboard spec). |

---

### Section D — Content Carousel

What the user sees: a horizontal scroll of 3–5 curated content cards, refreshed once per day. Cards are filtered by `current_stage`, personalisation data, and trigger relevance. Card types: health milestones, myth-busting, motivational prompts, practical tips, gain-frame content. See B2 for selection logic.

| User Action | What Happens |
|---|---|
| Scrolls carousel horizontally | Cards scroll. All loaded cards accessible. |
| Taps a card | Card expands. Visual milestone cards expand inline. Interactive myth-bust cards go full-screen. Reflection/response cards open a text input. |
| Closes expanded card | Returns to home scroll position. |

> **Stage 0 note:** Carousel shows Stage 0-eligible cards — pattern awareness, early habit framing, light motivational content. Health milestone and gain-frame cards do not appear until Stage 1 (no quit-day data to power them).

> **Empty carousel:** If no eligible cards exist for a given stage, the carousel section does not render. The Content System must ensure at least one Stage 0 card is always eligible to prevent this.

---

### Section E — Daily Check-In Card

A persistent home screen card that prompts the user to log before the day ends. Defined in [[LastOne_Logging_System_Spec]] Section 8. Tapping the card opens Flow A (Craving Log).

**Satisfied when:** The user completes any log flow (A, B, C, or D) for that day. For Flow A specifically: any save after A1 (intensity captured) counts — optional fields on A2 do not need to be filled.

**Reset:** `daily_checkin_satisfied` resets to false at midnight in the user's stored timezone. The card reappears the next day.

**GU-1 conflict:** If the Giving Up Support trigger card (GU-1) is active in the same session, it takes priority. The daily check-in card is suppressed for that session and the day still counts as engaged.

| User Action | What Happens |
|---|---|
| Taps card | → Flow A: Craving Log (LOG-A1, Logging System spec). |
| Completes any log flow | Card disappears for the rest of the day. `daily_checkin_satisfied = true`. |
| Ignores (scrolls past) | Card remains in scroll. No state change. |

> **Stage 0:** Not shown. No quit streak exists in Stage 0 and logging is still in the habit-building phase. The logging FAB remains available for voluntary logging.

---

### Section F — Insights Preview Card

A persistent card that surfaces the top-ranked insight from the user's Insights feed. Tapping opens [[LastOne_Insights]] (INS-1). The card reads position 1 of the Insights feed ranking — the same algorithm the Insights screen uses, evaluated on every app open.

**What it shows:**

| State | Display |
|---|---|
| Stage 0, no logs yet | "Log your first cigarette to start seeing your patterns." Tapping opens Insights (INS-1a). |
| Stage 0, logs exist, no insight generated yet | "Your smoking profile is building — check back soon." Tapping opens Insights (INS-1). |
| Stage 0+ with insight available, `tone_sensitivity = low` | Category label + full headline from top-ranked insight card. E.g. "PATTERN — Boredom is your real trigger, not stress." |
| Stage 0+ with insight available, `tone_sensitivity = high` | Category label only, no headline. E.g. "PATTERN — Tap to see your latest insight." High-sensitivity cards (slip pattern, risk window) are not headlined on the home screen. |

**What it does not show:** The card body, expanded detail, or any transparency line. Those live in the Insights screen. The home screen card is a hook only.

**Update cadence:** Reflects the current top-ranked card on every app open. If the user taps and reads the top insight, it gets deprioritised in the ranking and the next app open will show a different card at position 1.

**Tone sensitivity guardrail:** The `tone_sensitivity` field on each `insight_card` (Insights spec B1.1) drives this. Low-sensitivity cards (Learning Week profile, craving drop, tool effectiveness) show the full headline. High-sensitivity cards (slip pattern, peak risk window) show category label only — the user needs the full context of the Insights screen before reading those.

| User Action | What Happens |
|---|---|
| Taps card | → Insights screen (INS-1). |
| Ignores (scrolls past) | Card remains. No state change. |

**Stage behaviour:**

| Stage | Behaviour |
|---|---|
| Stage 0, no logs | Empty state prompt visible. |
| Stage 0, logs exist | Profile-building insight visible as soon as first insight card generates (no threshold — Learning Week cards surface immediately per Insights spec B2.3). |
| Stage 1+ | Always has content — Learning Week data carries forward as baseline. |

---

### Section G — Health Milestones Card

A persistent card below the content carousel. Not carousel content — it is a fixed element that is always present in V1 once Stage 1 begins. Links to the full Health Milestone Timeline (STK-8 in the Streak System spec).

**What it shows:**

| State | Display |
|---|---|
| Stage 1+, quit_date set, milestones in progress | "Next: [milestone name] in [X days / X hours]" — forward-looking countdown only. |
| Stage 1+, all milestones earned (15+ years) | "Your body has fully recovered. Every day smoke-free is a day it stays that way." — persistent. |
| Stage 0, quit_date set (quit day not yet reached) | "Your recovery starts in [X days]. You'll see your body change here." Tapping navigates to STK-8. |
| Stage 0, no quit_date | "You'll see your body's recovery here once you set a quit date." Tapping navigates to Settings (quit date picker). |
| After full relapse, no active quit attempt | Same as Stage 0 no quit_date. Teaser visible until user begins a new quit attempt. |

**Countdown logic:** Reads `current_attempt.quit_date` from the active quit attempt and compares to `now()`. Calculates time remaining to next unearned milestone from the YB card set (Content Cards spec). Shows days if > 48 hours away; shows hours if within 48 hours.

**What it does not show:** The card shows only the next upcoming milestone. Earned milestones and ghost states are not surfaced here — they live in the full STK-8 timeline. The card is forward-looking only.

**Relapse signal:** After a full relapse, the user's quit attempt ends (`ended_at` is set on the quit_attempts record). If no new attempt has been started, the card shows the teaser state. Once the user begins a new quit attempt, the countdown restarts from the new `current_attempt.quit_date`. The countdown resetting to a larger number is the visible home screen signal that a restart has happened — the card does not use explicit failure language.

> **Data model note:** quit attempts are stored as a history table (`quit_attempts`), not as a single overwritten field. Each restart creates a new row. The active attempt is the row where `ended_at IS NULL`. This preserves lifetime progress counter history across restarts. See Progress Dashboard spec B2 — that spec's calculation logic needs updating to reference `current_attempt.quit_date` rather than a single `quit_date` field.

**Tap behaviour:**
- If milestones have been earned: opens the most recently unlocked YB card inline (from Content Cards spec YB-01 through YB-15 set).
- If Stage 1 started but no milestones earned yet: opens STK-8 to show the upcoming timeline.
- If in teaser state (no quit_date): navigates to Settings (quit date picker).
- If in pre-quit teaser (quit_date set, not yet reached): opens STK-8 preview.
- If all milestones earned: opens STK-8.

**Stage behaviour:**

| Stage | Behaviour |
|---|---|
| Stage 0, no quit_date | Card visible. Teaser: set a quit date. |
| Stage 0, quit_date set | Card visible. Pre-quit teaser: recovery starts in X days. |
| Stage 1+ | Card visible. Shows countdown to next milestone. |
| All milestones earned | Card visible. Persistent completion message. |
| Paused (`streak_status = paused`) | Card visible. Countdown continues — pause does not affect `current_attempt.quit_date` or the health timeline. |

---


# PART A — SECTION 6: STAGE-BY-STAGE BEHAVIOUR

| Stage | Behaviour Detail |
|---|---|
| Stage 0 (Learning Week) | Greeting active. Streak bar shows logging streak (not quit streak). Dashboard counters show preview state (zeroes, "once you quit" copy from DASH spec). Content carousel shows Stage 0-filtered cards. Daily Check-In card: see P1. Insights Preview Card visible once first log exists. |
| Stage 1 (First 72 Hours) | All sections active. Dashboard counters begin accumulating from quit_date. Streak bar shifts to quit streak. Content carousel refreshes to Stage 1 cards. |
| Stage 2 (Days 4–7) | Fully active. Content carousel shifts toward pattern-based coaching. Insights richer with accumulating data. |
| Stage 3 (Weeks 2–3) | Fully active. Insights Preview can surface declining craving trend data. |
| Stage 4 (Weeks 4–8) | Fully active. |
| Stage 5 (Months 3+) | Fully active. Content carousel shows long-term maintenance and reflection cards. |

---

# PART A — SECTION 7: COPY

> The home screen owns minimal copy of its own. Most copy is owned by the sections it references. This section covers copy unique to the home screen.

### Greeting

See Section 5A above. Low-sensitivity, single version, no voice variants.

### Empty States

| Scenario | Copy |
|---|---|
| First open, Stage 0, no logs yet | Nothing to show yet — log your first cigarette to get started. |
| Insights Preview Card — no logs yet | Log a few cigarettes and we'll start finding your patterns. |
| Content carousel — no eligible cards | *(Section does not render — no empty state shown to user.)* |

> Voice-variant copy for high-sensitivity moments (craving states, milestones, slip responses) is owned by the respective feature specs. The home screen does not own or reproduce that copy.

### Coping Surface Card

Copy delegated to [[LastOne_Insights]] spec B2.8. Recorded here for reference.

- Card label: "Need a moment?"

### Insights Preview Card

Low-sensitivity copy. Single version (neutral-warm tone).

| State | Copy |
|---|---|
| Stage 0, no logs yet | "Log your first cigarette to start seeing your patterns." |
| Stage 0, logs exist, no insight generated yet | "Your smoking profile is building — check back soon." |
| Insight available, `tone_sensitivity = high` | "[CATEGORY LABEL] — Tap to see your latest insight." |
| Insight available, `tone_sensitivity = low` | "[CATEGORY LABEL] — [Full insight headline from Insights feed]" |

> The insight headline itself is generated and owned by the Insights System. This spec owns only the wrapper states.

### Health Milestones Card

Low-sensitivity states — single version (neutral-warm tone):

| State | Copy |
|---|---|
| Countdown active | "Next: [milestone name] in [X days]" / "Next: [milestone name] in [X hours]" |
| Pre-quit teaser (quit_date set, not yet reached) | "Your recovery starts in [X days]. You'll see your body change here." |
| All milestones earned | "Your body has fully recovered. Every day smoke-free is a day it stays that way." |
| No quit_date set (first use) | "You'll see your body's recovery here once you set a quit date." |

Post-relapse teaser — high-sensitivity (shown when `quit_date → NULL` after a full relapse). **Draft — review before shipping:**

| Voice Style | Copy |
|---|---|
| Steady & Direct | "You'll see your recovery here once you set a new quit date." |
| Emotional & Understanding | "When you're ready to set a new date, your recovery timeline will be right here waiting." |
| Light & Honest | "Your body's still got the receipts. Set a new date and we'll pick up where you left off." |

---

# PART A — SECTION 8: EDGE CASES

| Scenario | Behaviour |
|---|---|
| Stage 0, no logs yet (first open) | Carousel shows Stage 0 cards. Dashboard shows preview state. Insights preview hidden. Daily Check-In: see P1. |
| User has no quit date set (figuring_out, indefinite Stage 0) | Home screen active throughout Stage 0. Dashboard continues preview state. Nudge notifications (defined in Onboarding spec B3) handle quit date prompts. Home screen does not itself surface a quit date prompt. |
| User returns after long absence (2+ days) | Streak System return modal fires before home screen renders. After resolution, home renders normally with recalculated values. |
| User just had a slip | Streak bar shows updated state (freeze consumed or streak paused). Dashboard counters show deducted values. Home renders normally — no special alert or error state. |
| No internet connection | Dashboard counters, streak bar, and carousel all render from cached local state. Offline indicator handled at app level, not home screen level. |
| Carousel has no eligible cards for this stage | Carousel section does not render. Content System must ensure at least one Stage 0 card is always eligible to prevent a visible gap. |

---

# PART B — SYSTEM LOGIC

## B1. Data Inputs (Read-Only)

The home screen does not write data. It reads from:

| Field | Source | Purpose |
|---|---|---|
| first_name | onboarding_profile | Greeting |
| current_stage | Stage System | Section visibility, carousel filtering |
| intent | onboarding_profile | Stage 0 rendering variant |
| quit_date | quit_attempts (current_attempt.quit_date) | Stage 0 vs Stage 1+ display switch; Health Milestones countdown |
| motivation | onboarding_profile | Carousel personalisation boost (B2) |
| current_streak | Streak System | Streak bar |
| consistency_rate | Streak System | Streak bar |
| freeze_stock | Streak System | Streak bar |
| money_saved | Progress Dashboard engine | Counter card |
| time_reclaimed | Progress Dashboard engine | Counter card |
| cigarettes_not_smoked | Progress Dashboard engine | Counter card |
| daily_content_cards | Content System | Carousel (see B2) |
| top_insight_summary | Insights System | Insights preview card |

---

## B2. Content Carousel Selection Logic

Reproduced from Product Foundations V1 (B5.2) for build reference.

```
On each app open, select 3–5 cards for the carousel:

Step 1 — Filter:
  delivery_stages includes current_stage
  AND unlock_condition met (stage >= X for that card)

Step 2 — Sort:
  Primary: by priority ascending (1 = highest priority)
  Secondary: by trigger relevance
    - time_of_day matches a known trigger_time_window for this user
    - card's trigger_condition matches recent craving context tag
    - stage_entry event if current_stage was just entered

Step 3 — Deduplicate:
  Max 1 card per content type per carousel load
  Types: health_milestone | myth_bust | reflective_prompt | practical_tip | gain_frame

Step 4 — Freshness:
  Cards shown in the last 24 hours are deprioritised unless priority = 1

Step 5 — Personalisation boost:
  Gain-frame cards whose category matches user's primary_motivation
  receive +1 priority boost
  (money-motivated user → money gain-frame cards score higher)
```

---

## B2.2 Health Milestone Countdown Display Rule

```
IF time_to_next_milestone > 48 hours
  THEN display as days: "Next: [milestone name] in [X days]"
ELSE IF time_to_next_milestone <= 48 hours
  THEN display as hours: "Next: [milestone name] in [X hours]"

Where:
  time_to_next_milestone = unlock_time_of_next_unearned_milestone - now()
  unlock_time_of_next_unearned_milestone = quit_date + milestone_offset_hours
  milestone_offset_hours sourced from YB card set (Content Cards spec)
```

---

## B3. Notification Logic

No notifications are originated by the home screen itself. Notifications for daily check-in reminders, content cards, and insights prompts are owned and triggered by their respective feature specs (Streak System, Onboarding spec, Insights spec).

---

## B4. API Surface

On every app open, home screen reads:

```
GET  /profiles?id=:id
     → first_name, current_stage, quit_date, intent, motivation

GET  /streak?user_id=:id
     → current_streak, consistency_rate, freeze_stock

GET  /dashboard?user_id=:id
     → money_saved, time_reclaimed, cigarettes_not_smoked

GET  /content/carousel?user_id=:id&stage=:stage&date=:today
     → array of content card objects (3–5 items, filtered and sorted per B2)

GET  /insights/preview?user_id=:id
     → top_insight_summary { headline, metric, value }

GET  /milestones/next?user_id=:id
     → { milestone_name, unlocks_at } — next unearned milestone for Health Milestones card countdown
```

All calls are read-only. No writes originate from the home screen.

> **Naming note (Schema A1):** onboarding answers live on the single canonical `profiles` table — there is no separate `onboarding_profiles` table. The onboarding-status check reads `profiles.onboarding_complete`.

---

# OPEN PRODUCT GAPS

---

**[P1] — RESOLVED.** Daily Check-In card is a logging entry point (Flow A — Craving Log), owned by [[LastOne_Logging_System_Spec]] Section 8. Not a streak check-in. Satisfied by any log completion (A, B, C, or D) for the day. Disappears once satisfied; resets at midnight. Not shown in Stage 0. GU-1 card takes priority when both are due in the same session. See Section E for complete spec.

---

**[P2] — RESOLVED.** Health Milestones is a persistent card (Section G), not carousel content. Shows forward-looking countdown to next milestone. Teaser state when quit_date is NULL. Tap opens most recently unlocked YB card inline. Full timeline accessible via STK-8. See Section G for complete spec.

---

**[P3] — RESOLVED.** Insights Preview Card shows the top-ranked insight from the feed (position 1, re-evaluated on every app open). Low-sensitivity cards show full headline; high-sensitivity cards (slip pattern, risk window) show category label only. Two empty states for Stage 0 (no logs vs. logs exist, no insight yet). Updates on every app open as feed ranking shifts. See Section F for complete spec.

---

**[P6] — RESOLVED.** Confirmed scroll order:

| Position | Section | Condition |
|---|---|---|
| 1 | Greeting (A) | Always |
| 2 | Streak Bar (B) | Always |
| 3 | Coping Surface Card | Conditional — only when `alert_level = 2` (user is inside a high-confidence risk window). Owned by [[LastOne_Insights]] spec B2.8. Copy: "Need a moment?" Taps to coping tools. Absent on all other app opens. |
| 4 | Progress Dashboard (C) | Always |
| 5 | Daily Check-In Card (E) | Shown until satisfied (user completes any log flow). Disappears for the rest of the day once done. Not shown in Stage 0. |
| 6 | Content Carousel (D) | Always |
| 7 | Insights Preview Card (F) | Always (empty state shown when no logs exist) |
| 8 | Health Milestones Card (G) | Always (teaser shown when no quit_date set) |

**Rationale for key ordering decisions:**
- Daily Check-In above carousel: it feeds all systems and disappears once done — it is a task, not content. Tasks before content.
- Coping Surface Card between Streak Bar and Dashboard: user sees greeting and streak first (positive context), then the quiet nudge. Not the first thing they see. Dashboard and rest of screen follows normally beneath it.
- Greeting is a standalone line above the Streak Bar, not part of it.

---

**[P7] — RESOLVED (T-B Decision 6 / U4 + U5).** Post-slip home-surface precedence. After a slip, several surfaces can want the home screen at once. Fixed precedence:

| Priority | Surface | Condition |
|---|---|---|
| 1 | **STK-5 Streak Reset state** | Whenever the streak just reset this session. This is the home screen's *mode* post-slip (Streak Bar renders in reset state), not a card competing for a slot — it always wins. |
| 2 | **GU-1 card** (Giving Up Support) | Stage 2+ **and** `slip_type = return_to_smoking` only. Activates on **next app open**, never immediately from C3 (U5) — clean hand-off, so it does not collide with C3 in the same session. When present, it sits above the carousel and suppresses the daily check-in card for that session (per Section E / [P1]). |
| 3 | **Content carousel** | Renders beneath both, in standard P6 scroll order. `slip_logged` content cards do **not** inject into C3 — that card trigger defers to next app open (Content Cards / T-B Decision 3). |

Rationale: STK-5 is a screen state, not a card, so it never queues against cards. GU-1 is the heaviest intervention and only fires on a declared return-to-smoking — it earns the top card slot when eligible. The carousel is ambient and always yields. This resolves the three-way collision (STK-5 vs GU-1 vs carousel) that P6 left open for the post-slip case.

---

## Document Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | May 2026 | Vedant | Initial draft. P4 resolved (Donate and Give Back lives in Personal Goals, not home screen). P5 resolved (Group/Friend Updates is V2 — excluded). 4 product gaps remain (P1–P3, P6). |
| 1.1 | May 2026 | Vedant | P1 resolved (Daily Check-In = Logging System Section 8 prompt). P2 resolved (Health Milestones persistent card — Section G written). Streak System naming conflict fixed (quit_start_date → quit_date). Pause/break path quit_date behaviour defined in Streak System spec. 2 product gaps remain (P3, P6). |
| 1.2 | May 2026 | Vedant | P3 resolved (Insights Preview Card — Section F written). Coping surface card (alert_level = 2) identified as conditional home screen element; to be incorporated in P6 scroll order. 1 product gap remains (P6). |
| 1.3 | May 2026 | Vedant | P6 resolved (scroll order confirmed). All 6 product gaps resolved. Spec review pass: P1 gap cleaned up (Section E rewritten from Logging spec Section 8). Coping Surface Card flow stub added to Section 5. Section 7 expanded with Sections F + G copy and post-relapse voice variant drafts. B2 milestone countdown logic formalised. B4 milestone API call added. Minor: Decision 4 rejected alternative, dependencies Requires/Triggers, user story physical settings. |

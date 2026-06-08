# LastOne Progress Dashboard Spec v1.2

| Version | 1.2 |
| --- | --- |
| Date | April 2026 |
| Status | Draft |
| Stage Scope | Stage 0 — Stage 5 |
| Feature Prefix | DASH |
| Author | Vedant |
| Changed from V1.0 | B3, B4 added; Stage 0 copy completed; Flow 2 dead ends resolved; slip_type enum note added; smoke_free_days source clarified; DASH-3 ownership noted; null state edge cases completed; Stage 3 community reference scoped; duplicate metric removed; cigarettes_per_day type note added; streak screen ID noted. |

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — Progress & Gain-Frame content type (Foundation 5)
- [[LastOne_Streak_System_Spec_V1_2]] — streak data drives all three dashboard counters
- [[LastOne_PersonalGoals_Spec]] — goals allocate the money-saved counter shown here
- [[smoking_cessation_priority_analysis]] — Awareness vs. Impact Gap; this dashboard is the primary design response

---

## Purpose & Problem Statement

### Why

A user who quits smoking needs a reason to keep the app open on days when they don't feel a craving. On a good day, there's no emergency, no SOS, no logging event — so there's no pull to check in. Without a reason to return, the app goes quiet, and so does the quit attempt.

### Problem

Most cessation apps offer progress data that feels medical or abstract — days clean, a lung diagram, a life-expectancy ticker. For a 20-year-old in Chennai or Pune, none of that hits home. The data exists but it doesn't connect. There's no moment of 'oh, that's actually me.'

### Goal

A home-screen dashboard that answers one question every time the user opens the app: what have I gained by not smoking? Not what they avoided. Not what they sacrificed. What they got back. Three counters, all framed as gains, all personalised to things the user actually cares about.

---

## User Story

*Priya is in her second week at her first job. She used to smoke 4–5 cigarettes a day during college. She opens LastOne on her lunch break — not because she's craving, just habit. The dashboard shows ₹840 saved. Below it: 'That's 2 Swiggy orders.' She laughs a little. She's been thinking about ordering dinner this weekend. Below that, 49 cigarettes she didn't smoke. She doesn't tap anything. She just looks at it for a few seconds, then closes the app. She'll open it again tomorrow.*

---

## Success Metrics

- Dashboard is visible without any tap — present on home screen every session.
- Money Saved counter viewed on 70%+ of sessions in the first month.
- Reference cards in the expanded view are scrolled past the first card by at least 60% of users who open it. (This also serves as the measure of relatable equivalent resonance.)
- No counter ever shows ₹0 after Day 1 — the number always reflects real accumulation.

---

## PART A: FEATURE MECHANICS

## 1. Feature Overview

### 1.1 What This Feature Does

The Progress Dashboard is the main content area of the home screen. It shows the user three running counters — money saved, time reclaimed, and cigarettes not smoked — all framed as gains. Each counter is personalised with a relatable equivalent the user selects during onboarding. The counters never reset to zero; they only ever go up, or come down slightly from slips. The dashboard is always visible. No tap required.

### 1.2 Where It Lives in the App

Home screen, middle section. Below the streak display (current streak + lifetime total + freeze stock), above the daily check-in card. Always visible on first open. Not behind a tab or navigation action.

### 1.3 Stage Relevance

| Stage | Feature Status / Behaviour |
| --- | --- |
| Stage 0 (Learning Week) | Dashboard visible. All three counters show ₹0 / 0 hours / 0 cigarettes. Personalised equivalent placeholder visible but inactive. Used as motivational preview. |
| Stage 1 (First 72 Hours) | Fully active. Counters begin accumulating from quit date. Relatable equivalent updates live. |
| Stage 2 (Days 4–7) | Fully active. Expanded view available. First reference cards beginning to unlock as cigarette milestones are crossed. |
| Stage 3 (Weeks 2–3) | Fully active. Money Saved likely in ₹500–₹1,000 range. Equivalent copy becomes meaningful. |
| Stage 4 (Weeks 4–8) | Full feature active. Higher milestone reference cards unlocking. User likely seeing cards they couldn't access in early weeks. |
| Stage 5 (Months 3+) | Fully active. Long-term counters prominent. Dashboard remains primary home screen feature. |

### 1.4 Dependencies

- Reads: quit_date, cigarettes_per_day, price_per_cigarette from onboarding data.
- Reads: relatable_category (Food Delivery / Movies & OTT / Music & Podcasts / Travel / Gaming / Clothes & Shopping) from onboarding.
- Reads: slip logs from the Logging System — cigarettes actually smoked on slip days.
- Reads: current_stage from the Stage System.
- Reads: current_streak, lifetime_smoke_free_days from the Streak System.
- Reads: unlocked_milestones from the Milestone System — determines which reference cards are in active state.
- Writes: none. Dashboard is read-only. All writes are handled by the Logging System.

---

## 2. The Three Counters

The dashboard answers one question — 'what have I gained?' — through three running totals. Each counter displays two lines: the raw number, and a personalised equivalent the user chose at onboarding. Both lines update whenever the underlying data changes.

### 2.1 Money Saved

| Field | Detail |
| --- | --- |
| Calculation | smoke_free_days × cigarettes_per_day × price_per_cigarette |
| Pricing basis | Loose cigarette pricing, ₹10–₹20 per stick. Set during onboarding. Not pack pricing. |
| Display — line 1 | Rupee amount. Example: ₹2,340 saved |
| Display — line 2 | Personalised equivalent. Example: 'That's 13 Zomato orders' or '2 months of Spotify' |
| On a slip day (freeze used) | Deducts cost of cigarettes actually smoked that day. Does not zero the total. |
| On relapse (streak reset) | Deducts cost of cigarettes smoked during relapse period. Lifetime total preserved minus actual spend. |

> Relapse behaviour example: User saves ₹4,000 over 30 days. Relapses and smokes for 3 days at their usual rate (5 cigarettes/day × ₹12 = ₹60/day). Counter shows ₹4,000 − ₹180 = ₹3,820. The number goes down by exactly what was spent — not to zero.

### 2.2 Time Reclaimed

| Field | Detail |
| --- | --- |
| Calculation | smoke_free_days × cigarettes_per_day × 7 minutes |
| 7-minute basis | Average duration of a full smoking break: walk out + smoke + return. Conservative estimate. |
| Display — line 1 | Hours and minutes. Example: 18 hours reclaimed |
| Display — line 2 | Personalised equivalent. Example: 'That's 9 episodes of your show' or 'a full road trip playlist' |
| On a slip day (freeze used) | Deducts 7 minutes per cigarette smoked that day. |
| On relapse (streak reset) | Same deduction logic as Money Saved. Lifetime total preserved minus actual time spent. |

### 2.3 Cigarettes Not Smoked

| Field | Detail |
| --- | --- |
| Calculation | lifetime_smoke_free_days × cigarettes_per_day − cigarettes_logged_as_smoked |
| Display | Raw number only. Example: 247 cigarettes you didn't smoke |
| No equivalent | This counter is purely psychological. The number itself is the point. |
| On a slip day (freeze used) | Deducts the number of cigarettes logged as smoked in Flow C. |
| On relapse (streak reset) | Deducts all cigarettes smoked during relapse period. Total preserved minus actual cigarettes. |

> Design intent: 247 cigarettes is a physical, tangible concept. A 22-year-old can picture 247 cigarettes. They cannot picture ₹2,340 in the same way. This counter makes the abstract concrete.

---

## 3. Design Decisions

> **DECISION: COUNTERS NEVER RESET TO ZERO ON RELAPSE.**
>
> Rationale: Resetting to zero is the design equivalent of wiping someone's savings account because they had a bad week. It's not accurate — a person who smoked for 3 days after 30 smoke-free days did not un-save ₹4,000. They spent some of it. The counter reflects what actually happened. This also removes a significant fear of relapse: if a slip costs you 'everything', the system is punishing honesty. If it costs you only what you actually smoked, the system is being fair.

> **DECISION: RELATABLE EQUIVALENTS, NOT RAW NUMBERS ALONE.**
>
> Rationale: ₹2,340 means different things to different people. '13 Zomato orders' means something specific to a college student in Hyderabad who orders food 2–3 times a week. The equivalent collapses an abstract number into a lived reference. The category is chosen by the user at onboarding — not assigned — because the right equivalent depends on what they actually spend money on. Spotify means nothing to someone who doesn't use it.

> **DECISION: NO FEAR-BASED STATS ON THE DASHBOARD.**
>
> Rationale: No tar inhaled, no 'your lungs looked like this,' no cancer risk percentage. The research is consistent: fear messaging is ineffective with 18–25 year olds and frequently triggers reactance — the opposite of the intended behaviour. Everything on this dashboard is gain-framed. What the user got back, not what the cigarette took.

> **DECISION: NO LIFE EXPECTANCY CALCULATOR.**
>
> Rationale: Life expectancy gained ('you've added 2.3 hours to your life') sounds meaningful but lands as noise for a 20-year-old. The temporal horizon is too far. A 22-year-old does not make decisions based on what happens at 68. Money and time are immediate, tangible, and real. Those are the two variables that work.

> **DECISION: HEALTH TIMELINE IS EXCLUDED FROM THIS SPEC.**
>
> Rationale: The health recovery timeline (20 minutes → 1 year of body milestones) has its own relapse logic, milestone unlock system, and content requirements. It is complex enough to warrant a standalone spec. It is not part of the Progress Dashboard. The dashboard is strictly about the three counters.

---

## 4. Screen Inventory

| Screen ID | Screen Name & Brief Description |
| --- | --- |
| DASH-1 | Home Dashboard — the main home screen view. User sees streak display (top), three counter cards (middle), daily check-in card (bottom). This is not a separate screen — it is the home screen's content area. |
| DASH-2 | Expanded Counter View — full-screen view that opens when a user taps a counter card. Shows the scale ladder at the top, followed by a horizontal scroll of reference cards — active (unlocked) and inactive (locked but visible). |
| DASH-3 | Onboarding — Equivalent Category Picker — appears once during onboarding. User picks which category they care about for their personalised equivalent. Note: Onboarding spec has not yet been written. Screen ownership to be confirmed and potentially transferred to the Onboarding spec when it is created. |

---

## 5. Flow Logic

### Flow 1 — Dashboard Load (Every App Open)

*Entry point: User opens the app.*

#### DASH-1: Home Dashboard

What the user sees: Streak display at top. Three counter cards in the middle — Money Saved, Time Reclaimed, Cigarettes Not Smoked. Each card shows the current total and the personalised equivalent. Daily check-in card below.

| User Action | What Happens |
| --- | --- |
| Taps a counter card | → DASH-2: Expanded Counter View for that specific counter. |
| Taps the streak display | → STREAK-[X] (Streak System detail screen — screen ID to be confirmed against Streak System spec). Out of scope for this spec. |
| Takes no action | Dashboard remains visible. Counters are static until next data update (midnight calculation or slip log event). |

### Flow 2 — Expanded Counter View

*Entry point: User taps any counter card on DASH-1.*

#### DASH-2: Expanded Counter View

What the user sees: Two sections, stacked vertically.

#### Section 1 — Scale Ladder

Four rows showing the user's count at increasing time scales, calculated from their personal cigarettes_per_day. Simple, stacked, no chart.

| Row | Label | Value (example: 3/day user) |
| --- | --- | --- |
| Daily | per day | 3 cigarettes |
| Weekly | per week | 21 cigarettes |
| Monthly | per month | 90 cigarettes |
| Yearly | per year | 1,095 cigarettes |

> The scale ladder is personalised. A 10-a-day smoker sees 10 / 70 / 300 / 3,650. All four rows are always visible. The point is to let the yearly number land — it is usually the one that surprises people.
>
> For Money Saved and Time Reclaimed, the same ladder logic applies using rupees and hours respectively. Example for a ₹15/cigarette, 3/day user: ₹45/day → ₹315/week → ₹1,350/month → ₹16,425/year.
>
> For Time Reclaimed: 21 min/day → 2.5 hrs/week → 10.5 hrs/month → 127 hrs/year.

#### Section 2 — Reference Cards (Horizontal Scroll)

A horizontal scroll row of cards sits below the scale ladder. Each card corresponds to a milestone threshold defined in the Milestone System. All cards are always visible in the scroll. Cards the user has crossed are in active state. Cards they have not yet reached are in inactive state — readable, but visually dimmed.

| Card State | Visual Treatment | User Interaction |
| --- | --- | --- |
| Active (milestone crossed) | Full colour. Card title and content fully visible. Tappable to read in full. | Tap expands the card. Content is readable. |
| Inactive (milestone not yet crossed) | Dimmed / greyed out. Title visible. Content readable but visually de-emphasised. | Tappable but shows: 'Keep going — you'll unlock this one.' No full expand. |

> Tone note: Reference cards in the expanded view are permitted to carry slightly darker or more confrontational framing than the main dashboard. The user has tapped in deliberately — they want to feel the weight of the number, not just celebrate it. Cards may reference environmental impact, physical equivalents, or cultural scale references. They should never tip into clinical fear messaging.

**User actions on DASH-2**

| User Action | What Happens |
| --- | --- |
| Taps a counter card on DASH-1 | → DASH-2 opens. Scale ladder visible immediately. Reference cards scroll below. |
| Scrolls the reference card row | Cards scroll horizontally. All milestone cards visible — active and inactive. |
| Taps an active card | Card expands to show full reference content. |
| Taps an expanded active card again | Card collapses back to its default card state within the scroll row. No data changed. |
| Taps an inactive card | Brief message: 'Keep going — you'll unlock this one.' No full expand. |
| Taps Back / swipes down from within an expanded card | Collapses card first, returns user to the scrollable DASH-2 view. Second back/swipe returns to DASH-1. |
| Taps Back / swipes down from DASH-2 (no card expanded) | Returns to DASH-1. No data changed. |

### Flow 3 — Onboarding Category Pick

*Entry point: During onboarding, after cigarettes/day and price/cigarette are collected.*

#### DASH-3: Equivalent Category Picker

What the user sees: A single screen with the question 'What do you spend money on?' and six tappable options: Food Delivery, Movies & OTT, Music & Podcasts, Travel, Gaming, Clothes & Shopping. No option is pre-selected — the user must make an active choice.

| User Action | What Happens |
| --- | --- |
| Taps a category | Selected. Brief animation. 'Next' button activates. |
| Taps 'Next' | relatable_category saved to user profile. Onboarding continues. |
| Taps Back | Returns to previous onboarding screen. Selection not saved yet. |
| Skips onboarding / abandons mid-flow | relatable_category remains null. System applies 'food_delivery' as backend default silently on first dashboard load. User can change in Settings. |

---

## 6. Stage-by-Stage Behaviour

| Stage | Behaviour Detail |
| --- | --- |
| Stage 0 (Learning Week) | Dashboard visible as a preview. All three counters show zero. The personalised equivalent is visible as a preview: 'Once you quit, every day saves you ₹[daily_rate].' / 'Once you quit, you'll reclaim [X] minutes every day.' / 'Once you quit, that's [N] fewer cigarettes every day.' Expanded view not accessible. Goal is motivational — show what's coming, not what exists yet. |
| Stage 1 (First 72 Hours) | All three counters activate from quit_date. Calculating live. Expanded view accessible. Scale ladder shows live numbers from the first hour. First reference cards may already be in active state if early milestones are crossed. |
| Stage 2 (Days 4–7) | Full feature active. More reference cards unlocking as cigarette count grows. Inactive cards visible and readable — they serve as targets. |
| Stage 3 (Weeks 2–3) | Full feature active. Note: A future version may surface dashboard data in community milestone cards via the Social Architecture feature. This is not in scope for V1 and is dependent on the Social Architecture feature shipping. |
| Stage 4 (Weeks 4–8) | Full feature active. Higher milestone reference cards unlocking. User is seeing cards they couldn't access in early weeks — a visible sign of progress. |
| Stage 5 (Months 3+) | Full feature active. Long-term users have unlocked most or all reference cards. The yearly row of the scale ladder carries significant numbers by now. |

---

## 7. Copy

> Copy sensitivity note: The dashboard itself is low-sensitivity — it's showing gains, not responding to craving or slip. Counter labels are single-version copy. Relatable equivalents are populated from a lookup table (see Section B4).

### Counter Card Labels

| Moment | Copy |
| --- | --- |
| Money Saved — primary line | ₹[amount] saved |
| Money Saved — equivalent line | That's [X] [equivalent]. (e.g. 'That's 13 Zomato orders.') |
| Time Reclaimed — primary line | [H] hours [M] minutes reclaimed |
| Time Reclaimed — equivalent line | Enough to [X]. (e.g. 'Enough to watch 9 episodes of your show.') |
| Cigarettes Not Smoked — primary line | [N] cigarettes you didn't smoke |
| Stage 0 preview — Money Saved | Once you quit, every day saves you ₹[daily_rate]. |
| Stage 0 preview — Time Reclaimed | Once you quit, you'll reclaim [X] minutes every day. |
| Stage 0 preview — Cigarettes Not Smoked | Once you quit, that's [N] fewer cigarettes every day. |
| Stage 0 preview — equivalent line (all counters) | Equivalent placeholder shown but inactive. Example: 'That could be your next Zomato order.' |

### Expanded Counter View — Scale Ladder Labels

| Label | Copy |
| --- | --- |
| Scale ladder row — daily | per day |
| Scale ladder row — weekly | per week |
| Scale ladder row — monthly | per month |
| Scale ladder row — yearly | per year |
| Inactive reference card tap response | Keep going — you'll unlock this one. |

> Reference card copy (the actual contextual statements that appear on each milestone card) is not defined in this document. It is covered in the Reference Cards Content Doc, to be written separately.

### Onboarding — Category Picker

| Moment | Copy |
| --- | --- |
| Screen title | What do you spend money on? |
| Screen subtitle | We'll show your savings in something that actually means something to you. |
| Food Delivery option | Food Delivery |
| Movies & OTT option | Movies & OTT |
| Music & Podcasts option | Music & Podcasts |
| Travel option | Travel |
| Gaming option | Gaming |
| Clothes & Shopping option | Clothes & Shopping |

---

## 8. Edge Cases

| Scenario | Behaviour |
| --- | --- |
| User is on Day 0 / Stage 0 | All counters show 0. Preview copy visible. Expanded view not accessible. |
| User has not picked an equivalent category | Backend applies 'food_delivery' as silent default. User can change in Settings. |
| price_per_cigarette not set (onboarding incomplete) | Money Saved counter shows a dash '—' with prompt: 'Set your cigarette cost to track savings.' Tapping navigates to Settings. |
| cigarettes_per_day not set (onboarding incomplete) | All three counters show a dash '—' with prompt: 'Set your daily cigarettes to track your progress.' Tapping navigates to Settings. |
| quit_date not set (onboarding incomplete) | All three counters show a dash '—' with prompt: 'Set your quit date to start tracking.' Tapping navigates to Settings. |
| User relapsed and counters went down slightly | Counters update to reflect deduction. No alert, no error state. The number simply reflects reality. |
| User relapsed and restarted — very low counter value | Counter shows lifetime total, which may be very small if they smoked heavily. This is correct. It is still positive. |
| User has crossed a milestone but app was offline | Milestone unlock is calculated on next app open. Card moves to active state retroactively. No notification fired for offline-period milestones. |
| All reference cards are in inactive state (very early user) | Scroll row still visible. Inactive cards readable. Serves as a preview of what's coming. At minimum one card should always be within reach — milestone thresholds should account for this. |
| Counter value is very high (Stage 5, long-term user) | No cap on counter values. Display adjusts: ₹12,340 becomes ₹12.3K for readability above ₹9,999. |
| No internet connection | Counters calculate locally — all required data is stored on-device. Scale ladder and reference cards both work offline. Milestone unlock state is cached locally. |

---

## PART B: SYSTEM LOGIC FOR IMPLEMENTATION

## B1. Data Inputs (Read-Only)

The Progress Dashboard does not write any data. It reads from these existing tables:

| Field | Source Table | Updated By | Notes |
| --- | --- | --- | --- |
| current_attempt.quit_date | quit_attempts (row where ended_at IS NULL) | Logging / Settings | Defines start of current quit attempt. Lifetime calculation also reads ended_at and quit_date from all completed rows. |
| cigarettes_per_day | profiles | Onboarding / Settings | Must be stored as a whole integer. If onboarding allows a range input, round to nearest integer before storing. Canonical savings baseline (T-D). |
| price_per_cigarette | profiles | Onboarding / Settings | Loose cigarette price (₹10–₹20). Editable in Settings. |
| relatable_category | profiles | Onboarding / Settings | Selected at onboarding. Enum: food_delivery \| movies_ott \| music_podcasts \| travel \| gaming \| clothes_shopping. Defaults to food_delivery if null. |
| cigarettes_logged_as_smoked | log (WHERE log_type = 'slip') | Logging System | SUM(cigarette_count) from all Flow C slip log entries. Deducted from Cigarettes Not Smoked counter. |
| current_stage | stage_system | Stage System | Controls which UI behaviours are active. |
| current_streak_days | streak_record | Streak System | Displayed at top of home screen above dashboard. |
| lifetime_smoke_free_days | streak_record | Streak System | Read for reference. Where this value diverges from the locally derived smoke_free_days in B2, the B2 formula is canonical. |

---

## B2. Calculation Logic

### Shared Variable

```
lifetime_smoke_free_days =
  SUM across all completed quit attempts of:
    MAX(0, (attempt.ended_at − attempt.quit_date in days) − days_smoked_in_attempt)
  + MAX(0, (today − current_attempt.quit_date in days) − days_smoked_in_current_attempt)

Where:
  current_attempt        = row in quit_attempts where ended_at IS NULL
  completed attempt      = row in quit_attempts where ended_at IS NOT NULL
  days_smoked_in_attempt = count of distinct calendar days where:
                             log.slip_type = 'return_to_smoking'
                             AND log.timestamp >= attempt.quit_date
                             AND log.timestamp < attempt.ended_at
                           (inclusive of quit_date, exclusive of ended_at)

Stage 0 guard: if no row exists in quit_attempts where ended_at IS NULL,
  lifetime_smoke_free_days = 0. This state is handled at the display layer
  (Stage 0 shows preview zeroes) but the formula must not break on a null attempt.

MAX(0, ...) guards against data inconsistency — each attempt's contribution
  floors at 0 and cannot go negative.

Freeze days (slip_type = 'one_off') do NOT reduce lifetime_smoke_free_days — they are partial
deductions handled separately in the slip_deductions calculation below.

Implementation note: 'return_to_smoking' and 'one_off' are the canonical slip_type enum values
in the unified `log` table (Logging System spec B1, Schema §3). slip rows are read as
`log WHERE log_type = 'slip'` — there is no separate `craving_log`/`slip_log` table.

Canonical source: This locally derived formula is the canonical source for lifetime_smoke_free_days
in all counter calculations. If the Streak System's lifetime_smoke_free_days value differs, this
formula wins.
```

### Money Saved

```
gross_savings = lifetime_smoke_free_days × cigarettes_per_day × price_per_cigarette

slip_deductions = SUM(cigarettes_smoked_on_slip_days × price_per_cigarette)
                  across all quit attempts (lifetime)

money_saved = gross_savings − slip_deductions

money_saved can never go below ₹0.
```

### Time Reclaimed

```
gross_minutes = lifetime_smoke_free_days × cigarettes_per_day × 7

slip_deductions_minutes = SUM(cigarettes_smoked_on_slip_days × 7)
                          across all quit attempts (lifetime)

time_reclaimed_minutes = gross_minutes − slip_deductions_minutes

Display: hours = FLOOR(time_reclaimed_minutes / 60), minutes = time_reclaimed_minutes MOD 60
```

### Cigarettes Not Smoked

```
gross_not_smoked = lifetime_smoke_free_days × cigarettes_per_day

cigarettes_not_smoked = gross_not_smoked − cigarettes_logged_as_smoked

cigarettes_logged_as_smoked = SUM(cigarette_count) from all Flow C log entries
                               across all quit attempts (lifetime)
                               (log WHERE log_type = 'slip').

cigarettes_not_smoked can never go below 0.
```

---

## B3. Notification Logic

No notifications in this feature. The Progress Dashboard is a passive display element on the home screen. It does not trigger push notifications, scheduled alerts, or in-app notification banners. All counter updates happen silently on the triggers defined in B5. If a milestone is crossed and a notification is warranted, that is owned by the Milestone System, not this feature.

---

## B4. API Surface

The Progress Dashboard performs no write operations. All data is read-only. The following read operations are required:

| Operation | Source | Fields Read | Trigger |
| --- | --- | --- | --- |
| Read user profile | profiles | cigarettes_per_day, price_per_cigarette, relatable_category | App open / counter recalculation |
| Read current quit attempt | quit_attempts | quit_date, ended_at (open row + all completed rows for lifetime calc) | App open / counter recalculation |
| Read slip history | log (WHERE log_type = 'slip') | slip_type, cigarette_count | App open / counter recalculation |
| Read stage | stage_system | current_stage | App open |
| Read streak | streak_record | current_streak_days, lifetime_smoke_free_days | App open |
| Read milestones | milestone_system | unlocked_milestone_ids, milestone_threshold_list | App open / milestone check |

---

## B5. Counter Update Triggers

Counters do not update in real-time second-by-second. They recalculate on these events:

| Trigger Event | What Recalculates |
| --- | --- |
| Midnight (local timezone) | All three counters recalculate for the new day. Milestone check runs against updated cigarettes_not_smoked. |
| User logs a slip (Flow C completes) | All three counters recalculate immediately to reflect the deduction. |
| User returns after missed days (Return Modal completes) | All three counters recalculate for the resolved period. Milestone check runs. |
| User updates cigarettes_per_day or price_per_cigarette in Settings | All three counters recalculate from quit_date using updated values. |
| App foreground event (on open) | Reads last-calculated values. Recalculates only if last calculation was before midnight. Milestone check always runs on open. |

---

## B6. Milestone System — Dependency Note

The reference cards in the expanded view read their unlock state from the Milestone System. The Progress Dashboard does not own or calculate milestones — it only reads which milestones have been crossed and renders cards accordingly.

| What the Dashboard Reads | From |
| --- | --- |
| unlocked_milestone_ids — list of milestone IDs the user has crossed | Milestone System |
| milestone_threshold_list — full list of milestone IDs and their labels (for rendering inactive cards) | Milestone System |

> Milestone thresholds — the specific cigarette counts that trigger each milestone — are defined in the Milestone System spec, not here. This document only specifies that thresholds exist, that they are tied to cigarettes_not_smoked, and that crossing one moves a reference card from inactive to active state.

---

## B7. Relatable Equivalent Lookup

### B7a. Money Equivalent Lookup

Each relatable_category value maps to a lookup function that converts a rupee amount into a human-readable string. The function runs whenever money_saved is updated.

| relatable_category value | Equivalent Unit | Example Output |
| --- | --- | --- |
| food_delivery | Swiggy / Zomato order (₹180 avg) | 'That's 13 Zomato orders.' |
| movies_ott | Movie ticket (₹250 avg) | 'That's 9 movie tickets.' |
| music_podcasts | Spotify Premium monthly (₹119) | 'That's 2 months of Spotify.' |
| travel | Bus/train trip (₹500 avg) | 'That's 4 weekend trips.' |
| gaming | Mobile game top-up / Steam game (₹299 avg) | 'That's 7 gaming top-ups.' |
| clothes_shopping | Myntra/Meesho item (₹499 avg) | 'That's 4 new fits.' |

> If the money_saved amount is less than the cost of one equivalent unit, the copy adjusts: 'Almost enough for your next Zomato order.' This avoids showing '0 orders' which would undercut the gain framing.
>
> Prices should be reviewed quarterly — delivery and subscription costs in India shift. These are defaults that can be updated server-side without an app release.

### B7b. Time Equivalent Lookup

Time Reclaimed maps hours into a human-readable equivalent, also based on relatable_category.

| time_reclaimed_hours Range | Equivalent Reference | Example Output |
| --- | --- | --- |
| < 2 hours | Short form content (YouTube videos, shorts) | 'Enough to watch 8 YouTube videos.' |
| 2–10 hours | TV episodes (40 min avg) | 'Enough to watch [N] episodes.' |
| 10–30 hours | Films (2 hours avg) | 'Enough to watch [N] movies back to back.' |
| 30+ hours | Days of free time | 'That's [N] full days back in your pocket.' |

---

## B8. Data Structure — Dashboard State

| Field | Type | Updated By | Notes |
| --- | --- | --- | --- |
| money_saved | integer (paise) | Calculation engine | Stored in paise to avoid float errors. Display divides by 100. |
| time_reclaimed_minutes | integer | Calculation engine | Raw minutes. Display converts to H hrs M mins. |
| cigarettes_not_smoked | integer | Calculation engine | Direct count. Also the input used by Milestone System for unlock checks. |
| relatable_category | string (enum) | Onboarding / Settings | food_delivery \| movies_ott \| music_podcasts \| travel \| gaming \| clothes_shopping. Defaults to food_delivery if null. |
| last_calculated_at | datetime | Calculation engine | Used to determine if recalculation is needed on app open. |
| unlocked_milestone_ids | array[string] | Milestone System | Read-only from dashboard's perspective. Determines active vs inactive card state in expanded view. |

---

## Out of Scope

- **Health Timeline** — medically-established body recovery milestones tied to consecutive abstinence. Excluded here; requires a standalone spec with its own relapse logic and milestone unlock system.
- **Reference Cards Content** — the actual copy for each contextual reference card (e.g. physical scale comparisons, environmental impact, cultural references). Covered in a separate Reference Cards Content Doc.
- **Milestone System** — the engine that defines threshold values and tracks which milestones a user has crossed. Referenced here as a dependency; requires its own spec.
- **Personal Goals Feature** — the system that maps money_saved to user-defined savings targets. Covered in [[LastOne_PersonalGoals_Spec]].
- **Onboarding Spec** — DASH-3 (Equivalent Category Picker) screen ownership to be transferred to the Onboarding spec when it is written.

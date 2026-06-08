# LastOne Personal Goals Spec v1.2

| Field | Value |
| --- | --- |
| Version | 1.2 |
| Date | April 2026 |
| Author | LastOne Product Team |
| Status | Needs Team Input — NGO confirmation pending |
| Scope | Stages 0–5 — Personal Goals Feature |
| Supersedes | V1.0 (April 2026) |
| Changes in this version | Part B added in full. Screen inventory added. Edge cases added. Allocation flow defined. Stage 0 manual top-up enabled. Partial URL parse handling defined. Notification timing and global one-notification-per-day rule documented. |

> ⚠ Status: Needs Team Input — NGO confirmation (CFI, CPAA, CanSupport) must be completed before this feature ships. If any NGO is replaced, associated one-line descriptors and all copy prompts for that NGO must be rewritten. Copy structure and rotation logic are unaffected.

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — money-saved calculator (Foundation 5, Progress & Gain-Frame)
- [[LastOne_ProgressDashboard_Spec]] — dashboard surfaces the savings counter this feature allocates
- [[smoking_cessation_priority_analysis]] — Awareness vs. Impact Gap; gain-framing is core design principle

This document defines the Personal Goals feature for LastOne — a smoking cessation app for Indian college students (18–25). It covers the problem being solved, all product decisions with rationale, feature logic, stage-specific behaviour, screen inventory, flows, copy, edge cases, and the full technical Part B. It is intended to give a developer full context to build the feature without needing to ask clarifying questions.

---

## Section 1 — Problem & Purpose

### 1.1 The Problem

LastOne already tells users how much money they've saved by not smoking. The number is real and it updates every day. But without a destination, it stays abstract — a figure on a screen that doesn't connect to anything the user actually wants.

The deeper problem: motivation to quit erodes over time. The physical withdrawal fades, but the psychological pull of smoking remains. Users need a reason to stay quit that keeps updating in their favour — something that makes not smoking feel like actively gaining something, not just resisting something.

A secondary problem: quitting can feel isolating and self-contained. Users who are already making a positive change have no channel in the app to extend that energy outward. There is no bridge between their personal progress and anything larger than themselves.

### 1.2 User Story

Arjun is a second-year engineering student in a Pune hostel. He smokes 4–5 cigarettes a day, mostly at the tapri outside his campus gate — after lunch, before evening classes, and late at night when assignments pile up. He's tried quitting twice before. Both times he stopped tracking around Day 10 when the initial motivation wore off.

He downloads LastOne and during onboarding sets a goal: a pair of boAt headphones he's been eyeing on Amazon for ₹1,899. He pastes the link and the app pulls the name, image, and price. He sets his quit date for Monday.

By Day 14 his savings counter reads ₹620. He opens the Goals screen, taps Allocate, and assigns ₹500 to the headphones. The progress bar jumps to 26%. It's the first time quitting has felt like it's going somewhere. That evening he manually tops up ₹100 from money he didn't spend on chai. The bar moves again. He screenshots it and sends it to his roommate.

### 1.3 Success Metrics

- ≥ 60% of users who reach Stage 2 have at least one active goal set
- ≥ 40% of users with an active goal make at least one manual top-up by Day 14
- Causes Card 'Learn more' tap rate ≥ 8% among users shown the card
- Occasion nudge card engagement (tap or goal set) ≥ 20% among users shown the nudge
- User reaches the Allocate Savings screen in ≤ 2 taps from the Goals Dashboard

---

## Section 2 — Feature Overview

### 2.1 What This Feature Does

Personal Goals gives the user's saved money a destination. They set a goal — a product they want, a thing they're saving toward — and the app tracks their progress automatically using the cigarette-savings calculation. They allocate from their savings pool and can top up manually.

The feature also surfaces a Causes Card — a periodic, low-pressure awareness card that introduces vetted Indian NGOs working in cancer care and tobacco control. No in-app transaction. Just awareness and a link.

Finally, the feature uses a calendar of Indian and global occasions to surface contextual nudges — prompting the user to think about who they might want to spend their savings on.

### 2.2 Where It Lives

Personal Goals lives inside the Progress / Savings section of the app. It is not a standalone tab. It is a motivational layer on top of the savings number that already exists. It becomes most powerful in Stages 3–5, but is accessible from Day 1 (Stage 0) as a motivational setup tool.

### 2.3 Stage Relevance

| Stage | Period | Goals Feature State | Causes Card / Occasion Nudge |
| --- | --- | --- | --- |
| Stage 0 | Days -7 to 0 | Goal creation available. Savings show ₹0. Manual top-up enabled — user may set aside real money before quit day. Motivational setup. | Neither active. No auto-savings to reference. |
| Stage 1 | Days 1–3 | Goals dashboard visible. Auto-savings begins updating. Manual top-up and allocation enabled. Progress bar active. | Occasion nudge fires if occasion is within 3–5 days. Causes Card not active. |
| Stage 2 | Days 4–7 | Full feature active. Goals screen promoted in home carousel (carousel card defined in home screen spec). | Occasion nudge active. Causes Card not yet active. |
| Stage 3 | Days 8–21 | Full feature active. Causes Card activates — first appearance possible. Primary motivational driver. | Both active. Causes Card first appears here. |
| Stage 4 | Days 22–56 | Full feature active. Savings reaching tangible amounts (₹500–₹2000+ range). Goals likely approaching completion. | Both active. Causes Card on standard 14-day rotation. |
| Stage 5 | Day 57+ | Full feature active. User likely completing or setting second-generation goals. | Both active. Causes Card continues on rotation. |

### 2.4 Dependencies

**Reads from:**

- `total_saved` — the running cigarette-savings total (INR). **Derived, not a stored table** (Schema A4): it is the same canonical `money_saved` value owned by the Progress Dashboard (`cigarettes_not_smoked × price_per_cigarette`, piecewise). Personal Goals reads it; there is no `savings` table.
- profiles.current_stage — current stage (0–5). Gates Causes Card and nudge logic.
- profiles.voice_style — enum: `steady_and_direct` \| `emotional_and_understanding` \| `real_and_practical`. Drives Causes Card copy selection.
- user.notification_preferences — governs whether occasion nudges fire as push notifications.
- user.date_of_birth — optional. Required for birthday nudge. Collected at onboarding. If absent, birthday nudge is silently skipped.
- user.notification_time_preference — optional. If set, occasion nudge notifications follow this time. Default: 7pm.

**Writes to:**

- goal — creates and updates goal records.
- top_up_log — logs every manual top-up entry.
- causes_card_log — logs every Causes Card impression, dismissal, and Learn More tap.

**Requires from other features:**

- Cigarette savings calculation (Savings feature) — must be running and accurate before Goals progress is meaningful.
- Onboarding — must collect price_per_cigarette and optionally date_of_birth.
- Home screen carousel — owns the Stage 2 Goals carousel card. This spec provides the feature state; home screen spec defines the card UI.

**Triggers:**

- Occasion nudge notification — push notification fired 3–5 days before a calendar occasion.
- Causes Card render — inline card rendered on Goals Dashboard when eligibility conditions are met.

---

## Section 3 — Design Decisions

> **DECISION: Maximum 3 active goals at a time.**
>
> More than 3 goals creates cognitive overhead and dilutes focus — the user stops caring about any individual goal. 3 is enough to allow variety without becoming a wishlist. If a user wants a new goal, they retire or complete an existing one first.

> **DECISION: Three distinct savings states — total_saved (display), allocated_amount (intent), current_amount (committed).**
>
> Conflating these states creates confusion about what counts toward progress. total_saved is the auto-calculated cigarette savings pool — shown once, never written to by the user. allocated_amount captures the user's intention to direct savings toward a goal — reversible, no real-money commitment. current_amount is what the user has actually committed via manual top-up — drives the progress bar and completion logic. Separating them keeps the feature honest: the app never implies the user has spent money they haven't.

> **DECISION: Manual top-up enabled from Stage 0.**
>
> The original spec restricted manual top-up in Stage 0 on the grounds that there was 'no savings context yet.' This was an over-call. If a user wants to manually set aside real money toward a goal before their quit date, that is a meaningful motivational act consistent with the gain-frame principle. The auto-savings figure shows ₹0 in Stage 0, but the manual top-up field is fully available.

> **DECISION: Product link pulls name, image, and price at time of setup only. Partial parse is handled gracefully — not treated as full failure.**
>
> Live price tracking requires per-platform scraping infrastructure disproportionate to the value. For partial parse (name/image pulled, price missing): show what was pulled, leave price field blank for manual completion. Only a full parse failure (nothing retrieved) falls through to full manual entry. Throwing away a successfully pulled name and image creates unnecessary friction.

> **DECISION: Supported platforms: Amazon, Flipkart, Myntra, Blinkit, Nykaa, Swiggy Instamart (V1). Unknown URLs fall back to manual entry.**
>
> These six cover the dominant purchase categories for an 18–25 Indian college student: electronics/books, fashion, groceries/essentials, beauty. The fallback ensures the feature works for any product even if the platform isn't supported. List expands in V2.

> **DECISION: The Causes Card is awareness only — no in-app donation transaction.**
>
> An in-app donation flow requires payment rails, NGO partnerships, legal compliance, and trust infrastructure out of scope for V1. A soft awareness card with a 'Learn more' link is less intrusive and less likely to feel like the app is asking for something.

> **DECISION: Causes Card copy uses only Emotional & Understanding and Steady & Direct voice styles. Light & Honest is excluded.**
>
> Light & Honest relies on contrast and self-awareness to land ('your call entirely', 'no pressure'). In the context of charitable causes, this framing implicitly signals that not engaging is an option that requires disclaiming — a soft form of guilt-tripping. The two remaining styles present the cause neutrally. Users with Light & Honest preference default to Steady & Direct for Causes Cards.

> **DECISION: Occasion nudges are calendar-based only in V1. Live trend/social listening deferred.**
>
> Live trend integration requires a social listening API, editorial curation, and a content pipeline not sustainable at this stage. Calendar-based occasions (Diwali, Valentine's Day, Mother's Day, etc.) provide sufficient contextual relevance for V1 and can be planned ahead.

> **DECISION: Causes Card rotation advances on dismissal.**
>
> Showing the same NGO again after a dismissal is redundant — the user already saw it and chose not to engage. On dismissal, the rotation index advances. The next appearance (after the standard 14-day interval) shows the next NGO in sequence.

> **DECISION: One notification per day maximum across the entire app. Occasion nudge is lowest priority.**
>
> This rule originates in this spec as a product decision. It governs the entire app's notification behaviour, not just Personal Goals. When a global notifications document is built, this rule transfers there and this spec references it. Until then, this spec is the authoritative source. If a higher-priority notification (craving check-in, milestone, stage update) is already scheduled for a given day, the occasion nudge is pushed to the following day.

---

## Section 4 — Screen Inventory

| ID | Screen Name | Description |
| --- | --- | --- |
| GOAL-01 | Goals Dashboard | Main screen. Shows total_saved pool once at top, all active goal cards, Causes Card (Stage 3+ only), occasion nudge card when active. Entry point for all goal actions. |
| GOAL-02 | Add Goal — Entry Method | User chooses between 'Paste a link' or 'Enter manually.' Shown after tapping Add a Goal from GOAL-01. |
| GOAL-03 | Add Goal — URL Input | Text field for pasting a product URL. Shows hint listing supported platforms. Triggers parse on submit. |
| GOAL-04 | Add Goal — Confirm Pulled Details | Shows parsed product name, image, price. All fields editable. Price field blank if parse was partial. User confirms or edits before saving. |
| GOAL-05 | Add Goal — Manual Entry Form | Fields: goal name (required), target amount in ₹ (required), image/emoji (optional), 'Why this matters' (optional). |
| GOAL-06 | Goal Detail View | Expanded view of a single goal. Shows goal name, image, target_amount, current_amount, allocated_amount, progress bar, auto-savings display, manual top-up CTA, top-up history log. |
| GOAL-07 | Manual Top-Up Input | Amount input field (INR). Confirm button. Opened from GOAL-06 via 'Add money' CTA. |
| GOAL-08 | Goal Completion State | Celebratory card/screen shown when current_amount >= target_amount. Prompt to mark complete or keep saving. |
| GOAL-09 | Completed Goals History | List of past completed and retired goals. Accessible from GOAL-01. |
| GOAL-10 | Allocate Savings Screen | Shows total_saved pool at top. Lists all active goals with input fields. User enters fixed ₹ amounts or switches to percentage mode. Unallocated remainder updates in real time. Confirm button commits allocation. |
| GOAL-11 | Causes Card (inline) | Inline card rendered within GOAL-01 below active goal cards. NGO name, one-line descriptor, card copy (voice-matched), 'Learn more' CTA. Dismissible. |

---

## Section 5 — Flow Logic

### 5.1 Goal Creation Flow

**GOAL-01 → Add a Goal tapped**

- Check active goal count
  - = 3: Button is disabled. Label reads 'Complete a goal to add another.' No action on tap.
  - < 3: Navigate to GOAL-02.
- Back from GOAL-01: N/A — this is the root screen for this feature.

**GOAL-02 — Entry Method**

- 'Paste a link' tapped → navigate to GOAL-03.
- 'Enter manually' tapped → navigate to GOAL-05.
- Back button → return to GOAL-01. Nothing saved.
- App closed mid-screen → nothing saved.

**GOAL-03 — URL Input**

- User submits URL → app attempts parse.
  - Recognised platform, full parse success → navigate to GOAL-04 with all fields populated.
  - Recognised platform, partial parse (name/image retrieved, price missing) → navigate to GOAL-04 with name and image populated, price field blank. User fills price manually.
  - Unrecognised platform OR full parse failure → show inline message: 'We couldn't read this link. Fill in the details manually.' → navigate to GOAL-05 with all fields empty.
  - Offline → show inline message: 'No connection. Enter details manually.' → navigate to GOAL-05.
- Back button → return to GOAL-02. URL input cleared.
- App closed mid-screen → nothing saved.

**GOAL-04 — Confirm Pulled Details**

- All fields editable (name, image, price). Price field required before save is permitted.
- 'Save goal' tapped with all required fields complete → goal created. Navigate to GOAL-01. New goal card visible.
- 'Save goal' tapped with price field empty → inline validation: 'Enter a target amount to continue.' No navigation.
- Back button → return to GOAL-03. Pulled details discarded.
- App closed mid-screen → nothing saved.

**GOAL-05 — Manual Entry Form**

- Required fields: goal name, target amount (INR). Optional: image/emoji, 'Why this matters'.
- 'Save goal' tapped with all required fields complete → goal created. Navigate to GOAL-01.
- 'Save goal' tapped with missing required fields → inline validation per field. No navigation.
- Back button → return to GOAL-02. Form data discarded. No draft saved.
- App closed mid-screen → nothing saved.

**GOAL-01 → Goal card tapped**

- Navigate to GOAL-06.

**GOAL-06 — Goal Detail View**

- 'Add money' tapped → navigate to GOAL-07.
- 'Allocate savings' tapped → navigate to GOAL-10.
- Back button → return to GOAL-01.
- App closed → no unsaved state on this screen.

**GOAL-07 — Manual Top-Up Input**

- User enters amount → 'Confirm' tapped.
  - Amount > 0: write top-up to top_up_log. Update current_amount. Return to GOAL-06. Progress bar updates.
  - current_amount >= target_amount after top-up: trigger GOAL-08.
  - Amount = 0 or empty: inline validation: 'Enter an amount to continue.' No write.
- Back button or dismiss → return to GOAL-06. Amount discarded. current_amount unchanged.
- App closed mid-entry → amount discarded. current_amount unchanged.
- Offline: write top-up locally and sync on reconnect. Show no error to user unless sync fails permanently (edge — flag for backend).

**GOAL-08 — Goal Completion State**

- 'Mark as complete' tapped → goal status set to completed. completed_at timestamped. Goal moves to GOAL-09. Slot on GOAL-01 opens. Navigate to GOAL-01.
- 'Keep saving' tapped → goal remains active. Progress bar shows overflow (e.g. 104%). Return to GOAL-06.
- Back button → return to GOAL-06. Goal remains at completion state until user acts.

**GOAL-10 — Allocate Savings Screen**

- Shows total_saved at top. Lists all active goals.
- User enters fixed ₹ amounts per goal OR switches to percentage mode. Switching modes recalculates inputs in real time. Unallocated remainder visible and live-updating.
- Unallocated remainder may be positive (not all savings assigned), zero, or user may attempt to allocate more than total_saved.
- Over-allocation attempt: disable Confirm. Show inline message: 'Total exceeds your ₹[X] savings. Adjust to continue.'
- 'Confirm' tapped with valid allocation → write allocated_amount to each goal. Return to GOAL-01. Goal cards update.
- 'Confirm' tapped with all fields zero/empty → no write. Return to GOAL-01 unchanged.
- Back button or dismiss → return to GOAL-01. No changes committed.
- App closed mid-screen → no changes committed.

**GOAL-11 — Causes Card**

- 'Learn more' tapped → open NGO website in in-app browser. Update causes_card_log: tapped_learn_more = true. Card remains visible on return.
- Dismiss tapped → log dismissed_at. Advance rotation index. Card does not reappear until next 14-day eligibility cycle.
- Scrolled past without action → card remains visible until dismissed or next app open.

---

## Section 6 — Stage Behaviour

### 6.1 Stage-by-Stage Rules

All stage definitions are consistent with the LastOne Product Foundations V1 document.

**Stage 0 — Days -7 to 0 (Learning Week)**

- Goal creation available. User can set up goals before quit day — this is a motivational setup act.
- Savings display shows ₹0 on all goal cards. Auto-savings has not started.
- Manual top-up enabled. User may commit real money before quit day.
- Allocate Savings screen accessible but total_saved = ₹0. User may only allocate if they have manual top-ups.
- Causes Card: not active.
- Occasion nudges: not active.

**Stage 1 — Days 1–3 (First 72 Hours)**

- Goals Dashboard visible. Auto-savings begins updating daily.
- Manual top-up and allocation fully enabled.
- Progress bar live on all active goal cards.
- Occasion nudge fires if an occasion falls within 3–5 days. Card only — notification optional per user preference.
- Causes Card: not active.

**Stage 2 — Days 4–7 (First Full Week)**

- Full feature active. All screens accessible.
- Goals screen promoted in home carousel. Carousel card is defined by home screen spec — this spec provides the feature state only.
- Occasion nudges active.
- Causes Card: not active.

**Stage 3 — Days 8–21 (Psychological Challenge)**

- Full feature active.
- Causes Card activates. First appearance possible from Day 8 if user.stage >= 3 AND total_saved > 0.
- Causes Card eligibility checked on every app open. Standard 14-day interval between appearances.
- Both occasion nudges and Causes Card active.

**Stage 4 — Days 22–56 (Stabilisation)**

- Full feature active.
- Savings reaching tangible amounts (₹500–₹2000+ range). Goals likely approaching completion.
- Causes Card continues on 14-day rotation.

**Stage 5 — Day 57+ (Long-Term Maintenance)**

- Full feature active.
- User likely completing first-generation goals and setting new ones.
- Causes Card continues on 14-day rotation.

### 6.2 Relapse Behaviour

Personal Goals is not reset on a relapse or restart. Goals, manual top-ups, allocated_amounts, and top-up history always persist. The auto-savings calculation (total_saved) restarts with the new quit attempt, but all manually committed amounts (current_amount) remain. This is consistent with the foundations document's principle: data and progress persist across restarts.

---

## Section 7 — Copy & Content

> This section contains all final copy for the Causes Card. Copy for goal creation UI screens (GOAL-02 through GOAL-05), the Allocate Savings screen (GOAL-10), occasion nudges, progress states, completion states, and empty states is to be produced in a companion copy document. Screen-level labels and button text are defined in the flow logic above.

### 7.1 NGO One-Line Descriptors

These appear directly below the NGO name on every Causes Card, regardless of copy variant.

| NGO | One-Line Descriptor |
| --- | --- |
| Cancer Foundation of India (CFI) | Working on tobacco control and cancer prevention across India since 2002. |
| Cancer Patients Aid Association (CPAA) | Providing free treatment support, medicines, and rehabilitation to cancer patients across India since 1969. |
| CanSupport | Running India's largest free home-based palliative care program for cancer patients since 1996. |

### 7.2 Causes Card Copy

7 prompts across 3 NGOs, 2 voice styles each (Emotional & Understanding and Steady & Direct). The third voice (`real_and_practical`) is not authored for Causes Cards in V1 — users on `real_and_practical` receive the Steady & Direct variant as fallback. The ₹[X] token is replaced with the user's current `total_saved` at render time.

**CFI — Cancer Foundation of India**

> **Prompt 1 — Emotional & Understanding**
>
> *Card: You've saved ₹[X]. The Cancer Foundation of India has worked on tobacco control and cancer prevention across the country since 2002. Here's their work, if you'd like to take a look.*
>
> *Notification: ₹[X] saved. Here's somewhere that can go, if you're curious.*

> **Prompt 2 — Steady & Direct**
>
> *Card: ₹[X] saved. Cancer Foundation of India — tobacco control and cancer prevention work across India since 2002. Link below.*
>
> *Notification: Your savings have options. One of them is here.*

> **Prompt 7 — Emotional & Understanding (Alternate)**
>
> *Card: ₹[X] saved. The Cancer Foundation of India pushes for stronger tobacco laws and runs prevention programmes across the country. Worth knowing who's doing the ground work.*
>
> *Notification: Something worth knowing about — linked below.*

**CPAA — Cancer Patients Aid Association**

> **Prompt 3 — Emotional & Understanding**
>
> *Card: You've saved ₹[X]. CPAA has been helping underprivileged cancer patients access free treatment and medicines for over 55 years. Worth knowing they exist.*
>
> *Notification: ₹[X] saved. Here's one more place it can go.*

> **Prompt 4 — Steady & Direct**
>
> *Card: ₹[X] saved. CPAA gives underprivileged cancer patients access to free treatment, medicines, and rehabilitation. 55 years of this work across India. Link below.*
>
> *Notification: Your savings are building. Here's something worth knowing about.*

**CanSupport**

> **Prompt 5 — Emotional & Understanding**
>
> *Card: You've saved ₹[X]. CanSupport sends doctors, nurses, and counsellors to cancer patients' homes — free of charge — across six states. Here's their story.*
>
> *Notification: ₹[X] saved. Something quiet and important — tap if you're curious.*

> **Prompt 6 — Steady & Direct**
>
> *Card: ₹[X] saved. CanSupport runs India's largest free home-based palliative care program — medical and emotional support, delivered at home. Link below.*
>
> *Notification: ₹[X] saved. One more thing it could do.*

### 7.3 Voice Style Mapping

| User Preference | Causes Card Style Used |
| --- | --- |
| Emotional & Understanding | Emotional & Understanding |
| Steady & Direct | Steady & Direct |
| Light & Honest | Steady & Direct (default) |

---

## Section 8 — Edge Cases

### 8.1 No Data / First Run State

- User has no goals set: Goals Dashboard shows empty state with a single 'Add a Goal' CTA. ₹[total_saved] shown above. No goal cards. No Causes Card. No occasion nudge card.
- User is in Stage 0: savings figure reads ₹0. Empty state copy should acknowledge this — e.g. 'Your savings start on quit day. Set a goal now so you're ready.'

### 8.2 Mid-Flow Dismissal

See Section 5 flow definitions. Summary:

- GOAL-02, GOAL-03, GOAL-04, GOAL-05: back or close at any point — nothing saved, no draft preserved.
- GOAL-07 (top-up input): back or close — amount discarded, current_amount unchanged.
- GOAL-10 (allocate savings): back or close — no allocation committed, allocated_amount unchanged.
- GOAL-08 (completion state): back — goal remains at completion state until user acts.

### 8.3 Wrong Stage Access

- There is no wrong-stage lockout for goal creation or the dashboard. Feature is accessible from Stage 0.
- Causes Card does not render before Stage 3. No error state — it is a silent conditional render.
- Occasion nudge does not render in Stage 0. Silent conditional.

### 8.4 Feature Limits

- Maximum 3 active goals. When limit is reached: 'Add a Goal' button is disabled with label 'Complete a goal to add another.' Tapping the disabled button does nothing. No modal.
- Progress bar overflow: if current_amount exceeds target_amount (user keeps saving past 100%), display as percentage with a cap at 999% to prevent layout breakage. E.g. '104%', '215%'.

### 8.5 Return After Absence

- Auto-savings (total_saved) recalculates on every app open using the running cigarettes_not_smoked total. No special state needed for returning users.
- Causes Card 14-day interval calculated from last causes_card_log.shown_at timestamp. Absence does not reset the interval — a user who returns after 20 days away will see the card if all other conditions are met.
- Occasion nudge: if a user misses an occasion window (was absent during the 3–5 day fire window), the nudge is skipped for that year. It does not fire retroactively.

### 8.6 Connection Loss

- URL parsing (GOAL-03): requires network. If offline, show: 'No connection. Enter details manually.' Fall through to GOAL-05.
- Manual top-up (GOAL-07): write locally, sync on reconnect. No error shown to user unless sync fails permanently.
- Causes Card 'Learn more' link: if offline, show: 'Link unavailable offline.' Suppress tap action.
- Auto-savings calculation: reads from local store. No network dependency for display.

### 8.7 Birthday Nudge — Missing Data

- If user.date_of_birth is not set (optional field at onboarding), birthday nudge is silently skipped. No prompt inside the Goals flow to add a birthday. No empty state shown.

---

## Part B — Technical Specification

Part B is for the developer. It defines all data objects, logic conditions, notification rules, and API operations needed to build the feature.

## B1 — Data Model

### goal

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| goal_id | string | required | UUID. Generated on creation. |
| user_id | string | required | Foreign key to user. |
| goal_name | string | required | Max 60 chars. |
| target_amount | number (INR) | required | Must be > 0. |
| current_amount | number (INR) | required | Default 0. Sum of all top_up_log entries for this goal. |
| allocated_amount | number (INR) | required | Default 0. Set via Allocate Savings screen. Does not drive progress bar. |
| source | enum | required | Values: link \| manual |
| product_url | string | optional | Original URL pasted by user. Stored for reference. |
| product_image_url | string | optional | Pulled from URL parse or uploaded by user. |
| emoji | string | optional | Single emoji character. Used if no image. |
| why | string | optional | Private reflection field. Max 200 chars. |
| status | enum | required | Values: active \| completed \| retired |
| created_at | timestamp | required | ISO 8601. |
| completed_at | timestamp | optional | Set when status → completed. |

### top_up_log

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| topup_id | string | required | UUID. |
| goal_id | string | required | Foreign key to goal. |
| user_id | string | required | Foreign key to user. |
| amount | number (INR) | required | Must be > 0. |
| created_at | timestamp | required | ISO 8601. |

### causes_card_log

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| log_id | string | required | UUID. |
| user_id | string | required | Foreign key to user. |
| ngo_id | enum | required | Values: CFI \| CPAA \| CanSupport |
| shown_at | timestamp | required | ISO 8601. Used to calculate 14-day interval. |
| dismissed_at | timestamp | optional | Set when user dismisses card. |
| tapped_learn_more | boolean | required | Default false. Set true on Learn More tap. |

### External Objects Read (not owned by this feature)

- `total_saved` — number (INR). Running cigarette-savings total. **Derived, no table (A4)** — the Progress Dashboard's canonical `money_saved`.
- profiles.current_stage — enum: 0 \| 1 \| 2 \| 3 \| 4 \| 5.
- profiles.voice_style — enum: `steady_and_direct` \| `emotional_and_understanding` \| `real_and_practical`.
- user.notification_preferences — boolean or settings object. Structure defined in notifications spec.
- user.date_of_birth — date (YYYY-MM-DD). Optional. Used for birthday nudge only.
- user.notification_time_preference — time (HH:MM). Optional. Default: 19:00.

---

## B2 — Logic & Conditions

### Goal Count Gate

```
active_goal_count = COUNT(goals WHERE user_id = X AND status = 'active')

If active_goal_count >= 3: disable Add a Goal button. No creation flow permitted.
```

### Progress Calculation

```
current_amount = SUM(top_up_log.amount WHERE goal_id = G)

progress_pct = (current_amount / target_amount) × 100

Display cap: if progress_pct > 999, render as '999%'. Prevents layout breakage.

Completion trigger: fires when a manual top-up causes current_amount >= target_amount.
Does NOT auto-trigger from allocated_amount or total_saved.
```

### Allocation Logic

```
allocated_amount is written per goal on confirmation of the Allocate Savings screen.

Validation: SUM(allocated_amount inputs across all goals) must be <= savings.total_saved.
If over: disable Confirm, show inline error.

Percentage mode: rupee_equivalent = (percentage / 100) × savings.total_saved.
Calculated in real time as user types.

Unallocated remainder = savings.total_saved − SUM(all allocated_amount inputs).
Always visible, always live.

Re-allocation: user may return to GOAL-10 at any time and overwrite allocated_amount on any goal.
Fully reversible.
```

### Causes Card Eligibility

```
Check on every app open. All three conditions must be true:
  - user.stage >= 3
  - savings.total_saved > 0
  - (now − MAX(causes_card_log.shown_at WHERE user_id = X)) >= 14 days.
    If no prior log entry exists, condition is met.

NGO rotation index = COUNT(causes_card_log WHERE user_id = X) % 3
  0 → CFI, 1 → CPAA, 2 → CanSupport

Rotation advances on every impression (shown_at written), including dismissals.
```

### Occasion Nudge Logic

```
For each occasion in the V1 calendar, check daily:
  - days_until_occasion = occasion_date − today
  - If days_until_occasion is between 3 and 5 (inclusive): nudge is eligible to fire.
  - Check: has this occasion already been dismissed this calendar year? If yes: skip.
  - If user has active goals: render goal-contextual card copy referencing the nearest goal by name.
  - If user has no active goals: render generic card copy ('You've saved ₹[X]. Thinking of a gift? Set a goal.')
  - Stage gate: do not fire in Stage 0.

Birthday nudge: calculate days_until_birthday using user.date_of_birth and current year.
Same 3–5 day window. If date_of_birth is null: skip silently.
```

### Stage Transition Consistency

Stage boundaries used in this feature match foundations doc exactly:

- Stage 0: Days -7 to 0
- Stage 1: Days 1–3
- Stage 2: Days 4–7
- Stage 3: Days 8–21
- Stage 4: Days 22–56
- Stage 5: Day 57+

---

## B3 — Notification Logic

### Occasion Nudge Notification

| Property | Definition |
| --- | --- |
| Trigger condition | days_until_occasion BETWEEN 3 AND 5. Occasion not already dismissed this calendar year. user.stage >= 1. |
| Message reference | Section 3.3 occasion copy. Goal-contextual variant if active goals exist. Generic variant if no active goals. |
| Timing | Default: 19:00 local time. If user.notification_time_preference is set, use that time instead. |
| Priority | Low. If any other notification (craving check-in, milestone, stage update) is already scheduled for this calendar day, push occasion nudge to the following day. One notification per day maximum across the whole app. This rule is the authoritative source until a global notifications doc is created. |
| User preference | Respects user.notification_preferences. If notifications off, card renders on GOAL-01 only — no push notification sent. |
| Stage 1–2 personalisation | Occasion nudge notifications in Stage 1 and Stage 2 fire within the user's known high-risk window from Learning Week data, not at the default 19:00, consistent with the foundations doc notification personalisation rule. |
| Auto-reduce rule | If user ignores 3 consecutive occasion notifications, frequency reduces by one tier for 7 days. |
| Repeat logic | One nudge per occasion per calendar year. Does not re-fire after dismissal until next year. |

### Causes Card Notification

| Property | Definition |
| --- | --- |
| Trigger condition | Same eligibility as card render: user.stage >= 3, total_saved > 0, 14 days since last shown. |
| Message reference | Section 7.2 notification copy for the applicable NGO and voice style. |
| Timing | Same as occasion nudge timing rules. Subject to one-notification-per-day rule. |
| User preference | Respects user.notification_preferences. Card always renders inline regardless of notification preference. |
| Auto-reduce rule | Applies. 3 consecutive ignores → reduce by one tier for 7 days. |

---

## B4 — API Surface

| Operation | Object | Trigger | Notes |
| --- | --- | --- | --- |
| CREATE | goal | User saves goal creation form (GOAL-04 or GOAL-05) | Writes all fields. current_amount and allocated_amount default to 0. |
| READ (list) | goal | Goals Dashboard load (GOAL-01) | Filter: user_id = X, status = active. Also reads completed for GOAL-09. |
| UPDATE | goal | User edits goal; status change; allocated_amount update from GOAL-10 | Partial update permitted. allocated_amount updated on Allocate confirm. |
| UPDATE | goal.status | User marks complete (GOAL-08) or retires a goal | Set status = completed or retired. Set completed_at if completed. |
| CREATE | top_up_log | User confirms manual top-up (GOAL-07) | Write amount, goal_id, user_id, created_at. current_amount on goal derived from log sum — do not write directly. |
| READ (list) | top_up_log | Goal Detail View expanded (GOAL-06) | Filter: goal_id = G. Order by created_at desc. |
| CREATE | causes_card_log | Causes Card rendered on screen (GOAL-11) | Write ngo_id, shown_at. dismissed_at and tapped_learn_more null/false at creation. |
| UPDATE | causes_card_log | User dismisses card or taps Learn More | Update dismissed_at or tapped_learn_more on the relevant log entry. |
| READ | `total_saved` (derived — Progress Dashboard `money_saved`, A4) | Dashboard load, GOAL-10 Allocate screen, goal card render | Read-only. Not owned by this feature. No `savings` table — it is a derived value. |
| READ | user.stage | Any stage-gated render check | Read-only. |
| READ | profiles.voice_style | Causes Card copy selection | Read-only. |
| READ | user.notification_preferences | Notification send decision | Read-only. |
| READ | user.date_of_birth | Birthday nudge eligibility | Read-only. Null check before use. |
| READ | user.notification_time_preference | Occasion nudge notification timing | Read-only. Fall back to 19:00 if null. |

---

## Appendix — V2 Considerations & Open Items

### Deferred to V2

- Live trend integration for occasion nudges — requires social listening API and editorial pipeline.
- Real donation transaction flow — requires payment rails, NGO partnership agreements, legal/compliance review.
- More than 3 active goals — evaluate based on user behaviour data from V1.
- Goal sharing — ability to share a goal progress card to a Quit Group or the Community Feed.
- Expanding supported platforms beyond the V1 list of 6.
- 'Gift a friend' goal type — saving toward something for someone else, with optional reveal mechanic.

### Needs Confirmation Before Build

> ⚠ NGO confirmation is blocking. CPAA, CanSupport, and CFI are working selections. Formal vetting and permission to feature them must be completed before this feature ships. If any NGO is replaced, its one-line descriptor and all associated copy prompts must be rewritten. Copy structure and rotation logic are unaffected.

- NGO website links — confirm correct URLs and that 'Learn more' destination is appropriate (donation page vs about page).
- Price-per-cigarette data source — confirm onboarding field feeds correctly into savings.total_saved.
- Occasion calendar dates — confirm which occasions are in scope for V1 and who owns calendar maintenance.
- Offline top-up sync — backend to confirm whether local-write-then-sync is supported or whether top-ups require an active connection.

---

*End of Document — LastOne Personal Goals Feature Spec V1.2*

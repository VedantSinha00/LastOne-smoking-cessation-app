# LastOne — Settings & Profile Spec V1.2

[[LastOne]] — Feature Specification: Settings & Profile

---

| Field | Value |
| --- | --- |
| Version | 1.2 |
| Date | May 2026 |
| Author | Vedant Sinha |
| Status | Draft |
| Stage Scope | All Stages |
| Feature Prefix | PROF |

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — Personalisation Model (Foundation 4); onboarding fields that Settings allows post-onboarding editing of
- [[LastOne_ProgressDashboard_Spec]] — reads relatable_category, cigarettes_per_day, price_per_cigarette
- [[LastOne_PersonalGoals_Spec]] — reads voice_style, notification_preferences, notification_time_preference
- [[LastOne_Logging_System_Spec]] — reads timezone; quit_date drives quit_day_number on all log entries
- [[LastOne_Streak_System_Spec_V1_2]] — reads quit_date; streak resets route through the restart flow, not Settings
- [[LastOne_Giving_Up_Support_System]] — reads support_person_configured (SOS contact)
- [[LastOne_CopingToolsSuite_V1_2]] — reads voice_style for curated tool copy

---

# PART A: FEATURE DEFINITION

## Section 1 — Problem & Purpose

### 1.1 The Real Problem

LastOne collects significant personal data at onboarding — smoking habits, quit date, price per cigarette, voice style, notification preferences. But life changes. A user's cigarette price goes up. They realise they entered their CPD wrong. They want to switch from Emotional & Understanding to Steady & Direct after a few weeks. They want to add an SOS contact after Stage 1. Without an accessible, well-defined settings layer, the app's personalisation calcifies at onboarding and stops reflecting the user's actual situation.

### 1.2 Why This Matters for LastOne

Settings touches Foundation 4 (Personalisation Model) directly — it is the interface through which the app's personalisation layer stays accurate over time. It also touches Foundations 1, 2, and 5 indirectly: the quit date anchors the Stage System, the SOS contact enables peer coping, and voice style governs all high-sensitivity content delivery.

### 1.3 User Story

Arjun is on Day 18. He set up LastOne during his exam season when cigarettes near his hostel cost ₹12 a stick. The college tapri has since put prices up to ₹15. He opens Settings, finds Price Per Cigarette under Your Journey, updates it in two taps. His savings counter updates immediately from today forward. He also decides he wants a different tone from the app — he started with Emotional & Understanding but now finds it a bit soft. He switches to Steady & Direct from Preferences. The next craving prompt he gets reads differently. Neither change took more than 30 seconds.

### 1.4 Success Metrics

- 100% of editable fields are reachable in ≤ 3 taps from the Profile tab root
- Voice style changes reflect in the next content delivery without requiring an app restart
- CPD and price edits persist correctly and update the Progress Dashboard counters prospectively
- Delete Account flow requires explicit typed confirmation — zero accidental deletions

---

## Section 2 — Feature Overview

### 2.1 What This Feature Does

The Settings & Profile tab gives users control over the personal data and preferences that drive the app's personalisation. It surfaces key onboarding data in readable form, allows editing of fields where change is meaningful post-onboarding, and handles account-level actions (data export, delete account).

### 2.2 Where It Lives

Dedicated Profile tab in the root navigation. Accessible at all times from all stages. Organised into four sections: Your Journey, Preferences, Your Support, Privacy & Account.

### 2.3 Stage Relevance

| Stage | Feature Status |
| --- | --- |
| Stage 0 (Learning Week) | Fully accessible. Quit date is editable. All preferences configurable. |
| Stage 1 (First 72 Hours) | Fully accessible. Quit date edit redirects to pause/restart prompt from this stage onwards. |
| Stage 2 (Days 4–7) | Fully accessible. No changes from Stage 1. |
| Stage 3 (Weeks 2–3) | Fully accessible. No changes from Stage 1. |
| Stage 4 (Weeks 4–8) | Fully accessible. No changes from Stage 1. |
| Stage 5 (Months 3+) | Fully accessible. No changes from Stage 1. |

### 2.4 Dependencies

**Reads from:**
- user — all profile fields (full list in B1)

**Writes to:**
- profiles — voice_style, relatable_category, display_name, cigarettes_per_day, price_per_cigarette, notification_preference, notifications_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone
- quit_attempts — quit_date (Stage 0 only; on the open row where `ended_at IS NULL`)
- device storage (SecureStore) — sos_contact_name, sos_contact_phone (never synced to server — see T-F / Giving Up Support privacy decision)

**Triggers on save:**
- voice_style change → re-renders all active voice-variant content on next delivery
- relatable_category change → re-renders Money Saved and Time Reclaimed equivalents on Progress Dashboard
- cigarettes_per_day or price_per_cigarette change → Progress Dashboard counters recalculate prospectively from date of change
- quit_date change (Stage 0) → written to the open `quit_attempts` row; stage system recalculates from new date; all counter baselines update

**Does not trigger:**
- SOS contact change does not send a notification to the contact (and is a device-local write only — no server round-trip)
- Notification preference changes take effect from the next scheduled notification cycle

---

## Section 3 — Design Decisions

> **DECISION: Quit date is editable only in Stage 0. After Stage 0, tapping quit date redirects to the pause/restart prompt.**
>
> **Chosen:** Read-only after Stage 0 with redirect.
> **Rejected:** Freely editable at all stages.
> **Rationale:** Once the user has crossed into Stage 1, the quit date is not just a preference — it is the anchor for streak, stage, counters, and all log entries. Allowing arbitrary editing mid-journey would corrupt the timeline. The meaningful reasons to change it after Stage 0 are already handled by the existing restart and pause flows. The redirect surfaces those flows without creating a dead end.

> **DECISION: CPD and price per cigarette changes are prospective only — no retroactive recalculation.**
>
> **Chosen:** New values apply from the date of change. Historical data preserved as calculated.
> **Rejected:** Retroactive recalculation from quit date using new values.
> **Rationale:** Historical savings were calculated at the habits and prices the user actually had at the time. Retroactive recalculation would produce numbers that were never real. Prospective-only is honest: from today, the new value applies.

> **DECISION: SOS bypass is the only quiet hours exemption.**
>
> **Chosen:** Only SOS-triggered notifications bypass quiet hours.
> **Rejected:** Stage transitions, milestone celebrations also bypass.
> **Rationale:** Stage transitions and milestones are meaningful but not emergencies — seeing them first thing in the morning is fine. SOS involves another person reaching out for help or the app responding to active crisis. Suppressing that defeats the purpose. Full notification logic and the one-notification-per-day rule are deferred to the Notifications Spec.

> **DECISION: Quiet Hours, Notification Settings, and the one-notification-per-day rule are partially deferred to the Notifications Spec.**
>
> **Chosen:** This spec defines the settings UI surface (fields, toggles, screens). Logic governing which notifications fire when, priority rules, and the one-notification-per-day rule live in the Notifications Spec.
> **Rejected:** Defining full notification logic here.
> **Rationale:** Notification logic spans every feature in the app. Defining it inside the Settings spec would scatter the authoritative source across documents. Settings owns the UI and user-facing controls; Notifications Spec owns the delivery logic.

> **DECISION: Widgets deferred to V2.**
>
> **Chosen:** Not in V1.
> **Rejected:** Including home screen widget configuration in this spec.
> **Rationale:** Widget implementation requires platform-specific work (iOS WidgetKit, Android App Widgets) and design decisions about what data to surface. Out of scope for the prototype.

> **DECISION: Anonymous Mode, Profile Card, and Your Cheerleaders deferred to V2.**
>
> **Chosen:** Not in V1.
> **Rejected:** Partial implementation of social-facing settings.
> **Rationale:** All three depend on the Social Architecture layer, which is deferred for the prototype. Anonymous Mode governs Community Feed default posting identity. Profile Card and Cheerleaders are public-facing social features. None are needed until the social layer ships.

> **DECISION: Group Visibility deferred to V2.**
>
> **Chosen:** Not in V1.
> **Rejected:** Including group visibility controls in Privacy & Account.
> **Rationale:** Group Visibility governs what quit group members can see about you. Deferred with the rest of the Social Architecture layer.

---

## Section 4 — Screen Inventory

| Screen ID | Screen Name & Brief Description |
| --- | --- |
| PROF-01 | Profile Tab Root — main scrollable screen. Four sections listed (Your Journey, Preferences, Your Support, Privacy & Account). Each section is a group of tappable rows. Read-only values displayed inline. |
| PROF-02 | Edit Quit Date (Stage 0) — date picker. Available only while user is in Stage 0. Enforces 3-day minimum from account creation date. No maximum. |
| PROF-03 | Quit Date Redirect (Stage 1+) — modal prompt shown when user taps Quit Date after Stage 0. Asks whether they want to pause or start fresh. Routes to the appropriate existing flow. |
| PROF-04 | Edit Cigarettes Per Day — numeric input screen. Single field. Confirmation saves and triggers prospective counter recalculation. |
| PROF-05 | Edit Price Per Cigarette — numeric input screen (INR). Single field. Confirmation saves and triggers prospective counter recalculation. |
| PROF-06 | Voice Style Picker — three options displayed with example copy for each style. User selects one. Change takes effect immediately. |
| PROF-07 | Spending Category Picker — six options displayed with a brief label each. User selects one. Change re-renders Progress Dashboard equivalents immediately. |
| PROF-08 | Edit Display Name — single text input. Max 30 characters. |
| PROF-09 | SOS Contact Setup — name and phone number input. Covers both first-time setup and editing an existing contact. Option to remove contact. |
| PROF-10 | Notification Settings — frequency preference selector (App Decides / Few Daily / On Demand) plus a master notifications on/off toggle. |
| PROF-11 | Quiet Hours — on/off toggle plus time range picker (start time, end time). Note shown: SOS notifications always come through. |
| PROF-12 | Account Details — displays current email. Options: Change Email, Change Password. |
| PROF-13 | Data Export — confirmation screen. Explains what is included in the export and how it is delivered. Single CTA to request export. |
| PROF-14 | Delete Account — confirmation flow. Requires user to type "DELETE" before the final action is enabled. Explains what data is purged. |

---

## Section 5 — Flow Logic

### Flow 1 — Profile Tab Root Navigation

**Entry point:** User taps Profile tab in root navigation.

#### PROF-01: Profile Tab Root

What the user sees: scrollable screen with four labelled sections. Each section contains a list of rows. Rows with editable values show the current value and a chevron. Read-only rows show the value with no chevron.

**Your Journey rows:**

| Row | Display | Tappable? | Destination |
| --- | --- | --- | --- |
| Quit Date | Current quit date (e.g. 14 May 2026), or *Not set* if no quit date has been set | Yes | PROF-02 (Stage 0) or PROF-03 (Stage 1+) |
| Cigarettes Per Day | Current value (e.g. 5/day) | Yes | PROF-04 |
| Price Per Cigarette | Current value (e.g. ₹12/stick) | Yes | PROF-05 |
| Current Stage | Stage name (e.g. Stage 2 — First Full Week) | No | — |
| Quit Attempts | Count (e.g. 1) | No | — |
| Streak Freezes | Remaining freezes (e.g. 2 remaining) | No | — |
| Journal Entries | Total count (e.g. 14 entries) | No | — |

**Preferences rows:**

| Row | Display | Tappable? | Destination |
| --- | --- | --- | --- |
| Voice Style | Current style (e.g. Steady & Direct) | Yes | PROF-06 |
| Spending Category | Current category (e.g. Food Delivery) | Yes | PROF-07 |
| Display Name | Current name | Yes | PROF-08 |

**Your Support rows:**

| Row | Display | Tappable? | Destination |
| --- | --- | --- | --- |
| SOS Contact | Contact name if set (e.g. Rohan) or 'Not set' | Yes | PROF-09 |
| Notifications | On/Off + frequency summary (e.g. 'Few daily') | Yes | PROF-10 |
| Quiet Hours | On/Off + time range if set (e.g. '11 PM – 8 AM') | Yes | PROF-11 |

**Privacy & Account rows:**

| Row | Display | Tappable? | Destination |
| --- | --- | --- | --- |
| Account Details | Email address (truncated) | Yes | PROF-12 |
| Data Export | — | Yes | PROF-13 |
| Delete Account | — | Yes | PROF-14 |

---

### Flow 2 — Edit Quit Date

#### PROF-02: Edit Quit Date (Stage 0 only)

What the user sees: date picker pre-populated with current quit date, or empty if no quit date has been set. Minimum selectable date = max(account creation date + 3 days, today). Once the 3-day window has passed, today is selectable. No maximum.

| User Action | What Happens |
| --- | --- |
| Selects a valid date → taps Confirm | quit_date updated. Stage 0 end date recalculates. All counter baselines update. Returns to PROF-01. |
| Selects same date → taps Confirm | No write. Returns to PROF-01. |
| Taps Back | Returns to PROF-01. No change. |

#### PROF-03: Quit Date Redirect (Stage 1+)

What the user sees: modal prompt. Copy: *"What would you like to do?"* Two options: **Take a break** and **Start fresh**. The old "Want to change your quit date?" framing is retired — pausing does not change the quit date, so the framing was an over-promise. If the user genuinely wants to change their quit date, that is a direct edit via PROF-02 (Stage 0 only).

| User Action | What Happens |
| --- | --- |
| Taps Take a break | Dismisses modal. Routes to the pause flow (defined in [[LastOne_Streak_System_Spec_V1_2]] — STK-7). |
| Taps Starting fresh | Dismisses modal. Routes to the restart flow (defined in Logging System Spec, Flow C3). |
| Taps Back or dismisses | Returns to PROF-01. No change. |

---

### Flow 3 — Edit Cigarettes Per Day

#### PROF-04: Edit Cigarettes Per Day

What the user sees: numeric input field pre-populated with current value. Integer only. Minimum value: 1.

| User Action | What Happens |
| --- | --- |
| Enters valid value → taps Save | cigarettes_per_day updated. cpd_change_log entry written with new value and timestamp. Progress Dashboard counters recalculate prospectively. Returns to PROF-01. |
| Enters 0 or empty → taps Save | Inline validation: 'Enter a number greater than 0.' No write. |
| Taps Back | Returns to PROF-01. No change. |

---

### Flow 4 — Edit Price Per Cigarette

#### PROF-05: Edit Price Per Cigarette

What the user sees: numeric input field (INR) pre-populated with current value. Decimal allowed (e.g. ₹12.50).

| User Action | What Happens |
| --- | --- |
| Enters valid value → taps Save | price_per_cigarette updated. price_change_log entry written with new value and timestamp. Progress Dashboard counters recalculate prospectively. Returns to PROF-01. |
| Enters 0 or empty → taps Save | Inline validation: 'Enter a price greater than ₹0.' No write. |
| Taps Back | Returns to PROF-01. No change. |

---

### Flow 5 — Voice Style Picker

#### PROF-06: Voice Style Picker

What the user sees: three options, each displaying the style name and a short example line of copy in that style. Example lines use a neutral craving moment so the difference is clear.

| Style | Example Line Shown |
| --- | --- |
| Steady & Direct | *The craving is here. It'll pass. You know what to do.* |
| Emotional & Understanding | *This is a hard moment, and that's okay. Take a breath.* |
| Light & Honest | *Your brain is being dramatic. Give it 3 minutes and it'll get bored.* |

| User Action | What Happens |
| --- | --- |
| Taps a style | Selection highlighted immediately. |
| Taps Confirm | voice_style updated. Change reflected in next content delivery. Returns to PROF-01. |
| Taps Back without confirming | Returns to PROF-01. No change. |

---

### Flow 6 — Spending Category Picker

#### PROF-07: Spending Category Picker

What the user sees: six options listed with label and a one-line description of what kinds of equivalents this produces.

| Option | Description Shown |
| --- | --- |
| Food Delivery | Zomato orders, chai runs, canteen meals |
| Movies & OTT | Movie tickets, streaming subscriptions |
| Music & Podcasts | Spotify, headphones, earphones |
| Travel | Bus/train tickets, Ola/Uber rides |
| Gaming | In-app purchases, gaming gear |
| Clothes & Shopping | Outfits, shoes, accessories |

| User Action | What Happens |
| --- | --- |
| Taps an option | Selection highlighted immediately. |
| Taps Confirm | relatable_category updated. Progress Dashboard equivalent lines re-render. Returns to PROF-01. |
| Taps Back without confirming | Returns to PROF-01. No change. |

---

### Flow 7 — Edit Display Name

#### PROF-08: Edit Display Name

What the user sees: single text input pre-populated with current display name. Max 30 characters. Character count shown.

| User Action | What Happens |
| --- | --- |
| Edits name → taps Save | display_name updated. Returns to PROF-01. |
| Clears field → taps Save | Inline validation: 'Name cannot be empty.' No write. |
| Taps Back | Returns to PROF-01. No change. |

---

### Flow 8 — SOS Contact Setup

#### PROF-09: SOS Contact Setup

What the user sees: two fields — Contact Name (text, max 50 chars) and Phone Number (numeric, Indian format). If a contact is already set, fields are pre-populated. If no contact is set, fields are empty with placeholder text. If a contact exists, a Remove Contact option is visible at the bottom.

| User Action | What Happens |
| --- | --- |
| Fills both fields → taps Save | sos_contact_name and sos_contact_phone updated. support_person_configured = true. Returns to PROF-01. SOS Contact row shows contact name. |
| Taps Save with either field empty | Inline validation per empty field. No write. |
| Taps Remove Contact | Confirmation prompt: 'Remove [Name] as your SOS contact?' Confirm → both fields cleared, support_person_configured = false. Cancel → no change. |
| Taps Back | Returns to PROF-01. No change. |

---

### Flow 9 — Notification Settings

#### PROF-10: Notification Settings

What the user sees: master toggle (Notifications On/Off) at top. Below it, frequency selector — three options: App Decides, Few Daily, On Demand. (`Once Daily` removed — see Notifications spec Decision 1.) Frequency selector is disabled (greyed out) when master toggle is Off.

| User Action | What Happens |
| --- | --- |
| Toggles master toggle Off | notifications_enabled = false. Frequency selector disabled. Returns state to PROF-01 row. |
| Toggles master toggle On | notifications_enabled = true. Frequency selector enabled. |
| Selects frequency option → taps Save | notification_preference updated. Returns to PROF-01. |
| Taps Back | Returns to PROF-01. Any unsaved frequency change is discarded. Master toggle state is saved immediately on toggle. |

---

### Flow 10 — Quiet Hours

#### PROF-11: Quiet Hours

What the user sees: on/off toggle at top. Below it, two time pickers — Start Time and End Time. Time pickers are disabled when toggle is Off. A note reads: *'SOS notifications always come through, even during quiet hours.'*

| User Action | What Happens |
| --- | --- |
| Toggles Quiet Hours Off | quiet_hours_enabled = false. Time pickers disabled. |
| Toggles Quiet Hours On | quiet_hours_enabled = true. Time pickers enabled. Default times pre-populated: 11:00 PM – 8:00 AM if first time enabling. |
| Sets times → taps Save | quiet_hours_start and quiet_hours_end updated. Returns to PROF-01. |
| Sets start time = end time | Inline validation: 'Start and end time cannot be the same.' Confirm disabled. |
| Taps Back | Returns to PROF-01. Toggle state saved immediately. Time changes discarded if not confirmed. |

---

### Flow 11 — Account Details

#### PROF-12: Account Details

What the user sees: current email displayed. Two options: Change Email and Change Password.

| User Action | What Happens |
| --- | --- |
| Taps Change Email | Opens email change flow: current password required for verification, then new email input, then confirmation email sent. |
| Taps Change Password | Opens password change flow: current password required, then new password + confirm new password. |
| Taps Back | Returns to PROF-01. |

> Note: The exact email/password change flows follow standard Supabase Auth patterns. Full flow detail to be confirmed during development.

---

### Flow 12 — Data Export

#### PROF-13: Data Export

What the user sees: explanation of what is included in the export (all log entries, streak history, goal data, craving patterns) and that it will be sent to their registered email address. Single CTA: Request Export.

| User Action | What Happens |
| --- | --- |
| Taps Request Export | Export job queued. Confirmation message shown: 'Your data will be sent to [email] within a few minutes.' Returns to PROF-01. |
| Taps Back | Returns to PROF-01. No action taken. |

---

### Flow 13 — Delete Account

#### PROF-14: Delete Account

What the user sees: explanation of what deletion means (all data permanently removed, account cannot be recovered). Text input field with prompt: *'Type DELETE to confirm.'* Confirm button is disabled until the exact text is entered.

| User Action | What Happens |
| --- | --- |
| Types 'DELETE' exactly | Confirm button enables. |
| Taps Confirm | Account deletion initiated. User signed out and taken to app landing screen. All user data purged. |
| Taps Back | Returns to PROF-01. No action taken. |
| Types anything other than 'DELETE' | Confirm button remains disabled. |

---

## Section 6 — Stage-by-Stage Behaviour

| Stage | Behaviour Detail |
| --- | --- |
| Stage 0 (Learning Week) | Full Settings access. Quit date is editable via PROF-02 (date picker). 3-day minimum from account creation date enforced. No maximum. |
| Stage 1 (First 72 Hours) | Full Settings access. Quit date row tappable but opens PROF-03 redirect instead of date picker. All other fields editable as normal. |
| Stage 2 (Days 4–7) | Identical to Stage 1. No changes. |
| Stage 3 (Weeks 2–3) | Identical to Stage 1. No changes. |
| Stage 4 (Weeks 4–8) | Identical to Stage 1. No changes. |
| Stage 5 (Months 3+) | Identical to Stage 1. No changes. |

---

## Section 7 — Copy

### PROF-03 — Quit Date Redirect Modal

Low sensitivity. One version.

- Heading: *What would you like to do?*
- Option 1: *Take a break* — pauses streak; quit date unchanged; soft re-engagement notifications begin (N-PAU track)
- Option 2: *Start fresh* — opens restart flow (mini re-onboarding + new quit date picker)

### PROF-06 — Voice Style Picker Labels

- Steady & Direct — *Short. Confident. No fluff.*
- Emotional & Understanding — *Empathetic. Acknowledges the hard moments.*
- Light & Honest — *A touch of humour. Self-aware.*

### PROF-09 — SOS Contact

- Name placeholder: *Contact name*
- Phone placeholder: *Phone number*
- Remove prompt: *Remove [Name] as your SOS contact?*
- Empty state on PROF-01 row: *Not set — add someone you trust*

### PROF-11 — Quiet Hours Note

- *SOS notifications always come through, even during quiet hours.*

### PROF-13 — Data Export

- Body: *We'll send a full export of your LastOne data to [email]. This includes all your log entries, streak history, goal progress, and craving patterns.*
- CTA: *Request Export*
- Confirmation toast: *Your data will be sent to [email] within a few minutes.*

### PROF-14 — Delete Account

| Voice Style | Copy |
| --- | --- |
| All styles (low sensitivity context) | *This will permanently delete your account and all your data. This cannot be undone. Type DELETE below to confirm.* |

---

## Section 8 — Edge Cases

| Scenario | Behaviour |
| --- | --- |
| User taps Quit Date in Stage 1+ | Opens PROF-03 redirect modal. Does not open a date picker. |
| User enters a quit date before the 3-day minimum in Stage 0 | Date is not selectable on the picker. Dates before min (account_created_at + 3) are greyed out. No maximum — user may set quit date as far out as they need. |
| User changes CPD or price — Progress Dashboard is open in background | Dashboard recalculates on next render after settings save. No real-time push to already-open screen required. |
| User tries to save Voice Style or Spending Category without changing the value | No write. Returns to PROF-01 silently. |
| User loses connection mid-edit on any field | Local write attempted. If sync fails: show inline error 'Changes couldn't be saved. Try again.' Field reverts to previous value. |
| User has no SOS contact set | SOS Contact row shows 'Not set — add someone you trust'. PROF-09 opens with empty fields. |
| User taps Remove Contact then taps Back on confirmation prompt | Contact is not removed. Returns to PROF-09 with fields intact. |
| User requests Data Export while offline | Show inline error: 'No connection. Try again when you're online.' No job queued. |
| User starts Delete Account flow then closes app | No deletion occurs. Deletion only triggers on explicit Confirm tap with valid 'DELETE' input. |
| User changes Display Name to a string with only spaces | Inline validation: 'Name cannot be empty.' No write. Trim whitespace before validation. |
| Quiet Hours start and end time span midnight (e.g. 11 PM – 8 AM) | Valid. System interprets as overnight range. No special handling needed — start > end is treated as crossing midnight. |

---

# PART B: SYSTEM LOGIC FOR IMPLEMENTATION

## B1 — Data Model

### profiles (settings-relevant fields)

> Canonical table is `profiles` (collapses the old `user` / `user_profile` aliases — see Schema A1). `quit_date` is **not** on this table; it lives on `quit_attempts`. The SOS contact is **not** on this table; it is device-only.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | string (UUID) | Yes | Primary key. Supabase Auth user ID. |
| display_name | string | Yes | Max 30 chars. No leading/trailing whitespace. |
| email | string | Yes | Managed by Supabase Auth. |
| voice_style | enum [`steady_and_direct` \| `emotional_and_understanding` \| `real_and_practical`] | Yes | Set at onboarding. Editable via PROF-06. Canonical voice enum (Schema A5 / T-E). |
| relatable_category | enum [`food_delivery` \| `movies_ott` \| `music_podcasts` \| `travel` \| `gaming` \| `clothes_shopping`] | Yes | Set at onboarding. Editable via PROF-07. |
| cigarettes_per_day | integer | Yes | Must be > 0. Editable via PROF-04. Canonical savings baseline (T-D). |
| price_per_cigarette | number (INR) | Yes | Must be > 0. Decimal allowed. Editable via PROF-05. |
| notifications_enabled | boolean | Yes | Default true. |
| notification_preference | enum [`app_decides` \| `few_daily` \| `on_demand`] | Yes | Default app_decides. `once_daily` removed — see Notifications spec Decision 1. |
| quiet_hours_enabled | boolean | Yes | Default false. |
| quiet_hours_start | time (HH:MM) | No | Required if quiet_hours_enabled = true. Default 23:00. |
| quiet_hours_end | time (HH:MM) | No | Required if quiet_hours_enabled = true. Default 08:00. |
| timezone | string (IANA) | Yes | Default Asia/Kolkata. Set at onboarding. Not currently editable via Settings UI — update deferred to V2. |
| account_created_at | timestamp | Yes | Set on account creation. Used to enforce the first-attempt quit_date minimum. |

**Not on `profiles`:**
- `quit_date` → lives on `quit_attempts.quit_date` (open row where `ended_at IS NULL`). Settings PROF-02 writes there. Min = account_created_at + 3 days, **no maximum**.
- `sos_contact_name`, `sos_contact_phone` → **device-only** (SecureStore). Never synced to server (T-F). PROF-09 writes to device storage.
- `support_person_configured` → derived at read time from device storage (true if device-stored name + phone both present).

### cpd_change_log

Tracks historical CPD values for prospective-only counter calculation.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| log_id | string (UUID) | Yes | — |
| user_id | string (UUID) | Yes | Foreign key to user. |
| previous_value | integer | Yes | CPD value before this change. |
| new_value | integer | Yes | CPD value after this change. |
| changed_at | timestamp | Yes | ISO 8601. Used as the prospective boundary. |

### price_change_log

Tracks historical price values for prospective-only counter calculation.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| log_id | string (UUID) | Yes | — |
| user_id | string (UUID) | Yes | Foreign key to user. |
| previous_value | number (INR) | Yes | Price before this change. |
| new_value | number (INR) | Yes | Price after this change. |
| changed_at | timestamp | Yes | ISO 8601. Used as the prospective boundary. |

---

## B2 — Logic & Conditions

### B2.1 Quit Date Editability

```
IF profiles.current_stage = 0
  THEN quit date tap → PROF-02 (date picker)
ELSE
  THEN quit date tap → PROF-03 (redirect modal)

Quit date validation (Stage 0 only):
  min_quit_date = account_created_at + 3 days
  max_quit_date = none          // no ceiling — Stage 0 is variable/unbounded (T-A Decision 1)
  selected_date must be >= min_quit_date
  written to quit_attempts.quit_date (open row), not profiles
```

### B2.2 Prospective Counter Recalculation

When cigarettes_per_day or price_per_cigarette is updated, Progress Dashboard counters recalculate using a piecewise approach:

```
total_money_saved = SUM over all smoke-free days of:
  IF day < earliest_cpd_or_price_change_date
    THEN original_cpd × original_price
  ELSE FOR each period between change events
    THEN cpd_at_that_time × price_at_that_time

Where:
  cpd_at_that_time = cpd_change_log value effective on that day
  price_at_that_time = price_change_log value effective on that day
  A day with no log change inherits the most recent value from each log
```

The same piecewise logic applies to time_reclaimed (uses cigarettes_per_day × 7 minutes per day).

### B2.3 Quiet Hours Enforcement

```
IF quiet_hours_enabled = true
  AND current_time is within [quiet_hours_start, quiet_hours_end]
  AND notification.type != 'sos'
  THEN suppress notification — queue for delivery at quiet_hours_end

IF notification.type = 'sos'
  THEN send regardless of quiet hours
```

Overnight range handling:
```
IF quiet_hours_start > quiet_hours_end
  THEN range spans midnight
  current_time within range IF:
    current_time >= quiet_hours_start OR current_time <= quiet_hours_end
```

### B2.4 support_person_configured Derivation

```
support_person_configured =
  (device_sos_contact_name IS NOT NULL AND device_sos_contact_name != '')
  AND
  (device_sos_contact_phone IS NOT NULL AND device_sos_contact_phone != '')
```

This field is read by the Giving Up Support System and the SOS flow. It is not stored independently — it is always derived at read time, from **device-local storage** (SecureStore). The contact name/phone are never written to `profiles` or any server table (T-F). Consequence: `support_person_configured` is false after a reinstall or device switch until the user re-enters the contact.

---

## B3 — Notification Logic

This feature does not own any notification sends. It owns the user-facing controls that govern notification delivery across the app.

The following fields written by this feature are read by the notification delivery layer:

| Field | Effect |
| --- | --- |
| notifications_enabled | If false: no notifications sent of any type (except SOS — see below). |
| notification_preference | Governs frequency tier. Passed to notification scheduling logic defined in Notifications Spec. |
| quiet_hours_enabled | If true: non-SOS notifications suppressed during the quiet window. |
| quiet_hours_start / quiet_hours_end | Defines the quiet window boundaries. |

**SOS bypass rule:** Notifications of type `sos` are exempt from both notifications_enabled = false and quiet hours suppression. This is the only exemption. All other notification logic — the one-notification-per-day rule, priority tiers, stage-based cadence — is defined in the Notifications Spec.

---

## B4 — API Surface

```
GET    /user/:id/profile          → returns full user profile object (all settings fields)
PATCH  /user/:id/profile          → updates any editable field on user object

POST   /user/:id/cpd-change-log   → writes a new CPD change entry (on cigarettes_per_day update)
POST   /user/:id/price-change-log → writes a new price change entry (on price_per_cigarette update)

GET    /user/:id/cpd-change-log   → returns full CPD history (used by Progress Dashboard for piecewise calculation)
GET    /user/:id/price-change-log → returns full price history (used by Progress Dashboard for piecewise calculation)

DELETE /user/:id                  → initiates account deletion. Purges all user data across all tables.
POST   /user/:id/data-export      → queues a data export job. Sends to user's registered email.
```

---

## Appendix — Deferred to V2

| Item | Reason |
| --- | --- |
| Anonymous Mode | Community feed only. Deferred with social layer. |
| Profile Card (public-facing) | Depends on social layer. |
| Your Cheerleaders | Depends on social layer. |
| Group Visibility | Depends on social layer. |
| Widgets | Platform-specific implementation. Out of scope for prototype. |
| Timezone editing | Currently set at onboarding and not editable in V1. Edge case — most users are in Asia/Kolkata. Revisit in V2 if needed. |

---

## Document Version History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.2 | May 2026 | Vedant Sinha | Initial draft |

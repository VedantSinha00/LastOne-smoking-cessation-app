# LastOne — Notifications Spec V1.2

[[LastOne]] — Feature Specification: Notification System

## Connected to

- [[LastOne_Settings_Profile_Spec_V1_2]] — owns user-facing notification controls (PROF-10, PROF-11)
- [[LastOne_Content_Voice_Brief_V1_2]] — governs all notification copy
- [[LastOne_Onboarding_Spec_V1_2]] — owns N-OB-01 through N-OB-06 copy; OS permission requested here
- [[LastOne_Streak_System_Spec_V1_2]] — owns N-STK-01 through N-STK-03 copy
- [[LastOne_Content_Cards_V1]] — owns health milestone trigger logic
- [[LastOne_Insights]] — owns N-INS-01 through N-INS-03 trigger logic
- [[LastOne_PersonalGoals_Spec]] — owns N-GOAL-01 and N-GOAL-02 copy

---

## Version History

| Version | Date | Summary |
|---|---|---|
| 1.0 | May 2026 | Initial draft. All product decisions resolved. Copy for N-CON-01–10, N-INS-01–03, N-PROF-01 pending. |
| 1.1 | May 2026 | All notification copy written. Health milestones N-CON-01–10 get 3 voice variants each, leading with the time anchor. Added N-CON-11 (1yr) + N-CON-12 (5yr) as low-sensitivity single-version notifications (YB-11/12). Insight notifications kept generic — added Decision 9 documenting the privacy rationale (detected value shown on card, not in push). 72hr copy reworked to name the withdrawal peak; 3mo copy aligned to the card's "a fraction of Day 1". Status: Ready for Development. |
| 1.2 | May 2026 | N-CON-11 (1yr) + N-CON-12 (5yr) promoted to high-sensitivity, 3 voice variants each, merged into the main milestone table (now N-CON-01–12). SpecReview pass complete: dependencies, first-run edge case, and enum closure added; structure annotated. Voice variant labels reflect the V1.2 taxonomy (Steady & Direct / Emotional & Understanding / Real & Practical). All copy complete. |
| 1.3 | June 2026 | Added pause re-engagement track (N-PAU-01–04, Decision 10). Resolves U7 from schema merge gap register. 4 notifications (Day 3/7/14/30 of pause), 2 voice variants each (S&D + E&U; R&P deferred to V1.2 copy pass). All active-user notifications suppressed during pause. Data model dependency: `streak_record.paused_at` (Streak spec follow-through). |

---

# PART A: FEATURE DEFINITION

## 1. Problem & Purpose

### 1.1 The Real Problem

Notification logic for LastOne is currently scattered across eight feature specs, each defining its own triggers, timing rules, and priority logic in isolation. There is no unified source of truth for how notifications interact — which ones fire when multiple want to fire on the same day, what each preference tier actually suppresses, or how the delivery layer respects quiet hours and the auto-reduce rule. A developer building from the current specs would have to reconcile eight different B3 sections with no arbitration mechanism.

### 1.2 Why This Matters for LastOne

Notifications are the primary channel through which the app reaches users between sessions — especially in the critical first 72 hours of a quit attempt. Getting them wrong (too many, wrong timing, wrong priority) actively harms retention and can make the app feel like a source of anxiety rather than support. The notification system underpins the Content & Awareness Framework (Foundation 5) and the Stage System (Foundation 1) — both require notifications to deliver time-sensitive information at the right moment.

### 1.3 User Story

Priya is 48 hours into her first quit attempt. It's 6pm — her Learning Week data shows this is her highest-risk window. She hasn't logged a check-in yet today. Her phone buzzes once. It's LastOne: "48 hours. Nicotine is completely out of your body." She opens it, reads the card, logs a craving, uses a breathing tool. She doesn't smoke. The notification arrived at the right moment, said the right thing, and led her somewhere useful — without her having to remember to open the app.

### 1.4 Success Metrics

- Notification open rate ≥ 40% across all types
- Auto-reduce rule triggers for < 20% of users in any 7-day window (proxy: notifications are well-calibrated)
- Daily check-in reminder open rate ≥ 50% in Stage 1
- < 5% of users disable notifications entirely within 30 days of quit start

---

## 2. Feature Overview

### 2.1 What This Feature Does

The notification system is the delivery layer that connects all feature-level notification types to the user's lock screen. It enforces priority ordering when multiple notifications compete for a day's slot, respects the user's preference tier and quiet hours, applies the auto-reduce rule when notifications are consistently ignored, and serves as the single authoritative source for all notification logic across the app.

### 2.2 Where It Lives in the App

Not a screen. A delivery layer. The user-facing controls (notification preference, quiet hours, master on/off toggle) live in Settings — PROF-10 and PROF-11. This spec owns the logic behind those controls; Settings owns the UI.

### 2.3 Stage Relevance

| Stage | Notification Behaviour |
|---|---|
| Stage 0 (Learning Week) | Pre-quit notifications only: onboarding reminder, quit date nudges, quit eve reminder. No craving or milestone notifications. |
| Stage 1 (First 72 Hours) | Highest cadence. Daily check-in reminder fires. Health milestones N-CON-01–06 may fire. Quit day arrival fires on Day 1. Cap: up to 3/day (app_decides). |
| Stage 2 (Days 4–7) | Daily check-in reminder continues. Remaining health milestones eligible. Cap: up to 2/day. |
| Stage 3 (Weeks 2–3) | No daily check-in reminder. Insight notifications begin. Cap: 1/day or every other day. |
| Stage 4 (Weeks 4–8) | Milestone and insight notifications. Cap: 2–3/week. |
| Stage 5 (Months 3+) | Low-frequency. Milestone and insight notifications only. Cap: 1/week or less. |

### 2.4 Dependencies

**Reads from:**
- `profiles` — notification_preference, notifications_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, voice_style, current_stage, quit_date, trigger_times
- All feature specs for trigger conditions (see Section 5 — Notification Registry)

**Writes to:**
- `notification_log` — records every notification queued, delivered, opened, ignored, expired
- `notification_state` — tracks consecutive_ignored count and auto_reduce state per user

**Requires from other features:**
- Trigger conditions and copy ownership from each source spec — Onboarding (N-OB-*), Streak (N-STK-*), Content Cards (N-CON-*), Insights (N-INS-*), Goals (N-GOAL-*). See Section 5 Owning Spec column.
- The user's known risk window from Learning Week data (owned by Streak/Insights) for Stage 1–2 timing.

**Triggers:**
- Push delivery via Expo Push Notifications. This is the terminal delivery layer — it triggers no downstream feature logic.

---

## 3. Design Decisions

### Decision 1: Three preference tiers, not four

**Chosen:** `app_decides` | `few_daily` | `on_demand`

**Rejected:** A fourth tier `once_daily`

**Rationale:** The `on_demand` tier is a type filter — only specific high-importance notifications fire regardless of volume. If the on_demand notification set bypassed `once_daily` (which it must, being genuinely important), `once_daily` would mean "on_demand plus one more per day" — a misleading label and a tier without a real user mental model. Removing it keeps the preference model clean.

### Decision 2: on_demand is a type filter, not a quantity cap

**Chosen:** `on_demand` suppresses all notifications except a defined set of high-importance events. See Section 5 for the on_demand column.

**Rejected:** `on_demand` as a hard daily cap applied to all notification types.

**Rationale:** The `on_demand` user has opted out of being pushed to. They engage with the app on their own terms. A quantity cap still sends daily nudges — just fewer. A type filter respects their intent: only genuinely important events reach them. Everything else they discover on app open.

### Decision 3: Daily check-in reminder bypasses quiet hours only

**Chosen:** The daily check-in reminder (N-STK-01) bypasses quiet hours. It does not bypass `notifications_enabled = false`.

**Rejected:** Full bypass of all delivery controls.

**Rationale:** The check-in reminder fires at the user's peak risk window from Learning Week data. If quiet hours overlap with that window (e.g. risk window is 11pm, quiet hours start at 10pm), suppressing it defeats the entire purpose of risk-window timing. If a user has turned all notifications off (`notifications_enabled = false`), that is a stronger signal that must be respected.

### Decision 4: Freeze refill notification does not exist

**Chosen:** No notification for freeze stock refills.

**Rejected:** A notification informing the user their freeze stock has been refreshed.

**Rationale:** "Your freeze stock has been refreshed" reads as "you have room to slip again" — a cue-creating message that undermines the quit attempt. Freeze stock is visible on the streak screen; users who care will find it there.

### Decision 5: Quit day arrival and Stage 0→1 transition merged

**Chosen:** One notification fires when `current_date >= quit_date`. Owned by N-OB-05 (Onboarding spec B3).

**Rejected:** Two separate notifications for the same event.

**Rationale:** Both triggered by the same condition. Two notifications for the same moment would be redundant. The quit day arrival copy carries the right emotional weight for this moment.

### Decision 6: OS permission requested during onboarding

**Chosen:** Native iOS/Android notification permission prompt shown during onboarding, immediately after the user sets their notification preference.

**Rejected:** On quit day, or on first relevant trigger.

**Rationale:** The user has just actively engaged with notifications as a topic — they've selected their preference tier. Requesting permission immediately after is the logical next step. If denied: a one-time in-app prompt shown around quit day points to Settings. No further in-app prompts after that.

### Decision 7: Quit date nudges are notification-only

**Chosen:** Quit date nudges (N-OB-01/02/03) fire as push notifications only. No in-app surface.

**Rejected:** A persistent home screen card as a fallback for on_demand users.

**Rationale:** Adding an in-app surface adds complexity without proportionate value for V1. Quit date nudges fire for on_demand users too.

### Decision 8: Voice style prompt fires around Day 3

**Chosen:** N-PROF-01 fires on Day 3 after account creation if `set_during_onboarding = false`. Fires for all tiers including on_demand — voice style affects all high-sensitivity content delivery, so even on_demand users need this prompt.

**Rejected:** Collecting voice style during onboarding.

**Rationale:** Users cannot meaningfully choose a voice style before experiencing the app. Day 3 gives enough exposure to have a real preference. Decision originates in the Onboarding spec.

### Decision 10: Pause state gets a soft re-engagement track, not silence

**Chosen:** When `streak_status = 'paused'`, all normal active-user notifications (progress, streak, milestones, insights) are suspended. A dedicated lightweight re-engagement track fires instead: N-PAU-01 (Day 3), N-PAU-02 (Day 7), N-PAU-03 (Day 14), then silence until N-PAU-04 (Day 30), after which the user receives no further notifications until they resume or restart.

**Rejected:** Full silence during pause; continuing normal notifications during pause.

**Rationale:** Full silence risks the user drifting away permanently — no hand reaching out at all. Continuing normal notifications is wrong — telling a paused user their streak is doing well is factually misleading and tonally off. The re-engagement track is a welfare check, not a marketing push: calm, non-naggy, and explicitly respectful of the user's decision to step back. The track stops on resume (normal notifications restart) or restart (restart flow begins). Fires for all tiers including `on_demand` — a user who has paused is in a distinct state from an active user who prefers minimal notifications; the welfare check is warranted regardless of their normal preference.

### Decision 9: Insight notifications use generic copy, not the detected value

**Chosen:** N-INS-01/02/03 are written as generic copy that signals a pattern exists. The detected value (peak risk window, top trigger, slip pattern) is shown on the insight card after app open — never in the push body.

**Rejected:** Interpolating the detected value into the notification so it stands alone on the lock screen.

**Rationale:** This is a privacy decision, not a copy decision. A detected behavioural pattern — *your* peak craving window, *your* repeat trigger — is sensitive personal information. Placing it on a lock screen exposes it to anyone who can glance at the phone. Keeping the specific value behind the app open treats the app open as the user's implicit consent gate. This is a deliberate exception to the "must stand alone" rule that governs all other notification copy: for insights, the privacy of the inference outweighs lock-screen self-sufficiency.

---

## 4. Screen Inventory

No screens. This feature is a delivery layer. User-facing controls are in Settings (PROF-10, PROF-11).

> **Note on structure:** This spec has no Section 5 "Flow Logic" in the screen-flow sense, because there are no screens. The **Notification Registry (Section 5)** stands in as the flow-logic equivalent — it defines the trigger → timing → priority → delivery path for every notification. Section 8 (Edge Cases) and B2 (Logic & Conditions) carry the branch resolution that flows would normally hold.

---

## 5. Notification Registry

Master table of all notification types. Authoritative source for trigger, timing, priority, and delivery rules for each notification.

| ID | Name | Owning Spec | Trigger Condition | Timing | Priority | on_demand | Respects Pref? | Fires |
|---|---|---|---|---|---|---|---|---|
| N-OB-00 | Incomplete onboarding | Onboarding B3 | `onboarding_complete = false` after 24h | 24h after account creation | N/A | N/A — pre-preference | No | Once |
| N-OB-01 | Quit date nudge Day 7 | Onboarding B3 | `quit_date IS NULL` AND day 7 since account creation | 09:00 local | 10 | ✓ | Yes | Once |
| N-OB-02 | Quit date nudge Day 14 | Onboarding B3 | `quit_date IS NULL` AND day 14 since account creation | 09:00 local | 10 | ✓ | Yes | Once |
| N-OB-03 | Quit date nudge Day 21+ | Onboarding B3 | `quit_date IS NULL` AND day 21+, then twice weekly | 09:00 local | 10 | ✓ | Yes | Twice weekly until set |
| N-OB-04 | Quit eve reminder | Onboarding B3 | `quit_date - current_date = 1` AND `onboarding_complete = true` | 20:00 local | 4 | ✓ | Yes | Once |
| N-OB-05 | Quit day arrival | Onboarding B3 | `current_date >= quit_date` AND `onboarding_complete = true` | User's highest-risk window. Fallback: 09:00 local | 1 | ✓ | Yes | Once |
| N-STK-01 | Daily check-in reminder | Streak B3 | Stage 1–2 only. No check-in completed by 20:00 | User's known risk window from Learning Week. Fallback: 20:00 IST. Bypasses quiet hours. | 2 | ✗ | Yes | Daily (Stage 1–2 only) |
| N-STK-02 | Stage transition | Streak B3 | `current_stage` changes (1→2, 2→3, 3→4, 4→5) | Immediately on transition | 5 | ✗ | Yes | Once per transition |
| N-STK-03 | Streak milestone | Streak B3 | `current_streak_days` crosses milestone threshold (first crossing) | Immediately | 6 | ✗ | Yes | Once per milestone |
| N-CON-01 | Health milestone 20min | Content Cards B2 | `minutes_since_quit >= 20` (first time) | Immediately | 3 | ✓ | Yes | Once |
| N-CON-02 | Health milestone 8hr | Content Cards B2 | `hours_since_quit >= 8` | Immediately | 3 | ✓ | Yes | Once |
| N-CON-03 | Health milestone 12hr | Content Cards B2 | `hours_since_quit >= 12` | Immediately | 3 | ✓ | Yes | Once |
| N-CON-04 | Health milestone 24hr | Content Cards B2 | `hours_since_quit >= 24` | Immediately | 3 | ✓ | Yes | Once |
| N-CON-05 | Health milestone 48hr | Content Cards B2 | `hours_since_quit >= 48` | Immediately | 3 | ✓ | Yes | Once |
| N-CON-06 | Health milestone 72hr | Content Cards B2 | `hours_since_quit >= 72` | Immediately | 3 | ✓ | Yes | Once |
| N-CON-07 | Health milestone 1wk | Content Cards B2 | `days_since_quit >= 7` | Immediately | 3 | ✗ | Yes | Once |
| N-CON-08 | Health milestone 2wk | Content Cards B2 | `days_since_quit >= 14` | Immediately | 3 | ✗ | Yes | Once |
| N-CON-09 | Health milestone 1mo | Content Cards B2 | `days_since_quit >= 30` | Immediately | 3 | ✗ | Yes | Once |
| N-CON-10 | Health milestone 3mo | Content Cards B2 | `days_since_quit >= 90` | Immediately | 3 | ✗ | Yes | Once |
| N-CON-11 | Health milestone 1yr | Content Cards B2 | `days_since_quit >= 365` | Immediately | 3 | ✗ | Yes | Once |
| N-CON-12 | Health milestone 5yr | Content Cards B2 | `days_since_quit >= 1825` | Immediately | 3 | ✗ | Yes | Once |
| N-INS-01 | New pattern detected | Insights B3 | Significant insight_card generated for first time (peak_risk_window, top_trigger, craving_drop) | Within 2h of generation. Fire 1–2h after risk window in Stage 1–2. | 8 | ✓ | Yes | Once per insight_key |
| N-INS-02 | Progress threshold | Insights B3 | resistance_rate ≥ 70% first time OR cravings_per_day < 50% of baseline first time | Within 2h of crossing | 9 | ✗ | Yes | Once per threshold |
| N-INS-03 | Slip pattern emerging | Insights B3 | 2+ slips share trigger_tag or time window | Within 4h of detection | 7 | ✓ | Yes | Once per slip_pattern insight_key |
| N-GOAL-01 | Occasion nudge | Goals B3 | `days_until_occasion BETWEEN 3 AND 5`. Stage ≥ 1. Not dismissed this calendar year. | 19:00 local or user's notification_time_preference | 11 | ✗ | Yes | Once per occasion per year |
| N-GOAL-02 | Causes card | Goals B3 | Stage ≥ 3. total_saved > 0. 14 days since last shown. | Same as N-GOAL-01 | 12 | ✗ | Yes | Per 14-day interval |
| N-PROF-01 | Voice style prompt | This spec | `set_during_onboarding = false` AND day 3 since account creation | 19:00 local | N/A — fires for all tiers including on_demand | ✓ | Yes | Once |
| N-PAU-01 | Pause re-engagement Day 3 | This spec | `streak_status = 'paused'` AND `pause_duration_days = 3` | 09:00 local | 13 | ✓ | Pause-only† | Once per pause instance |
| N-PAU-02 | Pause re-engagement Day 7 | This spec | `streak_status = 'paused'` AND `pause_duration_days = 7` | 09:00 local | 13 | ✓ | Pause-only† | Once per pause instance |
| N-PAU-03 | Pause re-engagement Day 14 | This spec | `streak_status = 'paused'` AND `pause_duration_days = 14` | 09:00 local | 13 | ✓ | Pause-only† | Once per pause instance |
| N-PAU-04 | Pause re-engagement Day 30 | This spec | `streak_status = 'paused'` AND `pause_duration_days = 30` | 09:00 local | 13 | ✓ | Pause-only† | Once per pause instance |

> **† Pause-only:** N-PAU-01–04 fire exclusively during `streak_status = 'paused'`. During pause, all other active-user notifications (N-STK, N-CON, N-INS, N-GOAL) are suppressed regardless of preference tier. The PAU track replaces the normal cadence entirely; priority ordering against active-user notifications is irrelevant. Fires for all tiers including `on_demand` — see Decision 10. `pause_duration_days` is derived as `CURRENT_DATE − streak_record.paused_at`; requires `paused_at` timestamptz on `streak_record` (see B1 data model note).

---

## 6. Stage-by-Stage Behaviour

### Notification Cadence Caps

| Stage | app_decides | few_daily | on_demand |
|---|---|---|---|
| Stage 0 | Pre-quit types only | Pre-quit types only | Pre-quit types only |
| Stage 1 | Up to 3/day | Up to 2/day | on_demand set only |
| Stage 2 | Up to 2/day | Up to 2/day | on_demand set only |
| Stage 3 | 1/day or every other day | 1/day or every other day | on_demand set only |
| Stage 4 | 2–3/week | 2–3/week | on_demand set only |
| Stage 5 | 1/week or less | 1/week or less | on_demand set only |
| **Paused (any stage)** | **N-PAU track only (Day 3/7/14/30). All other notifications suspended.** | **N-PAU track only** | **N-PAU track only** |

> `few_daily` is functionally identical to `app_decides` from Stage 3 onwards — the stage cadence already caps at ≤ 1/day. The distinction only matters in Stages 1–2.

### on_demand Eligible Notifications

The following fire for `on_demand` users. All others are suppressed until the user opens the app.

N-OB-01, N-OB-02, N-OB-03, N-OB-04, N-OB-05, N-CON-01, N-CON-02, N-CON-03, N-CON-04, N-CON-05, N-CON-06, N-INS-01, N-INS-03, N-PROF-01.

---

## 7. Copy

All notification copy is high-sensitivity unless noted. High-sensitivity copy requires all 3 voice variants: Steady & Direct, Emotional & Understanding, Real & Practical. Max 12 words per notification. Each notification must stand alone — it appears on the lock screen with no app context around it. The user may not have opened the app in days. See [[LastOne_Content_Voice_Brief_V1_2]] for all language rules.

### Notifications with copy defined in owning spec

Do not duplicate here — reference only.

| Notification | Copy location |
|---|---|
| N-OB-00 — Incomplete onboarding | Onboarding Spec B3 |
| N-OB-01/02/03 — Quit date nudges | Onboarding Spec B3 |
| N-OB-04 — Quit eve reminder | Onboarding Spec B3 |
| N-OB-05 — Quit day arrival | Onboarding Spec B3 |
| N-STK-01 — Daily check-in reminder | Streak System Spec Section 7 |
| N-STK-02 — Stage transition | Streak System Spec Section 7 |
| N-STK-03 — Streak milestone | Streak System Spec Section 7 |
| N-GOAL-01 — Occasion nudge | Personal Goals Spec Section 7 |
| N-GOAL-02 — Causes card | Personal Goals Spec Section 7 |

### N-CON-01 through N-CON-12 — Health Milestone Notifications

> **Status: Ready for Development.**

All 12 are high-sensitivity. 3 voice variants each. The notification is the hook only — it leads with the time anchor so it stands alone on the lock screen, then taps through to the full card. Full card content is in [[LastOne_Content_Cards_V1]] (YB-01 through YB-12). Max 12 words.

| ID | Milestone | Steady & Direct | Emotional & Understanding | Real & Practical |
|---|---|---|---|---|
| N-CON-01 | 20 minutes | 20 minutes in. Your heart rate has already dropped. | 20 minutes. Small start — your heart's already responding. | 20 minutes smoke-free. Heart rate down, blood pressure falling now. |
| N-CON-02 | 8 hours | 8 hours. Carbon monoxide is clearing out of your blood. | 8 hours done. Your blood is already clearing the carbon monoxide. | 8 hours smoke-free. Carbon monoxide dropping; haemoglobin carrying oxygen again. |
| N-CON-03 | 12 hours | 12 hours. Carbon monoxide is back to normal levels. | 12 hours in. Your blood's carrying oxygen properly again. | 12 hours smoke-free. CO normalised; haemoglobin at full oxygen capacity. |
| N-CON-04 | 24 hours | 24 hours. One smoke-free day. Heart attack risk already down. | One full day smoke-free. That's real — and your heart knows. | 24 hours smoke-free. Risk of a cardiac event measurably lower. |
| N-CON-05 | 48 hours | 48 hours. Nicotine is completely out of your body now. | 48 hours. The nicotine's gone — smell and taste start returning. | 48 hours smoke-free. Nicotine fully cleared; smell and taste recovering. |
| N-CON-06 | 72 hours | 72 hours. The hardest stretch — and your lungs are opening up. | 72 hours. This part's hard. It peaks here, then it drops. | 72 hours smoke-free. Withdrawal peaks now, then eases. Lungs already recovering. |
| N-CON-07 | 1 week | One week. Peak withdrawal is behind you now. | One week smoke-free. The worst of withdrawal is behind you. | One week smoke-free. Nicotine receptors returning to a normal count. |
| N-CON-08 | 2 weeks | Two weeks. Blood is reaching your hands and feet better. | Two weeks smoke-free. Your circulation's noticeably better than Day 1. | Two weeks smoke-free. Circulation improved; lung function up since Day 1. |
| N-CON-09 | 1 month | One month. The cilia in your airways are working again. | One month smoke-free. Your lungs are cleaning themselves out again. | One month smoke-free. Airway cilia regrown, clearing debris properly again. |
| N-CON-10 | 3 months | Three months. Your lung function is significantly stronger now. | Three months smoke-free. Breathing and energy genuinely feel different now. | Three months smoke-free. Coughing and breathlessness a fraction of Day 1. |
| N-CON-11 | 1 year | One year smoke-free. Your heart disease risk is now half a smoker's. | One year smoke-free. A whole year you chose this. Your heart's safer. | One year smoke-free. Coronary heart disease risk now halved versus a smoker. |
| N-CON-12 | 5 years | Five years smoke-free. Your stroke risk is near someone who never smoked. | Five years. That's a different life now — stroke risk near a non-smoker's. | Five years smoke-free. Stroke risk now approaches a never-smoker's baseline. |

> N-CON-11 (1yr) and N-CON-12 (5yr) fire in Stage 5 as anniversary milestones, anchored to `quit_date` (see Section 5 registry). Their underlying cards YB-11/12 are still tagged low-sensitivity in [[LastOne_Content_Cards_V1]] — so the notification is voice-matched (3 variants) while the card it opens is single-version. Acceptable for V1; bump the cards if full parity is wanted.

### N-INS-01 — New Pattern Detected

> **Status: Ready for Development.**

High-sensitivity. 3 voice variants. Fires once per insight_key. Insight types: peak_risk_window, top_trigger, craving_drop. Copy is generic — it signals a pattern exists and pulls the user in; the detected value is shown on the insight card, not in the push.

| Voice | Copy |
|---|---|
| Steady & Direct | Something new showed up in your cravings. Worth a look. |
| Emotional & Understanding | There's a pattern in your week you'll want to see. |
| Real & Practical | New pattern detected in your craving data. Details in the app. |

### N-INS-02 — Progress Threshold

> **Status: Ready for Development.**

High-sensitivity. 3 voice variants. Gain-framed. Fires once per threshold crossed (resistance rate ≥ 70%, or cravings/day below 50% of baseline).

| Voice | Copy |
|---|---|
| Steady & Direct | You crossed a real milestone today. Open to see it. |
| Emotional & Understanding | Your numbers moved in a way that matters. Take a look. |
| Real & Practical | A progress threshold just cleared. The data's in the app. |

### N-INS-03 — Slip Pattern Emerging

> **Status: Ready for Development.**

High-sensitivity. 3 voice variants. No shame framing. No drama. Fires once per slip_pattern insight_key.

| Voice | Copy |
|---|---|
| Steady & Direct | A pattern's forming in your slips. Worth knowing about. |
| Emotional & Understanding | Something's repeating around your slips. No judgment — just worth seeing. |
| Real & Practical | Two slips share a pattern. The details are in the app. |

### N-PAU-01 through N-PAU-04 — Pause Re-engagement Track

> **Status: Ready for Development.**

2 voice variants only (Steady & Direct, Emotional & Understanding). Real & Practical deferred to V1.2 alongside the broader Real & Practical copy pass. Low-sensitivity framing — no guilt, no false cheerfulness. Calm and functional. Fires at 09:00 local. All active-user notifications are suppressed during pause; these are the only notifications a paused user receives. Track stops immediately on resume or restart — do not send any pending PAU nudge once `streak_status` is no longer `paused`.

| ID | Day of pause | Steady & Direct | Emotional & Understanding |
|---|---|---|---|
| N-PAU-01 | Day 3 | Title: "Still with you." Body: "Your quit journey is paused. Everything's saved — come back when you're ready." | Title: "Take your time." Body: "Stepping back takes courage too. We're here whenever you're ready." |
| N-PAU-02 | Day 7 | Title: "One week paused." Body: "Your progress is saved. Whenever you're ready, your journey picks up where you left off." | Title: "A week in." Body: "It's okay to need more time. Your journey is waiting — no judgement, whenever you're ready." |
| N-PAU-03 | Day 14 | Title: "Last check-in for now." Body: "We'll give you space from here. Everything's saved and ready when you are." | Title: "We'll stop nudging you." Body: "We don't want to pressure you. Your journey is here — come back in your own time." |
| N-PAU-04 | Day 30 | Title: "One last check-in." Body: "It's been a month. Ready to try again? Your journey is one tap away." | Title: "Still thinking of you." Body: "A month is a long time to hold onto this. Whenever you're ready — even if it's not today — we're here." |

> After N-PAU-04, the user receives no further notifications until they resume (streak_status → active, normal cadence restarts) or restart (restart flow begins, new attempt opens, normal cadence restarts from Stage 0).

### N-PROF-01 — Voice Style Prompt

> **Status: Ready for Development.**

Low-sensitivity — one version only. Fires Day 3 if voice style not set during onboarding. Nudges the user to personalise how the app communicates with them.

| Voice | Copy |
|---|---|
| Neutral (single version) | Pick how LastOne talks to you — ten seconds in Settings. |

---

## 8. Edge Cases

| Scenario | Behaviour |
|---|---|
| First run / no history — user has not set `quit_date` yet | Only pre-quit notifications are eligible (N-OB-00 incomplete onboarding, N-OB-01/02/03 quit date nudges). No milestone, check-in, or insight notification can fire without a `quit_date` anchor. `notification_state` row is created on first preference write; until then, only N-OB-00 (pre-preference) is eligible. |
| Multiple notifications compete for the same day's slot | Priority ordering (Section 5, Priority column) determines which fires. Lower-priority notifications defer to the next available slot. |
| Deferred notification expires before its slot opens | Discard silently. Do not deliver. Applies to N-INS-01, N-INS-02, N-INS-03 (48hr expires_at). |
| User's risk window falls inside quiet hours | N-STK-01 (daily check-in reminder) fires regardless — it bypasses quiet hours only. All other notifications queue for delivery at quiet_hours_end. |
| `notifications_enabled = false` | No notifications fire. N-STK-01 does NOT bypass this. Only N-OB-00 (pre-preference) is exempt. |
| `on_demand` user — non-eligible notification wants to fire | Suppress silently. No deferral. Not queued for later. |
| OS notification permission denied during onboarding | App notes denied state. One-time in-app prompt shown around quit day directing to Settings. No further in-app prompts until user asks in Settings. |
| User ignores 3 consecutive notifications | Auto-reduce fires: effective tier drops one step for 7 days. Sequence: app_decides → few_daily → on_demand. After 7 days, reverts to stored preference. |
| User on `on_demand` ignores 3 consecutive | Already at floor. No further reduction. Auto-reduce does not apply. |
| User pauses (`streak_status = 'paused'`) | All active-user notifications (N-STK, N-CON, N-INS, N-GOAL) suppressed immediately. N-PAU track begins: Day 3/7/14/30 of pause. `paused_at` set on `streak_record` at the moment of pause. |
| User resumes while a N-PAU notification is pending | Cancel the pending N-PAU notification. Do not deliver it. Normal notification cadence restarts immediately from the user's current stage. |
| User restarts from pause | N-PAU track stops. Restart flow begins (Decision 2 — T-A). New attempt opens; normal cadence restarts from Stage 0. |
| User pauses multiple times | Each pause instance is independent. `paused_at` resets on each new pause. N-PAU-01–04 fire once per pause instance, not once per account lifetime. |
| N-PAU-04 delivered, user still paused | No further notifications. Permanent silence until resume or restart. Auto-reduce does not apply during pause — the PAU track is already the floor. |
| Health milestone crosses while app is offline | Notification queued. Delivered on next background fetch or app open. If delivery is delayed beyond 24h, discard — the milestone moment has passed. |
| Quit date nudges for `on_demand` user | These are notification-only (no in-app surface). Fire as normal. |

---

# PART B: SYSTEM LOGIC FOR IMPLEMENTATION

## B1. Data Model

### `notification_log`

Records every notification that enters the delivery pipeline.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| user_id | uuid | Yes | FK → profiles.id |
| notification_type | enum | Yes | Closed set — every N-code defined in the Section 5 Registry (N-OB-00 … N-PROF-01). Section 5 is the authoritative value list. |
| status | enum [`queued` \| `delivered` \| `opened` \| `ignored` \| `expired` \| `discarded`] | Yes | |
| scheduled_for | timestamptz | Yes | When notification should fire |
| delivered_at | timestamptz | No | Null until delivered |
| opened_at | timestamptz | No | Null until opened |
| expires_at | timestamptz | No | Required for N-INS-01/02/03. Null for non-expiring types. |
| created_at | timestamptz | Yes | Auto |

> **Data model dependency — `streak_record.paused_at`:** N-PAU-01–04 derive `pause_duration_days` as `CURRENT_DATE − streak_record.paused_at`. The `streak_record` table must include a `paused_at timestamptz` field, set when `streak_status` transitions to `paused` and cleared (set NULL) on resume or restart. This is a Streak System spec follow-through item (T-A/T-B). Without `paused_at`, the PAU trigger condition cannot be evaluated.

### `notification_state`

One row per user. Tracks auto-reduce state.

| Field | Type | Required | Notes |
|---|---|---|---|
| user_id | uuid | Yes | PK + FK → profiles.id |
| consecutive_ignored | integer | Yes | Default 0. Resets to 0 on any notification opened. |
| auto_reduce_active_until | timestamptz | No | Null when auto-reduce is not active |
| effective_tier | enum [`app_decides` \| `few_daily` \| `on_demand`] | Yes | Matches user.notification_preference unless auto-reduce is active |

---

## B2. Logic & Conditions

### B2.1 Preference Tier Behaviour

```
IF notifications_enabled = false
  THEN suppress all notifications
  EXCEPT N-OB-00 (pre-preference — fires regardless)

ELSE
  effective_tier = notification_state.effective_tier

  IF effective_tier = 'on_demand'
    THEN only fire notifications where on_demand = ✓ (Section 5)

  IF effective_tier = 'few_daily'
    THEN daily cap = 2
    Use priority ordering (B2.3) when cap is reached

  IF effective_tier = 'app_decides'
    THEN daily cap = stage cadence (Section 6)
    Use priority ordering (B2.3) when cap is reached
```

### B2.2 Quiet Hours Enforcement

```
IF quiet_hours_enabled = true
  AND current_time is within [quiet_hours_start, quiet_hours_end]
  AND notification_type != 'N-STK-01'
  THEN suppress — queue for delivery at quiet_hours_end

IF notification_type = 'N-STK-01'
  THEN send regardless of quiet hours

// Overnight range handling:
IF quiet_hours_start > quiet_hours_end
  THEN range spans midnight
  current_time within range IF:
    current_time >= quiet_hours_start OR current_time <= quiet_hours_end
```

### B2.3 Priority Ordering

When multiple notifications compete for a slot, deliver the highest-priority one. Lower-priority notifications defer to the next available slot.

| Priority | Notification |
|---|---|
| 1 | N-OB-05 — Quit day arrival |
| 2 | N-STK-01 — Daily check-in reminder |
| 3 | N-CON-01 through N-CON-12 — Health milestones |
| 4 | N-OB-04 — Quit eve reminder |
| 5 | N-STK-02 — Stage transition |
| 6 | N-STK-03 — Streak milestones |
| 7 | N-INS-03 — Slip pattern emerging |
| 8 | N-INS-01 — New pattern detected |
| 9 | N-INS-02 — Progress threshold |
| 10 | N-OB-01/02/03 — Quit date nudges |
| 11 | N-GOAL-01 — Occasion nudge |
| 12 | N-GOAL-02 — Causes card |

### B2.4 Auto-Reduce Rule

```
ON notification status → 'ignored':
  notification_state.consecutive_ignored += 1

  IF consecutive_ignored >= 3:
    IF effective_tier = 'app_decides' → set effective_tier = 'few_daily'
    IF effective_tier = 'few_daily'   → set effective_tier = 'on_demand'
    IF effective_tier = 'on_demand'   → no change (already at floor)

    IF tier changed:
      set auto_reduce_active_until = now() + 7 days
      reset consecutive_ignored = 0

ON any notification opened:
  reset consecutive_ignored = 0

ON app open — check auto-reduce expiry:
  IF auto_reduce_active_until IS NOT NULL
    AND current_time > auto_reduce_active_until:
    set effective_tier = user.notification_preference
    set auto_reduce_active_until = NULL
```

### B2.5 Stale Notification Handling

```
// Insight notifications (N-INS-01, N-INS-02, N-INS-03)
IF notification.status = 'queued'
  AND current_time > notification.expires_at:
  set status = 'expired'
  discard silently

// Health milestones delayed by offline state
IF delivered_at > scheduled_for + 24 hours:
  discard — milestone moment has passed
```

---

## B3. Notification Logic

This document is the notification spec. B3 does not apply here.

---

## B4. API Surface

```
// Notification log
POST   /notification_log              → creates queued notification entry
PATCH  /notification_log/:id          → updates status (delivered | opened | ignored | expired | discarded)
GET    /notification_log?user_id=     → returns notification history for a user

// Notification state
GET    /notification_state/:user_id   → returns effective_tier, consecutive_ignored, auto_reduce state
PATCH  /notification_state/:user_id   → updates consecutive_ignored, auto_reduce_active_until, effective_tier
```

> Push delivery is handled via Expo Push Notifications. Time-based scheduling is handled via Supabase pg_cron or Edge Functions. This spec defines the logic; implementation architecture is in the Architecture Guide.

---

## Document Version History

| Field | Value |
|---|---|
| Version | 1.2 |
| Date | May 2026 |
| Author | Vedant Sinha |
| Status | Ready for Development |
| Stage Scope | All Stages |

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | May 2026 | Vedant Sinha | Initial draft. All product decisions resolved. Copy for N-CON-01–10, N-INS-01–03, N-PROF-01 pending. |
| 1.1 | May 2026 | Vedant Sinha | All notification copy written and slotted into Section 7. Status moved to Ready for Development. |
| 1.2 | May 2026 | Vedant Sinha | N-CON-11/12 promoted to high-sensitivity (3 variants), merged into the milestone table. SpecReview pass complete. Spec finalised — all copy done. |
| 1.3 | June 2026 | Vedant Sinha | Added pause re-engagement track (N-PAU-01–04, Decision 10). Resolves U7. |

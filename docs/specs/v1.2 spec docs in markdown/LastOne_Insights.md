# LastOne Insights Feature Spec v1.2

| Feature | Insights Screen |
| --- | --- |
| Version | v1.2 |
| Date | April 2026 |
| Author | LastOne Product Team |
| Status | Needs Team Input — Copy variants pending card list lock |
| Stage Scope | Stage 0–5 (accessible from first cigarette log in Learning Week) |

*Audience: Product & Engineering Team*

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — Foundation 4 (Personalisation Model) is this spec's primary foundation
- [[LastOne_Logging_System_Spec]] — logs provide the raw data surfaced in Insights
- [[smoking_cessation_priority_analysis]] — Awareness vs. Impact Gap (Theme 06) is the product problem this solves

---

## PART A — PRODUCT SPECIFICATION

## Section 1 — Problem & Purpose

### 1.1 Problem Statement

Indian college students quit and relapse because they do not understand their own smoking patterns. They believe they smoke because of stress — but the data often tells a different story. Without seeing their own behaviour reflected back clearly, every quit attempt is a guess.

The Insights screen addresses this through the Personalisation Model (Foundation 4): it transforms raw logs from the Learning Week and post-quit cravings into readable pattern recognition, giving the user a truthful picture of why they smoke and what is actually working. This is distinct from the Progress Dashboard, which handles motivation. Insights handles self-awareness only.

### 1.2 Foundation Reference

Primary: Foundation 4 — Personalisation Model. The Learning Week (Stage 0) exists specifically to collect the data this screen surfaces. Without Insights, the Learning Week has no visible payoff for the user.

Secondary: Foundation 2 — Two-Layer Coping System. Tool effectiveness data (which coping tools are working, and in which contexts) is surfaced here, closing the feedback loop between coping and awareness.

### 1.3 User Story

Arjun is 20, second year, lives in a hostel in Pune. He has been using LastOne for 11 days. Tonight, lying in bed after dinner, he opens the app and taps Insights. He is not craving right now — he just wants to check in.

He sees a card at the top: "Your cravings have dropped from 9 a day to 3." He knew things felt easier but he had not put a number on it. He scrolls down. Another card: "Boredom is your real trigger — not stress." He assumed stress. Everyone does. Seeing boredom named makes him think differently about tomorrow's long afternoon gap between lectures.

He taps the card, it expands, shows the breakdown. He closes the app. Two minutes, total. He goes to sleep with a clearer picture of himself.

### 1.4 Success Metrics

| Metric | Target / Observation Method |
| --- | --- |
| Insights screen opened at least once per week per active user | Event log: screen_open, weekly cohort |
| At least one card expanded per session (tap to expand) | Event log: card_expand |
| Session duration on Insights: 30–120 seconds (reflective, not rushed) | Session timer: screen_open to screen_close |
| Insight notification open rate ≥ 40% | Push notification open events |
| Users who open Insights in Stage 0 log more cigarettes during Learning Week (proxy: data quality) | Compare log count: Insights openers vs non-openers in Stage 0 |

---

## Section 2 — Feature Overview

### 2.1 What This Feature Does

One screen. A ranked feed of insight cards generated from the user's own data. The screen evolves across the quit journey — leading with the smoking profile in early stages and shifting to quit patterns as post-quit data accumulates. The Learning Week profile is always accessible but steps back as live data grows.

Insights is a pull surface — the user opens it when they want to reflect. It is not a crisis tool. It is opened by someone lying in their hostel bed calmly checking in. Every design decision follows from this.

### 2.2 Stage Relevance

| Stage | State Name | What Leads / Behaviour |
| --- | --- | --- |
| Stage 0 Learning Week | profile_building | Accessible from first cigarette log. Smoking profile populates in real time. Payoff for logging — user sees value immediately. Empty state shown before first log. |
| Stage 1 First 72 Hours | profile_led | Still profile-led — post-quit data too thin. First craving log generates a visible card immediately: "Your first craving came at 6pm — that matches your Learning Week peak." Learning Week data still ranks highest. |
| Stage 2 Days 4–7 | transitional | Both layers active. Live craving and trigger data begins competing with Learning Week cards for the leading position. No hard switch — driven by feed ranking. |
| Stage 3 Weeks 2–3 | feed_led | Full pattern feed leads. Learning Week profile collapses to bottom, faded but accessible. Tap to expand full Learning Week view. (Explicitly designed state — see Section 5 wireframe.) |
| Stage 4 Weeks 4–8 | feed_continues | Feed continues, awareness-framed. Leading insight shifts to pattern recognition across time: e.g. "Your stress cravings have dropped. Your social ones have not." Cross-attempt comparisons surface only per Q5 rules (current attempt ahead only). |
| Stage 5 Months 3+ | feed_continues | Same as Stage 4. Pattern recognition across time. Long-run trends surface. Notification cadence drops to 1/week or less. |

> The screen state variable `insight_screen_state` is derived from `current_stage` at render time. In `profile_building` and `profile_led` states, Learning Week cards receive a priority boost that overrides live data cards regardless of base ranking score.

### 2.3 Dependencies

| Data / Capability | Owned By |
| --- | --- |
| Craving log entries from unified `log` table (log_type='craving': timestamp, triggers[], intensity, tool_selected, mood) | Logging System Spec |
| Slip log entries from unified `log` table (log_type='slip': timestamp, triggers[], slip_type) | Logging System Spec |
| Tool usage and effectiveness scores (tool_score, use_count) | Coping System spec (B2 in foundations doc) |
| Smoking profile — Learning Week data (timestamps, location, social, trigger, mood) | Onboarding / Learning Week spec |
| User preferences (voice_style, notification_preference) | Onboarding / Settings spec |
| current_stage, attempt_id, has_logged_at_least_one_cigarette | Core user record / Progress spec |

The Insights screen owns no data. It is a read-only consumer of all sources above. It does not write to any of these data sources directly.

---

## Section 3 — Design Decisions

### DD-01 — One evolving screen, not two modes

| | |
| --- | --- |
| **Chosen** | A single screen that evolves over time, with Learning Week data leading early and stepping back as post-quit data accumulates. |
| **Rejected** | Two distinct modes: a smoking profile view and a quit patterns view. |
| **Rationale** | The most powerful insight is the contrast between who the user was and who they are becoming. Splitting into two views buries that narrative. The single screen also solves the Day 2 empty state problem — Learning Week data is real, personal, and fully populated from the first log. |

### DD-02 — Feed ranking over chronological display

| | |
| --- | --- |
| **Chosen** | A ranked feed using three signals: recency, has_app_action boolean, and implicit engagement signal (tap to expand as strong positive; scroll-past as weak negative). |
| **Rejected** | Chronological feed, or a simple most-recent-first list. |
| **Rationale** | The feed has a point of view. The most relevant insight must lead — not the most recent one. A chronological list treats all insights as equal, which they are not. Explicit helpfulness ratings (thumbs up/down) were also considered and rejected: sparse response rates and selection bias make them less reliable than implicit behavioural signals. |

### DD-03 — Preemptive nudge as sensitivity multiplier only (Position B)

| | |
| --- | --- |
| **Chosen** | Risk window timing data informs an internal alert_level variable. At alert_level = 2, the coping surface is one tap closer — surfaced as a quiet card on the home screen. No notification fires. The app never names what it is responding to. |
| **Rejected** | Sending a push notification during a known risk window (e.g. "it's almost 6pm and you usually crave right now"). |
| **Rationale** | Stress-tested against five failure scenarios: the user decodes the pattern and the nudge becomes a smoking bell; the nudge arrives on a day the user is fine and burns notification credibility; the fixed timing becomes a new ritual; transparency itself creates the cue; the system preserves a vulnerability the user has already moved past. All five are real risks. Position B avoids all of them. |

### DD-04 — No craving duration data

| | |
| --- | --- |
| **Chosen** | Craving duration is not collected and not surfaced in Insights. |
| **Rejected** | Collecting duration via a second tap to close the craving log. |
| **Rationale** | The second-tap problem: there is no reliable forcing function to close the log. Delayed entries produce arbitrary numbers that would be visualised as fact. The insight duration was meant to generate — "cravings are shorter than you think" — is delivered instead via a myth-bust content card, which is more honest at this stage. |

### DD-05 — Insight cards are read-only, expand in-place

| | |
| --- | --- |
| **Chosen** | Cards have three states: collapsed (feed), expanded (in-place, full detail visible), read (deprioritised in future ranking). No full-screen navigation except the Learning Week profile section. |
| **Rejected** | Navigating to a separate full-screen card detail view. |
| **Rationale** | Insights is a reflective, calm surface. Full-screen navigation adds friction and implies a task to complete. Expansion in-place matches the low-urgency, browsing nature of how the user visits this screen. The Learning Week profile is the one exception — its data density warrants its own view. |

### DD-06 — Cross-attempt data shown only when current attempt is ahead

| | |
| --- | --- |
| **Chosen** | Cross-attempt comparisons surface only when current.resistance_rate > previous.resistance_rate, framed as "here's what you've learned." When the current attempt is behind, the comparison is suppressed entirely. |
| **Rejected** | Showing all cross-attempt data side-by-side with raw numbers. |
| **Rationale** | Showing a user they are performing worse than their previous attempt during a sensitive quit window is demoralising and not actionable. The gain-frame rule applies: show only what encourages forward motion. The trigger shift comparison ("last time stress led, this time it's social situations") is always safe to show because it is framed as learning, not as comparison. |

### DD-07 — Insight generation is idempotent and threshold-gated

| | |
| --- | --- |
| **Chosen** | Each insight type has a unique insight_key per user per attempt. Generation runs as a background job (every 24h or post-log). Thresholds gate surfacing: e.g. 3+ cravings in a 2-hour window across 3+ days before a risk window card appears. |
| **Rejected** | Generating insights on every app open; or generating insights without minimum data thresholds. |
| **Rationale** | Insights without sufficient data are noise, not signal. Surfacing a "peak risk window" from a single data point would erode trust in the feature. Idempotency prevents duplicate cards from multiple job runs. |

---

## Section 4 — Screen Inventory

| Screen ID | Screen Name | Description |
| --- | --- | --- |
| INS-1 | Insights Feed | The main screen. A ranked vertical feed of insight cards. Always accessible. State (profile_building through feed_continues) determines card ranking and which cards are eligible to surface. The entry point from all navigation. |
| INS-1a | Insights Feed — Empty State | Shown in Stage 0 only, before the first cigarette log exists. Displays a single prompt card: "Log your first cigarette to start seeing your patterns." Replaced permanently once the first log is submitted. Never shown again. |
| INS-2 | Insight Card — Collapsed | Default card state in the feed. Shows card category label, headline insight, and a one-sentence explanation. Tappable. Renders within INS-1. |
| INS-3 | Insight Card — Expanded | Expands in-place within INS-1 on tap. Shows full insight detail, supporting context/data, and (where applicable) a transparency line explaining related app behaviour. Tap again or tap outside to collapse. Read-only — no input fields. |
| INS-4 | Learning Week Profile View | Full-screen view of the complete Learning Week smoking profile. Opens from the collapsed Learning Week profile card in the feed (Stage 3+) or from the leading profile section (Stage 0–2). Contains: peak time windows, social context breakdown, top trigger categories, mood at smoking. Has a standard back/close button returning to INS-1. |

> INS-2 and INS-3 are states of the same card component, not separate routes. They are listed separately because they have distinct visual designs and distinct user actions. INS-4 is a separate route with its own navigation stack entry.

---

## Section 5 — Flow Logic

### 5.1 Screen Access Gate

```
if current_stage >= 0 AND user.has_logged_at_least_one_cigarette:
    render INS-1 (or INS-1a if no logs exist yet)
else:
    show empty state prompt (INS-1a)
```

### 5.2 INS-1 — Insights Feed

**On screen open**

- Evaluate insight_screen_state from current_stage
- Run feed ranking (see B2) — returns ordered list of eligible insight cards
- In profile_building or profile_led: apply Learning Week priority boost before rendering
- Render cards in ranked order. Cards with state = "read" are deprioritised (pushed down) but never hidden
- Check alert_level (see B2 §preemptive nudge) — if alert_level = 2, inject coping_surface_card at position 1 of home screen feed (not Insights feed — this is a home screen action)

**User actions**

| Action | Outcome |
| --- | --- |
| Tap any card (collapsed state) | Card expands in-place → INS-3. Card state set to "expanded". On first expansion: set state = "read", log seen_at timestamp. |
| Tap Learning Week section / collapsed profile card | Opens INS-4 (full-screen Learning Week profile view). New navigation stack entry. |
| Scroll past a card (without tapping) | Logs weak negative engagement signal. Used in next feed ranking cycle. No visible change. |
| Tap risk window card toggle ("Turn off app alertness for this window") | Sets user.risk_windows[n].active = false. Card updates to reflect off state. App no longer uses that window for alert_level calculation. |
| Back / close | Returns to previous screen (home or wherever navigation originated). No state loss. Feed state is preserved on next open. |
| App closed mid-session | No action required. Card states (read/collapsed/expanded) are persisted. Feed resumes from last state on next open. |

### 5.3 INS-2 / INS-3 — Card Collapsed / Expanded

| Action | Outcome |
| --- | --- |
| Tap collapsed card (INS-2) | Expands to INS-3 in-place. If first-time expansion: card.state = "read", log card.last_seen_at. |
| Tap expanded card (INS-3) header | Collapses back to INS-2. card.state remains "read". |
| Tap outside expanded card | Collapses to INS-2. Same as above. |
| Swipe down on expanded card | Collapses to INS-2. |

### 5.4 INS-4 — Learning Week Profile View

| Action | Outcome |
| --- | --- |
| Tap back / close button | Returns to INS-1 (Insights Feed). Navigation stack entry popped. Feed scroll position preserved. |
| OS back gesture (Android / swipe back iOS) | Same as back button. Standard nav stack behaviour. |
| App closed mid-view | On next open, app resumes at INS-1 (root of Insights), not at INS-4. INS-4 is not a persistent state. |

### 5.5 Insight Generation Flow

How a card moves from raw data to visible feed entry:

| User logs | App derives | Threshold check | Insight created | Feed ranked | User sees |
| --- | --- | --- | --- | --- | --- |
| craving + context | pattern or threshold | min data met? | with timestamp | recency + signals | insight card |

### 5.6 App Action Transparency Flow

| Insight detected (e.g. 6pm peak) | App behaviour set (alert_level = 2) | Card shows transparency line | User can toggle off the action |
| --- | --- | --- | --- |

---

## Section 6 — Stage Behaviour

> Notification cadence figures below are maximums per stage from the foundations doc. Insight notifications count toward the daily stage cap — they do not get additive slots. Priority order within the cap: (1) craving-window notifications, (2) insight notifications. See B3 for full notification logic.

### Stage 0 — Learning Week (profile_building)

| | |
| --- | --- |
| Notification cap | N/A — no quit-phase notifications yet |
| Feed behaviour | Smoking profile populates in real time as cigarettes are logged. Each log may trigger a profile update visible immediately on the screen. |
| Cards eligible | Peak time windows, social context (who smoked with), trigger categories, mood at smoking. All from Learning Week data. |
| Empty state | Before first log: INS-1a — "Log your first cigarette to start seeing your patterns." After first log: first profile card renders. INS-1a never shown again. |
| Special notes | This is the payoff for logging. The user must feel the screen is alive and responding to their data in real time. Do not defer rendering until Learning Week is complete. |

### Stage 1 — First 72 Hours (profile_led)

| | |
| --- | --- |
| Notification cap | Max 2–3/day total (all notification types combined). Insight notifications are lowest priority. |
| Feed behaviour | Learning Week profile still leads. First craving log generates a visible card immediately, cross-referencing the profile (e.g. "Your first craving came at 6pm — that matches your Learning Week peak."). |
| Cards eligible | Learning Week profile cards + first craving pattern cards. No resistance rate card yet (minimum 10 craving logs required). |
| Empty state | No empty state — Learning Week data is fully populated from Stage 0. |
| Special notes | This is the highest-stress stage. The Insights screen is calming, not urgent. Do not surface anything that looks like a warning or alert. |

### Stage 2 — Days 4–7 (transitional)

| | |
| --- | --- |
| Notification cap | Max 1–2/day total. |
| Feed behaviour | Both layers active. Live craving data begins competing with Learning Week cards. No hard rule on which leads — determined by feed ranking. The transition is invisible to the user. |
| Cards eligible | Learning Week cards + growing craving pattern cards. Resistance rate card may surface if 10+ logs exist. Top trigger card may surface if 5+ logs exist. |
| Empty state | No empty state. |
| Special notes | Habitual trigger patterns emerge in this stage (chai time, end-of-class, hostel common room). Cards should reflect these specifically when data supports them. |

### Stage 3 — Weeks 2–3 (feed_led)

| | |
| --- | --- |
| Notification cap | Max 1/day or every other day. |
| Feed behaviour | Full pattern feed leads. Learning Week profile collapses to bottom section of the feed, faded but tappable. Tapping opens INS-4. |
| Cards eligible | Full card set active: peak window, top trigger, resistance rate, tool effectiveness, slip pattern (if applicable), cross-attempt (if applicable and current attempt is ahead). |
| Empty state | No empty state. |
| Special notes | This is the primary designed state of the screen — the "Stage 3 state" from the original design wireframe. Most users will have their richest Insights experience here. |

### Stage 4 — Weeks 4–8 (feed_continues)

| | |
| --- | --- |
| Notification cap | Max 2–3/week. |
| Feed behaviour | Same as Stage 3. Pattern recognition across time becomes the dominant card type. "Your stress cravings have dropped. Your social ones have not." Awareness-framed, never progress-celebration-framed. |
| Cards eligible | Full card set. Cross-attempt comparisons surface per Q5 rules. Complacency-risk patterns may surface here (e.g. a week with no cravings logged — is the user still using the app, or just not craving?) |
| Empty state | No empty state. |
| Special notes | Complacency risk is real in Stage 4. The Insights screen should not celebrate silence — if no data is coming in, do not surface a card saying "you've had a great week." Surface nothing rather than surface misleading positivity. |

### Stage 5 — Months 3+ (feed_continues)

| | |
| --- | --- |
| Notification cap | Max 1/week or less. |
| Feed behaviour | Long-run trend insights lead. Patterns across months, not days. The screen is less frequently visited — that is correct behaviour, not a problem. |
| Cards eligible | Long-run pattern cards. Historical comparisons where current attempt is ahead. Tool effectiveness summary across full quit duration. |
| Empty state | No empty state. |
| Special notes | Stage 5 users are the success cases. The Insights screen's job here is to consolidate identity — "here is what you have learned about yourself" — not to manage cravings. Tone should reflect that. |

---

## Section 7 — Copy

> **INCOMPLETE — PENDING CARD LIST LOCK**
>
> Copy variants (Steady & Direct, Emotional & Understanding, Light & Honest) for high-sensitivity cards must be authored after the full V1 card set is finalised. Writing three variants of a card that gets cut wastes effort. The copy structure and examples below define the format; complete copy is a separate deliverable.
>
> All inline copy from the original design document is reproduced here as reference copy only — not production-ready.

### 7.1 Copy Format

Every insight card has the following copy fields:

| Field | Required / Optional | Description |
| --- | --- | --- |
| card_category_label | Required | Uppercase label shown above headline. E.g. "WHEN YOU SMOKED", "PATTERN", "WHAT'S WORKING", "MOST IMPORTANT RIGHT NOW — PROGRESS" |
| card_headline | Required | Bold headline insight. Dynamic variables in {curly_braces}. E.g. "Your cravings have dropped from {prev_daily_avg} a day to {current_daily_avg}" |
| card_body | Required | One to two sentence explanation. Gain-framed. No shame. Slips = information. |
| transparency_line | Optional | Only present on cards with a linked app action (e.g. risk window toggle). Explains what the app is doing and why. Always includes the toggle option. |
| voice_variants | Required if tone_sensitivity = high | Three variants keyed to canonical `voice_style`: `steady_and_direct`, `emotional_and_understanding`, `real_and_practical`. Selected at render time by `profiles.voice_style`. (V1: `real_and_practical` copy deferred — falls back to `steady_and_direct`.) |

### 7.2 High-Sensitivity Copy Definition

A card is high-sensitivity if it is shown in any of these contexts:

- During or immediately after a craving
- After a slip
- At a meaningful milestone (resistance rate crosses threshold, cravings drop below target)
- In a notification
- In a guided micro-experience

All three voice variants are required for high-sensitivity cards. Low-sensitivity cards (e.g. Learning Week profile cards, tool effectiveness cards) may use a single voice.

### 7.3 Reference Copy (from original design document — not production-ready)

> Dynamic variable names are placeholders — final variable names must match B1 field names exactly once the data model is complete.

**Stage 0–1 Cards (profile_building / profile_led)**

| Card | Headline | Body |
| --- | --- | --- |
| Peak windows | "Your peak windows were {peak_window_1}, {peak_window_2}, and {peak_window_3}" | "These are the moments your brain still expects something. You're already past the {earlier_window} one today." |
| Social context | "8 out of 10 cigarettes were with other people" [dynamic] | "Friends and group situations are your strongest cue — not solo stress." |
| First craving match | "Your first craving came at {craving_time} — that matches your Learning Week peak" | "Your brain is running the pattern. You caught it." |

**Stage 3+ Cards (feed_led / feed_continues)**

| Card | Headline | Body |
| --- | --- | --- |
| Progress — craving drop | "Your cravings have dropped from {prev_daily_avg} a day to {current_daily_avg}" | "Two weeks ago you were logging {prev_daily_avg} cravings a day. This week it's averaging {current_daily_avg}. That's not willpower — that's your brain rewiring." |
| Top trigger | "Boredom is your real trigger — not stress" | "{trigger_pct}% of your cravings happen when mood is neutral or fine. Most people guess stress. Your data says otherwise." |
| Risk window (with app action) | "6pm is still your hardest window" | "Your old tapri time. Cravings here are stronger than the rest of the day — but you're resisting {resist_rate_6pm} out of 10. App stays alert 5:30–6:30pm. [Toggle to turn off]" |
| Tool effectiveness | "Box breathing is your most effective tool" | "You've used it {tool_use_count} times. It's worked {tool_success_count}. Especially when the trigger is boredom or the 6pm window." |
| Slip pattern | "Your last two slips had something in common" | "[Dynamic — references shared trigger_tag or time window from slip logs.]" |

### 7.4 Static / UI Copy

| Element | Copy |
| --- | --- |
| INS-1a empty state prompt | "Log your first cigarette to start seeing your patterns." |
| Forward-looking line (Day 2+, below profile cards) | "Your quit patterns will start appearing here as you go. Check back after a few days." |
| Learning Week section label (Stage 3+, collapsed) | "YOUR SMOKING PROFILE — tap to see full breakdown" |
| Risk window toggle — on state | "App stays alert {window_start}–{window_end}" |
| Risk window toggle — off state | "Alertness off for this window" |
| Attempt divider label (timeline view) | "New attempt started here." |

---

## Section 8 — Edge Cases

| Edge Case | Handling |
| --- | --- |
| No data / first run (Stage 0, no logs) | Render INS-1a. Single prompt card: "Log your first cigarette to start seeing your patterns." No feed. No cards. As soon as the first cigarette is logged, INS-1a is replaced by the first profile card and never shown again. |
| Mid-session dismissal / back navigation | Card states (read, expanded, collapsed) are persisted on every state change — not on close. Back navigation returns to previous screen. Feed scroll position is preserved on next open within the same session. No data is lost on dismiss. |
| Wrong stage access (screen accessed before Stage 0 log) | Gate check: if current_stage >= 0 AND has_logged_at_least_one_cigarette == false → render INS-1a. The screen is never completely blocked — it shows the empty state prompt to give the user direction. |
| Feature limits (maximum insight cards in feed) | No hard cap on cards in the feed. However, the insight generation job is idempotent and threshold-gated — natural limits prevent a flood of cards. If feed contains more than 15 cards, older read cards with no new data signal are filtered from the visible feed (archived, not deleted). User can access archived cards via a "Show older insights" control at the bottom of the feed. |
| Return after absence (user returns after several days away) | Card states persist. Feed re-ranks on screen open. If new insights have been generated in the background during absence, they surface at the top. No special "welcome back" interstitial — the insights themselves tell the story. Streaks are not surfaced on this screen; that is the Progress Dashboard's concern. |
| Connection loss (offline) | Insights screen is read-only. All insight cards are generated server-side and stored locally on device. The screen works fully offline from cached data. New insight generation (background job) requires connectivity — if offline, the job defers until the next app open with connectivity. A stale feed is preferable to a broken screen. No error state is shown unless the cached data is more than 7 days old, in which case show a subtle label: "Last updated {date}" |
| Restart — data across attempts | Quit timeline resets. attempt_id increments. All data persists with the previous attempt_id. Averages shown in the feed default to current attempt only. Cross-attempt comparisons surface only per Q5 rules (current attempt must be ahead on the metric). A faint timeline divider with label "New attempt started here." is shown on any timeline view. The insight count for the current attempt restarts; the history does not. |
| Insight becomes stale after generation (e.g. slip pattern notification deferred 3+ days) | Insight notifications carry an expires_at field (48 hours after scheduled_for). If current_time > expires_at when the notification slot opens, the notification is discarded silently. The card itself remains in the feed — only the notification is dropped. |

---

## PART B — TECHNICAL SPECIFICATION

## B1 — Data Model

> The Insights screen owns no data. It is a read-only consumer. The objects below are either (a) owned by other specs and consumed here, or (b) owned by the Insights feature for feed/card state management only.

### B1.1 Objects Owned by Insights

**insight_card**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| insight_key | string | Required | Unique per user per insight_type per attempt_id. Format: {user_id}_{insight_type}_{attempt_id}. Idempotency key — prevents duplicate generation. |
| user_id | string | Required | |
| attempt_id | integer | Required | Increments on each user-confirmed restart. Insight belongs to the attempt during which it was generated. |
| insight_type | enum | Required | Allowed values: peak_risk_window \| top_trigger \| resistance_rate \| tool_effectiveness \| slip_pattern \| craving_drop \| cross_attempt_comparison \| trigger_shift \| profile_peak_windows \| profile_social_context \| profile_trigger_category \| first_craving_match |
| card_state | enum | Required | Allowed values: collapsed \| expanded \| read. Default: collapsed. |
| has_app_action | boolean | Required | True if this card has a linked app behaviour (e.g. risk window alertness). Adds ranking boost. |
| tone_sensitivity | enum | Required | Allowed values: high \| low. Determines whether voice_variants are required. |
| generated_at | timestamp | Required | Timestamp of insight generation (when background job created the card). Used as recency signal in feed ranking. |
| last_seen_at | timestamp | Optional | Null until first expansion. Set on first card_state transition to "expanded". |
| engagement_score | number | Optional | Accumulated implicit engagement score. Default 0. +2 on tap-to-expand; +0.5 on active time (capped per session at 30–40s); -0.5 on scroll-past. Used in feed ranking. |
| archived | boolean | Required | Default false. Set to true when feed exceeds 15 read cards with no new signal. Archived cards accessible via "Show older insights." |

**insight_notification**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| notification_id | string | Required | Unique ID. |
| user_id | string | Required | |
| insight_key | string | Required | References the insight_card that triggered this notification. |
| notification_type | enum | Required | Allowed values: new_pattern_detected \| progress_threshold \| slip_pattern_emerging |
| scheduled_for | datetime | Required | |
| expires_at | datetime | Required | Recommended: 48 hours after scheduled_for. If current_time > expires_at when slot opens, discard silently. |
| status | enum | Required | Allowed values: queued \| delivered \| expired \| discarded |
| content_id | string | Required | References copy entry in Section 7. Must match a defined copy record. |

### B1.2 Objects Read by Insights (owned by other specs)

| Object | Owned By | Fields Consumed | Notes |
| --- | --- | --- | --- |
| `log` WHERE `log_type = 'craving'` | Logging System Spec | log_id, user_id, attempt_id, timestamp, triggers[] (array), intensity (1–5), tool_selected, mood (Stage 2+) | Replaces phantom `craving_log` table. `trigger_tag` (singular) derived at query time as top element or MODE of `triggers[]`. `outcome` derived: `log_type='overcome'` → resisted; `log_type='slip'` → slipped. `tool_used` → `tool_selected`. `mood_at_craving` → `mood`. |
| `log` WHERE `log_type = 'slip'` | Logging System Spec | log_id, user_id, attempt_id, timestamp, triggers[], slip_type | Replaces phantom `slip_log` table. `slip_id` → `log_id`. `trigger_tag` derived from `triggers[]`. |
| `user_tool_scores` | Coping Tools Suite Spec | tool_id, user_id, tool_score, total_uses | Replaces old `tool_score` object. No `attempt_id` on this table — **attempt-scoped use_count derived at query time** by joining `log WHERE log_type='sos' AND attempt_id=current_attempt`. Lifetime tool_score used for SOS ranking; attempt-scoped count derived for Insights display. |
| `log` WHERE `timestamp < quit_date` | Logging System Spec | log_id, user_id, timestamp, triggers[], location (array), mood | Replaces phantom `learning_week_log` table. Stage 0 entries live in the same unified `log` table. `location_context` → `location[]`. `mood_at_smoking` → `mood`. |
| `profiles` | Onboarding / Settings | user_id, current_stage, cigarettes_per_day, price_per_cigarette, voice_style, notification_preference | `attempt_id` read from `quit_attempts` (row WHERE ended_at IS NULL). `cpd` → `cigarettes_per_day`. `voice_style` enum updated — see below. `risk_windows` array stored on `profiles` (written by Insights). |

**Enum Value Lists**

| Enum Field | Allowed Values |
| --- | --- |
| trigger_tag (derived from triggers[]) | stress \| boredom \| social \| habit \| post_meal \| post_chai \| anxiety \| celebration \| focus \| other |
| outcome (derived from log_type) | resisted (log_type='overcome') \| slipped (log_type='slip') — not stored, derived at query time |
| location_context | hostel_room \| hostel_common \| canteen \| tapri \| campus_outside \| college_corridor \| home \| transport \| other |
| social_context | alone \| one_other \| small_group (2–4) \| large_group (5+) |
| voice_style | steady_and_direct \| emotional_and_understanding \| real_and_practical |
| insight_screen_state | profile_building \| profile_led \| transitional \| feed_led \| feed_continues |
| risk_window.confidence | high (threshold met 5+ days) \| medium (threshold met 3–4 days) |

**risk_window (nested array on user record)**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| start_hour | integer (0–23) | Required | Local time hour, 24h format. |
| end_hour | integer (0–23) | Required | Local time hour, 24h format. |
| confidence | enum | Required | high \| medium. Only high-confidence windows trigger alert_level = 2. |
| active | boolean | Required | Default true. Set to false if user taps the toggle on the risk window insight card. |

---

## B2 — Logic & Conditions

### B2.1 insight_screen_state Derivation

```
function derive_insight_screen_state(current_stage):
    if current_stage == 0: return "profile_building"
    if current_stage == 1: return "profile_led"
    if current_stage == 2: return "transitional"
    if current_stage == 3: return "feed_led"
    if current_stage >= 4: return "feed_continues"
```

### B2.2 Feed Ranking Formula

Ranking runs on screen open. Returns ordered list of non-archived insight cards.

```
function rank_feed(cards, insight_screen_state):
    for each card in cards:
        // Base score: recency (normalised to 0–1 over 30-day window)
        recency_score = 1 - (days_since_generated / 30)  // floor 0

        // App action boost: flat +0.3 if card has linked app behaviour
        action_boost = 0.3 if card.has_app_action else 0

        // Engagement score (accumulated — see B1.1)
        engagement = card.engagement_score  // range roughly -5 to +10

        // Read penalty: push read cards down
        read_penalty = -0.5 if card.state == "read" else 0

        // Priority 1 cards (manually assigned) always float to top
        if card.priority == 1: return SORT_TOP

        base_score = recency_score + action_boost + (engagement * 0.1) + read_penalty

        // Learning Week priority boost in profile_building and profile_led states
        if insight_screen_state in ["profile_building", "profile_led"]:
            if card.insight_type starts_with "profile_":
                base_score += 1.0  // overrides all live data cards

    return cards sorted by base_score descending
```

### B2.3 Insight Generation Thresholds

| Insight Type | Threshold Condition |
| --- | --- |
| peak_risk_window | 3+ cravings within the same 2-hour window, across at least 3 different calendar days |
| top_trigger | Most-tagged trigger_tag from craving logs. Minimum 5 total craving logs before card surfaces. |
| resistance_rate | Minimum 10 craving attempts logged (outcome recorded). |
| slip_pattern | 2+ slips sharing the same trigger_tag OR the same 2-hour time window, within current attempt. |
| craving_drop | Week-over-week: current 7-day avg < previous 7-day avg. Minimum 5 logs in each 7-day window. |
| tool_effectiveness | Tool used minimum 5 times. tool_score derived from coping spec B2. |
| profile_* cards (Learning Week) | First cigarette logged (Stage 0). No minimum threshold — Learning Week data populates in real time. |

### B2.4 Insight Generation Job

```
// Runs: every 24 hours server-side, OR immediately after any new craving/slip log

function run_insight_generation_job(user_id):
    for each insight_type in INSIGHT_TYPES:
        key = user_id + "_" + insight_type + "_" + current_attempt_id

        if insight_card_exists(key):
            continue  // idempotent — skip if already generated

        if threshold_met(user_id, insight_type):
            create insight_card(insight_key=key, generated_at=now, ...)
            if warrants_notification(insight_type):
                queue_insight_notification(user_id, key)
```

### B2.5 Peak Risk Window Calculation

```
function calculate_risk_windows(craving_logs):
    // Bucket all craving timestamps into 2-hour windows
    buckets = {}
    for each log in craving_logs:
        window = floor(log.timestamp.hour / 2) * 2  // e.g. hour 17 → window 16
        window_key = f"{window}:00–{window+2}:00"
        buckets[window_key].add(log.timestamp.date)
        buckets[window_key].count += 1

    risk_windows = []
    for each window_key, data in buckets:
        if len(data.unique_days) >= 3 AND data.count >= 3:
            confidence = "high" if len(data.unique_days) >= 5 else "medium"
            risk_windows.append({ start_hour, end_hour, confidence, active: true })

    return risk_windows
```

### B2.6 Derived Metrics Formulas

| Metric | Formula |
| --- | --- |
| money_saved | cpd × price_per_cigarette × days_since_quit_start (current attempt only, in INR) |
| resistance_rate | count(log WHERE log_type='overcome') ÷ count(log WHERE log_type IN ('craving','overcome','slip')). `outcome` derived from log_type. Edge case: if denominator = 0, resistance_rate = null — do not surface the card. |
| cravings_per_day (rolling) | count(log WHERE log_type='craving' AND timestamp >= today-7) ÷ 7. Filter to current attempt_id only. |
| top_trigger_category | MODE of triggers[] values across all log WHERE log_type='craving' for current attempt. Minimum 5 logs. |

### B2.7 Cross-Attempt Comparison Logic

```
function evaluate_cross_attempt_comparison(user_id):
    current = aggregate_metrics(attempt_id = current_attempt)
    previous = aggregate_metrics(attempt_id = current_attempt - 1)

    // Resistance rate comparison — only show if current is ahead
    if current.resistance_rate > previous.resistance_rate:
        surface comparison card, framed as "you've learned"
        // Copy: "Your resistance rate is higher than your last attempt."
    else:
        suppress comparison card entirely

    // Trigger shift — always safe to show (framed as learning, not comparison)
    if current.top_trigger != previous.top_trigger:
        surface trigger_shift card:
        // Copy: "Last time {prev_trigger} led your cravings.
        //        This time it's {current_trigger}."

    // Note: quit_attempt_number in the foundations doc B1 = attempt_id here.
    // Confirm with backend that one field is used, not two.
```

### B2.8 Alert Level (Preemptive Nudge — Position B)

```
// Runs on every app open. Client-side or lightweight server flag.
// Does NOT send a push notification. Affects home screen render only.

function evaluate_alert_level(user):
    current_hour = local_time.hour  // 0–23
    alert_level = 1  // default

    for each window in user.risk_windows:
        if window.active == false: continue
        if window.confidence != "high": continue  // medium windows: info only, no alert
        if current_hour >= window.start_hour AND current_hour < window.end_hour:
            alert_level = 2
            break

    return alert_level

// Home screen render:
if evaluate_alert_level(user) == 2:
    inject coping_surface_card at position 1 of home_screen_feed
    // Card copy: "Need a moment?" — no mention of timing or risk window
```

### B2.9 Stage Transition Consistency

Stage definitions and transition conditions are owned by the foundations doc. This feature does not define or modify stage transitions. The insight_screen_state is derived from current_stage at render time — it is not a separate state machine.

Relapse rules applied to Insights:

- Setbacks do not erase data. All logs persist with their original attempt_id.
- A restart increments attempt_id at the moment the user confirms the restart (not at mini-prep start).
- Stage 1: 1–2 slips absorbed, user-initiated restart only. Insights feed remains stable; slip data strengthens existing pattern cards.
- Stage 2: 3+ slips → restart suggestion. Insights slip_pattern card may surface before this threshold is reached.
- Stages 3–5: rolling_14d_slips thresholds per foundations doc. Slip pattern cards on Insights may be early signal of these conditions — they are informational, not prescriptive.

---

## B3 — Notification Logic

### B3.1 Notification Types

| Type | Trigger Condition | Timing Rule | Respects Notif. Pref? | Copy Reference |
| --- | --- | --- | --- | --- |
| new_pattern_detected | A significant pattern insight_card is generated for the first time (insight_type: peak_risk_window, top_trigger, craving_drop). Fires once per insight_key — never repeatedly. | Fire within 2 hours of generation job completing. Subject to daily stage cap. | Yes | Section 7 — TBD (pending card list lock) |
| progress_threshold | resistance_rate crosses 70% for the first time. OR cravings_per_day drops below 50% of Learning Week baseline for the first time. | Fire within 2 hours of threshold being crossed. Gain-framed. Subject to daily stage cap. | Yes | Section 7 — TBD (pending card list lock) |
| slip_pattern_emerging | 2+ slips share trigger_tag or time window (slip_pattern threshold met). Fires once per slip_pattern insight_key. | Fire within 4 hours of pattern detection. Delicate copy required — no shame framing. | Yes | Section 7 — TBD (pending card list lock) |

### B3.2 Notification Queue Logic

```
// Insight notifications count toward the daily stage cap.
// They do not get additive slots.

// Priority order within the cap:
// 1. Craving-window notifications (time-sensitive, highest priority)
// 2. Insight notifications (deferrable)

notification_queue per user per day:
    slots_remaining: integer  // set by stage (Stage 1: 3, Stage 2: 2, Stage 3: 1, Stage 4: ~3/week, Stage 5: ~1/week)

on insight notification trigger:
    if slots_remaining > 0:
        add to queue
        slots_remaining -= 1
    else:
        defer to next available slot (next day, first slot)
        // Do not drop — insight notifications should eventually fire
        // UNLESS: current_time > notification.expires_at → discard silently

// Stale notification handling:
if current_time > notification.expires_at:
    set notification.status = "expired"
    discard silently — do not deliver
```

### B3.3 Auto-Reduce Rule

If a user ignores 3 consecutive notifications (of any type), notification frequency reduces by one tier for 7 days. This rule applies to insight notifications as part of the overall notification system. Insight notifications are subject to this rule and do not bypass it.

```
// Auto-reduce applies to all notification types including insight notifications.
// Managed at the notification system level — not Insights-specific logic.
// Reference: foundations doc notification auto-reduce rule.

if consecutive_ignored >= 3:
    reduce_frequency_by_one_tier(duration_days=7)
```

### B3.4 Notification Timing — Stage 1 & 2

Insight notifications in Stages 1 and 2 must reference the user's known risk windows from the Learning Week for timing decisions. Fixed-time notification delivery is not used.

```
// For Stage 1 and Stage 2 insight notifications:
// Schedule delivery to avoid known risk windows (do not stack insight notifications
// on top of already high-sensitivity moments).

// Preferred delivery window: 1–2 hours AFTER a risk window has passed.
// Rationale: the user has navigated the hard moment — the insight is now
// contextually relevant, not cue-creating.
```

---

## B4 — API Surface

> The Insights screen is read-only. It creates insight_card and insight_notification objects (server-side, via the background job) and reads from all dependency sources. User-initiated writes are limited to card state updates and risk window toggle.

### B4.1 Reads (Insights screen → external data)

| Endpoint / Operation | Method | Notes |
| --- | --- | --- |
| GET /log?user_id=&log_type=craving&attempt_id=&limit= | GET | Returns: [ { log_id, timestamp, triggers[], intensity, tool_selected, mood } ]. `trigger_tag` and `outcome` derived client-side from triggers[] and log_type respectively. |
| GET /log?user_id=&log_type=slip&attempt_id= | GET | Returns: [ { log_id, timestamp, triggers[], slip_type } ]. Replaces /slip_logs. |
| GET /user_tool_scores?user_id= | GET | Returns: [ { tool_id, tool_score, total_uses } ]. No attempt_id filter — lifetime scores. Attempt-scoped use_count derived by joining /log?log_type=sos&attempt_id=. |
| GET /log?user_id=&timestamp_before=quit_date | GET | Returns Stage 0 log entries (pre-quit). Replaces /learning_week_logs. Fields: log_id, timestamp, triggers[], location[], mood. |
| GET /profiles?user_id= | GET | Returns: { user_id, current_stage, cigarettes_per_day, price_per_cigarette, voice_style, notification_preference, risk_windows }. `attempt_id` read separately from GET /quit_attempts?user_id=&ended_at=null. |

### B4.2 Reads (Insights screen → own data)

| Endpoint / Operation | Method | Notes |
| --- | --- | --- |
| GET /insight_cards?user_id=&attempt_id= | GET | Returns all insight_card objects for current attempt. Feed ranking applied client-side. Includes archived cards (filtered client-side). |

### B4.3 Writes (user-initiated)

| Endpoint / Operation | Method | Notes |
| --- | --- | --- |
| PATCH /insight_cards/{insight_key} | PATCH | Updates card_state (collapsed \| expanded \| read), last_seen_at, engagement_score. Fired on card tap and scroll-past events. |
| PATCH /user/{user_id}/risk_windows/{window_index} | PATCH | Updates active boolean on a specific risk_window entry. Fired when user taps the toggle on a risk window card. |

### B4.4 Writes (server-side, background job)

| Endpoint / Operation | Method | Notes |
| --- | --- | --- |
| POST /insight_cards | POST | Creates new insight_card. Idempotent — insight_key uniqueness enforced. Called by background job on threshold met. |
| POST /insight_notifications | POST | Creates notification entry when insight warrants push. Subject to stage cap and queue logic (B3.2). |
| PATCH /insight_notifications/{notification_id} | PATCH | Updates status (delivered \| expired \| discarded). Fired by notification delivery pipeline. |
| PATCH /user/{user_id}/risk_windows | PATCH | Replaces risk_windows array after Learning Week analysis job completes. |

> API contracts marked "Confirm contract with [spec]" above are minimum data requirements from the Insights screen's perspective. These must be validated against the owning spec before backend work begins. If the owning spec's data model differs, either the Insights screen adapts or a formal contract is agreed.

---

## Open Items

| Item | Status | What is needed |
| --- | --- | --- |
| Copy variants (S7) | Blocked on card list lock | Full 3-variant copy (steady, warm, light) for all high-sensitivity cards. Authored after V1 card set is finalised. |
| Surprise signal | Parked | Ranking input (how far is this insight from population average?) — requires sufficient user base to compute baselines. Revisit post-launch. |
| Visual design | Pending | Card design, feed layout, Learning Week profile view. Wireframe states (Day 2 and Stage 3) exist as design references. Handled by design team. |
| API contract confirmation | Pending | Cross-check data contracts in B4.1 against Craving spec, Coping System spec, and Onboarding spec before backend work begins. |
| quit_attempt_number vs attempt_id | Pending | Foundations doc B1 references quit_attempt_number. This spec uses attempt_id. Confirm with backend that these are the same field — one should be deprecated. |

---

*LastOne — Insights Feature v1.2 · April 2026 · Product & Engineering Team*

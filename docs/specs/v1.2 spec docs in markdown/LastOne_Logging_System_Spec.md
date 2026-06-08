# LastOne Logging System Spec

Version 1.2 — April 2026

> How to use this document: This spec defines all user-initiated logging flows, the SOS system, and the system logic that supports them. It is the source of truth for log entry architecture. Read alongside the Streak System Spec and the Giving Up Support System Spec. The Giving Up Support System is a supporting document that extends several patterns defined here.

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — Two-Layer Coping System (Foundation 2) and Stage System
- [[LastOne_Streak_System_Spec_V1_2]] — all log flows update streak and lifetime counter
- [[LastOne_Giving_Up_Support_System]] — supporting spec that extends relapse patterns defined here
- [[Logging_SOS]] — flow diagram companion
- [[Coping_mech]] — flow diagram companion

---

## Version History

| Version | Date | Summary |
|---|---|---|
| V1.0 | March 2026 | Initial draft |
| V1.1 | April 2026 | SOS flow + return modal added |
| V1.2 | April 2026 | Technical gap resolutions: timezone, partial-save, SOS-3 skippability, pre-quit logging, cigarette_count sentinel. Author clarifications: Flow A completion, return modal inline, optimistic commit, stage-aware Flow D placeholders. New: Other chip on all multi-selects, Flow D toast, AI Coach escalation replaced with Giving Up Support System routing. |

---

# Part A — Feature Definition

## Section 1: Overview

The logging system is the primary data-capture layer of LastOne. It records craving events, overcome moments, slips, and free-form notes. All logging happens through four named flows (A–D) plus a dedicated SOS overlay. Every flow is designed to be completable in under 90 seconds.

### 1.1 Entry Points

| Entry Point | Flow Triggered | Context |
|---|---|---|
| Daily check-in card (home) | Flow A — Craving Log | Appears until daily check-in is satisfied |
| Log button (FAB) | Half-sheet: A / B / C / D | Available at all times from home screen |
| SOS FAB | SOS overlay | High-urgency. Bypasses all other flows. |
| Notification tap | See dependency note below | Notification spec is a separate document — TBD |

> V1.2 note: Notification entry point behaviour is out of scope for this spec. It will be defined in a dedicated Notification Spec, to be written after the master feature map is complete.

### 1.2 Flow Summary

| Flow | Name | Trigger | Time Target |
|---|---|---|---|
| A | Craving Log | Daily check-in card or Log FAB | < 60 seconds |
| B | Overcome Log | Log FAB → 'I resisted' | < 30 seconds |
| C | Slip Log | Log FAB → 'I smoked' or SOS-3 outcome | < 90 seconds |
| D | Quick Note | Log FAB → 'Note' | < 30 seconds |
| SOS | Craving SOS | SOS FAB | < 90 seconds (tool-dependent) |

---

## Section 2: Flow A — Craving Log

The primary logging flow. Triggered from the daily check-in card or the Log FAB. Captures craving intensity, trigger context, and optional environmental detail.

### Screen A1 — Intensity

Single screen. Required. Slider or tap-based intensity selector (1–5). Save button visible from this screen onwards.

**Completion rule:** Any save after A1 satisfies the daily check-in card. The user does not need to complete A2 or fill optional fields.

**Partial-save rule:** If the user exits after A1 without tapping Save, the craving log is auto-committed with intensity + timestamp. Minimum viable log.

### Screen A2 — Context (Optional)

Optional fields, all skippable. Save remains visible. Fields:

- Trigger chips (multi-select). Includes 'Other' chip → free text field, max 60 chars.
- Location chips (multi-select). Includes 'Other' chip → free text field, max 60 chars.
- Social context chips (multi-select). Includes 'Other' chip → free text field, max 60 chars.

> 'Other' chip behaviour: tapping it opens an inline text field within the chip row. Field max 60 chars. Value stored in other_text field on the log entry. This applies to all multi-select chip lists across all flows.

### A2 Escape Hatch — I Need Help Now

Available on A2. Tapping it saves a partial craving log (intensity + any fields already filled) and routes directly to the SOS overlay.

**Data behaviour:** Partial log is committed with routed_to_sos = true. Null optional fields are acceptable. No 'incomplete' state is shown to the user on the dashboard. The entry appears as a standard craving log.

---

## Section 3: Flow B — Overcome Log

The user proactively logs that they resisted a craving. Triggered via Log FAB → 'I resisted a craving.' Optimistic commit — streak updates on B1 entry.

### Screen B1 — Celebration

Brief celebration animation. Streak counter visually increments.

**Commit timing:** The overcome log is saved and the streak is updated at the moment B1 is displayed — not on explicit Save. If the user exits immediately after B1, the log and streak update are preserved.

### Screen B2 — Optional Context

Optional. What helped? Multi-select chips. Includes 'Other' chip → free text, max 60 chars. Save → home.

---

## Section 4: Flow C — Slip Log

Triggered from Log FAB → 'I smoked', or from SOS-3 when the user selects 'I smoked' as post-tool state. The experience is warm and non-judgmental at every point.

### Screen C1 — Acknowledgement

Full-screen. No questions. Warm, gain-framed copy. Single CTA to continue. This is the most tone-sensitive screen in the app.

### Screen C2 — Context

- slip_type (required): 'One-off' or 'Been smoking a few days' or 'Back to regular smoking'
- cigarette_count (optional): 1 / 2 / 3 / 4 / 5+
- trigger chips (optional, multi-select). Includes 'Other' chip → free text, max 60 chars.

**cigarette_count storage:** Stored as integer. 1–4 = exact count. '5+' maps to sentinel value 99. Display layer converts 99 → '5+' everywhere. Never expose 99 to the user.

**Partial-save rule:** Slip log is auto-committed once slip_type is answered (the only required field in C2). If user exits after that, a valid slip entry exists.

### Screen C3 — Support Response

Personalised response based on slip_type. No restart prompt is shown at this stage.

| slip_type | Response |
|---|---|
| One-off | Gain-framed message. Slips = data, not failure. → Home. |
| Been smoking a few days | Acknowledgement + option to 'Just keep going' or 'Start fresh'. 'Start fresh' opens the restart re-engagement flow (mini re-onboarding: dependency re-assessment → trigger/timing pre-filled editable → quit date picker). Not an inline date picker — full restart flow. |
| Back to regular smoking | Routes to Giving Up Support System (see Section 9). GU experience activates on **next app open** (not immediately from C3). |

---

## Section 5: Flow D — Quick Note

10 seconds flat. Text field (280 chars), rotating daily placeholder (stage-aware — see Section 5.1), optional mood selector (5 faces), optional photo. Save → home. No confirmation screen. A toast message confirms the note was saved.

### 5.1 Flow D Placeholder Copy

Static list, stage-aware. Voice: Real & Practical (neutral journaling tone — not emotional, not celebratory). Prompts rotate by day-of-week index (7-day cycle, no repeats within a week). List maintained in the Content Database, not hardcoded in the app.

| Stage | Sample Prompts |
|---|---|
| Stage 0 (pre-quit) | What usually sets it off? / When's the hardest time of day? / Who do you smoke with most? / What do you think quitting will feel like? / What are you looking forward to? |
| Stage 1 (first 72 hrs) | What got you through today? / What surprised you? / What was the hardest moment? / What's different about today? |
| Stages 2–3 | What do you do instead now? / What still catches you off guard? / What are you noticing? / What's easier than you expected? |
| Stages 4–5 | What's different about you now? / What would you tell someone starting today? / What do you not miss? / What are you proud of? |

---

## Section 6: SOS Flow

Activated via the SOS FAB. High-urgency path. Bypasses all check-ins and log selection. Designed for active craving moments.

### Screen SOS-1 — Tool Selection

Curated tool list, stage and history aware. User selects one tool. Tool selection is committed immediately — log entry created with tool_selected at this point.

### Screen SOS-2 — Tool Execution

The tool runs. Duration tracked. User can exit at any time.

### Screen SOS-3 — Post-Tool Check-in

'Did that help?' — Thumbs up / thumbs down.

'How are you now?' — Three cards: Better / Same / I smoked.

| Response | What Happens |
|---|---|
| Better | Optional 'what else helped?' chips (includes 'Other' chip). Auto-logs craving overcome. → Home. |
| Same | 'Try another tool?' (→ SOS-1) or 'Just wait it out' (→ craving timer visual). |
| I smoked | Compressed Flow C: C1 (acknowledgement) + C3 (support response) only. Skips C2 context capture. |

**SOS-3 is skippable.** A visible but unobtrusive dismiss option (Skip or X) is available. If skipped, tool_helpful and post_tool_state are logged as null. SOS usage is still committed — tool_selected and duration are captured regardless. Null tool_helpful entries are excluded from tool_score calculation.

### SOS Escalation — High-Use Condition

> V1.2 change: The 'Tough day. Want to chat with the AI coach?' nudge previously referenced in this section has been replaced. The AI Coach is not being implemented in V1. It is planned for a future release and will integrate at this escalation point when available.

When sos_uses_last_24h >= 3 AND post_tool_state IN ['same', 'smoked'] for 2 or more of those uses, SOS-3 adds the following link:

*"Talk to someone who's heard this before →"*

This routes to the Giving Up Support System. Specifically:

- If support_person_configured = true → GU-6 (Pre-Call Screen, direct to person)
- If support_person_configured = false → GU-8 (Professional Resource Cards)

The Giving Up Support System handles the full escalation experience, including the human support layer (Tier 2) and professional resources (Tier 3). See the Giving Up Support System Spec V1.0 for complete flow definitions.

---

## Section 7: Return Modal

Shown when a user returns to the app after a gap of 2 or more days without activity.

| Gap Duration | Modal Behaviour |
|---|---|
| 2–3 days | Warm re-engagement card. 'Welcome back.' Low-key, no streak reference. Single CTA → Home. |
| 4+ days | Three options: 'Just keep going', 'Start fresh' (→ restart re-engagement flow, see below), 'Been smoking regularly' (→ routes to Giving Up Support System, GU-1 trigger conditions evaluated on next app open) |

**4+ day restart flow:** 'Start fresh' opens the **restart re-engagement flow** (T-A Decision 2) — a mini re-onboarding, not a raw inline date picker: (1) dependency re-assessed via 2 questions (`craving_intensity` + `time_to_first_cigarette`); (2) `smoking_reasons` + `trigger_times` shown pre-filled and editable; (3) quit-date picker (min = `restart_triggered_at + 3`, no max, default today+7). On completion a new `quit_attempts` row opens (old row closes, `ended_at = now()`).

> Ownership note: the canonical return-after-absence modals are owned by the Streak System (STK-2 short absence 1–4 days; STK-3 long absence 5+ via auto-pause). This Section 7 table is the Logging-side view of those hand-offs; the restart re-engagement flow it invokes is the same one defined in T-A and the Onboarding spec edge case.

---

## Section 8: Daily Check-in Card

A persistent home screen card that prompts the user to log before the day ends. Disappears once satisfied.

**Satisfied when:** The user completes any log flow (A, B, C, or D). For Flow A specifically: any save after A1 (intensity captured) counts as completed. The user does not need to fill optional fields on A2.

**Reset:** daily_checkin_satisfied resets to false at midnight in the user's stored timezone (see B3 for timezone rule).

**Conflict with GU-1 card:** If both the daily check-in card and the Giving Up Support trigger card are due in the same session, the GU-1 card takes priority. The daily check-in card is suppressed for that session and does not need to be resolved for the day to count as engaged.

---

## Section 9: Giving Up Support System — Integration Points

The Giving Up Support System is defined in full in a supporting document ([[LastOne_Giving_Up_Support_System]] Spec V1.0). The logging system integrates with it at the following points:

| Integration Point | Condition | Routes To |
|---|---|---|
| Flow C3 — 'Back to regular smoking' response | slip_type = return_to_smoking | GU trigger conditions evaluated on next app open. GU-1 card may appear. |
| SOS-3 escalation link | sos_uses_last_24h >= 3 AND 2+ uses with 'same' or 'smoked' outcome | GU-6 (if support person configured) or GU-8 (professional resources) |
| Return modal — 'Been smoking regularly' | User selects this option on 4+ day return | GU trigger conditions evaluated. GU-1 card may appear on next home screen render. |

> AI Coach note: Several screens in the original spec referenced a nudge to 'chat with the AI Coach' as a high-distress escalation action. The AI Coach is not being implemented in V1. All escalation paths that previously routed to the AI Coach now route to the Giving Up Support System (Tiers 2 and 3). The AI Coach is planned for a future release and will be integrated at these escalation points when available.

---

# Part B — System Logic

## B1: Data Model

### Log Entry Object

| Field | Type | Required | Notes |
|---|---|---|---|
| log_id | UUID | Yes | Auto-generated |
| user_id | UUID | Yes | |
| log_type | enum | Yes | craving \| overcome \| slip \| note \| sos |
| timestamp | datetime | Yes | Auto-captured at commit point (see commit rules, B2) |
| quit_day_number | integer | Yes | Positive = days since quit. 0 = quit day. Negative = days before quit date. Streak logic applies only when >= 0. |
| current_stage | integer (0–5) | Yes | Stage at time of log |
| entry_method | enum | Yes | daily_card \| fab \| sos \| notification |
| routed_to_sos | boolean | No | True if user tapped 'I need help now' in A2. Default false. |
| other_text | string \| null | No | Populated when user taps 'Other' on any chip list. Max 60 chars. Applies to all log types with chip selections. |

### Craving Log Fields (Flow A)

| Field | Type | Required | Notes |
|---|---|---|---|
| intensity | integer (1–5) | Yes | Captured at A1. Commit point. 5 = maximum intensity, triggers SOS override in Coping Tools. |
| triggers | string[] | No | Multi-select chip values |
| location | string[] | No | Multi-select chip values |
| social_context | string[] | No | Multi-select chip values |

### Overcome Log Fields (Flow B)

| Field | Type | Required | Notes |
|---|---|---|---|
| what_helped | string[] | No | Multi-select chip values from B2 |

### Slip Log Fields (Flow C)

| Field | Type | Required | Notes |
|---|---|---|---|
| slip_type | enum | Yes (from C2) | one_off \| few_days \| return_to_smoking. Commit point. |
| cigarette_count | integer \| null | No | 1–4 = exact. 99 = sentinel for '5+'. Display layer converts 99 → '5+'. Never expose 99 to user. Feeds `cigarettes_logged_as_smoked` in the cigs-not-smoked formula (Progress Dashboard). |
| slip_triggers | string[] | No | Multi-select chip values from C2 |
| source | enum | Yes | `flow_c` (real-time in-app slip) \| `return_modal` (absence-window disclosure via STK-2 "Had one or two"). Distinguishes real-time slips from absence-window slips. `return_modal` entries are timestamped to the absence window, not the moment of logging. Used to prevent double-counting when both paths fire for the same episode. |

### SOS Log Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| tool_selected | string | Yes | Commit point — logged at SOS-1 selection |
| tool_duration_seconds | integer \| null | No | Tracked during SOS-2 |
| tool_helpful | boolean \| null | No | Null if SOS-3 skipped. Excluded from tool_score calc. |
| post_tool_state | enum \| null | No | better \| same \| smoked \| null. Null if SOS-3 skipped. |
| sos_count_24h | integer | Yes | Running count of SOS uses in last 24 hours. Used for escalation condition. |

### Note Log Fields (Flow D)

| Field | Type | Required | Notes |
|---|---|---|---|
| note_text | string | Yes | Max 280 chars. Explicit save required (no auto-save for Flow D). |
| mood | integer (1–5) \| null | No | 1 = lowest, 5 = highest |
| has_photo | boolean | No | Default false |

---

## B2: Commit Rules

The point at which a log entry is saved to the database. Each flow has a defined commit point to handle app exits and interruptions cleanly.

| Flow | Commit Point | Minimum Saved Fields |
|---|---|---|
| Flow A (Craving) | A1: intensity selected | log_type + intensity + timestamp |
| Flow B (Overcome) | B1: celebration screen displayed | log_type + timestamp. Streak also updates here. |
| Flow C (Slip) | C2: slip_type answered | log_type + slip_type + timestamp |
| Flow D (Note) | Explicit Save tap only | log_type + note_text + timestamp. No auto-save. |
| SOS | SOS-1: tool selected | log_type + tool_selected + timestamp |

> Partial saves: If a user exits after the commit point but before completing the flow, the entry is committed with null optional fields. No incomplete flag is surfaced to the user. All partial entries are valid log records.

---

## B3: System State Fields

| Field | Type | Notes |
|---|---|---|
| daily_checkin_satisfied | boolean | Default false. Resets to false at midnight in stored timezone. Set to true on any log save (A, B, C, or D). For Flow A: set to true on A1 commit. Device-local boolean — not a server table (T-G). |
| timezone | string (IANA) | Stored at onboarding (e.g. Asia/Kolkata). Used for all midnight resets. Updateable in settings. Default: Asia/Kolkata. Device timezone at time of first app launch. |
| current_streak_days | integer | Managed by [[LastOne_Streak_System_Spec_V1_2]] (`streak_record`, separate document). Increments on Flow B commit. Freeze/reset logic defined in Streak System Spec. (Canonical name — was `streak_count`.) |
| quit_date | date | Source of truth is `quit_attempts.quit_date` (open row where `ended_at IS NULL`). Set on onboarding or restart. Used to calculate quit_day_number. (Canonical name — was `quit_start_date`.) |

---

## B4: Pre-Quit Logging

Logging is available from the first day of onboarding, before the quit date is reached. Pre-quit entries are valid log records stored identically to post-quit entries, with the following differences:

- quit_day_number is a negative integer (e.g. -3 = three days before quit date)
- Streak system is inactive for all pre-quit entries. No streak impact.
- SOS tools are available pre-quit for familiarisation.
- Flow C (Slip Log) is available pre-quit. slip_type field is set to null — smoking before the quit date is not classified as a slip.

---

## B5: SOS Escalation Logic

### Tool Score

tool_score is a per-tool rating derived from tool_helpful values. Only non-null tool_helpful entries contribute. Used to surface the most effective tools at the top of SOS-1.

### Escalation Condition

```
IF sos_uses_last_24h >= 3
AND post_tool_state IN ['same', 'smoked'] for 2+ of those uses
THEN add escalation link to SOS-3
  Label: "Talk to someone who's heard this before →"
  Routes to: GU-6 (if support_person_configured = true)
             GU-8 (if support_person_configured = false)
```

> V1.2 change: This escalation condition previously triggered an AI Coach nudge. The AI Coach is benched for V1. Routing now goes to the Giving Up Support System. The AI Coach will be integrated at this point in a future release.

---

## B6: API Surface

### Log Entry

- **Create:** POST on commit point. Fields set at commit. Remaining fields updated as user progresses.
- **Update:** PATCH as optional fields are captured (e.g. context chips added after initial commit).

### User State

- **Read:** GET daily_checkin_satisfied, timezone, quit_date (from quit_attempts), current_stage on each app open.
- **Update:** PATCH daily_checkin_satisfied on any log commit. PATCH streak fields on Flow B commit (via streak system).

### SOS State

- sos_count_24h is a derived count — calculated from log entries WHERE log_type = 'sos' AND timestamp >= now - 24h. No separate counter field required.

---

# Appendix — Change Log from V1.1

## Technical Resolutions (V1.2)

| Gap | Resolution |
|---|---|
| Timezone handling | Device timezone stored at onboarding as IANA string (default: Asia/Kolkata). All midnight resets run against stored timezone. Updateable in settings. |
| Partial-save behaviour | Defined per flow. Each flow has a named commit point. Auto-commit fires at commit point regardless of whether user completes the flow. |
| SOS-3 skippability | SOS-3 is skippable. Null tool_helpful and post_tool_state are valid. Null entries excluded from tool_score. SOS usage still logged. |
| cigarette_count sentinel | 5+ stored as integer 99. Display layer converts 99 → '5+'. Never exposed to user. |
| Pre-quit logging | Available from onboarding. quit_day_number uses negative integers pre-quit. Streak inactive. Flow C slip_type = null pre-quit. |
| A2 escape hatch (partial log) | Partial craving log saved with routed_to_sos = true. No incomplete flag shown. Appears as standard craving log on dashboard. |

## Author Clarifications (V1.2)

| Question | Answer | Impact |
|---|---|---|
| Flow A 'completed' definition | Any save after A1 (intensity captured) | daily_checkin_satisfied set to true on A1 commit |
| Post-call state (Call My Person) | Show SOS-3 as normal | No special handling on app return after call |
| Return modal → restart | Restart re-engagement flow (T-A Decision 2) | 'Start fresh' launches the mini re-onboarding (dependency re-check → triggers/timing pre-filled → quit-date picker), not an inline picker. Supersedes the earlier "C3b inline within modal" model. |
| Log commit timing (Flow B) | Optimistic — commit on entry, not save | Streak updates on B1 display. Exit after B1 = log preserved. |
| Notification entry points | Out of scope. Separate Notification Spec TBD. | Flagged as external dependency. |
| Flow D placeholder source | Static, stage-aware list in Content Database | 5–6 prompts per stage, rotating by day-of-week index |

## New Additions (V1.2)

| Addition | Description |
|---|---|
| 'Other' chip on all multi-selects | Every chip list across all flows includes an 'Other' option. Tapping opens inline free-text field (max 60 chars). Stored in other_text field on log entry. |
| Flow D toast message | No confirmation screen. Toast message confirms note was saved. |
| AI Coach escalation replaced | All escalation paths previously pointing to the AI Coach now route to the Giving Up Support System. AI Coach is planned for a future release. |
| Giving Up Support System integrated | Section 9 added to Part A. Integration points defined. Full system spec in supporting document: [[LastOne_Giving_Up_Support_System]] Spec V1.0. |

## Deferred / External Dependencies

| Item | Status |
|---|---|
| Streak System | Separate spec exists. To be cross-referenced with this spec in a future review session. |
| Notification entry points | Separate Notification Spec. To be written after master feature map is complete. |
| AI Coach | Benched for V1. Planned for future release. Will integrate at SOS-3 escalation and Giving Up Support System escalation points. |
| Professional resource contact details (GU-8) | To be verified by team before implementation. See [[LastOne_Giving_Up_Support_System]] Spec V1.0, Section 5. |

---

*LastOne — Logging System Spec V1.2 | April 2026*

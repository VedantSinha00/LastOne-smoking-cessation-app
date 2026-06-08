# LastOne Slip Threshold & Restart Logic

## Feature Specification — Supporting Document for Logging System V1.2

Version 1.1 — May 2026

> How to use this document: This is a supporting spec for the Logging System V1.2. It defines the routing logic that determines which outcome screen a user sees at the end of Flow C for slip_type = one_off, and the pattern-tracking state that drives that decision. The "Been smoking a few days" and "Back to regular smoking" paths in Flow C are governed by the Logging System Spec and Giving Up Support System respectively — this spec does not touch those paths. Read alongside Logging System Spec V1.2 and Streak System Spec V1.2.

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Logging_System_Spec]] — primary spec this document extends; governs Flow C outcome routing for slip_type = one_off
- [[LastOne_Streak_System_Spec_V1_2]] — freeze allocation and all freeze decrements owned by Streak; this spec reads freeze_stock as input only and signals Streak to consume
- [[LastOne_FeatureSpec_Template_V1]] — structural reference

---

## Version History

| Version | Date | Summary |
|---|---|---|
| V1.0 | May 2026 | Initial draft — backend logic, state table, C3 screen definitions |
| V1.1 | May 2026 | Shipped as v1.2 supporting doc. Added design decisions, stage relevance, C3 Restart Nudge copy, voice style alignment. Clarified scope boundary with Logging System C3 table. |

---

# Part A — Feature Definition

## Section 1: Overview

### What This Does

When a user logs a one-off slip in Flow C, the system determines whether to show them a warm reassurance screen (C3 Warm) or a gentle restart nudge screen (C3 Restart). The decision is made automatically based on three inputs: `freeze_stock`, `red_flag_count`, and `days_since_last_slip`.

Freeze allocation per profile and stage is defined in `LastOne_Streak_System_Spec_V1_2`. This spec defines what happens after freezes are consumed.

> Streak impact is never shown during Flow C. It appears silently on the next home screen visit.

### Core Principle

Freezes are the first buffer. Once gone, the system watches for a pattern. A single bad week with a clear reason is protected. Repeated slips in a short window, after freezes are exhausted, trigger a gentle restart suggestion. The user is never forced to restart.

### The Three Phases

**Phase 1 — Freezes available**
User logs a slip. One freeze is auto-consumed. Streak is protected. No flags raised. C3 Warm shown.

**Phase 2 — Freezes exhausted, first streak break**
Freezes at zero. Next slip breaks the streak. `red_flag_count` increments by 1. C3 Warm still shown. No restart nudge yet.

**Phase 3 — Pattern confirmed**
`red_flag_count` reaches 2 or more, with less than 6 days between slips, and no freezes remaining. C3 Restart nudge shown.

**Pattern reset condition**
If 6 or more days pass since the last slip with no new slip logged, `red_flag_count` resets to 0. The next slip is treated as an isolated incident, not a continuation of a pattern.

### State Table

| Freezes left | red_flag_count | Days since last slip | Screen shown |
|---|---|---|---|
| 1 or more | Any | Any | C3 Warm |
| 0 | 0 | Any | C3 Warm, streak resets |
| 0 | 1 | Less than 6 days | C3 Warm, streak resets |
| 0 | 2 or more | Less than 6 days | C3 Restart nudge |
| 0 | Any | 6 or more days | C3 Warm, flag resets to 0 |

---

## Section 2: Stage Relevance

Active in all stages where a quit attempt is in progress (Stage 1–5). Stage 0 is excluded — the streak system is dormant before the quit date.

The feature's practical impact varies by stage because freeze stock decreases over the course of a quit attempt. As freeze stock depletes, exposure to Phase 2 and Phase 3 logic increases.

| Stage | Feature Status | Freeze Context |
|---|---|---|
| Stage 0 — Learning Week | Inactive | Streak dormant. No slip state. |
| Stage 1 — Days 1–3 | Active | Freeze period 0: Light 2, Moderate 3, Heavy 4. High stock — Phase 1 (C3 Warm) is the likely outcome. |
| Stage 2 — Days 4–7 | Active | Freeze period 0 continues. Phase 2/3 only if stock was exhausted in Stage 1. |
| Stage 3 — Days 8–21 | Active | Freeze period 1 from Day 15: Light 1, Moderate 2, Heavy 3. Reduced stock increases Phase 2/3 exposure. |
| Stage 4 — Days 22–56 | Active | Freeze period 2 from Day 29: Light 1, Moderate 1, Heavy 2. C3 Restart nudge more probable as stock depletes. |
| Stage 5 — Day 57+ | Active | Freeze period 3 from Day 91: Light 0, Moderate 1, Heavy 1. Light users have no freezes — any slip enters Phase 2 directly. |

---

## Section 3: Design Decisions

### Decision 1 — 6-day pattern window

**Chosen:** `red_flag_count` resets to 0 if 6 or more days pass since the last slip.

**Rejected:** 7-day reset (one full week).

**Rationale:** A 7-day window can be gamed mechanically — a user could space slips 7 days apart and perpetually avoid the restart nudge. 6 days is long enough to represent genuine recovery from a rough patch while being resistant to deliberate spacing. It also aligns with human weekly rhythms: a full clean week would feel like a natural reset; 6 days reflects genuine restraint without requiring perfection.

### Decision 2 — Threshold of 2 flags before restart nudge

**Chosen:** `red_flag_count >= 2` triggers C3 Restart — meaning the third post-freeze slip in a short window surfaces the nudge.

**Rejected:** Threshold of 1 (second post-freeze slip triggers nudge) or 3 (fourth slip triggers nudge).

**Rationale:** A threshold of 1 surfaces the restart nudge after only two post-freeze slips — likely to feel accusatory when the user just had their first streak break. The second slip could still be a genuine isolated incident. A threshold of 3 means four slips in close succession before the nudge appears — probably too late to feel timely. Two flags means the user has had three slips in less than 6 days with no freezes: there is a clear pattern, not ambiguity.

### Decision 3 — Continue de-emphasised, not removed

**Chosen:** Continue CTA present but with lowest visual weight — clearly secondary to Restart and Take a Break.

**Rejected:** Removing Continue entirely and requiring the user to choose Restart or Take a Break.

**Rationale:** Forcing a major decision at a pattern moment is coercive. Some users will have context the system cannot see — a specific high-stress week that has now passed, a clearly identifiable trigger that is gone. Continue must exist as a valid option. The de-emphasis signals the system's read of the situation without overriding user judgment.

### Decision 4 — Pattern state is separate from the streak data model

**Chosen:** `slip_state` object (`red_flag_count`, `last_slip_date`, `pattern_window_open`) lives independently of `streak_record`.

**Rejected:** Deriving pattern detection from existing streak and freeze fields alone.

**Rationale:** The streak system tracks freeze consumption and streak continuity — it has no dimension for how close together slips occurred. `red_flag_count` is time-sensitive: it resets on a clean window, not at a period boundary. Embedding it in `streak_record` would couple two systems with different jobs and different reset conditions.

---

## Section 4: Screen Definitions

### C3 Warm Screen

Shown in all Phase 1 and Phase 2 cases. Tone: steady, no drama. Streak reset (if it occurred) is not mentioned on this screen — it surfaces on the home screen silently on next visit.

| Voice | Copy |
|---|---|
| Steady & Direct | You smoked. You came back to log it. That second part is the one that counts. |
| Emotional & Understanding | It happens. The fact that you're logging it means you haven't given up. |
| Light & Honest | One smoke is one data point. Logging it is how you figure out what's actually going on. |

### C3 Restart Nudge Screen

Shown only when `red_flag_count >= 2`, `days_since_last_slip < 6`, and `freeze_stock = 0`. The screen names a pattern without blame and presents three paths as genuine choices.

| Voice | Copy |
|---|---|
| Steady & Direct | Three slips in a few days. That's a pattern worth paying attention to — not a failure. Take a moment. You've got options. |
| Emotional & Understanding | Something's making this stretch harder than usual. That's worth noticing. There's no pressure here — just three paths, whichever feels right. |
| Light & Honest | The data is suggesting your current approach might need a remix. No judgement — just some options. |

**CTAs:**

| CTA | Action | Visual Priority |
|---|---|---|
| Restart | Routes to Quit Date Picker, then Home | High |
| Take a break | Routes to Paused State, data preserved | High |
| Continue | Closes flow, returns Home | Low (de-emphasised) |

Continue carries the least visual weight. Restart and Take a break are visually equal. The screen is an option, not a directive.

---

# Part B — Backend Logic

## B1. Data Model

New fields on the user `slip_state` object:

```
slip_state {
  freeze_stock   : number (required)       // sourced from streak system
  red_flag_count      : number, default = 0     // increments on post-freeze slips
  last_slip_date      : date (nullable)         // date of most recent Flow C log
  pattern_window_open : boolean, default = false // true when flags are accumulating
}
```

## B2. Logic & Conditions

### B2.1 — Slip routing logic

**For slip_type = `few_days`** (runs on every Flow C completion where slip_type = few_days):
```
signal Streak to consume ALL remaining freeze_stock
streak resets to 0
red_flag_count unchanged (no increment — few_days does not escalate toward restart nudge)
show C3 Warm
```
> Rationale: `few_days` is worse than `one_off` (all freezes gone) but the user is still in the app managing it — red_flag escalation is reserved for repeat one_off patterns, not declared multi-day slips.

**For slip_type = `one_off`** (runs on every Flow C completion where slip_type = one_off):
```
IF freeze_stock > 0
  THEN signal Streak to consume 1 freeze
       red_flag_count = 0
       show C3 Warm

ELSE IF freeze_stock = 0
  AND days_since_last_slip >= 6
  THEN red_flag_count = 0
       last_slip_date = today
       streak resets
       show C3 Warm

ELSE IF freeze_stock = 0
  AND days_since_last_slip < 6
  AND red_flag_count < 2
  THEN red_flag_count + 1
       last_slip_date = today
       streak resets
       show C3 Warm

ELSE IF freeze_stock = 0
  AND days_since_last_slip < 6
  AND red_flag_count >= 2
  THEN show C3 Restart Nudge
```

### B2.2 — Freeze stock

Freeze allocation by profile and stage is defined in `LastOne_Streak_System_Spec_V1_2`. This spec reads `freeze_stock` as an input only.

### B2.3 — red_flag_count reset conditions

| Condition | red_flag_count result |
|---|---|
| Freeze consumed (Phase 1 slip) | Resets to 0 |
| 6+ days since last slip (clean window) | Resets to 0 |
| Freeze-period boundary crossed (Day 15, 29, 91) | Resets to 0 (freeze stock also resets per streak spec) |
| User restarts quit journey | Resets to 0 |
| User enters paused state | Preserved, resumes on return |

## B3. Notifications

No notifications in this feature. The C3 screen itself is the only surface.

## B4. API Surface

```
GET   /user/slip-state         -> returns slip_state object
POST  /log/smoked              -> logs Flow C event, triggers routing logic
                                  returns { screen: 'warm' | 'restart_nudge' }
PATCH /user/slip-state/reset   -> called on restart or freeze-period boundary
```

## B5. Edge Cases

| Scenario | Behaviour |
|---|---|
| User restarts via C3 Restart Nudge | red_flag_count resets to 0. New quit date set. Freeze stock replenished per profile and new stage. |
| User chooses Take a Break | red_flag_count preserved. Paused state active. Resumes with same count when they return. |
| User chooses Continue from C3 Restart Nudge | No state change. red_flag_count unchanged. Next slip re-evaluates against same thresholds. |
| User in compressed Flow C (from SOS post_tool_state = smoked) | Same routing logic applies. C1 and C3 only, no context screens. |
| Freeze-period boundary occurs while flags are active (Day 15, 29, 91) | Freeze stock resets per streak spec. red_flag_count resets to 0. User gets a fresh window. |

---

*LastOne — Slip Threshold & Restart Logic Spec V1.1 | Supporting document for Logging System V1.2 | May 2026*

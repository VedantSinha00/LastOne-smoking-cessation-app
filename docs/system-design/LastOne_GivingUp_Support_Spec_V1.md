# LastOne — Giving Up Support System
## Feature Specification
### Supporting Document — Logging & Streak System V1.2

**Part A: Feature Definition & Mechanics**
**Part B: System Logic for Implementation**

Version 1.0 — April 2026

---

> **How to use this document**
> This is a supporting spec for the Logging & Streak System. It defines the system that activates when a user is at risk of abandoning their quit attempt entirely — not during a single craving (covered by the SOS flow), but during a sustained low point where quitting itself feels futile. Read alongside the Logging System Spec V1.1 and the Product Foundations Document V1.0.

---

## PART A — FEATURE DEFINITION

---

### Section 1: Problem & Purpose

#### 1.1 The Real Problem

A single craving is a spike — it passes in 3–5 minutes and the SOS system handles it well. The "giving up" moment is structurally different: it is a slow, accumulated despair, often following several slips in quick succession, where the user begins building a narrative that they are fundamentally unable to quit. At this point, standard coping tools feel tone-deaf, and the absence of a response from the app feels like abandonment.

#### 1.2 Why This Matters for LastOne

This feature touches all five foundations:

- **Stage System** — The trigger conditions are built on existing relapse variables (`rolling_14d_slips`, `slip_type`). The experience is most relevant in Stages 2–4, where sustained patterns of failure are most demoralising.
- **Two-Layer Coping System** — This is a third mode, distinct from both the curated craving surface and the explorative library. It is not a craving tool. It is a despair intervention.
- **Social Architecture** — The "Call My Person" feature (existing in SOS) is extended here with a briefing layer that makes peer support actually functional.
- **Personalisation Model** — The data shown to the user in Beat 2 of the in-app experience is drawn from their own logs, making it personal and evidence-based.
- **Content & Awareness Framework** — The copy in this experience is high-sensitivity and requires all three voice variants. It must never be preachy, artificial, or cheerful.

#### 1.3 User Story

Priya is on Day 12. She's slipped four times in the last week — twice at the tapri after evening chai with her friends, once after a particularly rough exam, once just out of boredom. She's opened LastOne less and less because looking at her streak counter feels like looking at a report card she keeps failing. Tonight she opens the app out of habit. Instead of the streak counter, she sees a card that says: *"This stretch has been hard. We noticed. Take 2 minutes?"* She taps it. The app doesn't ask her to restart. It doesn't show her what she lost. It shows her that she resisted 11 cravings in the last two weeks — cravings she forgot about because she was focused on the slips. She sits with that for a moment. At the end, she taps "Just keep going." She doesn't restart. She doesn't quit quitting. That's the win.

#### 1.4 Success Metrics

1. **Retention at trigger point** — % of users who, after the Tier 1 experience triggers, remain active in the app 7 days later. Target: meaningfully higher than the baseline dropout rate at the same slip-count threshold.
2. **"Call My Person" setup rate** — % of users who complete the support person briefing flow during onboarding. Target: >40% of onboarded users.
3. **"Call My Person" usage at crisis** — % of users who have it set up and actually use it when routed from the Tier 1 experience.
4. **Professional resource tap rate** — % of users who tap through to a professional resource card when it is surfaced. (Benchmark only — not a success metric in itself, but low rates may indicate framing problems.)
5. **Restart-vs-abandon ratio at slip threshold** — Of users who hit the `rolling_14d_slips >= 3` condition, the ratio who choose a controlled restart via the app vs. silent churn.

---

### Section 2: Feature Overview

#### 2.1 What This Feature Does

The Giving Up Support System is a three-tier escalation response that activates when the app detects a user is at high risk of abandoning their quit attempt. Tier 1 is an in-app micro-experience that interrupts the failure narrative using the user's own data. Tier 2 is a human connection via a pre-briefed personal contact. Tier 3 is a signpost to professional support resources.

#### 2.2 Where It Lives

| Tier | Surface | Entry Point |
|------|---------|-------------|
| Tier 1 | Home screen card (distinct visual treatment from daily check-in card) | System-triggered. Not user-initiated. |
| Tier 2 | Extends the existing "Call My Person" SOS option | Accessible from end of Tier 1 experience, and from SOS as existing |
| Tier 3 | In-app resource cards | Accessible from end of Tier 1 experience, and contextually from SOS post-tool screen |

#### 2.3 Stage Relevance

| Stage | Feature Status / Behaviour |
|-------|---------------------------|
| 0 — Learning Week | Inactive. User is not yet in a quit attempt. |
| 1 — First 72 Hours | Tier 1 trigger suppressed. Stage 1 is inherently high-intensity; slip logic here is handled by the relapse system. Tier 2 and Tier 3 remain accessible via SOS. |
| 2 — First Full Week | Tier 1 active. Trigger condition: `slip_type = return_to_smoking` logged (Flow C3b) OR `rolling_14d_slips >= 3`. This is the first week of habitual triggers — a realistic moment for early despair. |
| 3 — Weeks 2–3 | Tier 1 fully active. All trigger conditions apply. Passive disengagement signal also active. This is the highest-risk window for giving up. |
| 4 — Weeks 4–8 | Tier 1 active. Trigger thresholds remain the same. Tone of the experience shifts slightly — the user has more history to reflect on, so Beat 2 data will be richer. |
| 5 — Months 3+ | Tier 1 trigger adjusted. `rolling_14d_slips` threshold raises to 4 (consistent with Foundations relapse logic for Stage 5). Passive disengagement signal remains active. |

#### 2.4 Dependencies

**Reads from:**
- `rolling_14d_slips` (Foundations B1, Relapse Logic)
- `slip_type` (Logging Spec B2, Flow C)
- `daily_checkin_satisfied` (Logging Spec B3)
- `craving` and `overcome` log counts (Logging Spec B1)
- `sos_uses_last_72h` (Logging Spec B2, SOS Usage Log)
- `support_person_configured` (new field — see B1 below)
- `current_stage` (Foundations B1)

**Writes to:**
- `giving_up_experience_triggered` (new — see B1)
- `giving_up_experience_outcome` (new — see B1)
- `support_person_configured` (set during onboarding)
- `support_person_briefing_sent` (new — see B1)

**Triggers:**
- Tier 1 home screen card
- "Call My Person" extended flow (Tier 2)
- Professional resource cards (Tier 3)

**Requires:**
- Craving and overcome log history to populate Beat 2 data
- Contact picker access (device) for support person setup
- WhatsApp/SMS deep link capability for briefing message send

---

### Section 3: Design Decisions

#### Decision 1: Tier 1 is system-triggered, not user-initiated
**Chosen:** The home screen card appears automatically when trigger conditions are met. The user does not tap "I'm thinking of giving up."
**Alternative rejected:** A dedicated button or menu item for crisis support.
**Rationale:** A user at their lowest point will not self-identify and navigate to a help section. The system must detect the pattern and surface the response. The activation barrier of self-identification is too high at exactly the moment when initiative is lowest.

#### Decision 2: Tier 1 does not ask for a restart
**Chosen:** The experience ends with a low-commitment binary — "Just keep going" or "I want to talk to someone." No restart prompt.
**Alternative rejected:** Using the Tier 1 experience as a gateway to the restart flow.
**Rationale:** Asking someone to make a big decision at their lowest moment is the wrong design. The goal of this experience is to keep the user's relationship with the app alive until they reach a better moment. A restart can be initiated at any time — it does not need to happen here.

#### Decision 3: Beat 2 uses resistance data, not streak data
**Chosen:** The data surface in Beat 2 shows cravings resisted (overcome logs) over the last 14 days — not the streak counter, not the number of slips.
**Alternative rejected:** Showing overall quit progress, days smoke-free, or money saved.
**Rationale:** The user is currently focused on their failures. The streak counter confirms their failure narrative. Resistance data reframes the same period: "you succeeded X times" instead of "you failed Y times." The goal is narrative interruption, not progress review.

#### Decision 4: Quit Groups are explicitly excluded from the escalation path
**Chosen:** The social escalation path is limited to a single pre-set personal contact (Tier 2). Quit Groups are not used as an escalation surface.
**Alternative rejected:** Routing to the Quit Group SOS ping or Quit Group chat.
**Rationale:** Peer group responses are unpredictable. A comment from one group member — however well-intentioned — can be deeply counterproductive at a moment of vulnerability. The risk profile of group social escalation is too high for V1. This decision is explicitly parked for review in a future version when the social layer is better understood.

#### Decision 5: Trigger conditions are wired into existing relapse variables, not new tracking
**Chosen:** Tier 1 triggers are derived from `rolling_14d_slips`, `slip_type`, `sos_uses_last_72h`, and `daily_checkin_satisfied` — all variables already tracked.
**Alternative rejected:** Building a separate "distress score" system with its own tracking.
**Rationale:** Reusing existing variables keeps the system consistent, avoids double-tracking, and means Tier 1 is available as soon as the logging system is live. The only genuinely new signal is passive disengagement (app opens without action), which `daily_checkin_satisfied` supports without new infrastructure.

#### Decision 6: Professional resources are presented as contextual cards, not a help section
**Chosen:** Resource cards surface at the end of the Tier 1 experience and on the SOS post-tool screen after repeated "Same" or "I smoked" outcomes. They are not in a standalone menu.
**Alternative rejected:** A dedicated "Get Help" or "Crisis Support" section.
**Rationale:** Users experiencing despair will not navigate to a help section. Framing resources as emergency services also causes self-screening: "I'm not that bad." Resources must appear when the system detects need, not when the user decides to seek them. Framing: "sometimes it helps to talk to someone who's heard this before" — not a crisis hotline.

#### Decision 7: "Call My Person" setup includes a briefing layer
**Chosen:** During onboarding, after the user sets their support contact, the app generates a shareable message that primes the contact on what the role involves and what to say/not say.
**Alternative rejected:** "Call My Person" as a bare one-tap dial feature with no context layer.
**Rationale:** An uninformed support contact can make things worse. Common unhelpful responses ("just don't smoke," "come join us") actively harm the user at a vulnerable moment. The briefing message transforms an unprepared friend into a minimally-adequate supporter. The cost is one extra step in onboarding; the benefit is that the feature actually works when used.

#### Decision 8: Copy across all three tiers is high-sensitivity
**Chosen:** All user-facing text in this feature — home screen card, Tier 1 beats, Tier 2 pre-call screen, Tier 3 resource cards — is treated as high-sensitivity and written in all three voice variants.
**Alternative rejected:** Treating resource cards and the home screen trigger card as low-sensitivity (neutral-warm, single version).
**Rationale:** Every touchpoint in this feature occurs at a moment of emotional vulnerability. The voice style the user chose in onboarding reflects how they process difficulty. Applying it consistently here is not optional.

---

### Section 4: Screen Inventory

| ID | Name | Description |
|----|------|-------------|
| GU-1 | Trigger Card | Home screen card that appears when Tier 1 conditions are met. Distinct visual treatment. |
| GU-2 | Beat 1 — Validation | Full-screen. Names the difficulty without asking anything of the user. Single CTA to continue. |
| GU-3 | Beat 2 — Resistance Data | Full-screen. Shows user's own craving resistance count over the last 14 days. Single CTA to continue. |
| GU-4 | Beat 3 — Choice | Full-screen. Low-commitment binary: "Just keep going" or "I want to talk to someone." |
| GU-5 | Talk Options | Half-sheet. Two options: Call My Person (if configured) or Professional Support. |
| GU-6 | Pre-Call Screen | Brief screen shown before "Call My Person" dials. Shows contact name + one-line prompt. |
| GU-7 | Post-Call Log | Optional. "How did that go?" Single question, 3 options. |
| GU-8 | Professional Resource Cards | Two cards: tobacco-specific helpline + mental health helpline. Each with name, brief description, contact detail. |
| GU-9 | Support Person Setup | Onboarding screen (Chapter 4 extension). Contact picker + briefing message send. |
| GU-10 | Briefing Message Preview | Shows the generated briefing message before the user sends it. Edit option. Send via WhatsApp or SMS. |

---

### Section 5: Flow Logic

#### GU-1 — Trigger Card (Home Screen)

**Appears when:** Any Tier 1 trigger condition is met (see B2). Replaces the daily check-in card for that session if both would appear simultaneously.

**What the user sees:** A card with distinct visual treatment (warmer, softer than the daily check-in — no streak imagery, no numbers). Copy is voice-style matched.

**Actions:**
- Tap card → GU-2
- Scroll past / ignore → Card persists until user taps it or trigger condition clears (session ends without action → card reappears next session, max 3 consecutive sessions)

**Data saved:** `giving_up_experience_triggered = true`, `trigger_timestamp`

---

#### GU-2 — Beat 1: Validation

**What the user sees:** Full-screen. Single piece of copy (voice-matched). No data, no numbers. No questions. One button: "Keep going."

**Actions:**
- Tap "Keep going" → GU-3

**Data saved:** `beat_1_completed = true`

---

#### GU-3 — Beat 2: Resistance Data

**What the user sees:** Full-screen. The number of overcome logs from the last 14 days, framed positively. Short supporting copy (voice-matched). One button: "Keep going."

**Edge case — no overcome logs in 14 days:** Fall back to total overcome logs since quit start. If still zero, skip this screen and go directly to GU-4. Do not show "0 cravings resisted" — that reinforces the failure narrative.

**Actions:**
- Tap "Keep going" → GU-4

**Data saved:** `beat_2_completed = true`, `resistance_count_shown` (integer, for future reference)

---

#### GU-4 — Beat 3: Choice

**What the user sees:** Full-screen. Single question. Two options: "Just keep going" and "I want to talk to someone."

**Actions:**
- Tap "Just keep going" → Experience closes → Home screen. `giving_up_experience_outcome = kept_going`
- Tap "I want to talk to someone" → GU-5

**Data saved:** `giving_up_experience_outcome` (enum: `kept_going` | `routed_to_support`)

---

#### GU-5 — Talk Options

**What the user sees:** Half-sheet slides up. Two options shown conditionally.

| Condition | Options Shown |
|-----------|--------------|
| `support_person_configured = true` | "Call [Name]" + "Talk to a counsellor" |
| `support_person_configured = false` | "Set up a support person" + "Talk to a counsellor" |

**Actions:**
- Tap "Call [Name]" → GU-6
- Tap "Talk to a counsellor" → GU-8
- Tap "Set up a support person" → GU-9 (onboarding flow, accessible mid-journey)
- Dismiss half-sheet → Home. Outcome remains `routed_to_support`.

---

#### GU-6 — Pre-Call Screen

**What the user sees:** Contact name, small avatar/initial, one-line prompt (voice-matched). Two buttons: "Call" and "WhatsApp."

**Actions:**
- Tap "Call" → Native dial intent with support person's number
- Tap "WhatsApp" → WhatsApp deep link to support person's number
- Back → GU-5

**After call ends / user returns to app:**
→ GU-7 (post-call log, optional)

---

#### GU-7 — Post-Call Log

**What the user sees:** Single question: "How did that go?" Three tap options: "Helped a lot" / "Helped a little" / "Didn't really help."

**Actions:**
- Any tap → Home. Toast: "Good that you reached out."
- Dismiss without answering → Home. No log written.

**Data saved:** `support_call_outcome` (enum: `helped_a_lot` | `helped_a_little` | `didnt_help` | `not_logged`). Used to weight whether "Call My Person" surfaces again in future escalations.

---

#### GU-8 — Professional Resource Cards

**What the user sees:** Two cards. Each card has: name of organisation, one-sentence description of what it's for, contact detail (phone number), and a "Call" button.

> ⚠️ **Resource Vetting Note — Action Required Before Implementation**
> The specific organisations, phone numbers, and availability details in these cards must be verified by the team before being coded into the application. The cards below are structural templates. Do not ship with placeholder or unverified contact information. See Section 3 (Decision 6) for context on how these cards are framed.

**Card 1 — Tobacco Cessation Support**
- **Organisation:** [Tobacco-specific cessation helpline — to be vetted. Suggested starting point: MoHFW National Tobacco Quitline]
- **Description:** "Trained counsellors specifically for tobacco and smoking cessation. Free, confidential."
- **Contact:** [Number to be verified]

**Card 2 — Emotional Support**
- **Organisation:** [General mental health helpline — to be vetted. Suggested starting point: iCall by TISS]
- **Description:** "If the weight of this moment is about more than smoking — stress, anxiety, feeling overwhelmed — trained counsellors are available."
- **Contact:** [Number to be verified]

**Actions:**
- Tap "Call" on either card → Native dial intent
- Back → GU-5

---

#### GU-9 — Support Person Setup (Onboarding, Chapter 4 Extension)

**What the user sees:** Shown after voice style and notification preference selection in onboarding Chapter 4. Heading: "Who's in your corner?" Brief explanation: one support person they trust, who the app will help them brief. Contact picker button.

**Actions:**
- Tap "Pick a contact" → Device contact picker → returns selected contact name + number
- Contact selected → GU-10
- Tap "Skip for now" → `support_person_configured = false`. Skippable. App will re-surface this setup once, in Stage 2, via a contextual prompt.

---

#### GU-10 — Briefing Message Preview

**What the user sees:** The generated briefing message, pre-written, displayed in a text-area style view. An edit option. Two send buttons: "Send via WhatsApp" and "Send via SMS." A note below the message: *"This copy is operational but not finalised — your content team should review before the production build."*

> **Briefing Message — Draft Copy (Operational, Not Finalised)**
> The following is a working draft of the briefing message. It is functional and can ship in this form if the content team has not yet reviewed it. It should be reviewed and refined before the production release.

---

*"Hey [contact name] — I'm using an app called LastOne to quit smoking. I've set you as my support person, which means if I'm having a really rough moment, I might send you a message or give you a quick call.*

*You don't need to do anything right now, and you don't need to have any answers. If I reach out, I'm not looking for advice on whether to quit — I've already decided that. I just need someone to be on the other end for a few minutes.*

*The most helpful thing you can do is just listen and say something like 'I'm here' or 'that sounds hard.' You don't need to fix anything.*

*Thanks for being in my corner."*

---

**Actions:**
- Tap "Send via WhatsApp" → WhatsApp deep link with message pre-filled
- Tap "Send via SMS" → SMS deep link with message pre-filled
- Tap "Edit" → Message becomes editable text area. "Save & Send" replaces send buttons.
- Tap "Skip sending" → `support_person_configured = true`, `support_person_briefing_sent = false`. Contact is saved but message not sent.

**Data saved:** `support_person_configured = true`, `support_person_name`, `support_person_number`, `support_person_briefing_sent` (boolean)

---

### Section 6: Stage-by-Stage Behaviour

| Stage | Tier 1 Card | Trigger Conditions Active | Tier 2 | Tier 3 |
|-------|-------------|--------------------------|--------|--------|
| 0 — Learning Week | Not shown | None | Accessible from SOS only | Accessible from SOS only |
| 1 — First 72 Hours | Suppressed | None (Stage 1 relapse handled by existing relapse logic) | Accessible from SOS | Accessible from SOS post-tool screen |
| 2 — First Full Week | Active | `slip_type = return_to_smoking` OR `rolling_14d_slips >= 3` | Active — routable from GU-5 | Active — routable from GU-5 and SOS |
| 3 — Weeks 2–3 | Fully active | All three conditions (slip threshold, return-to-smoking, passive disengagement) | Active | Active |
| 4 — Weeks 4–8 | Active | All three conditions. Beat 2 data is richer — user has more overcome logs to surface. | Active | Active |
| 5 — Months 3+ | Active, adjusted threshold | `rolling_14d_slips >= 4` (consistent with Foundations Stage 5 relapse logic). Passive disengagement signal remains. | Active | Active |

---

### Section 7: Copy

All high-sensitivity copy is provided in three voice variants: **Steady & Direct**, **Warm & Grounding**, **Light & Honest**. The user's chosen voice style (set in onboarding) determines which variant they see.

---

#### GU-1 — Trigger Card

| Variant | Copy |
|---------|------|
| Steady & Direct | "This stretch has been hard. We noticed. Take 2 minutes?" |
| Warm & Grounding | "The last few days haven't been easy. We're still here. Take 2 minutes with us?" |
| Light & Honest | "Okay, it's been a rough patch. We've got you for 2 minutes — want to?" |

---

#### GU-2 — Beat 1: Validation

| Variant | Copy |
|---------|------|
| Steady & Direct | "Some stretches of quitting are just harder. That's not a character flaw. It's how quitting actually works." |
| Warm & Grounding | "A difficult stretch doesn't mean something is wrong with you. It means quitting is genuinely hard — and you're still here." |
| Light & Honest | "Your brain is doing its best impression of your worst enemy right now. That's normal. It doesn't mean it's winning." |

**Button (all variants):** "Keep going"

---

#### GU-3 — Beat 2: Resistance Data

**Data line (all variants — only the framing copy varies):**
`"In the last 14 days, you resisted [X] cravings."`

| Variant | Supporting Copy |
|---------|----------------|
| Steady & Direct | "Those didn't vanish. You made it through each one. That's [X] times your instinct to quit was stronger than the urge." |
| Warm & Grounding | "It's easy to remember the moments that were hard. These [X] moments — you got through them. Every single one." |
| Light & Honest | "Your brain only shows you the highlight reel of bad moments. Here's the edit it left out: [X] cravings you beat without making a big deal of it." |

**Button (all variants):** "Keep going"

**Fallback (no overcome logs — skip screen):** No copy needed. Screen GU-3 is not shown.

---

#### GU-4 — Beat 3: Choice

| Variant | Copy |
|---------|------|
| Steady & Direct | "You don't have to decide anything right now. What feels okay for the next hour?" |
| Warm & Grounding | "There's no pressure here. What would feel right for you in the next little while?" |
| Light & Honest | "No big decisions required. Future you can handle the rest. What works for the next hour?" |

**Buttons (all variants):** "Just keep going" / "I want to talk to someone"

---

#### GU-5 — Talk Options

**Header (all variants):** "Who do you want to reach out to?"

| Variant | Subtext |
|---------|---------|
| Steady & Direct | "Sometimes a conversation is the right move." |
| Warm & Grounding | "You don't have to sit with this alone." |
| Light & Honest | "Turns out other humans can be useful sometimes." |

**Option labels (all variants):**
- If configured: "Call [Name]" / "Talk to a counsellor"
- If not configured: "Set up a support person" / "Talk to a counsellor"

---

#### GU-6 — Pre-Call Screen

| Variant | Copy |
|---------|------|
| Steady & Direct | "[Name] knows you're trying. Just say the word." |
| Warm & Grounding | "[Name] is there. You don't have to explain everything — just reach out." |
| Light & Honest | "[Name] picked up before. They'll pick up again." |

**Buttons (all variants):** "Call" / "WhatsApp"

---

#### GU-7 — Post-Call Log

**Question (all variants):** "How did that go?"

**Options (all variants):** "Helped a lot" / "Helped a little" / "Didn't really help"

**Toast on completion (all variants):** "Good that you reached out."

---

#### GU-8 — Professional Resource Cards

**Introductory framing (all variants):**

| Variant | Copy |
|---------|------|
| Steady & Direct | "Sometimes it helps to talk to someone who's heard this story before." |
| Warm & Grounding | "There are people whose job is to sit with this — and they've heard it before, without judgement." |
| Light & Honest | "Professionally trained humans exist for exactly this moment. Might as well use them." |

**Card copy:** See Section 5, GU-8. Resource names and numbers to be verified by team before implementation.

---

#### GU-9 — Support Person Setup

**Heading (all variants):** "Who's in your corner?"

| Variant | Body copy |
|---------|-----------|
| Steady & Direct | "Pick one person you trust. The app will help you tell them what you need — so if things get hard, they'll know what to do." |
| Warm & Grounding | "Sometimes the hardest part is asking for help. Let's make that easier. Pick one person, and we'll give them a heads-up on how to show up for you." |
| Light & Honest | "Pick someone who won't immediately suggest you just 'have willpower.' We'll send them a quick brief on actually being helpful." |

**Skip link (all variants):** "Skip for now"

---

#### GU-10 — Briefing Message Preview

**Instruction line (all variants):** "Here's a message for [Name]. Edit it if you like, then send."

**Note below message (all variants):** *(See Section 5, GU-10 for the draft briefing message copy and the operational note.)*

**Buttons (all variants):** "Send via WhatsApp" / "Send via SMS" / "Edit" / "Skip sending"

---

### Section 8: Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| GU-1 card appears but user ignores it for 3 consecutive sessions | Card stops appearing. System logs `giving_up_card_dismissed`. Tier 2 and Tier 3 remain accessible via SOS post-tool screen. |
| User reaches GU-3 but has zero overcome logs in past 14 days | GU-3 is skipped. Go directly to GU-4. Do not show a zero. |
| User reaches GU-3 and has zero overcome logs since quit start | Same as above. GU-3 skipped. |
| Support person not configured when user reaches GU-5 | Show "Set up a support person" option instead of "Call [Name]." Tapping it opens GU-9 mid-journey (not onboarding context). |
| User exits Tier 1 experience mid-flow (e.g., home button) | Session state preserved for that session. If user reopens app in same session, experience resumes from last completed beat. If new session, card reappears on home screen. |
| User taps "Call" on GU-6 but call fails (number wrong, no signal) | App returns to GU-6 with a quiet error state. Option to "Try WhatsApp instead" surfaces. |
| User has already seen the Tier 1 experience in the past 7 days | Trigger suppressed for 7 days after last `giving_up_experience_triggered` event, even if trigger conditions are still met. Prevents the experience from feeling like a loop. Tier 2 and Tier 3 remain accessible via SOS. |
| Trigger conditions met during Stage 1 | Tier 1 card suppressed as per stage rules. No card shown. SOS handles Stage 1 escalation. |
| User selects "I want to talk to someone" (GU-4) but then dismisses GU-5 without acting | Outcome logged as `routed_to_support` with `support_action = dismissed`. Home screen. No further prompt in that session. |
| User taps "Skip for now" on GU-9 during onboarding | `support_person_configured = false`. App re-surfaces GU-9 once, as a contextual prompt, when user first reaches Stage 2. After that, only accessible manually. |
| Daily check-in card and GU-1 trigger card both due on same session | GU-1 takes priority. Daily check-in card is suppressed for that session. It does not need to be resolved for the day to count as engaged. |

---

## PART B — SYSTEM LOGIC

---

### B1: Data Model

#### New Object: `giving_up_event`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `event_id` | UUID | Yes | Auto-generated |
| `user_id` | UUID | Yes | |
| `timestamp` | datetime | Yes | Auto-captured |
| `current_stage` | integer (0–5) | Yes | From stage system at time of trigger |
| `trigger_condition` | enum | Yes | `slip_threshold` \| `return_to_smoking` \| `passive_disengagement` |
| `beat_1_completed` | boolean | Yes | Default false |
| `beat_2_completed` | boolean | Yes | Default false. False if screen was skipped (no overcome data). |
| `resistance_count_shown` | integer | No | Null if GU-3 was skipped |
| `outcome` | enum | Yes | `kept_going` \| `routed_to_support` \| `dismissed_mid_flow` |
| `support_action` | enum | No | `called_person` \| `whatsapped_person` \| `viewed_resources` \| `dismissed` |
| `support_call_outcome` | enum | No | `helped_a_lot` \| `helped_a_little` \| `didnt_help` \| `not_logged` |

---

#### New Fields on `user_profile`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `support_person_configured` | boolean | Yes | Default false |
| `support_person_name` | string | No | Set during GU-9 |
| `support_person_number` | string | No | Set during GU-9. Stored locally on device, not server. |
| `support_person_briefing_sent` | boolean | No | Default false |
| `last_giving_up_trigger_timestamp` | datetime | No | Used for 7-day suppression window |
| `giving_up_card_dismissed_count` | integer | Yes | Default 0. Increments on session-end without tap. Resets after any tap. |

> **Privacy note:** `support_person_number` should be stored on-device only, not synced to the server. The app requires it only to initiate the dial or deep link intent.

---

### B2: Logic & Conditions

#### Tier 1 Trigger Conditions

The GU-1 card is shown on the next app open when ANY of the following are true, AND the stage allows it (Stage 2–5), AND the 7-day suppression window has not been active:

**Condition A — Slip threshold:**
```
current_stage IN [2, 3, 4] AND rolling_14d_slips >= 3
current_stage = 5 AND rolling_14d_slips >= 4
```

**Condition B — Return to smoking declared:**
```
slip_type = 'return_to_smoking' logged in Flow C within last 48 hours
```

**Condition C — Passive disengagement:**
```
daily_checkin_satisfied = false
AND app_opened = true (session started but no log, no SOS, no card tap)
AND this pattern is true for 3 consecutive calendar days
```

**Suppression rule:**
```
IF last_giving_up_trigger_timestamp EXISTS
AND (now - last_giving_up_trigger_timestamp) < 7 days
THEN suppress GU-1 card regardless of trigger conditions
```

**Dismissal cap:**
```
IF giving_up_card_dismissed_count >= 3
THEN suppress GU-1 card until trigger conditions reset
(i.e., a new trigger event fires after a clean period)
```

---

#### Beat 2 Data Logic

```
resistance_count = COUNT of overcome logs WHERE timestamp >= (now - 14 days)

IF resistance_count > 0:
  Show GU-3 with resistance_count
ELSE:
  resistance_count_fallback = COUNT of all overcome logs since quit_start_date
  IF resistance_count_fallback > 0:
    Show GU-3 with resistance_count_fallback
    (Adjust copy: "since you started" instead of "in the last 14 days")
  ELSE:
    Skip GU-3. Go directly to GU-4.
```

---

#### Support Person Setup Re-surface Logic

```
IF support_person_configured = false
AND user enters Stage 2 for the first time
AND GU-9 was skipped during onboarding
THEN surface a contextual prompt once (home screen card, low-priority)
   Copy: "Want to set up a support person? One person, two minutes."
   Tap → GU-9
   This prompt fires a maximum of once. Not repeated.
```

---

#### SOS Integration — Tier 3 Surface Condition

The professional resource cards (GU-8) are also accessible from the SOS post-tool screen (SOS-3) under the following condition, independent of the Tier 1 trigger:

```
IF sos_uses_last_24h >= 3
AND post_tool_state IN ['same', 'smoked'] for 2+ of those uses
THEN add GU-8 link to SOS-3 screen
   Label: "Talk to someone who's heard this before →"
```

This is distinct from the existing "Tough day. Want to chat with the AI coach?" nudge in the logging spec — that line should be updated to route to GU-8 (or GU-5 if support person is configured) now that the AI coach is not being implemented in V1.

---

### B3: Notification Logic

This feature does not generate push notifications. The Tier 1 card is a home screen surface — it is seen when the user opens the app, not pushed to their lock screen.

**Rationale:** A push notification saying "we've noticed you're struggling" would feel surveillance-like and could be counterproductive. The home screen card approach respects user agency — they open the app, they see it.

The support person briefing message (GU-10) is user-initiated via WhatsApp/SMS deep link. It is not a notification.

---

### B4: API Surface

#### Giving Up Event
- **Create:** POST when GU-1 is triggered. Initial record with `trigger_condition` and `current_stage`.
- **Update:** PATCH as user progresses through beats and reaches an outcome. Fields updated: `beat_1_completed`, `beat_2_completed`, `resistance_count_shown`, `outcome`, `support_action`, `support_call_outcome`.

#### User Profile
- **Read:** GET `support_person_configured` to determine GU-5 options.
- **Update:** PATCH `support_person_configured`, `support_person_briefing_sent`, `last_giving_up_trigger_timestamp`, `giving_up_card_dismissed_count` as events occur.
- **Note:** `support_person_name` and `support_person_number` are stored on-device only. Not in the server-side user profile.

#### Trigger Evaluation
- **Read:** GET `rolling_14d_slips`, `slip_type` (last 48h), `daily_checkin_satisfied` (last 3 days), `current_stage`, `last_giving_up_trigger_timestamp` on each app open.
- The trigger evaluation logic runs client-side on app open, using data already fetched for the home screen render. No additional API call required.

#### Overcome Log Count (Beat 2)
- **Read:** GET count of overcome logs WHERE `timestamp >= now - 14 days`. This is a lightweight count query, not a full log fetch.
- Fallback: GET count of all overcome logs since `quit_start_date` if 14-day count is zero.

---

*LastOne — Giving Up Support System Spec V1.0*
*Supporting document for Logging & Streak System V1.2*
*April 2026*

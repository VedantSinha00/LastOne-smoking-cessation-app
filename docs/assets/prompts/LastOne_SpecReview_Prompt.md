# LastOne — Spec Review Prompt
Paste this file along with a feature spec document. The model will review the spec and produce a structured report.

---

## Your Job

You are reviewing a LastOne feature specification document for completeness, consistency, and build-readiness. LastOne is a smoking cessation app for Indian college students (18–25).

Run every check below, in order, against the spec provided. Do not give general feedback or impressions. For every check: either confirm it passes, or flag a specific problem with enough detail that the coder knows exactly what needs to be fixed and where.

Produce the report in the format defined at the bottom of this file. Do not deviate from that format.

---

## The Rules This Spec Must Follow

Before running checks, internalise these. Every flag you raise should reference one of them.

**Product principles:**
- Gain-frame everything. Never shame. Slips = information.
- Content lives inside features, never standalone. Under 30 seconds per piece.
- Every feature must be stage-aware. Stage behaviour must be defined for all 6 stages.
- Cultural specifics matter: chai-sutta, tapri, hostel, INR, Indian college life.

**The 6 stages:**
- Stage 0: Learning Week (Days -7 to 0) — user still smoking, app learning patterns
- Stage 1: First 72 Hours (Days 1–3) — peak withdrawal, maximum support
- Stage 2: First Full Week (Days 4–7) — habitual triggers, pattern coaching
- Stage 3: Weeks 2–3 (Days 8–21) — psychological challenge, habit disruption
- Stage 4: Weeks 4–8 (Days 22–56) — stabilisation, complacency risk
- Stage 5: Months 3+ (Day 57+) — long-term maintenance

**Relapse rules (from foundations doc):**
- Setbacks reduce momentum but never erase progress
- Data, insights, and tool preferences always persist across restarts
- Restart resets the quit attempt timeline, not the relationship with the app
- Stage 1: 1–2 slips absorbed, user-initiated restart only
- Stage 2: 3+ slips → restart suggestion (2–3 day mini-prep → Stage 1)
- Stage 3: rolling_14d_slips >= 3 → restart suggestion
- Stage 4: rolling_14d_slips >= 3 → restart suggestion
- Stage 5: rolling_14d_slips >= 4 or sustained pattern → focused reset

**Voice styles (high-sensitivity copy only):**
- Steady & Direct: short, confident, no fluff
- Warm & Grounding: empathetic, acknowledges difficulty
- Light & Honest: touch of humour, self-aware

**Coping tool categories:** physical_reset | cognitive_reframe | distraction | social_coping | reflective

**User profiles:** Social/Occasional | Regular Light | Regular Moderate-Heavy

---

## The Checks

Run every check. Do not skip any. If a section is missing entirely, flag every check within it as a single blocking issue rather than listing them individually.

---

### STRUCTURE

1. Confirm the doc contains all 8 Part A sections in order: Problem & Purpose, Feature Overview, Design Decisions, Screen Inventory, Flow Logic, Stage Behaviour, Copy, Edge Cases. Flag any that are missing or merged together.

2. Confirm the doc contains all 4 Part B sections: Data Model (B1), Logic & Conditions (B2), Notification Logic (B3), API Surface (B4). Flag any that are missing, empty, or marked TBD.

3. Check the cover page. Confirm version number, date, author, status, and stage scope are all filled in. Flag any that are blank or placeholder text.

4. If the status says "Ready for Development," confirm that Part B is fully complete. If Part B has any TBD, empty sections, or prose-only descriptions where structured logic is needed, flag this as a blocking issue — a spec cannot be Ready for Development with an incomplete Part B.

---

### SECTION 1 — Problem & Purpose

5. Check the problem statement. It must be specific to the LastOne user — Indian college student, hostel life, social smoker. Flag if it reads as generic (could apply to any app or any user).

6. Check that at least one of the 5 foundations is explicitly named and correctly referenced. Flag if foundations are referenced vaguely or incorrectly (e.g. wrong stage numbers, wrong relapse thresholds).

7. Check the user story. It must include a real Indian name, a real setting from the user's life (hostel, tapri, canteen, chai spot, college campus), and walk through what the user actually does and feels. Flag if it uses generic language like "the user" or "the app" without grounding it in a real moment.

8. Check that success metrics are present and measurable. Flag any metric that is vague and cannot be observed or tested (e.g. "users feel supported" is not measurable; "user reaches a coping tool in under 2 taps" is).

---

### SECTION 2 — Feature Overview

9. Check the stage relevance table. It must cover all 6 stages (0 through 5). Flag any stage that is missing, blank, or marked "same as above" without being explicit about what that means.

10. Check the dependencies section. It must list what this feature reads from, writes to, requires from other features, and triggers. Flag if any of these four are missing. Flag if a dependency references a data object or feature that does not appear to exist in the LastOne system.

---

### SECTION 3 — Design Decisions

11. Count the design decisions. Flag if there are fewer than 4. A feature with fewer than 4 documented decisions has almost certainly not been thought through fully enough.

12. For each decision, check that it includes both what was chosen AND why the alternative was rejected. Flag any decision that only states what was chosen without rationale.

13. Check each decision against the foundations doc rules. Flag any decision that contradicts: stage definitions, relapse thresholds, coping layer logic, voice style rules, content delivery rules, or personalisation model.

---

### SECTION 4 — Screen Inventory

14. Check that every screen in the feature is listed. Cross-reference against the flow descriptions in Section 5 — if a screen is described in the flows but not in the inventory, flag it.

15. Check every screen has a unique ID in the format [PREFIX]-[NUMBER][OPTIONAL LETTER]. Examples of correct format: LOG-A1, GOAL-2, SOS-3b. Flag any screen missing an ID, using a non-standard format, or using a prefix that appears to duplicate another feature's prefix.

16. Check that screen descriptions are present for every screen — at minimum one sentence describing what the user sees and does. Flag any screen listed with only an ID and name and no description.

---

### SECTION 5 — Flow Logic

17. Check that every screen in the Section 4 inventory has a corresponding flow description in Section 5. Flag any screen in the inventory that has no flow description.

18. For every screen in the flows, check that every possible user action has a defined outcome. This includes: primary actions (taps, selections), secondary actions (back button, dismiss, swipe), and the skip/save action for optional fields. Flag any action without a defined outcome — these are dead ends in the build.

19. Check that every branch in the flows is fully resolved. Flag any branch that leads to a TBD, "to be decided," or an undefined screen.

20. Check that optional fields are explicitly marked optional and required fields are explicitly marked required throughout the flows. Flag any field where the required/optional status is ambiguous.

21. Check that screen IDs referenced within flow descriptions match the screen inventory exactly. Flag any ID used in a flow that does not appear in the inventory, or any inventory screen whose ID is never referenced in the flows.

22. Check that escape hatches are defined for every flow — what happens when the user taps back, dismisses mid-flow, or closes the app mid-flow. Flag any flow where these are not addressed.

---

### SECTION 6 — Stage Behaviour

23. Check that all 6 stages are covered with explicit behaviour descriptions. Flag any stage that is missing, blank, or uses vague language that doesn't tell a developer what to build.

24. Check that the stage behaviour is consistent with the foundations doc. Specifically: notification cadence per stage (Stage 1: 2–3/day, Stage 2: 1–2/day, Stage 3: 1/day or every other day, Stage 4: 2–3/week, Stage 5: 1/week or less). Flag any contradiction.

25. For any stage where the feature is described as hidden or inactive, check that the spec says what the user sees instead. Flag if a feature is just marked "hidden" with no explanation of the user experience.

---

### SECTION 7 — Copy

26. Check that every piece of user-facing text referenced in Section 5 (flows) appears in Section 7. This includes: screen titles, button labels, input placeholders, confirmation messages, error messages, and all the large moment copy (craving prompts, slip responses, milestone messages). Flag any text in the flows that has no corresponding entry in Section 7.

27. For every piece of high-sensitivity copy, check that all 3 voice variants are present: Steady & Direct, Warm & Grounding, Light & Honest. High-sensitivity copy is: anything shown during a craving, after a slip, at a milestone, in a notification, or in a guided micro-experience. Flag any high-sensitivity copy with fewer than 3 variants.

28. Check every piece of copy for shame language or negative framing. Flag any copy that: blames the user for slipping, uses language of failure or weakness, frames smoking negatively rather than non-smoking positively, or could make a user feel judged. This includes subtle framing — "you failed" and "this is hard" are both problems for different reasons.

29. Check that copy follows the gain-frame rule. Flag any copy that says "smoking causes X" rather than "by not smoking, you're gaining X." Flag any copy that leads with loss rather than gain.

30. Check that the Light & Honest voice style is not used for any copy involving charitable causes, donation prompts, or serious health information. Flag if it is.

---

### SECTION 8 — Edge Cases

31. Check that the following edge cases are addressed. Flag any that are missing:
- No data / first run state (what does the feature show before the user has any history)
- Mid-flow dismissal or back navigation (what is saved, what is lost, where does the user land)
- Wrong stage access (user reaches the feature before it should be active)
- Feature-specific limits (if the feature has a maximum — goals, group members, etc. — what happens when the limit is hit)
- Return after absence (if the feature tracks time or streaks, what happens when the user returns after days away)
- Connection loss (if the feature makes any network calls, what happens offline)

---

### PART B — DATA MODEL (B1)

32. Check that every object the feature creates is fully defined with all fields. For each object, every field must have: a name, a data type (string / number / boolean / timestamp / enum / list), and a required/optional marker. Flag any object with missing fields, missing types, or missing required/optional markers.

33. Check that every enum field lists all allowed values explicitly. Flag any enum field that uses vague descriptions instead of a closed list of values.

34. Check that every object the feature reads from (but doesn't own) is named. It doesn't need to be fully defined here if it's defined in another spec, but it must be referenced by name. Flag any object that is used in the flows but never named in B1.

35. Check object and field names for consistency with how they appear in the flows and in other sections. Flag any naming drift — the same concept referred to by different names in different parts of the doc.

---

### PART B — LOGIC & CONDITIONS (B2)

36. Check that every non-obvious rule implied by the flows is captured in B2. A rule is non-obvious if a developer could not derive it from reading the flows alone. Flag any rule that exists in the flows but has no corresponding logic definition in B2.

37. Check that every formula or scoring calculation is written out explicitly with all variables defined. This includes: tool_score calculation, savings calculation, dependence scoring, profile classification thresholds, notification timing logic. Flag any formula referenced in prose but not written out.

38. Check that any stage transition conditions in this feature match the foundations doc exactly. Flag any discrepancy in stage durations, entry conditions, or exit conditions.

39. Check that any relapse handling in this feature matches the foundations doc thresholds exactly. Flag any discrepancy.

---

### PART B — NOTIFICATION LOGIC (B3)

40. If the feature sends notifications: check that every notification has all four of these defined: trigger condition, message reference (pointing to Section 7 copy), timing rule, and whether it respects the user's notification preference setting. Flag any notification missing any of these four.

41. Check that notifications in Stages 1 and 2 reference the user's known risk windows from the Learning Week for timing. Flag if Stage 1–2 notifications use fixed times rather than personalised windows.

42. Check that the auto-reduce rule is acknowledged: if a user ignores 3 consecutive notifications, frequency reduces by one tier for 7 days. Flag if this rule is not referenced where notification logic is defined.

43. If the feature has no notifications, confirm this is explicitly stated. Flag if B3 is simply blank or missing rather than stating "no notifications in this feature."

---

### PART B — API SURFACE (B4)

44. Check that every data operation implied by the flows is listed in B4. For every object the feature creates, reads, updates, or deletes — there must be a corresponding operation. Flag any operation implied by the flows that has no entry in B4.

45. Check that object names in B4 match the object names in B1 exactly. Flag any naming mismatch.

46. If B4 is absent or empty, flag it as a blocking issue — the coder cannot wire up the data layer without knowing what operations are needed.

---

## Output Format

Produce your report in exactly this format. Do not add sections. Do not combine sections.

---

**SPEC REVIEWED:** [Feature name and version]

---

**BLOCKING ISSUES**
These must be fixed before this spec can be used to build. List each as:
> [Section] — [What is wrong] — [What is needed to fix it]

If there are no blocking issues, write: None found.

---

**FLAGGED FOR TEAM**
These are product or design decisions that are missing or ambiguous. The coder cannot resolve these alone — they need input from the product or design team. List each as:
> [Section] — [What is unclear or missing] — [What decision or content is needed]

If there are none, write: None found.

---

**MINOR FIXES**
These are structural or formatting issues the coder can fix directly without input from the team. List each as:
> [Section] — [What needs fixing]

If there are none, write: None found.

---

**SECTION SUMMARY**
For every section, one line confirming whether it passed or had issues:
> Structure — [Pass / Issues found]
> Section 1 — [Pass / Issues found]
> Section 2 — [Pass / Issues found]
> Section 3 — [Pass / Issues found]
> Section 4 — [Pass / Issues found]
> Section 5 — [Pass / Issues found]
> Section 6 — [Pass / Issues found]
> Section 7 — [Pass / Issues found]
> Section 8 — [Pass / Issues found]
> B1 Data Model — [Pass / Issues found]
> B2 Logic & Conditions — [Pass / Issues found]
> B3 Notification Logic — [Pass / Issues found]
> B4 API Surface — [Pass / Issues found]

---

**OVERALL STATUS**
One of three verdicts:
- **Ready for Development** — no blocking issues, no flagged items
- **Needs Team Input** — no blocking issues, but flagged items require product/design decisions before build
- **Not Ready** — blocking issues present, must be resolved before this spec can be built from

---

## Note on Cross-Doc Consistency

This prompt reviews a single spec in isolation. It does not check for inconsistencies across multiple specs — for example, whether object names match between the Logging spec and the Streak spec, or whether stage behaviour contradicts between two features. Cross-doc consistency should be run as a separate pass once all individual specs are clean. A separate prompt exists for that purpose.

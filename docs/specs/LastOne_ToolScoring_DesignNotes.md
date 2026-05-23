# LastOne — Coping Tool Scoring System
## Design Notes & Open Discussion
*Status: Parked — to be discussed at team meeting before any decisions are made.*
*Origin: Spec review session, Coping Tools Suite V1.0.1, May 2026*

---

## Why this discussion exists

The Coping Tools Suite V1.0.1 uses a simple scoring formula to personalise which tools surface in the SOS curated layer:

```
tool_score = successful_resistance_count - slip_after_use_count
```

This works but has known gaps. This document captures those gaps and a proposed path forward, so the team can decide how much to address before build and how much to defer to post-launch data.

---

## Known gaps in the V1 score

### 1. No context segmentation
`tool_score` is a single number. A tool that works for boredom cravings and fails for stress cravings accumulates a blended score that masks the difference. The system will surface that tool during a stress craving even if it has never helped in that situation.

### 2. No recency weighting
A tool that worked well in Stage 1 (acute withdrawal) and stopped working in Stage 3 carries all its Stage 1 positive scores forward. There is no decay. The score doesn't notice that the tool's effectiveness changed.

### 3. Stage weighting only applies to cold-start
The current SOS waterfall (Section 6.1) applies stage weighting only when the user has insufficient personal data. Once personal data exists, `tool_score` takes over entirely and ignores stage context. A user who scored push-ups highly in Stage 1 will keep getting push-ups surfaced in Stage 4-5, regardless of the stage de-prioritisation intent.

**Recommended fix:** Apply stage filtering as a pre-filter on the candidate pool before ranking by `tool_score`, not as a fallback only reached when personal data is absent.

### 4. SOS vs library uses are treated equally
A tool used 3 times during an active craving (SOS) is much stronger signal than a tool tried 3 times in the library during calm exploration. The current system treats both identically.

### 5. Signal quality problem
Cravings pass whether or not a tool is used. A positive outcome (+1) may reflect the tool working, or simply the craving fading on its own. The thumbs up/down feedback is coarse and partially confounded.

---

## Proposed approach: V1.5 scoring model

Not the full V1 simple score, and not a fully calibrated ML formula. A structured model that can be shipped with reasonable directional assumptions and then calibrated using real user data.

### The goal
The score should answer: *"given this user, this intensity, this context, and this stage — what tool is most likely to work right now?"*

Not: *"what tool has generally worked for this user?"*

### Structural decision (agreed)
**Option B — single score with context multipliers at selection time.**

Each tool keeps one aggregate `tool_score`. At selection time, tools whose `context_tags` match the current craving context receive a boost. This is faster to accumulate data than per-context scores and simpler to implement than Option A (fully segmented scores per context bucket).

Option A (context-segmented scores) is the more precise long-term direction but needs more data than a new user will generate quickly enough.

### Dimensions to include

| Dimension | What it captures | Include in V1.5? |
|---|---|---|
| Base effectiveness | Has this tool worked for this user overall | Yes — anchor |
| Context match | Does it work in this specific context (stress/boredom/social) | Yes — multiplier at selection |
| Intensity match | Does it work at this intensity level | TBD |
| Recency | Is it still working, or did it work months ago | TBD |
| Stage appropriateness | Is it right for the current stage | Yes — pre-filter, not score variable |

### Threshold decision (agreed)
Minimum **3 uses** before `tool_score` is weighted. Rationale: 3 uses gives enough signal, and user self-selection (gravitating toward tools that help) will naturally concentrate uses on effective tools — though this effect is stronger in the library than in SOS, where the app controls what's surfaced.

**Open question for team:** Should the threshold be the same for SOS uses and library uses? SOS uses carry stronger signal.

---

## Stage filtering — how it should work

Stage should not be a variable inside `tool_score`. It should be a **pre-filter and post-filter** around scoring:

1. **Pre-filter:** Restrict or de-prioritise the candidate pool by stage before scoring.
   - Stage 1–2: Full pool available. Physical reset weighted up.
   - Stage 3: Distraction and social coping weighted up.
   - Stage 4–5: Reflective and social coping weighted up. PHY-03 and PHY-04 de-prioritised (not removed).

2. **Score:** Rank within the filtered pool using `tool_score` + context multiplier.

3. **Post-filter:** Section 6.3 composition rules (never two tools from same sub-category, physical tool required at intensity 4–5, etc.).

PHY-03 (Push-ups) and PHY-04 (Squat Jumps) are not hard-capped out in Stage 4–5. If the user's personal `tool_score` keeps them highly ranked and the user personally finds them effective, they stay accessible. The stage pre-filter de-prioritises them as defaults, not as a hard block.

---

## Data collection requirements (critical)

If V1 does not log the right variables per tool use, V1 data cannot be used to calibrate this model later. These fields need to be captured at every tool use:

| Field | Why it's needed |
|---|---|
| `craving_intensity` at time of tool use | Enables intensity-match analysis |
| `craving_context` at time of tool use (stress/boredom/social/habitual) | Enables context-match calibration |
| `user_stage` at time of tool use | Enables stage-effectiveness analysis |
| `tool_surface` (SOS or library) | Enables SOS vs library signal separation |
| `post_tool_state` (better/same/worse/smoked) | More granular than binary thumbs up/down |
| `time_since_last_tool_use` | Enables recency analysis |

---

## Open questions for team meeting

1. **SOS vs library threshold:** Should tool uses in SOS (active craving) count more toward the threshold than library uses (calm exploration)?

2. **Recency decay:** Do we want old scores to decay over time? If yes, what's the half-life — days, weeks, stage boundaries?

3. **Intensity match:** Is intensity a meaningful enough variable to segment on, or is context sufficient?

4. **Context multiplier value:** What's the boost for a context match? This is the one number we have to pick before launch. Directional options: 1.5× (modest), 2× (meaningful), 3× (dominant).

5. **Stage 0 tool access:** Confirmed decision — library accessible, but when a Stage 0 user tries to use a tool, show a supportive message explaining the app is building their smoking profile and that unaffected baseline data is valuable. Still allow access if they choose to proceed (friction, not a hard block).

---

*Bring this to team meeting before any implementation decisions. The scoring formula directly affects what gets built in the data collection layer — that decision cannot wait until post-launch.*

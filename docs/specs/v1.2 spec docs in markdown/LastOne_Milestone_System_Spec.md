# LastOne Milestone System Spec v1.2

| Version | 1.2 |
| --- | --- |
| Date | June 2026 |
| Status | Ready for Development |
| Stage Scope | Stage 1 — Stage 5 (no unlocks possible in Stage 0) |
| Feature Prefix | MILE |
| Author | Vedant |
| Resolves | The "Milestone System" + "Reference Cards Content Doc" dependencies declared Out of Scope by the Progress Dashboard spec (ProgressDashboard_Spec §B6, Out of Scope). |

## Connected to
- [[LastOne]] — parent project
- [[LastOne_ProgressDashboard_Spec]] — the consumer; DASH-2 Section 2 reference cards read unlock state from this system
- [[LastOne_Content_Cards_V1]] — the milestone reference cards (CM-01–CM-08) live in the `content_cards` catalog under `trigger_type = 'cigarette_milestone'`
- [[LastOne_Content_Voice_Brief_V1_2]] — copy standards; milestone cards are high-sensitivity (voice variants)
- [[LastOne_Data_Schema_V1]] — canonical schema; this system owns no new tables (derived, per Schema A4 pattern)

---

## Purpose & Problem Statement

### Why

The Progress Dashboard's expanded view (DASH-2) shows a horizontal scroll of reference cards that flip from dimmed/locked to full-colour/unlocked as the user crosses thresholds. The dashboard spec deliberately does **not** own these thresholds or their content — it only reads which milestones have been crossed (ProgressDashboard_Spec §B6). That owner was never written. This spec is that owner.

### Problem

A counter that only ever ticks upward eventually stops surprising anyone. `1,247 cigarettes not smoked` is abstract once you've seen it a few times. The reference cards re-anchor the number in something physical and picture-able — a length, a weight, a landmark — so the count keeps landing emotionally across months of use. They also give the user something to reach for: a dimmed card just ahead is a target.

### Goal

Define (1) the milestone thresholds, (2) the unlock logic, (3) the reference-card content, and (4) the minimal data model — such that the Progress Dashboard can render the DASH-2 reference scroll with no further dependencies.

---

## Design decisions

> **DECISION: ALL MILESTONES ARE KEYED TO `cigarettes_not_smoked`.**
>
> Not money, not time. The Progress Dashboard spec ties every milestone unlock to `cigarettes_not_smoked` (ProgressDashboard_Spec §B6:463, §B8:505). The cigarette count is the spec's emotional anchor — "purely psychological. The number itself is the point" (§2.3). The reference cards translate that one count into physical scale, so they read coherently regardless of which counter the user tapped to open DASH-2.

> **DECISION: ONE SHARED CARD SET ACROSS ALL THREE COUNTER VIEWS.**
>
> Tapping Money Saved, Time Reclaimed, or Cigarettes Not Smoked all open DASH-2 with the same reference-card scroll, unlocked by the same `cigarettes_not_smoked` value. Rationale: the spec defines a single `milestone_threshold_list` / `unlocked_milestone_ids` (not per-counter lists), there is no time-reclaimed card set authored for V1, and the cards' framing ("1,000 cigarettes end to end is nearly a football pitch") is a fact about the count, not about money. A per-counter model — savings cards under Money, a time set under Time — is a clean V2 evolution once those sets exist. **Out of scope for V1.**

> **DECISION: DERIVED, NOT STORED — NO MILESTONE TABLE.**
>
> Mirrors the savings model (Schema A4: savings is derived, no `savings` table). There is no `milestone_system` table. Unlock state is computed on read by comparing the dashboard's `cigarettes_not_smoked` against a static threshold list. The phantom `milestone_system` table referenced in ProgressDashboard_Spec §B1/§B4/§B8 resolves *down* to this derived check.

> **DECISION: REFERENCE CARDS ARE A PERSISTENT GALLERY, NOT A FIRING EVENT.**
>
> Unlike `savings_milestone` cards (which fire once, inline on the home screen, when crossed — Content Cards §2.2), `cigarette_milestone` cards are read as a **complete set** and rendered as the DASH-2 scroll, every card always visible, with computed active/inactive state. The 14-day cooldown and least-recently-shown selection logic (Content Cards §3) do **not** apply to this trigger type. No card is ever hidden; locked cards are shown dimmed as targets.

> **DECISION: NO PUSH NOTIFICATIONS ON CIGARETTE MILESTONES IN V1.**
>
> Crossing a cigarette milestone updates the card's state silently on next dashboard recalculation (consistent with ProgressDashboard_Spec edge case :313 — offline-period milestones unlock retroactively, no notification). Push notifications for cigarette milestones are a possible future addition owned by the Notifications spec, not built here. (Time-based health milestones already fire pushes via N-CON-01–12; this is deliberately separate.)

---

## 1. Milestone Thresholds

Eight thresholds on `cigarettes_not_smoked`. Tuned so a typical 3–5/day smoker crosses the first within ~2 weeks (satisfying ProgressDashboard_Spec edge case :314 — "at minimum one card should always be within reach"), with the top threshold sitting far enough out to remain a Stage 5 aspiration.

| Milestone ID | Card ID | Threshold (`cigarettes_not_smoked` ≥) | Typical reach (5/day user) |
| --- | --- | --- | --- |
| MILE-01 | CM-01 | 50 | ~Day 10 |
| MILE-02 | CM-02 | 100 | ~Day 20 |
| MILE-03 | CM-03 | 250 | ~Week 7 |
| MILE-04 | CM-04 | 500 | ~Month 3 |
| MILE-05 | CM-05 | 1,000 | ~Month 6 |
| MILE-06 | CM-06 | 2,500 | ~Month 16 |
| MILE-07 | CM-07 | 5,000 | ~Month 33 |
| MILE-08 | CM-08 | 10,000 | Long-horizon (Stage 5 aspiration) |

> Reach estimates are illustrative for a 5/day smoker (`cigarettes_not_smoked ≈ 5 × smoke_free_days`). Heavier smokers reach each threshold proportionally faster; a 10/day user hits 50 in ~5 days, 10,000 in ~5.5 years. The thresholds are absolute counts, not stage-gated — stage falls out of the count naturally.

---

## 2. Unlock Logic

```
INPUT: cigarettes_not_smoked   (canonical, from ProgressDashboard_Spec §B2 — the one derived value)

THRESHOLDS = [50, 100, 250, 500, 1000, 2500, 5000, 10000]

For each milestone M:
  M.state = ACTIVE   if cigarettes_not_smoked >= M.threshold
  M.state = INACTIVE if cigarettes_not_smoked <  M.threshold

unlocked_milestone_ids = [ M.id for M where M.state == ACTIVE ]
milestone_threshold_list = full ordered list of (M.id, M.card_id, M.threshold)  // for rendering inactive cards
```

- **When it runs:** on every dashboard recalculation — i.e. the same triggers as the counters (ProgressDashboard_Spec §B5: midnight, slip log, return-modal, settings change, app foreground). No separate scheduler.
- **Idempotent:** unlock state is a pure function of the current `cigarettes_not_smoked`. There is no "fire once" event and nothing to de-duplicate. A milestone can therefore also move **back** to inactive if `cigarettes_not_smoked` drops below its threshold after a relapse deduction — this is correct and matches the dashboard's "the number reflects reality" principle (ProgressDashboard_Spec Design Decision, :131). See Edge Cases.
- **Stage 0:** `cigarettes_not_smoked = 0`, so all cards are inactive. The scroll still renders (all dimmed) as a preview of what's coming, consistent with the Stage 0 dashboard preview state.

---

## 3. Reference Card Content (CM-01 – CM-08)

Eight cards. **High-sensitivity** (Voice Brief §04 — milestones are high-sensitivity), so each carries voice variants. Per the V1 voice-scope decision, **two variants are authored**: Steady & Direct (`body_copy_steady`) and Emotional & Understanding (`body_copy_warm`). Real & Practical (`body_copy_practical`) is deferred to the project-wide R&P batch and falls back to `body_copy_steady` until authored (Content Cards §1.3).

**Format:** Expanded / Milestone Card — max 4 sentences, max 50 words per variant (Voice Brief §06). Tone: "Warm but not gushing. Marks the moment with weight. Doesn't perform excitement" (Voice Brief §03). The dashboard permits "slightly darker or more confrontational framing" here (ProgressDashboard_Spec :213) — the user tapped in deliberately. **Never clinical fear messaging** (ProgressDashboard_Spec Design Decision, :139): tar is framed as a physical quantity *never produced*, never as a threat inside the body.

**Figure basis (for auditability):** cigarette length ≈ 84 mm (standard king-size); tar ≈ 10 mg per cigarette (machine-measured average). Lengths/weights below are computed from these and rounded. Cricket pitch = 20.12 m; football pitch ≈ 100 m; Burj Khalifa = 828 m. These are physical-scale and cultural references, not health claims.

---

### CM-01 — 50 cigarettes

**Pill tag:** Milestone · 50
**Title:** Fifty you didn't smoke.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | Lined up end to end, that's about the length of a car. Fifty cigarettes that never got lit. Small number — but it's the first real marker. |
| `body_copy_warm` | Fifty. Doesn't sound like much until you line them up — about as long as a car, not one of them lit. That came from a lot of small moments you got through. Worth noticing. |

### CM-02 — 100 cigarettes

**Pill tag:** Milestone · 100
**Title:** One hundred.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | Stacked end to end, that's a two-storey building. A hundred cigarettes you walked past — and about a gram of tar that was never produced. |
| `body_copy_warm` | A hundred. End to end, taller than a two-storey building. None of it happened, and none of it was automatic. You chose past it, a hundred separate times. |

### CM-03 — 250 cigarettes

**Pill tag:** Milestone · 250
**Title:** Two hundred and fifty.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | End to end, that's longer than a cricket pitch. Twenty-two yards of cigarettes you didn't smoke. The number's starting to carry weight now. |
| `body_copy_warm` | Two-fifty. Stretched out, that's a full cricket pitch, end to end. You've been at this long enough that the count surprises even you. Sit with that for a second. |

### CM-04 — 500 cigarettes

**Pill tag:** Milestone · 500
**Title:** Five hundred.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | End to end, taller than a 13-floor building. About five grams of tar that was never produced. Half a thousand — that's not nothing. |
| `body_copy_warm` | Five hundred cigarettes. None lit, none inhaled. Stacked up, they'd clear a 13-storey building. This one took patience, and the patience is the part worth acknowledging. |

### CM-05 — 1,000 cigarettes

**Pill tag:** Milestone · 1,000
**Title:** One thousand.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | Laid end to end, nearly the length of a football pitch. A thousand cigarettes, about ten grams of tar, none of it real. Four digits now. |
| `body_copy_warm` | A thousand. Picture a football pitch — that's how far they'd stretch, end to end. You didn't get here in a week. A thousand is the kind of number you earn slowly. |

### CM-06 — 2,500 cigarettes

**Pill tag:** Milestone · 2,500
**Title:** Two thousand five hundred.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | Two football pitches, end to end. About twenty-five grams of tar that never existed. For a lot of people that's a year of smoking — and you're on the other side of it. |
| `body_copy_warm` | Twenty-five hundred. Two full football pitches of cigarettes you didn't smoke. For many people that's a whole year of it. You turned it into nothing. Quietly huge. |

### CM-07 — 5,000 cigarettes

**Pill tag:** Milestone · 5,000
**Title:** Five thousand.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | End to end, longer than four football pitches. About fifty grams of tar that was never produced. Five thousand — that's a habit you've genuinely left behind. |
| `body_copy_warm` | Five thousand. Four football pitches, laid end to end. Numbers this size don't come from one hard day of willpower — they come from showing up, again and again. That's what this is. |

### CM-08 — 10,000 cigarettes

**Pill tag:** Milestone · 10,000
**Title:** Ten thousand.

| Variant | Copy |
| --- | --- |
| `body_copy_steady` | Stacked end to end, taller than the Burj Khalifa. Ten thousand cigarettes, roughly a full cup of tar, none of it real. Almost no one reaches this. |
| `body_copy_warm` | Ten thousand. End to end, they'd stand taller than the Burj Khalifa. There isn't really a bigger way to say it — this is a different life than the one you started with. You built that. |

---

## 4. Data Model

No new tables. The cards are rows in the existing `content_cards` catalog (Content Cards §1.1); unlock state is derived at read time.

### 4.1 Storage — `content_cards`

The eight cards are seeded with:

| Column | Value |
| --- | --- |
| `card_id` | `CM-01` … `CM-08` |
| `pill_tag` | `Milestone · [threshold]` |
| `title` | per §3 |
| `body_copy` | null (high-sensitivity → uses variant columns) |
| `body_copy_steady` | per §3 |
| `body_copy_warm` | per §3 |
| `body_copy_practical` | null (deferred; falls back to `body_copy_steady`) |
| `trigger_type` | `cigarette_milestone` *(new enum value — see Content Cards §2)* |
| `trigger_value` | the integer threshold as text: `50`, `100`, … `10000` |
| `sensitivity` | `high` |
| `stage_min` / `stage_max` | `null` / `null` (all stages; unlock gated by count, not stage) |
| `active` | `true` |

### 4.2 What the Progress Dashboard reads

Resolves the read described in ProgressDashboard_Spec §B6 / §B8 / §B1 (the `milestone_system` source):

| Dashboard field (per ProgressDashboard_Spec) | Resolved source |
| --- | --- |
| `unlocked_milestone_ids` | derived — `CM-NN` where `trigger_value <= cigarettes_not_smoked` |
| `milestone_threshold_list` | `SELECT card_id, title, pill_tag, trigger_value FROM content_cards WHERE trigger_type='cigarette_milestone' AND active ORDER BY trigger_value` |

No `user_card_history` row is written for `cigarette_milestone` cards — state is purely derived, so there is nothing to record. (`user_card_history` is still used by the inline `savings_milestone` cards, which are unaffected by this spec.)

### 4.3 Read query

```sql
-- All milestone cards for the DASH-2 reference scroll (the full set, always)
select card_id, pill_tag, title,
       coalesce(body_copy_steady, body_copy) as steady,
       body_copy_warm,
       trigger_value::int as threshold
from content_cards
where trigger_type = 'cigarette_milestone' and active
order by threshold;
-- active/inactive computed client-side: threshold <= cigarettes_not_smoked
-- voice variant chosen client-side from profiles.voice_style (Content Cards §1.3)
```

---

## 5. Edge Cases

| Scenario | Behaviour |
| --- | --- |
| Stage 0 / Day 0 (`cigarettes_not_smoked = 0`) | All eight cards inactive (dimmed). Scroll renders as a preview. Consistent with the Stage 0 dashboard preview state. |
| User crosses a threshold while app is offline | State recomputes on next foreground/recalc (ProgressDashboard_Spec §B5). Card appears active retroactively. No notification (per Design Decision above). |
| Relapse deduction drops `cigarettes_not_smoked` back below a threshold | The card returns to inactive. This is correct — it mirrors the counters going down (ProgressDashboard_Spec :131). Because state is derived, this needs no special handling; it just recomputes. No "lost milestone" alert. |
| User is between two thresholds, far from the next | At least one inactive card is always visible ahead as a target; the lowest threshold (50) is reachable within ~2 weeks for typical users (threshold tuning, §1). |
| All eight crossed (long-term Stage 5 user) | All cards active/full-colour. Scroll is a full gallery of crossed milestones. No "completion" state needed beyond every card being active. |
| `cigarettes_per_day` or `price` not set (onboarding incomplete) | `cigarettes_not_smoked` is undefined → the dashboard shows its own `—` prompt (ProgressDashboard_Spec §8); the reference scroll renders all-inactive until the counter is live. |
| Tap an inactive card | `Keep going — you'll unlock this one.` (ProgressDashboard_Spec §7 copy; owned there, not here.) |

---

## 6. Build Notes (for the Architecture Guide / Step 12)

This system is implemented entirely inside the existing Step 12 (Progress Dashboard) — there is no separate build step.

1. **Seed** the eight `CM-NN` rows into `content_cards` (alongside the Content Cards seed in Step 14, or in the Step 12 dashboard work — either is fine; they're catalog rows).
2. **Add** `cigarette_milestone` to the `content_cards.trigger_type` accepted values (Architecture Guide §Step-7 SQL comment + Content Cards §2 table).
3. **DASH-2 reference scroll** reads the query in §4.3 and computes active/inactive against the canonical `cigarettes_not_smoked` (already in scope for Step 12).
4. **Fix the existing Step 12 bug:** the guide currently wires the reference cards to `trigger_type='savings_milestone'` and compares a rupee threshold to a cigarette count (Architecture_Guide:2837–2839). Both are wrong — point at `cigarette_milestone` and compare the integer threshold to `cigarettes_not_smoked` (same unit). The `savings_milestone` cards remain a separate, inline home-screen surface (Content Cards §2.2) and are not shown in the DASH-2 scroll.

---

## Out of Scope

- **Per-counter reference card sets** — savings cards under the Money view, a time-reclaimed set under the Time view. V2 evolution; requires a time-reclaimed card set that does not exist yet. V1 uses one shared cigarette-count set across all three views.
- **Push notifications for cigarette milestones** — silent state change only in V1. Any future push is owned by the Notifications spec.
- **Health Timeline milestones** — time-based body-recovery milestones (20 min → 15 years) are a separate system: cards YB-01–YB-14 (Content Cards), the STK-8 timeline, the Home Screen Health Milestones card (Section G), and notifications N-CON-01–12. **Not part of this spec.** This spec is counter-based (cigarettes), not elapsed-time-based.
- **Real & Practical voice variants** — deferred to the project-wide R&P authoring batch; falls back to Steady & Direct (Content Cards §1.3).

---

## Version History

| Version | Date | Summary |
| --- | --- | --- |
| 1.2 | June 2026 | Initial spec. Resolves the Milestone System + Reference Cards Content dependencies declared Out of Scope by the Progress Dashboard spec. 8 cigarette-count thresholds (50–10,000), 8 reference cards (CM-01–CM-08) at 2 voice variants each, derived unlock model (no new table), one shared set across all DASH-2 counter views. |

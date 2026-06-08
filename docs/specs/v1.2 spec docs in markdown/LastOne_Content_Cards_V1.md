# LastOne — Content Cards V1

> Full database of in-app content cards across all four categories.
> **Version 1.2 · Internal — Content & Product**
> Source: `LastOne_Content_Cards_V1.xlsx`
> Voice & tone rules: [[LastOne_Content_Voice_Brief_V1]]

## Connected to
- [[LastOne]] — parent project
- [[LastOne_Product_Foundations_V1]] — Stage System (stage filtering), voice_style field on user profile
- [[LastOne_Logging_System_Spec]] — craving_logged and slip_logged triggers fire from Flow A and Flow C
- [[LastOne_Content_Voice_Brief_V1]] — copy standards and voice variant rules

---

## Version History

| Version | Date | Summary |
|---|---|---|
| V1.0 | April 2026 | Content database created. 63 cards across 4 categories. |
| V1.2 | May 2026 | Part B added: data model, trigger architecture, card selection logic, edge cases. |
| V1.2.1 | May 2026 | YB-11 (1yr) and YB-12 (5yr) retagged `scheduled / any` → `time_milestone / 1year`, `5year` so they fire as anniversary push notifications (N-CON-11/12 in [[LastOne_Notifications_Spec_V1_2]]). YB-13 (10yr) and YB-14 (15yr) remain carousel-only `scheduled` cards. |

---

## Schema

| Field | Description |
|---|---|
| **Card ID** | Unique identifier (e.g. MB-01, YB-03) |
| **Pill Tag** | Display label shown on card |
| **Title** | Card headline (displayed prominently) |
| **Body Copy** | Card body text |
| **Trigger Type** | `scheduled`, `contextual`, `time_milestone`, `craving_logged`, `slip_logged`, `savings_milestone`, `stage_change` |
| **Trigger Value** | Specific trigger condition (e.g. `chai`, `20min`, `500`, `any`) |
| **Sensitivity** | `low` or `high` — high = requires all 3 voice variants |
| **Stage Range** | Which app stages this card is active in (0–5) |
| **Notes** | Source references, context, intent |

---

## Myth Buster (18 cards)

| Card ID | Title | Body Copy | Trigger | Sensitivity | Stage | Notes |
|---|---|---|---|---|---|---|
| MB-01 | The cigarette doesn't calm you down. | It ends the withdrawal that was making you anxious. Smoking causes the stress it appears to fix. | scheduled / any | low | 0–2 | Stress myth. Allen Carr core reframe. |
| MB-02 | That focus boost isn't real. | Nicotine withdrawal kills your concentration. The cigarette just restores what smoking took away. | scheduled / any | low | 0–2 | Exam focus myth. India specific. |
| MB-03 | "Whenever" keeps getting postponed. | That's not a choice anymore. That's what addiction feels like from the inside. | scheduled / any | low | 0–3 | Denial of addiction myth. |
| MB-04 | The filter isn't protecting you. | It makes smoke smoother, so you inhale deeper. That's not safety. That's just better delivery. | scheduled / any | low | all | Filter safety myth. Nichter et al. |
| MB-05 | Every social moment. Every single one. | If you smoke every time you're with people, that's not occasional. That's a pattern. | contextual / social | low | 0–3 | Social smoker denial myth. |
| MB-06 | Your body is chasing a moving number. | Nicotine temporarily raises your metabolism, then drops it every time you stop. It's not managing your weight. It's disrupting it. | scheduled / any | low | all | Weight control myth. |
| MB-07 | "Light" is a marketing word, not a health one. | Light cigarettes deliver less nicotine per puff, so you take more puffs. The tobacco industry already knew this. | scheduled / any | low | all | Light cigarette myth. Nichter et al. |
| MB-08 | One cigarette usually doesn't reset you. | But the craving after it is three times stronger. That's the part worth knowing. | slip_logged / any | high | all | Post-slip context. Reassuring but honest. |
| MB-09 | This was decided for you a long time ago. | The tobacco industry spent decades funding research to prove nicotine wasn't addictive. They lost. Badly. | scheduled / any | low | all | Industry deception. Empowering frame. |
| MB-10 | Life doesn't get less stressful. Seriously. | But your ability to handle it without a cigarette gets stronger, starting within weeks of quitting. | scheduled / any | low | 0–3 | Timing myth. Waiting for calm moment. |
| MB-11 | Cutting down keeps the trap alive. | Addiction wants more, not less. Every cigarette you allow just makes the next craving harder to ignore. | scheduled / any | low | 0–2 | Cutting down myth. Allen Carr. |
| MB-12 | That restlessness isn't boredom. | Nicotine withdrawal feels exactly like restlessness. The cigarette relieves what smoking caused, not what your afternoon caused. | contextual / boredom | low | 0–2 | Boredom trigger myth. |
| MB-13 | Nobody enjoys their first cigarette. | They taste awful. You learned to need them. That's a different thing entirely. | scheduled / any | low | all | Enjoyment myth. Allen Carr core. |
| MB-14 | Quitting doesn't make you gain weight. | Using food to replace the craving does. The hunger and the craving feel similar. They're not the same thing. | scheduled / any | low | all | Weight gain post-quitting myth. |
| MB-15 | That relaxed feeling at a party isn't real. | It's the relief of ending withdrawal that started when your last cigarette wore off. You're just back to baseline. | contextual / social | low | 0–3 | Social relaxation myth. |
| MB-16 | A cigarette isn't a personality trait. | The industry spent decades making it look like one. That was the product. Not the tobacco. | scheduled / any | low | 0–3 | Identity myth. Nichter Karnataka study. |
| MB-17 | The cool smoker was always fictional. | Cigarette companies paid Bollywood and Hollywood for decades to put cigarettes in the hands of heroes. You inherited their marketing. | scheduled / any | low | 0–2 | Media and cool image myth. India specific. |
| MB-18 | A pricier cigarette isn't a safer one. | The tobacco inside costs the same to your lungs regardless of what the brand charges for it. | scheduled / any | low | all | Premium cigarette safety myth. Nichter et al. |

---

## Your Body (15 cards)

| Card ID | Title | Body Copy | Trigger | Sensitivity | Stage | Notes |
|---|---|---|---|---|---|---|
| YB-01 | Twenty minutes since your last one. | Your heart rate has already dropped. Blood pressure is coming down right now. | time_milestone / 20min | high | all | WHO timeline. First card after quitting. |
| YB-02 | Eight hours. Carbon monoxide is leaving. | The CO displacing oxygen in your blood is clearing out. Your haemoglobin is starting to work properly again. | time_milestone / 8hr | high | all | WHO timeline. CO clearance. |
| YB-03 | Twelve hours in. Blood is cleaner. | Carbon monoxide levels are back to normal. Your blood is carrying oxygen the way it's supposed to. | time_milestone / 12hr | high | all | WHO timeline. Blood oxygen normalisation. |
| YB-04 | Twenty-four hours. Heart attack risk drops. | One smoke-free day and your cardiovascular system is already responding. The risk of a cardiac event has measurably decreased. | time_milestone / 24hr | high | all | WHO timeline. Cardiovascular gain. |
| YB-05 | Forty-eight hours. Nicotine is fully gone. | It's completely out of your body now. Your sense of smell and taste are beginning to come back. | time_milestone / 48hr | high | all | WHO timeline. Nicotine clearance. Sensory recovery. |
| YB-06 | Seventy-two hours. Breathing gets easier. | Your bronchial tubes are relaxing and lung capacity is increasing. You may already notice it on a flight of stairs. | time_milestone / 72hr | high | all | WHO timeline. Bronchial relaxation. |
| YB-07 | One week. The hardest part is done. | Peak withdrawal is behind you. Your brain's nicotine receptors are returning to their normal count. | time_milestone / 1week | high | all | Allen Carr 5-day marker. Receptor normalisation. |
| YB-08 | Two weeks. Circulation is improving. | Blood is reaching your hands and feet more effectively. Lung function has already measurably improved since day one. | time_milestone / 2weeks | high | all | WHO timeline. Circulation and lung function. |
| YB-09 | One month. Lungs are clearing out. | The cilia in your airways are recovering. They're moving debris out again, something they couldn't do properly before. | time_milestone / 1month | high | all | WHO timeline. Cilia recovery. |
| YB-10 | Three months. Lungs are significantly stronger. | Lung function keeps climbing. Coughing and breathlessness are a fraction of what they were on day one. | time_milestone / 3months | high | all | WHO timeline. End of primary recovery window. |
| YB-11 | A year without smoking. | Your risk of coronary heart disease is now half that of a smoker's. One year did that. | time_milestone / 1year | low | 4–5 | Long-term gain. WHO 1-year milestone. Fires anniversary push N-CON-11. |
| YB-12 | Five years smoke-free. | Stroke risk drops to almost the same as someone who never smoked. The body is that good at recovering. | time_milestone / 5year | low | 4–5 | Long-term gain. WHO 5-year milestone. Fires anniversary push N-CON-12. |
| YB-13 | Ten years smoke-free. | Your risk of dying from lung cancer is now roughly half a smoker's. A decade of repair, showing up. | scheduled / any | low | 4–5 | Long-term gain. WHO 10-year milestone. |
| YB-14 | Fifteen years smoke-free. | Coronary heart disease risk resets to the same as a lifelong non-smoker. The body gets all the way back. | scheduled / any | low | 4–5 | Long-term gain. WHO 15-year milestone. |
| YB-15 | Your body never stops recovering. | Every month without a cigarette, something improves. There is no point at which the repair stops. | scheduled / any | low | all | Evergreen carousel card. No specific milestone. |

---

## Practical Tips (20 cards)

| Card ID | Title | Body Copy | Trigger | Sensitivity | Stage | Notes |
|---|---|---|---|---|---|---|
| PT-01 | Chai doesn't need a sutta. | Try changing where you sit at the tapri. Same chai, different spot — the cue breaks faster than you'd think. | contextual / post_chai | low | 0–2 | Chai-sutta ritual disruption. Habit reversal BCT 8.4. |
| PT-02 | The walk to the tapri is the trigger. | Not the chai. Next time, take a different route and see if the craving arrives at the same intensity. | contextual / post_chai | low | 0–2 | Cue disruption. Environmental trigger. |
| PT-03 | Replace the ritual, not just the cigarette. | The tapri break is about stepping away and exhaling. You can do that without anything in your hand. | contextual / post_chai | low | 0–3 | Behaviour substitution BCT 8.2. |
| PT-04 | Cravings peak at three minutes. | You don't need to kill it. You just need to outlast it. Most cravings are gone before five minutes. | craving_logged / any | high | 0–3 | Craving duration psychoeducation. |
| PT-05 | Cold water works faster than you expect. | Drink a full glass slowly when a craving hits. It interrupts the pattern without needing any willpower. | craving_logged / any | high | 0–3 | Physical craving interruption technique. |
| PT-06 | Your hands want something to do. | Keep something nearby — a pen, a coin, anything. The hands-busy fix is simple and it actually works. | craving_logged / any | low | 0–2 | Hands substitution. Behavioural technique. |
| PT-07 | Change the scene, change the craving. | If you're in the place where you usually smoke, move. A different room or a short walk changes the signal. | craving_logged / any | high | 0–3 | Environmental cue disruption. Smart-T2 RCT backed. |
| PT-08 | Stress before an exam is real. | But the cigarette isn't solving it — it's ending withdrawal that started an hour ago. A five-minute walk does more. | contextual / stress | low | 0–3 | Exam stress trigger. India specific. |
| PT-09 | Deep breathing isn't just a wellness thing. | Six slow breaths activates your parasympathetic nervous system. That's the part that actually calms you down. | craving_logged / any | low | all | Physiological craving management. Evidence-based. |
| PT-10 | Postpone the craving by ten minutes. | Tell yourself you'll smoke in ten minutes if you still want to. Most of the time, the ten minutes is enough. | craving_logged / any | high | 0–3 | Delay technique. Highly effective in cessation literature. |
| PT-11 | You can still go on the smoke break. | Standing outside with your friends without smoking is completely possible. Nobody actually checks. | contextual / social | low | 0–3 | Social trigger management. Peer pressure context. |
| PT-12 | Have one honest conversation about it. | Telling one friend you're quitting makes you measurably more likely to succeed. You don't need to tell everyone. | scheduled / any | low | 0–1 | Social support activation. BCT 3.2. |
| PT-13 | Boredom and craving feel identical. | Next time you reach for one, check if you're actually craving or just have nothing to do for three minutes. | contextual / boredom | low | 0–2 | Boredom vs withdrawal distinction. |
| PT-14 | The corridor is a trigger, not a necessity. | If hostel nights are when you smoke most, identify the specific moment. That's where the habit actually lives. | scheduled / any | low | 0–2 | Hostel context. India specific. |
| PT-15 | Late night cravings are the weakest ones. | Your nicotine levels are low and your willpower is tired but cravings at this hour pass faster than any other. | scheduled / any | low | 0–2 | Night-time craving context. Reassuring frame. |
| PT-16 | The post-meal cigarette is pure conditioning. | Your body doesn't need it after eating. Your brain just learned to expect it. Break the sequence once and it loosens. | contextual / post_meal | low | 0–3 | Post-meal trigger. Behavioural conditioning explanation. |
| PT-17 | Get up from the table immediately after eating. | Walk somewhere, rinse your mouth, do anything that interrupts the usual post-meal sequence before the craving forms. | contextual / post_meal | low | 0–3 | Post-meal habit interruption. Specific and actionable. |
| PT-18 | Pick one trigger to work on first. | Not all of them. Just one. Chai, post-lecture, after meals — pick the smallest one and start there. | scheduled / any | low | 0–1 | Early stage advice. Implementation intention BCT 1.4. |
| PT-19 | Track which situations are hardest for you. | After a week you'll see a pattern. Knowing your two or three highest-risk moments is more useful than general willpower. | stage_change / stage_1 | low | 1–2 | Self-monitoring BCT 2.3. Week one insight. |
| PT-20 | Tell your body what's coming. | Before entering a high-risk situation, say it out loud: I'm going to want one in there. I'm not going to have it. | scheduled / any | low | 0–3 | Implementation intention. Gollwitzer 1999. Strong effect size. |

---

## Small Wins (10 cards)

| Card ID | Title | Body Copy | Trigger | Sensitivity | Stage | Notes |
|---|---|---|---|---|---|---|
| SW-01 | First hundred. That's a... | ...chaat plate and a chai on the cigarettes you didn't buy. Small, but it's real money back in your hands. | savings_milestone / ₹100 | high | all | First savings trigger. Warm, low-key celebration. |
| SW-02 | Two hundred. Sounds like... | ...a decent dessert or a small Swiggy order waiting to happen. That one's yours, genuinely earned. | savings_milestone / ₹200 | high | all | Second savings milestone. |
| SW-03 | Three hundred. Treat yourself to... | ...a good burger or a pizza, just for you. You got here without trying to be perfect. That counts. | savings_milestone / ₹300 | high | all | Third savings milestone. |
| SW-04 | Five hundred. That's a... | ...proper meal or a movie ticket, sitting right there. Half a thousand rupees that almost went up in smoke. | savings_milestone / ₹500 | high | all | Half-thousand marker. |
| SW-05 | Seven-fifty. Pick a... | ...JioCinema or Hotstar subscription, covered for the month. A whole month of something good, from something you let go of. | savings_milestone / ₹750 | high | all | OTT subscription equivalent. India specific. |
| SW-06 | One thousand. Take someone for... | ...a good meal, on the cigarettes you didn't smoke. Four digits. That's not nothing, that's genuinely something. | savings_milestone / ₹1000 | high | all | Four-digit milestone. Meaningful marker. |
| SW-07 | Fifteen hundred. Date night... | ...sorted, without touching your actual budget. This one took patience. Worth acknowledging that. | savings_milestone / ₹1500 | high | all | Social milestone. Celebratory but grounded. |
| SW-08 | Two thousand. Spend it on... | ...a month of ChatGPT Plus or a full stretch of canteen lunches. Two thousand rupees back. That's a real number now. | savings_milestone / ₹2000 | high | all | Software/food equivalent. Note: ChatGPT ref may date. |
| SW-09 | Three thousand. Plan a... | ...trip, bus, stay, food, the whole thing. This didn't happen overnight. That's worth sitting with for a moment. | savings_milestone / ₹3000 | high | all | Trip equivalent. Significant milestone. |
| SW-10 | Five thousand. That's a... | ...flight somewhere or a full road trip with friends. Five thousand rupees. You did that. Seriously. | savings_milestone / ₹5000 | high | all | Largest milestone. Most celebratory card in set. |

---

## Card Counts

| Category | Cards | High Sensitivity | Low Sensitivity |
|---|---|---|---|
| Myth Buster | 18 | 1 (MB-08) | 17 |
| Your Body | 15 | 10 (YB-01–10) | 5 |
| Practical Tips | 20 | 5 (PT-04,05,07,10 + 1) | 15 |
| Small Wins | 10 | 10 (all) | 0 |
| **Total** | **63** | **26** | **37** |

---

# Part B — System Logic

## Section 1: Data Model

### 1.1 `content_cards` table (Supabase)

Seeded once from the V1 database. Not user-generated — admin-managed.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `card_id` | text | Unique string e.g. `MB-01`, `YB-03` |
| `pill_tag` | text | Display label |
| `title` | text | Card headline |
| `body_copy` | text | Used for low-sensitivity cards (single copy) |
| `body_copy_steady` | text | High-sensitivity only — Steady & Direct variant |
| `body_copy_warm` | text | High-sensitivity only — Emotional & Understanding variant |
| `body_copy_practical` | text | High-sensitivity only — Real & Practical variant |
| `trigger_type` | enum | See Section 2 |
| `trigger_value` | text | Specific condition or `any` |
| `sensitivity` | enum | `low` or `high` |
| `stage_min` | int | Minimum stage (0–5). `null` = all stages. |
| `stage_max` | int | Maximum stage (0–5). `null` = all stages. |
| `active` | boolean | Allows cards to be disabled without deletion |

> `stage_range: all` in the content database maps to `stage_min: null, stage_max: null` in Supabase.

### 1.2 `user_card_history` table (Supabase)

Tracks which cards each user has seen and when.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `profiles.id` |
| `card_id` | text | FK → `content_cards.card_id` |
| `last_shown_at` | timestamptz | Used for 14-day cooldown check |
| `show_count` | int | Total times shown to this user |

### 1.3 Voice preference

Stored on the existing `profiles` table as `voice_style`, canonical enum `steady_and_direct | emotional_and_understanding | real_and_practical` (Schema A5 / T-E). Set during onboarding. The high-sensitivity card columns map to the enum as: `body_copy_steady` → `steady_and_direct`, `body_copy_warm` → `emotional_and_understanding`, `body_copy_practical` → `real_and_practical`. Voice rules in [[LastOne_Content_Voice_Brief_V1_2]].

> V1 note: onboarding exposes only the first two voices in its picker; `real_and_practical` copy is not yet authored (deferred). For high-sensitivity cards, a user on `real_and_practical` falls back to the `steady_and_direct` column until that copy exists.

---

## Section 2: Trigger Architecture

Each trigger type maps to a specific app event. The card engine listens for these events and queries eligible cards when they fire.

| Trigger Type | What Fires It | Where Card Appears |
|---|---|---|
| `scheduled` | App open, once per day (if not already refreshed) | Home screen carousel |
| `contextual` | Trigger chip selected during craving log (Flow A, Screen A2) | Inline card after log is saved |
| `time_milestone` | Background function comparing `now()` to `quit_date` | Push notification + card on next app open |
| `craving_logged` | Any craving log saved (Flow A completion) | Inline card on log confirmation screen |
| `slip_logged` | Slip log saved (Flow C completion) | Inline card on log confirmation screen |
| `savings_milestone` | Cumulative savings crosses a threshold | Inline card on home screen |
| `stage_change` | User transitions to a new stage | Card surfaced on first home screen open in new stage |

### 2.1 Contextual trigger matching

The `trigger_value` on contextual cards maps directly to the canonical trigger chips available in Flow A (Screen A2). All surfaces share one trigger vocabulary (N4) — `trigger_value` matches the chip token exactly, no aliasing.

| Chip selected in log | `trigger_value` matched |
|---|---|
| Chai / tapri | `post_chai` |
| Social / with friends | `social` |
| Boredom | `boredom` |
| Stress | `stress` |
| After meals | `post_meal` |
| Anxiety | `anxiety` |
| Celebration | `celebration` |
| Focus | `focus` |

> Canonical trigger vocabulary (N4), exact tokens, no aliases: `stress | boredom | social | habit | post_meal | post_chai | anxiety | celebration | focus | other`. `post_chai` replaces the old `chai`; `post_meal` replaces the old `after_meal`. The Insights `top_trigger` ↔ Content Cards contextual-match join depends on exact string equality, so these must not drift.

If multiple trigger chips are selected in a single log, the engine picks one contextual card (highest priority: most specific match, then least-recently-shown).

### 2.2 Savings milestone calculation

`savings_milestone` cards fire off the **one canonical savings number** owned by the Progress Dashboard (derived, per Schema A4 / T-D). Content Cards does **not** compute its own savings — it reads the Progress Dashboard's `money_saved` value and checks it against the thresholds below. The old Content-Cards formula (`daily_baseline` = observed Stage 0 average) is **retired** (M2/M3): the baseline is the self-reported `profiles.cigarettes_per_day`, and the cigarettes-not-smoked formula lives only in the Progress Dashboard spec.

```
money_saved        = (read from Progress Dashboard — canonical derived value)
on update:           if money_saved crosses a threshold not yet recorded → fire that card
```

- Baseline: `profiles.cigarettes_per_day` (self-reported, confirmed by the D-1 nudge at Stage 0→1). Not the observed Stage 0 average.
- `price_per_cigarette` — stored on `profiles`, set during onboarding.
- Milestone thresholds: ₹100, ₹200, ₹300, ₹500, ₹750, ₹1000, ₹1500, ₹2000, ₹3000, ₹5000
- Each threshold fires once. Record crossed milestones per user to prevent re-firing.

---

## Section 3: Card Selection Logic

When a trigger fires, the engine runs the following steps in order:

**Step 1 — Filter by trigger**
Query `content_cards` where `trigger_type` matches and `trigger_value` matches the event (or `trigger_value = 'any'`).

**Step 2 — Filter by stage**
Retain only cards where user's current stage falls within `[stage_min, stage_max]`. Cards with `null` values pass for all stages.

**Step 3 — Filter by cooldown**
Exclude cards where `user_card_history.last_shown_at` is within the last 14 days for this user.

**Step 4 — Select card**
From remaining eligible cards, select the least-recently-shown (oldest `last_shown_at`, or never shown). If multiple cards tie, select randomly.

**Step 5 — Resolve body copy**
- If `sensitivity = low` → use `body_copy`
- If `sensitivity = high` → use the voice column mapped from `voice_style` (1.3): `steady_and_direct`→`body_copy_steady`, `emotional_and_understanding`→`body_copy_warm`, `real_and_practical`→`body_copy_practical` (falls back to `body_copy_steady` until R&P copy exists)

**Step 6 — Record impression**
Insert or update `user_card_history` with `last_shown_at = now()` and increment `show_count`.

### 3.1 Carousel population (scheduled cards)

The home screen carousel is populated once per day on first app open.

- Pull 3–5 eligible `scheduled` cards using the selection logic above
- Cap per category: max 2 cards from any single category per carousel refresh (prevents showing 3 Myth Busters in a row)
- If fewer than 3 eligible cards exist after cooldown filtering, relax the cooldown to 7 days and retry
- Cards stay in the carousel until the next daily refresh — they do not disappear when scrolled past

---

## Section 4: Edge Cases

| Scenario | Behaviour |
|---|---|
| No eligible card for a trigger (all in cooldown, none match stage) | Silently skip — no card shown. Do not show an empty card state. |
| All cards in a category exhausted within cooldown | Show least-recently-shown card from that category, regardless of cooldown. |
| Stage 0 user receives a `time_milestone` trigger | Suppress — time milestones require an active quit. `time_milestone` cards are not shown in Stage 0. |
| User has no `voice_style` set (onboarding incomplete) | Default to `steady_and_direct` (→ `body_copy_steady`). |
| `price_per_cigarette` not set | Suppress all `savings_milestone` triggers until set. |
| User restarts (new quit attempt) | `user_card_history` is retained. Cooldown clock continues from original `last_shown_at` — cards seen in a previous attempt are not immediately re-shown. |

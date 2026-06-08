**LastOne**

**Coping Tools Suite**

*Breathing · Physical Interventions · Mini-Games*

|  |  |
|----|----|
| **Version** | V1.2 |
| **Date** | May 2026 |
| **Author** | LastOne Product Team |
| **Status** | Build-Ready |
| **Supersedes** | Coping Tools Suite V1.0.1 |
| **Scope** | All three coping tool families — Breathing, Physical Interventions, Mini-Games |

**00 · Purpose of This Document**

This document is the single canonical reference for all coping tools in LastOne. It replaces the three individual family briefs and the V1.0.1 compiled reference. A developer should be able to build any coping tool from this document alone, without clarifying questions.

**This document owns:**

- The tool catalogue (Sections 02–04)

- The master reference table and Supabase seed data (Section 05)

- The cross-family SOS selection logic (Section 06)

- Stage behaviour across all six stages (Section 07)

- The escalation system including Call a Friend and Quit Specialist Line (Section 08)

- Part B: data model, logic, notification policy, and API surface (Sections B1–B4)

**This document does not own:**

- Visual design — screen-level pixel decisions and motion specs live in the Figma file.

- The craving log flow — owned by the Logging System spec.

- The slip threshold and red_flag_count system — owned by the Slip Threshold spec (specs/v1.2/LastOne_SlipThreshold_Spec.md).

- Global notification rules — owned by the forthcoming Global Notifications spec.

**01 · The Coping Tools Model**

Three families. Twelve tools. Two delivery layers. One shared check-in at the end of every tool.

**1.1 The Three Families**

|  |  |  |  |
|----|----|----|----|
| **Family** | **Core Mechanism** | **Best For** | **Tools in V1** |
| Breathing | Nervous system de-escalation via rhythm | Stress spikes, anxiety, overwhelm | 4 |
| Physical | Motor interruption and adrenaline burn | Automatic reaches, anger, public social triggers | 4 |
| Mini-Games | Visuospatial attention capture | Boredom, idle time, habitual time-window cravings | 4 |

**1.2 Intensity and Context — The Routing Dimensions**

Every craving has two properties relevant to tool selection: intensity (1–5) and context (public vs private, with emotional tags). The combination picks the tool.

|  |  |  |  |  |
|----|----|----|----|----|
| **Intensity** | **State** | **Primary Family** | **Secondary** | **Why** |
| 1 — Mild | Passing, habitual | Mini-Games | Breathing | Distraction is enough. Games occupy idle attention before it reaches for a cigarette. |
| 2 — Low | Background pull, boredom | Mini-Games | Breathing | Same as above. 5-5-5 Grounding Breath works here too. |
| 3 — Moderate | Noticeable, situational | Breathing | Physical | 4-7-8 Reset or Box Breathing. If context is private, Push-ups. |
| 4 — Strong | Near urgent, needs action | Physical | Breathing | Public: Pulse Press or Tongue Press. Private: Push-ups. |
| 5 — Overwhelming | Already walking to buy | Physical | Breathing | Physiological Sigh as 60-second primer, then strongest tool for context. |

**1.3 The Two Delivery Layers**

**Every tool lives in one of two surfaces:**

**SOS curated layer (Layer 1).** When the user taps the SOS button during an active craving, the app surfaces exactly three tools. Never more. Selection is made by the logic in Section 06. One tap to a tool — no menus, no browsing.

**Explorative library (Layer 2).** Accessed from the Tools hub during calm moments. All tools are visible, organised into four categories: Breathing Exercises, Physical Reset, Games and Puzzles, AI Bot. Users can read about each tool and try them in a no-pressure state before a craving hits.

> *A craving is not the time to browse. A calm evening is not the time to be rationed. The same tool catalogue needs two front doors.*

**02 · Breathing Tools**

Breathing tools work by changing physiology directly. Every tool in this family interrupts the cortisol-adrenaline cycle that a nicotine craving produces. They are context-neutral — usable anywhere, invisible to everyone nearby — which makes them the highest-coverage family in the suite.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>BRE-01 · BREATHING · CONTEXT-NEUTRAL</strong></p>
<p><strong>Box Breathing</strong></p>
<p><em>Inhale 4s → Hold 4s → Exhale 4s → Hold 4s × 4 cycles</em></p></td>
</tr>
</tbody>
</table>

**When to Use It**

|  |  |
|----|----|
| **Craving intensity** | Mild to moderate (1–3) |
| **Emotional state** | Restless, slightly anxious, distracted |
| **Situation** | Lecture break, hostel common room, any moment where the user has 60 seconds and is not in acute distress |
| **Duration** | ~64 seconds |
| **Difficulty** | Very low. Equal timing across all four phases is easy to follow. |

**How It Works**

Equal-ratio breathing activates the parasympathetic nervous system by extending the breath cycle beyond the body's stress-response default. The hold phases are the mechanism: holding after a full inhale maximises oxygen exchange; holding after a full exhale forces the nervous system to pause before the next stress signal can compound. Used by military personnel, surgeons, and athletes because it works rapidly and requires no equipment.

**UX Implementation Note**

Default low-intensity breathing tool. Animated square pacer: each side of the square activates for its 4-second phase, so the user has a visual anchor without counting. Soft count visible in the corner. No audio required — works in a lecture corridor or library. Completion line: "Your nervous system just hit the reset button."

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>BRE-02 · BREATHING · CONTEXT-NEUTRAL</strong></p>
<p><strong>4-7-8 Reset</strong></p>
<p><em>Inhale 4s → Hold 7s → Exhale 8s × 3–4 cycles</em></p></td>
</tr>
</tbody>
</table>

**When to Use It**

|  |  |
|----|----|
| **Craving intensity** | Moderate to intense (3–5) |
| **Emotional state** | Anxious, overwhelmed, on the edge of giving in |
| **Situation** | Exam stress craving, walking past a tapri when the pull hits hard, or the first 60 seconds of a strong post-meal urge |
| **Duration** | ~90 seconds |
| **Difficulty** | Low. The 7-second hold is the only point of difficulty for beginners. |

**How It Works**

The extended 7-second hold activates the vagus nerve, directly suppressing the sympathetic nervous system. The disproportionately long exhale forces a slower heart rate and lowers cortisol almost immediately. A nicotine craving spike is partly a cortisol and adrenaline event — the body reads nicotine absence as a mild stress signal. The 4-7-8 pattern interrupts that signal before it becomes a decision. The 7-second hold is long enough to shift the brain's attention entirely to the breath, crowding out the craving thought.

**UX Implementation Note**

Primary breathing tool — default option surfaced in the SOS curated layer for intensity 3+. Circular visual pacer: circle expands on inhale, holds at full size, contracts slowly on exhale. Hold phase needs a subtle pulse animation so users feel guided. Soft count visible in the centre. No audio required. Completion line: "That craving just lost 90 seconds. It's already weaker."

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>BRE-03 · BREATHING · CONTEXT-NEUTRAL</strong></p>
<p><strong>Physiological Sigh</strong></p>
<p><em>Full inhale → Short sniff top-up → Slow exhale 8–10s × 2–3 times</em></p></td>
</tr>
</tbody>
</table>

**When to Use It**

|  |  |
|----|----|
| **Craving intensity** | Intense to overwhelming (4–5) |
| **Emotional state** | Panicked, close to giving in, feeling out of control |
| **Situation** | Already walking toward a cigarette seller, acute craving during a high-stress event, late-night intense urge in a hostel with cigarettes in reach |
| **Duration** | 45–60 seconds |
| **Difficulty** | Very low despite its power. Almost no technique to learn. |

**How It Works**

The double inhale re-opens collapsed alveoli in the lungs, maximising oxygen exchange. The prolonged exhale is the single fastest way to activate the parasympathetic nervous system. For acute nicotine urges — which are partly a dopamine-drop panic response — speed of effect matters more than sustained technique. The physiological sigh works within one cycle and is physiologically impossible to do incorrectly, which matters at intensity 5 when cognitive load is already maxed.

**UX Implementation Note**

Surface when intensity is logged at 5, or when SOS is triggered without intensity logging. Screen design is distinct from other breathing tools: darker background, simpler animation, fewer words. One instruction at a time. Two quick expanding shapes for the double inhale, then one very slow contraction for the exhale. After the final exhale: 2 full seconds of stillness before any feedback — that pause is part of the exercise. Opening line: "Just do what the screen does. Nothing else." Optional haptic: gentle pulse guides the double inhale without requiring the user to watch the screen.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>BRE-04 · BREATHING · CONTEXT-NEUTRAL</strong></p>
<p><strong>5-5-5 Grounding Breath</strong></p>
<p><em>Inhale 5s (see) → Hold 5s (feel) → Exhale 5s (hear) × 3 cycles</em></p></td>
</tr>
</tbody>
</table>

**When to Use It**

|  |  |
|----|----|
| **Craving intensity** | Low to moderate (1–3) |
| **Emotional state** | Not particularly emotional — the craving is situational, almost subconscious |
| **Situation** | Post-meal urge with no stress present, the walk past the chai stall, the break between lectures that used to always include a cigarette |
| **Duration** | ~90 seconds |
| **Difficulty** | Moderate. Requires slightly more cognitive engagement because of the sensory anchoring. |

**How It Works**

A hybrid of diaphragmatic breathing and the CBT 5-4-3-2-1 grounding technique used in anxiety and trauma therapy. Standard breathing tools work on the physiological pathway. This one works on the cognitive pathway simultaneously — engaging three separate sensory channels forces the prefrontal cortex back online, interrupting automaticity. The result is the user moves from automatic smoking mode into conscious decision mode, where they have significantly more agency.

**UX Implementation Note**

Library-first tool. Should not be slot 1 in SOS unless the user has personally scored it highly. Each breath phase displays exactly one sensory prompt — never all three at once. Phase 1: pacer + "Notice one thing you can see." Phase 2: "Notice one thing you can feel — your feet on the floor, your back against a chair." Phase 3: "Notice one thing you can hear." A text-only mode without animation is worth building — users in a lecture hall corridor may glance at a prompt rather than watch a full animation. Tagged in data model as: habitual, post_meal, morning, social.

**03 · Physical Interventions**

Physical interventions are the fastest way to interrupt a craving. A craving peaks physiologically — heart rate rises, cortisol spikes, hands reach automatically. Reasoning with it does not work. Moving the body does.

This family is context-gated. The app asks one routing question — "Around people or on your own?" — before surfacing any physical tool. This gate fires during SOS sessions only (not on passive craving logs). The gate must be two large tap targets, no other information on screen, loading instantly.

|  |  |  |
|----|----|----|
| **Context** | **Setting** | **Routes To** |
| Around people | Campus, street, social event | PHY-01 Finger Pulse Press or PHY-02 Tongue Press |
| On my own | Hostel room, home | PHY-03 Push-ups or PHY-04 Squat Jumps |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>PHY-01 · PHYSICAL · PUBLIC</strong></p>
<p><strong>Finger Pulse Press</strong></p>
<p><em>Locates your own heartbeat to break the craving loop.</em></p></td>
</tr>
</tbody>
</table>

**When It Fires**

User tags "stressed" or "anxious" at craving log, or craving intensity is 4–5 in a public context.

**Duration**

40 seconds — completely invisible in public.

**Steps**

1.  Press your right index finger firmly against your left wrist, directly over your pulse.

2.  Count 10 heartbeats — not seconds, beats.

3.  With each beat, exhale slowly through your nose.

4.  After 10 beats, release and notice the difference in your hand.

**Why It Works**

Locating your pulse forces voluntary attention onto a physical sensation, breaking the automatic craving loop. Rhythmic counting activates the prefrontal cortex while slow nasal exhalation triggers the parasympathetic nervous system. Physiologically the same mechanism as biofeedback therapy, compressed into 40 seconds.

**UX Implementation Note**

Screen dims slightly. A wrist illustration appears with a single pulsing dot. No text except a beat counter running from 1 to 10. After 10 counts, a subtle haptic pulse confirms completion. Check-in follows: "How does your hand feel now?" Thumbs up or down. This tool looks like the user is checking their watch — socially invisible by design.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>PHY-02 · PHYSICAL · PUBLIC</strong></p>
<p><strong>Tongue Press</strong></p>
<p><em>Interrupts the motor simulation of smoking at the source.</em></p></td>
</tr>
</tbody>
</table>

**When It Fires**

User tags "with friends who smoke" or "social situation", or logging history shows a recurring pattern at this time of day.

**Duration**

5 full breaths — completely hidden, usable mid-conversation.

**Steps**

5.  Press the tip of your tongue firmly to the roof of your mouth, just behind your front teeth.

6.  Hold the pressure — hard enough to feel it clearly.

7.  Breathe slowly through your nose only. Mouth stays closed.

8.  Hold for 5 full breaths, then release.

**Why It Works**

When watching others smoke, the brain runs a motor simulation of smoking — it rehearses the hand-to-mouth movement at a neural level (mirror neuron activation). The tongue-to-palate position physically occupies the oral motor system that smoking uses. You cannot simulate the hand-to-mouth action while your mouth is executing a competing motor command. Also activates the vagus nerve through the hard palate, dropping arousal quickly.

**UX Implementation Note**

Instructions appear one line at a time, advancing on tap — never all at once. Cognitive load is high in social situations. A breath counter shows 5 rings, one filling per breath. V1 implementation: timer-based pacer (one ring fills every 5 seconds). No microphone detection — mic detection is unreliable in the noisy environments where this tool fires, adds permission overhead, and adds implementation complexity for V1. After completion: "How's the craving now?" One tap.

> *This tool is entirely invisible. The user can use it mid-conversation. Mouth-closed nasal breathing looks like a thoughtful pause. Designed specifically for the moment when friends light up at a tapri or social event — the hardest public trigger to design for.*

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>PHY-03 · PHYSICAL · PRIVATE</strong></p>
<p><strong>Push-ups</strong></p>
<p><em>Burns adrenaline and resets dopamine in 60 seconds.</em></p></td>
</tr>
</tbody>
</table>

**When It Fires**

User taps "On my own" at context gate. Priority for high-intensity cravings (4–5) and stress-driven moments.

**Duration**

60 seconds — highest physiological impact in the system.

**Steps**

9.  Drop to the floor — any surface, any push-up form.

10. Complete your rep count at any pace. Knees on floor is fine.

11. Stand up immediately. No rest between push-ups and standing.

12. Stay still for 10 seconds. Notice your breathing and your hands.

**Why It Works**

Vigorous movement burns off the adrenaline and cortisol spike that the craving produces. Also triggers a dopamine release that the craving was trying to manufacture through nicotine. The no-rest transition from push-ups to standing keeps the mind occupied through the full 60 seconds and prevents the craving thought from re-entering before the neurochemistry has shifted.

**UX Implementation Note**

Large rep counter fills the screen — just the number, counting down from the user's configured rep count. No instructions visible mid-exercise. After completion, a 10-second still timer runs with the prompt "Stand still. Notice your breathing." Then the single check-in question. Rep count is configured per-tool at onboarding: 5, 10, or 15. PHY-03 and PHY-04 each have their own setting — a user who can do 15 push-ups may not manage 15 squat jumps. Default is 10 for both. Adjustable in settings at any time.

> *Rep count personalisation is critical. Set it too high and users skip the tool. Skip the tool and the craving wins. The goal is completion, not effort.*

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>PHY-04 · PHYSICAL · PRIVATE</strong></p>
<p><strong>Squat Jumps</strong></p>
<p><em>Explosive movement that discharges cortisol and forces a full breath reset.</em></p></td>
</tr>
</tbody>
</table>

**When It Fires**

User tags "angry", "frustrated", or "overwhelmed". Also fires when craving follows a pattern of post-argument or bad-news moments in logging history.

**Duration**

45–60 seconds — leaves the user physically breathless, craving displaced.

**Steps**

13. Stand with feet shoulder-width apart.

14. Drop into a squat — thighs parallel to the floor.

15. Explode upward, both feet leaving the ground.

16. Land softly, go straight back into the squat. No rest between reps.

17. Complete your configured rep count.

**Why It Works**

Explosive movement burns cortisol and adrenaline faster than slow isometric effort. The repeated jump-land cycle forces deep involuntary exhales — the body cannot sustain the output without resetting its breath rhythm. By rep 6 or 7 the user is breathing hard and the craving thought has been physically displaced from working memory. The landing impact grounds the user sensorially — feet on the floor, body weight felt — which interrupts the dissociative quality of anger-state cravings specifically.

**UX Implementation Note**

Same large rep counter as PHY-03 — single number counting down, nothing else on screen. After completion, a 15-second still timer runs before the check-in appears. The extra 5 seconds versus PHY-03 is deliberate: breath recovery after squat jumps takes longer, and that recovery window is part of the intervention. Rep count is configured per-tool at onboarding: 5, 10, or 15. Separate from PHY-03's setting.

**04 · Mini-Games**

A craving peaks in 3–5 minutes. It does not disappear because the user wills it away — it fades when the brain is occupied. These mini-games are precision-designed distractions that occupy the exact mental and physical channels a craving hijacks: the hands, the eyes, and attention.

Scientific basis: Kemps & Tiggemann (Flinders University, 2015) found that visuospatial tasks — games that use the eyes and working memory together — reduce craving intensity by an average of 24%. All tools in this family work on this principle.

Mini-games surface in the Tools hub under the "Games and Puzzles" category. They are not a separate tab — they sit alongside Breathing Exercises, Physical Reset, and AI Bot in one unified screen.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>MIN-01 · MINI-GAMES · SINGLE PLAYER</strong></p>
<p><strong>Echo Tap</strong></p>
<p><em>A rhythm replication game. The game plays a tap sequence. The player replays it back.</em></p></td>
</tr>
</tbody>
</table>

**What It Is**

Think of it as the old Simon Says toy — sequences flash in order and you repeat them — except here it is pure rhythm and tapping. Sequences start short and grow longer as the player progresses.

**What the Player Sees and Does**

A simple screen with a visual pulse — an expanding circle or glowing dots. The game plays a sequence of taps with visual and optional haptic feedback. The player replicates the sequence by tapping the screen. Each correct tap gives a satisfying visual response. Each wrong tap gives a gentle buzz — noticeable, not harsh. Sequences get longer and faster as the player progresses.

**How the Game Tracks Progress**

Internally the game maintains three things: the sequence it just played (an ordered list of taps), the player's input (taps captured in real time and compared one by one), and the player's streak and level (how many sequences in a row they nailed, which raises difficulty).

> *V1 simplification: track sequence order only, not exact timing precision. This is far easier to build and still delivers the experience. Timing accuracy can be added in V2.*

**Why It Works**

Listening and replicating a rhythm demands real attention — the brain cannot multitask the craving simultaneously. Rhythmic tapping has documented calming effects on the nervous system, similar to EFT tapping used in stress therapy. Short feedback loops (each round 10–15 seconds) keep restless users hooked. V1 ships with one default rhythm. User-selectable BPM or genre deferred to V1.5.

**Build Complexity**

Medium. Core single-player is straightforward. The only nuanced decision is timing precision — start with order-only.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>MIN-02A · MINI-GAMES · SINGLE PLAYER</strong></p>
<p><strong>Memory Game (1P)</strong></p>
<p><em>A classic card-matching game. Find all the pairs.</em></p></td>
</tr>
</tbody>
</table>

**What It Is**

A grid of face-down cards, each with a hidden image. Every card has exactly one matching pair somewhere in the grid. The player flips two cards at a time and tries to find all the pairs.

**What the Player Sees and Does**

Grid of face-down cards — 3×4 (12 cards) for a quick craving session, 4×4 (16 cards) for a longer one. Tap any card to flip it. Tap a second card. If they match, both stay face-up. If they do not match, both flip back face-down after approximately one second. Game ends when all pairs are found. Score equals pairs matched.

**Core Logic**

Each card has two properties: its position on the grid and its content (which image it holds). When two cards are flipped, the game checks if they share the same content. If yes: mark both as matched and remove from play. If no: flip both back. Score equals total matched pairs.

**Delivery Note**

Instructions appear on first launch only. During play: grid fills the screen, nothing else visible except the matched pair counter at the top. Each successful match delivers a satisfying visual and subtle haptic. Game ends with a completion screen showing pairs found and time taken. Standard check-in follows: "How's the craving now?" Thumbs up or down.

**Why It Works**

Pure working memory game — remembering card positions occupies the same mental space a craving needs. Self-paced: no timer pressure means it works even when the user is stressed, which is often the trigger. Satisfying loop: every successful match delivers a small dopamine hit.

**Build Complexity**

Low. Standard memory game logic with no real-time requirements.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>MIN-02B · MINI-GAMES · 2 PLAYER (LOCAL)</strong></p>
<p><strong>Memory Game (2P)</strong></p>
<p><em>Same grid, same rules — two players take turns. Pass-and-play.</em></p></td>
</tr>
</tbody>
</table>

**What It Is**

The same card-matching game as MIN-02A but played by two players on one device, passing it back and forth. If you find a match, you score a point and take another turn immediately. If you do not match, it becomes the other player's turn. Whoever has more matches when the board is cleared wins.

**What the Players See and Do**

Same grid as 1P. A turn indicator at the top shows whose turn it is. Each player's score is tracked separately and visible throughout. The strategic layer: in 2P, you watch your opponent's flips and use what they reveal to find your own matches — a mechanic similar to poker where information is shared but the game rewards whoever retains it better.

**Delivery Note**

Turn indicator is prominent at the top of the screen — player name or "Your turn" / "Their turn". During each turn: the active player sees a subtle highlight state. On match: brief celebration, score updates, same player continues. On miss: cards flip back, turn passes. At game end: final score screen showing both players' totals and the winner. Standard check-in follows for both players individually — each player taps their own thumbs up or down when the phone is passed to them.

> *Our research identifies social belonging as a primary driver for the 16–27 year old Indian audience. The chai-sutta break is social — it is not really about the cigarette. A 2-player memory game between two friends who are both trying to quit replaces that social ritual without the smoke. That is the real product value here.*

**Build Complexity**

Medium. Same-room pass-and-play is straightforward. Online real-time sync is V2.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>MIN-03 · MINI-GAMES · 2 PLAYER</strong></p>
<p><strong>Find Match</strong></p>
<p><em>A competitive visual race. Spot the matching pair before your opponent does.</em></p></td>
</tr>
</tbody>
</table>

**What It Is**

Both players see a shared board of mixed icons, patterns, or images. Somewhere on that board is a matching pair. Both players race to find and tap it first. Think of the card game Spot It! — two people looking at the same cards, racing to call out what they share — except digital and faster.

**What Both Players See and Do**

A board of visual elements appears on screen. Both players search for the matching pair simultaneously. The first player to tap the correct match scores a point. An incorrect tap triggers a short penalty — two seconds of disabled tapping — which prevents random spam-tapping. A new round begins immediately. First to X points wins. A full game lasts about 2–3 minutes across 5–7 rounds.

**V1 Implementation — Async Round Model**

Both players get the same board, play their round on their own device within a 30-second window, and scores are compared at the end of each round. No live sync required. This is how 8 Ball Pool's async mode works — it feels competitive without needing real-time infrastructure. Real-time sync deferred to V2.

**Why It Works**

Visual scanning and pattern matching monopolise attention — the brain cannot crave and race simultaneously. Competitive pressure creates a different, more productive form of tension that overrides craving anxiety. Short rounds (10–15 seconds each) fit naturally within the 3–5 minute craving window. The "challenge a friend" interaction matches how the audience already uses Ludo King and MPL.

**Build Complexity**

High. The biggest risk is fairness perception. The async round model eliminates this risk in V1.

**05 · Master Reference Table**

Every tool in the suite. This is the source of truth the Supabase seed file should mirror. Tool IDs are stable identifiers — once assigned, they do not change, because user_tool_scores references them.

|  |  |  |  |  |  |
|----|----|----|----|----|----|
| **Tool ID** | **Family / Name** | **Intensity** | **Duration** | **SOS Role** | **Category** |
| BRE-01 | Breathing / Box Breathing | 1–3 | ~64s | Default low | breathing |
| BRE-02 | Breathing / 4-7-8 Reset | 3–5 | ~90s | Primary 3+ | breathing |
| BRE-03 | Breathing / Physiological Sigh | 4–5 | 45–60s | Intensity 5 primer | breathing |
| BRE-04 | Breathing / 5-5-5 Grounding Breath | 1–3 | ~90s | Library-first | reflective |
| PHY-01 | Physical / Finger Pulse Press | 3–5 public | 40s | Public primary | physical_reset |
| PHY-02 | Physical / Tongue Press | 2–5 social | ~60s | Social primary | physical_reset |
| PHY-03 | Physical / Push-ups | 4–5 private | 60s | Private primary | physical_reset |
| PHY-04 | Physical / Squat Jumps | 4–5 angry | 45–60s | Private anger | physical_reset |
| MIN-01 | Mini-Games / Echo Tap | 1–3 | 2–4 min | Idle / boredom | distraction |
| MIN-02A | Mini-Games / Memory Game (1P) | 1–3 | 3–5 min | Idle / boredom | distraction |
| MIN-02B | Mini-Games / Memory Game (2P) | 1–3 | 3–5 min | Social ritual | social_coping |
| MIN-03 | Mini-Games / Find Match (2P) | 1–3 | 2–3 min | Social / idle | social_coping |

**Notes on Category Mapping**

The category column maps each tool to one of six enum values in the coping_tools table: physical_reset \| cognitive_reframe \| distraction \| social_coping \| reflective \| breathing. The sixth value (breathing) was added in V1.0.1 as the resolution to the enum inconsistency — see action items in Section B1.

- BRE-01, BRE-02, BRE-03 → breathing. Pure breath-pattern tools. Giving them their own category makes SOS selection logic expressive — "give me one breathing tool" becomes a clean one-line filter.

- BRE-04 → reflective. The cognitive work (sensory anchoring) matters more than the physiological pattern. The breath is a carrier for the grounding exercise, not the point of the tool.

- MIN-02B, MIN-03 → social_coping. These tools are used when the user would otherwise be in a social smoking situation. Their category reflects their purpose, not just their visuospatial mechanism.

- MIN-02A is a separate tool ID from MIN-02B. 1P and 2P serve different use cases, peak at different stages, and should be scored independently — a user may find 1P effective but rarely have a friend present for 2P. Pooling their tool_scores would corrupt the personalisation signal.

**06 · SOS Selection Logic — Cross-Family**

This section is the authoritative source for SOS tool selection logic across all three families. It supersedes the SOS Tool Selection Logic in the Logging System spec V1.1 Section B4. Once agreed, the Logging System spec should point to this section rather than maintain its own version.

**6.1 The Selection Waterfall**

When the user taps the SOS button, the app selects three tools using the following waterfall. Steps run in order. The first step that produces three valid tools wins.

> *Stage pre-filter runs before every step. See Section 07 for the stage-level candidate pool rules. Stage always constrains the pool first; then the waterfall ranks within the filtered pool.*

|  |  |  |
|----|----|----|
| **Step** | **Rule** | **Output** |
| Step 0 Intensity 5 override | If craving intensity is 5, skip context gating entirely. Surface BRE-03 (Physiological Sigh) first, then the user's two highest-scoring tools from any family, regardless of context. | 3 tools. BRE-03 always slot 1. |
| Step 1 Personal effectiveness | If the user has 5+ uses of any tool AND at least one scored tool with tool_score \> 0, use their top 3 tools across all families. Minimum 5 uses before a tool is fully weighted; below 5 uses tool_score is treated as 0 (neutral, not excluded). | 3 tools, personalised. |
| Step 2 Context gate | If craving context is "around people": restrict physical tools to PHY-01, PHY-02. If "on my own": restrict to PHY-03, PHY-04. Breathing and mini-games are context-neutral and always eligible. | Filtered candidate pool for Steps 3–4. |
| Step 3 Stage weighting | If insufficient personal data: apply stage-based defaults (see Section 07). Stage 1–2: 1 breathing + 1 physical + 1 mini-game. Stage 3+: 1 breathing + 1 mini-game + 1 physical, mini-game elevated to slot 1 or 2. | 3 tools from stage-filtered pool. |
| Step 4 Profile fallback | No data at all: use onboarding profile. Social/Occasional → mini-games first. Regular Light → breathing first. Regular Moderate–Heavy → physical first. | 3 tools, profile default. |

**6.2 Cold-Start Intensity-to-Tool Map**

Before a user has any personal data, the app uses this table. These are the tools that surface as the primary (slot 1) option at each intensity level.

|  |  |  |  |
|----|----|----|----|
| **Intensity** | **Public Context** | **Private Context** | **Unknown Context** |
| 1 | MIN-01 Echo Tap | MIN-02A Memory 1P | BRE-01 Box Breathing |
| 2 | MIN-01 Echo Tap | MIN-02A Memory 1P | BRE-01 Box Breathing |
| 3 | BRE-01 Box Breathing | BRE-02 4-7-8 Reset | BRE-02 4-7-8 Reset |
| 4 | PHY-01 Finger Pulse Press | PHY-03 Push-ups | BRE-02 4-7-8 Reset |
| 5 | BRE-03 Physiological Sigh | BRE-03 Physiological Sigh | BRE-03 Physiological Sigh |

**6.3 Three-Slot Composition Rules**

The SOS surface always shows exactly three tools. Never fewer, never more. Slots are labelled primary / secondary / backup but are not visually different beyond subtle emphasis on slot 1. These rules prevent bad combinations.

|  |  |
|----|----|
| **Rule** | **Why** |
| Never show two tools from the same sub-category in the same surface (e.g. Box Breathing + 4-7-8 Reset) | Reduces the feeling that the surface is "just breathing options". Users need variety to perceive choice. |
| At intensity 4–5, at least one of the three slots must be a physical tool (subject to context gate) | High-intensity cravings have a physiological component that breathing alone may not break in time. |
| At intensity 1–2, at least one of the three slots must be a mini-game | Low-intensity cravings are usually boredom-driven. Breathing alone feels disproportionate and users report it as "dramatic for no reason" in similar apps. |
| MIN-03 (Find Match 2P) only appears if the user has an active Quit Buddy paired | A 2-player game with no opponent available is a dead end. Falls back to MIN-02A in cold state. |
| BRE-04 (5-5-5 Grounding) is never in slot 1 unless the user has personally scored it highly | Cognitive load is too high for first-presentation during an active craving. Library-first tool. |

**07 · Stage Behaviour**

Stage behaviour defines how the coping tools feature behaves differently across the six stages of the LastOne quit journey (Stage 0–5). Stage pre-filter runs before the SOS waterfall — stage always constrains the candidate pool first, then personal tool_score ranks within that filtered pool.

**Stage 0 — Baseline Week (Still Smoking)**

- Library is fully accessible. Users can browse and read about all tools.

- When a user attempts to use a tool in Stage 0, show a supportive friction message before proceeding. Example: "We're still getting to know your smoking patterns this week. You can try this tool — it won't hurt anything." User can proceed with one tap — friction, not a hard block.

- SOS button is not visible in the main UI in Stage 0 but is one tap away (accessible if the user looks for it). Rationale: the app is building a baseline and prefers the first week unaffected by intervention data.

- Stage pre-filter: no tool exclusions. Full catalogue accessible.

**Stage 1–2 — Early Quit (Acute Withdrawal)**

- Full SOS layer active.

- Cold-start default: 1 breathing + 1 physical + 1 mini-game (per waterfall Step 3).

- Physical tools prioritised for high-intensity cravings — withdrawal peaks here.

**Stage 3 — Consolidation**

- Mini-games elevated in the SOS candidate pool. Rationale: distraction-based tools become more relevant as acute withdrawal fades and boredom/habitual cravings dominate.

- Cold-start default: 1 breathing + 1 mini-game + 1 physical, mini-game elevated to slot 1 or 2.

**Stage 4–5 — Maintenance**

- Social coping and reflective tools prioritised. Rationale: maintenance phase — social accountability and self-reflection are the primary levers.

- PHY-03 (Push-ups) and PHY-04 (Squat Jumps) are de-prioritised in the candidate pool, not hard-capped. If a user's personal tool_score keeps them highly ranked, they remain fully accessible.

- MIN-02B (Memory 2P) and MIN-03 (Find Match) surface more readily — social ritual replacement is the target behaviour in this phase.

> *V1.5 scoring model (stage-adaptive tool_score weighting) is benched pending a team meeting. Open questions documented in: docs/specs/LastOne_ToolScoring_DesignNotes.md (git repo).*

**08 · Escalation — When Nothing Works**

"Call a Friend" and "Quit Specialist Line" are coping tools, not a separate escalation system. They compete normally in the SOS waterfall under baseline conditions. Escalation is the condition under which the normal waterfall is partially or fully suspended in favour of these tools.

**8.1 The failed_sos_count Ladder**

|  |  |
|----|----|
| **failed_sos_count** | **SOS Behaviour** |
| 0–1 | Normal SOS waterfall. Call a Friend and Quit Specialist Line compete normally alongside other tools. |
| 2 | Call a Friend pinned to slot 1. Slots 2 and 3 fill normally from the remaining candidate pool. |
| 3+ | Only Call a Friend and Quit Specialist Line shown. Normal waterfall suspended. |

**8.2 Softer Check-In After First Failure**

After 1 failed SOS session, do not push another tool immediately. Show a brief acknowledgement screen:

> *"That one was hard. Want to note what triggered it?"*

One tap to log trigger context. One tap to skip. Tone: no lecture, no streak warning. Low effort for the user, feeds craving_context data for future selection.

**8.3 The Two Escalation Tools**

**Call a Friend.** Opens the native phone dialler to call a pre-saved contact directly. No in-app messaging. The friend's phone number is collected at onboarding and is always editable in settings.

**Quit Specialist Line.** Framed in UI as "Talk to a quit specialist." Never use the word "addiction" in any copy relating to this tool. Functions as a coping tool — surfaces in the SOS waterfall and is scored like other tools.

**8.4 Escalation Conditions (from Section 06)**

|  |  |
|----|----|
| **Condition** | **Action** |
| 3+ SOS tools tried in 24 hours, all post_tool_state = "same" | Suppress further tool suggestions. Surface Call a Friend or Quit Specialist Line as primary action. |
| Intensity 5 logged and BRE-03 post_tool_state = "smoked" | Route directly to compressed Flow C (slip log). No retry surfacing. |
| Same tool used 5 times with tool_score trending negative (\< –2) | Remove that tool from the user's SOS candidate pool. Keep it in the library. Do not re-surface until the user explicitly tries it again from the library. |

**8.5 failed_sos_count Reset Conditions**

The window resets if either condition is met first:

18. 24 hours have elapsed since the first failed session — filters out a single bad day.

19. 2 consecutive successful SOS sessions with no slip in between — active recovery within the window.

Also resets on: stage boundary crossed; user restarts quit journey.

> *Longer pattern tracking (repeated failures across days) is handled by the Slip Threshold spec (red_flag_count) and the streak system (freeze depletion → C3 Restart nudge). The SOS counter does not need memory beyond the 24-hour window. Reference: specs/v1.2/LastOne_SlipThreshold_Spec.md — scope covers slip_type = one_off in Flow C only.*

**PART B — TECHNICAL SPECIFICATION**

Part B is intended for the developer. It defines the data model, logic, notification policy, and API surface needed to build this feature. All Supabase references use the JS client unless otherwise noted.

**B1 · Data Model**

**coping_tools (seed table — static)**

One row per tool. Populated by seed file. Never written to by the app at runtime.

|  |  |  |  |
|----|----|----|----|
| **Field** | **Type** | **Required** | **Notes** |
| tool_id | text (PK) | Yes | Stable identifier. Format: BRE-01, PHY-03, MIN-02A, etc. Never changes after assignment. |
| data_model_id | text | Yes | Internal identifier for use in user_tool_scores and logic. E.g. memory_1p, memory_2p, echo_tap. Snake_case. |
| family | text | Yes | breathing \| physical \| mini_games |
| name | text | Yes | Display name. E.g. "Box Breathing", "Push-ups", "Memory Game (1P)" |
| category | text (enum) | Yes | physical_reset \| cognitive_reframe \| distraction \| social_coping \| reflective \| breathing |
| intensity_min | integer | Yes | Minimum craving intensity this tool is appropriate for (1–5 scale). |
| intensity_max | integer | Yes | Maximum craving intensity this tool is appropriate for (1–5 scale). |
| context | text\[\] | No | Array of applicable contexts. Values: public, private, social, any. Null = context-neutral. |
| duration_seconds | integer | Yes | Approximate duration in seconds. |
| sos_eligible | boolean | Yes | Whether this tool may appear in the SOS curated layer. |
| library_only | boolean | Yes | True for tools that are library-first and should not be SOS slot 1 without personal score data. E.g. BRE-04. |
| requires_buddy | boolean | Yes | True for MIN-03. Falls back to MIN-02A if no Quit Buddy is paired. |
| stage_min | integer | No | Minimum stage for this tool to appear in SOS candidate pool. Null = available from Stage 0. |
| emotional_tags | text\[\] | No | Tags used to match tool to craving emotional context. E.g. \["stressed","anxious","angry"\]. |

**user_tool_scores (per-user, per-tool)**

One row per user per tool. Created on first use. Updated after every tool session.

|  |  |  |  |
|----|----|----|----|
| **Field** | **Type** | **Required** | **Notes** |
| id | uuid (PK) | Yes | Auto-generated. |
| user_id | uuid (FK) | Yes | References auth.users. |
| tool_id | text (FK) | Yes | References coping_tools.tool_id. |
| tool_score | integer | Yes | Cumulative score. +1 per thumbs_up check-in, –1 per thumbs_down. Default 0. |
| total_uses | integer | Yes | Total number of times this tool has been started. Default 0. |
| is_weighted | boolean | Yes | True when total_uses \>= 5. Below 5 uses, tool_score is treated as 0 for selection purposes. |
| last_used_at | timestamptz | No | Timestamp of last tool session start. |
| post_tool_state | text (enum) | No | Outcome of last check-in. Values: better \| same \| smoked. Null if no check-in yet. |
| removed_from_sos | boolean | Yes | True when tool has been removed from user's SOS pool (tool_score \< –2 after 5+ uses). Default false. |

**user_sos_state (per-user)**

One row per user. Tracks escalation state. Resets on conditions in Section 8.5.

|  |  |  |  |
|----|----|----|----|
| **Field** | **Type** | **Required** | **Notes** |
| user_id | uuid (PK/FK) | Yes | References auth.users. One row per user. |
| failed_sos_count | integer | Yes | Number of failed SOS sessions in current window. Default 0. |
| consecutive_sos_successes | integer | Yes | Resets to 0 on any slip within window. Default 0. |
| window_started_at | timestamptz | No | Timestamp of first failure in current window. Null if no active window. |

> **`friend_phone_number` is NOT stored on this table — device-only (T-F / F-1).** The "call a friend" / SOS contact number is third-party PII and is never written to Supabase. It lives in device SecureStore only (same single contact as Settings `sos_contact_phone` and Giving Up `support_person_number` — all three aliases collapse to one device-only field). Lost on reinstall/device switch → user re-enters. The escalation flow must handle the number being absent gracefully.

**Schema Action Items for Build**

- Add the sixth enum value (breathing) to the coping_tools.category column before seeding.

- Verify coping_tools.intensity_min / intensity_max use the 1–5 scale throughout. The Architecture Guide previously defined intensity as 1–10 — this has been corrected to 1–5. Audit any other file referencing the cravings table intensity field and update accordingly.

- Seed file must include all 12 tool rows. MIN-02A and MIN-02B are separate rows with separate tool_ids.

**B2 · Logic & Conditions**

**tool_score Formula**

tool_score is a cumulative integer. It is updated after every tool session where the user completes the check-in.

|  |  |
|----|----|
| **Condition** | **Operation** |
| User taps thumbs up at check-in | tool_score += 1 \| total_uses += 1 \| post_tool_state = "better" |
| User taps thumbs down, no slip | tool_score –= 1 \| total_uses += 1 \| post_tool_state = "same" |
| User taps thumbs down and logs a slip immediately after | tool_score –= 1 \| total_uses += 1 \| post_tool_state = "smoked" |
| User exits tool without completing check-in | total_uses += 1 \| tool_score and post_tool_state unchanged |
| total_uses \>= 5 | Set is_weighted = true. Tool now participates in Step 1 of the waterfall at its actual tool_score. |
| total_uses \< 5 | is_weighted = false. Tool participates in Step 1 only if it is the user's only option; otherwise treated as tool_score = 0 (neutral). |
| tool_score \< –2 AND total_uses \>= 5 | Set removed_from_sos = true. Tool is removed from SOS candidate pool. Remains in library. User can re-add it by using it from the library (next use resets removed_from_sos to false). |

**SOS Waterfall — Pseudocode**

function selectSOSTools(user, craving): pool = coping_tools.filter(sos_eligible = true) pool = pool.filter(removed_from_sos\[user\] = false) // Stage pre-filter stage = user.current_stage pool = applyStageFilter(pool, stage) // Step 0 — Intensity 5 override if craving.intensity == 5: top2 = getUserTopTools(user, pool, exclude=\[BRE-03\], limit=2) return \[BRE-03, ...top2\] // Step 1 — Personal effectiveness weighted = pool.filter(is_weighted\[user\] = true, tool_score\[user\] \> 0) if weighted.length \>= 3: return applyCompositionRules(weighted.sortBy(tool_score).top(3), craving) // Step 2 — Context gate (modifies pool for physical tools) if craving.context == "public": pool = pool.filter(NOT family=physical OR tool_id IN \[PHY-01, PHY-02\]) if craving.context == "private": pool = pool.filter(NOT family=physical OR tool_id IN \[PHY-03, PHY-04\]) // Step 3 — Stage weighting if stage \<= 2: return pickOne(breathing) + pickOne(physical) + pickOne(mini_games) if stage \>= 3: return pickOne(mini_games) + pickOne(breathing) + pickOne(physical) // Step 4 — Profile fallback profile = user.smoker_profile  // derived enum: social_occasional | regular_light | regular_moderate_heavy (N7) return profileDefaults\[profile\]

**failed_sos_count Logic**

|  |  |
|----|----|
| **Event** | **Action** |
| SOS session ends with post_tool_state = "same" or "smoked" | failed_sos_count += 1. If window_started_at is null, set to now(). consecutive_sos_successes = 0. |
| SOS session ends with post_tool_state = "better", no slip in window | consecutive_sos_successes += 1. If consecutive_sos_successes \>= 2: reset window (failed_sos_count = 0, window_started_at = null, consecutive_sos_successes = 0). |
| 24 hours elapsed since window_started_at | Reset window (failed_sos_count = 0, window_started_at = null, consecutive_sos_successes = 0). Run as Supabase Edge Function on a scheduled cron or check at session start. |
| User crosses a stage boundary or restarts quit journey | Reset window. |

**PHY-03 / PHY-04 Rep Count**

Each tool has its own rep count setting stored in user_settings (or equivalent user profile table). Field names: phy03_rep_count and phy04_rep_count. Allowed values: 5 \| 10 \| 15. Default for both: 10. Set at onboarding. Editable in settings. The two fields are independent.

**B3 · Notification Logic**

This feature owns no notifications.

The Coping Tools Suite is a reactive feature — it activates only when the user initiates (taps SOS or opens the library). It does not independently generate push notifications, scheduled reminders, or in-app alerts.

Notification-adjacent behaviours that touch this feature:

- Tool suggestion nudges (e.g. "Try Echo Tap next time you're bored") — if implemented, owned by the Logging System spec or the forthcoming Global Notifications spec, not this document.

- The acknowledgement screen after a failed SOS session (Section 8.2) is an in-session UI element, not a notification.

- The failed_sos_count escalation ladder (Section 8.1) changes the tools shown in an active SOS session — it does not generate a notification.

**B4 · API Surface**

All operations use the Supabase JS client (supabase-js). Edge Functions are noted where server-side execution is required.

**Read Operations**

|  |  |
|----|----|
| **Operation** | **Query** |
| Fetch all tools for library | supabase.from('coping_tools').select('\*').order('family') |
| Fetch user's tool scores | supabase.from('user_tool_scores').select('\*').eq('user_id', userId) |
| Fetch SOS-eligible tools | supabase.from('coping_tools').select('\*').eq('sos_eligible', true) |
| Fetch user SOS state | supabase.from('user_sos_state').select('\*').eq('user_id', userId).single() |

**Write Operations**

|  |  |
|----|----|
| **Operation** | **Query** |
| Upsert tool score after session | supabase.from('user_tool_scores').upsert({ user_id, tool_id, tool_score, total_uses, is_weighted, post_tool_state, last_used_at }, { onConflict: 'user_id,tool_id' }) |
| Update removed_from_sos flag | supabase.from('user_tool_scores').update({ removed_from_sos: true }).eq('user_id', userId).eq('tool_id', toolId) |
| Upsert SOS state | supabase.from('user_sos_state').upsert({ user_id, failed_sos_count, consecutive_sos_successes, window_started_at }, { onConflict: 'user_id' }) |
| Read/write friend phone number | **Device-only — not a Supabase call.** Read/write via SecureStore (e.g. `SecureStore.getItemAsync('sos_contact_phone')` / `setItemAsync`). Never persisted server-side (T-F / F-1). "Call a friend" must degrade gracefully when the value is absent (post-reinstall). |

**Edge Functions**

|  |  |
|----|----|
| **Function** | **Purpose** |
| check-sos-window-expiry | Scheduled cron (every hour) or triggered at SOS session start. Checks if window_started_at is more than 24 hours ago for any user with failed_sos_count \> 0. Resets window if so. |

**Seed File**

The Supabase seed file must mirror the master reference table in Section 05 exactly. 12 rows total. Confirm before seeding: (1) category enum includes "breathing"; (2) MIN-02A and MIN-02B are separate rows; (3) intensity values use 1–5 scale throughout.

**09 · Cross-Document Action Items**

Items in this section require changes to other specs before build begins. They are recorded here to prevent inconsistencies across documents.

|  |  |  |
|----|----|----|
| **\#** | **Document** | **Required Change** |
| 1 | Logging System Spec V1.1 — Section B4 | SOS Tool Selection Logic section should now point to Section 06 of this document as the authoritative source, rather than maintaining its own version. |
| 2 | Architecture Guide | intensity field on the cravings table must be corrected from integer (1–10) to integer (1–5). Audit any other file referencing this field. |
| 3 | Logging System Spec — coping_tools schema | Add sixth enum value "breathing" to the category column. Confirm seed file reflects this. |
| 4 | Global Notifications Spec (forthcoming) | When written, tool suggestion nudges should be defined there. This document confirms no notifications are owned here. |

**10 · User Stories & Success Metrics**

**User Stories**

**Primary (SOS layer).** As a user experiencing a craving, I want to be shown coping tools that match my situation and have worked for me before, so that I have something concrete to do in the moment instead of reaching for a cigarette.

**Secondary (Library layer).** As a user between cravings, I want to browse and learn about coping tools at my own pace, so that I'm prepared before a craving hits.

**Primary Success Metric**

Craving resistance rate — % of SOS sessions where the user confirms post_tool_state = "better" at the end of the tool session.

Rationale: this is the most direct signal that a coping tool worked. It feeds back into tool_score, which drives personalised SOS selection over time. The entire personalisation system depends on this signal — making it the metric most directly tied to the north star.

> *Metric relies on in-session self-report. Self-reporting bias is a known limitation for V1 — no passive detection in scope.*

**11 · Deferred to V2**

- Online real-time 2-player for MIN-02B (Memory 2P) and MIN-03 (Find Match). V1 is local pass-and-play and async-round respectively. Real-time sync depends on Supabase realtime channels being stable under expected load.

- More tools. The catalogue is deliberately small in V1 — 12 tools. Adding tools before V1 data is available is guessing. Prioritise based on which gaps the data shows after 3 months of real use. Candidates: cold water on the face, journaling prompt, guided visualisation.

- ML-based tool selection (C3). V1 uses rule-based waterfall. ML adaptation requires the rule-based system to produce enough data to train against first.

- Haptic-only delivery for BRE-03 (C4). A version of the Physiological Sigh that works entirely through haptic pulses, no screen required. Requires real haptic engineering work.

- Craving-intensity adaptive difficulty for mini-games (B1). If a user logs a high-intensity craving before opening a game, the game auto-starts at a harder difficulty. Worth testing with a small cohort before committing.

- V1.5 tool_score stage weighting. Open questions documented in docs/specs/LastOne_ToolScoring_DesignNotes.md.

- Echo Tap rhythm selection (D3). Ship with one default rhythm in V1; add BPM / genre selection in V1.5 if users ask.

*End of document · LastOne Coping Tools Suite V1.2 · May 2026*

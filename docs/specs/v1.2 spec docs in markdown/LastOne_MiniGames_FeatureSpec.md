# LastOne MiniGames FeatureSpec

Version 1.2 | April 2026 | Status: Ready for Development | Stage Scope: All stages (0–5)

## Connected to
- [[LastOne]] — parent project
- [[LastOne_MiniGames_Brief]] — the brief this spec was built on
- [[LastOne_Product_Foundations_V1]] — Distraction/Engagement coping category (Foundation 2)
- [[LastOne_Logging_System_Spec]] — games are accessed through the SOS coping overlay

---

# PART A — Feature Definition

## Section 1: Problem & Purpose

### 1.1 The Real Problem

Cravings are not decisions — they are physical and psychological events that peak in 3–5 minutes and then fade on their own. The problem is that most users don't know this, so they treat a craving like a wall they have to smash through rather than a wave they can ride out. Without something to genuinely occupy their hands, eyes, and attention in those minutes, the craving wins by default — not because it was too strong, but because there was nothing else competing for the user's focus.

### 1.2 Why This Matters for LastOne

- **Coping System (Foundation 2):** Mini-games are a distraction-category tool in the Two-Layer Coping System. They live in both Layer 1 (curated, surfaced during active cravings) and Layer 2 (explorative library, available anytime).
- **Personalisation (Foundation 4):** Game effectiveness is tracked per user and per game type. Over time, the app learns which game works best for which person and weights it higher in the curated layer.
- **Social Architecture (Foundation 3):** Memory 2P directly replaces the social ritual of a chai-sutta break — the same friends, the same few minutes, minus the cigarette.
- **Stage System (Foundation 1):** Games serve different purposes across stages — familiarity-building in Stage 0, peak craving support in Stages 1–2, social ritual replacement in Stages 3–4.

### 1.3 User Story

> Rohan is in his second year of engineering in Pune. It's 4pm, he's been in the library for two hours, and his chai is sitting in front of him. Every day at this time, he and his friends walk to the tapri outside the gate. Today he's trying not to. He can feel the pull — not really for the cigarette, but for the break, the exit, the familiar rhythm of it. He opens LastOne, sees the games section, and starts a round of Memory. By the time he matches the last pair, the urge has quieted down enough that he goes back to his textbook.

### 1.4 Success Metrics

- At least 40% of craving-linked game sessions end with a 'Yes' on the post-game reflection ('Did the craving pass?') within the first 4 weeks of the feature being live.
- **Craving-resistance rate:** Users who play at least one craving-linked game session show a higher craving-resistance rate than those who don't. Craving-resistance rate is defined as the percentage of craving-linked game sessions where the user answered 'passed' or 'partial' on the post-game reflection, OR logged no slip within 30 minutes of the session ending. Comparison group: users who logged a craving but did not open a game within 30 minutes of that log.
- Average game session length is between 2–5 minutes, confirming games fit within the craving window.
- At least 25% of users who use coping tools use a game at least once within their first two weeks.
- **Streak growth:** The number of users with an active game streak (at least 1 consecutive day) among users currently in Stages 1–3 grows week over week from feature launch baseline (Week 1).

---

## Section 2: Feature Overview

### 2.1 What This Feature Does

Mini-Games gives users a fast, effective way to ride out a craving by occupying the exact mental and physical channels a craving hijacks — attention, hands, and eyes. Users can launch a game at any time, declare whether they're playing because of a craving, and the app adjusts what happens after accordingly. Between cravings, games are simply there to play.

### 2.2 Where It Lives

- Home screen: a persistent games card or shortcut in the main feed.
- Coping tools library (Layer 2): games appear as a tool category, tappable from the full tool pool.
- Craving flow (Layer 1): when the app surfaces curated tools during an active craving, a game may appear as one of the 2–3 recommended tools based on the user's tool score.

### 2.3 Dependencies

- **Reads from:** User profile (stage, tool scores, coping history), craving log (to check for recent craving declaration), quit milestone data (for themed card content in Stage 1+).
- **Writes to:** Game session log (game type, craving-linked flag, result, reflection response), tool score (updated after each craving-linked session), game streak counter.
- **Requires:** Craving prompt component (shared overlay), reflection screen (post-game), streak tracking module.
- **Triggers:** Tool score update after each craving-linked session. Streak milestone notification if applicable.

---

## Section 3: Design Decisions

### Decision 1: User declares craving intent at launch — not inferred by the app

**Decision:** A single-tap prompt appears every time a game is launched — 'Playing because of a craving? Yes / No.' The app does not try to infer intent from timing or context.

**Rationale:** The alternative — inferring craving-linkage from a time window after a logged craving — fails because users in the middle of a craving often don't stop to log it first. They reach for the game immediately. Inferring intent from timing would miss these sessions and mislabel others. A direct, single-tap question is faster, more honest, and produces cleaner data.

### Decision 2: Games are available from Stage 0, with no gating

**Decision:** All games are accessible from Day 1, even during the Learning Week when the user is still smoking.

**Rationale:** Stage 0 is exactly when users should be building familiarity with the tools they'll rely on later. A user who discovers Echo Tap during Learning Week and enjoys it will reach for it instinctively during Stage 1 cravings. Gating games until quit day is a friction cost with no product benefit.

### Decision 3: Difficulty scales naturally during play — no intensity-driven adaptive launch

**Decision:** Games always start at a fixed default difficulty and scale up as the player progresses within that session. Craving intensity does not change the starting difficulty.

**Rationale:** The hypothesis that harder difficulty = better craving interruption is unvalidated. A user in a high-intensity craving may be less capable of handling a harder game — the result could be frustration rather than distraction. This is a V2 experiment once we have more data.

### Decision 4: Card skin (generic vs. themed) is user-controlled — app controls content within the themed skin

**Decision:** Users choose their card skin via a toggle on the Memory game entry screen. The app does not switch skins automatically. The user decides which skin they're in; the app decides what content appears within the themed skin.

**Rationale:** App-controlled skin switching creates an inconsistent experience. Some users find quit-context content motivating; others find it preachy. Default is generic. Themed is opt-in.

### Decision 5: Post-game reflection appears only for craving-linked sessions

**Decision:** The reflection prompt — 'Did the craving pass?' — only appears when the user answered 'Yes' to the launch prompt. Casual sessions go directly to the result screen.

**Rationale:** Asking 'Did the craving pass?' after a casual session makes no sense and trains users to dismiss the prompt without reading it. Showing it every time would erode that relevance within a week.

### Decision 6: Memory 2P uses pass-and-play on a single phone — no online sync in V1

**Decision:** The 2-player Memory game is local only — both players share one device and pass it between turns.

**Rationale:** Online real-time multiplayer requires synchronisation infrastructure, introduces latency fairness issues, and significantly increases build complexity. In the tapri-visit-replacement context, pass-and-play on one phone is an accurate product fit. Online 2P is a natural V2 addition.

### Decision 7: Echo Tap tracks sequence order only in V1 — not timing precision

**Decision:** Echo Tap evaluates whether the user tapped in the correct order. Millisecond timing accuracy is not checked in V1.

**Rationale:** Order-only tracking delivers the same cognitive load while being significantly easier to build and less punishing for users on older devices. Timing precision is a V2 axis.

### Decision 8: Game streaks live inside the games section — not on the home screen

**Decision:** The game streak counter and dashboard are accessible from within the games hub, not surfaced on the home screen alongside the quit-day streak.

**Rationale:** The home screen streak is the quit-day streak. Placing a game streak alongside it risks diluting what the primary streak means. Game streaks are most valuable for users who have slipped and need an alternative way to feel progress.

---

## Section 4: Screen Inventory

| Screen ID | Name | Description |
|---|---|---|
| MG-HUB-1 | Games Hub | Main games landing screen — shows all available games, personal streaks, and entry point to each game. |
| MG-HUB-2 | Craving Prompt | Single-tap overlay shown at every game launch — 'Playing because of a craving? Yes / No.' |
| MG-MEM1-1 | Memory 1P Entry | Game intro screen — grid size selection (3×4 or 4×4), card skin toggle (generic / themed), Start button. |
| MG-MEM1-2 | Memory 1P Game | Active game screen — face-down card grid, score counter, pairs remaining indicator. |
| MG-MEM1-3 | Memory 1P Result | End screen — pairs matched, time taken, game streak update. Leads to reflection if craving-linked. |
| MG-ECHO-1 | Echo Tap Entry | Game intro screen — brief how-to (first launch only), difficulty indicator (auto-scales), Start button. |
| MG-ECHO-2 | Echo Tap Game | Active game screen — visual pulse display, tap response area, sequence progress, streak counter. X button top-right. |
| MG-ECHO-3 | Echo Tap Result | End screen — sequences completed, longest streak, game streak update. Leads to reflection if craving-linked. |
| MG-MEM2-1 | Memory 2P Entry | Game intro screen — explains pass-and-play (first launch only), grid size selection, card skin toggle, Start button. |
| MG-MEM2-2 | Memory 2P P1 Turn | Player 1 active screen — grid with 'Your turn' indicator, score display for both players. |
| MG-MEM2-3 | Memory 2P Handoff | Handoff screen — shown after each non-matching turn. 'Pass to [Player 2]' button. Covers the grid. |
| MG-MEM2-4 | Memory 2P P2 Turn | Player 2 active screen — identical to P1 screen with reversed name display. |
| MG-MEM2-5 | Memory 2P Result | End screen — winner declared, final scores, game streak update for craving-linked session. |
| MG-REFLECT-1 | Post-Game Reflection | Shown only for craving-linked sessions — 'Did the craving pass?' Yes / Not fully / Still going. |
| MG-STREAK-1 | Game Streaks Dashboard | Inside Games Hub — current streak, longest streak ever, sessions this week, per-game breakdown. |

---

## Section 5: Flow Logic

### Flow 1: Games Hub Entry

1. User taps games entry point (home screen card, coping tools library, or craving flow recommendation).
2. App loads MG-HUB-1. Displays: available games (Memory 1P, Echo Tap, Memory 2P), current game streak count, and a shortcut to MG-STREAK-1.
3. User taps a game tile → MG-HUB-2 (Craving Prompt) appears as overlay. See Flow 2.
4. User taps streak shortcut → MG-STREAK-1 loads. Back arrow on MG-STREAK-1 returns to MG-HUB-1.
5. Escape hatch: Back button or swipe-down from MG-HUB-1 returns user to the surface that launched it.

### Flow 2: Craving Prompt (shared across all games)

1. MG-HUB-2 appears as an overlay immediately after the user taps any game tile.
2. User taps 'Yes — I'm having a craving' → session flagged as craving_linked. App proceeds to the selected game's entry screen.
3. User taps 'No — just playing' → session flagged as casual. App proceeds to the selected game's entry screen.
4. User taps X or dismisses the overlay → treated as casual. App proceeds to entry screen.
5. No input / timeout: If the overlay receives no tap within 8 seconds, it is treated as casual. Session flagged as casual.

**Data saved:** session_type = 'craving_linked' | 'casual', timestamp.

### Flow 3: Memory Game — Single Player

1. MG-MEM1-1 loads. User selects grid size (3×4 default, 4×4 optional) and card skin (generic default, themed toggle). Taps Start.
2. MG-MEM1-2 loads. All cards are face-down. Score and pairs-remaining counter shown.
3. User taps a card → it flips face-up, image revealed. User taps a second card → it flips face-up.
4. If cards match: both stay face-up. Pairs matched counter increments. A satisfying animation plays.
5. If cards do not match: both cards flip face-down after 1 second. No penalty. User continues.
6. When all pairs are matched: game ends. MG-MEM1-3 loads with result and game streak update.
7. If session was craving-linked → MG-REFLECT-1 appears after result screen. Otherwise → return to MG-HUB-1.
8. Escape hatch (MG-MEM1-2): Back button or app close mid-game abandons the session. No score saved, no streak update, no reflection shown.

**Data saved:** game_type = 'memory_1p', grid_size, card_skin, pairs_matched, time_taken_seconds, craving_linked flag.

### Flow 4: Echo Tap — Single Player

1. MG-ECHO-1 loads. Brief how-to shown on first launch only. Difficulty indicator shows 'Starts easy — gets harder as you go.' Taps Start.
2. MG-ECHO-2 loads. Game plays a sequence — audio tone and/or haptic vibration fires for each tap. Visual pulse animates.
3. Sequence ends. User replicates the sequence by tapping the screen in the same order.
4. Each correct tap: satisfying visual flash. Each incorrect tap: gentle buzz. No immediate termination on wrong tap — sequence attempt completes.
5. If sequence correct: streak increments, next sequence plays (one tap longer). If incorrect: streak resets to 0, sequence length reduces by 1 (minimum of 2).
6. Game ends after approximately 3–4 minutes, or if the user taps the X button. Tapping X mid-sequence completes the current sequence attempt first, then loads MG-ECHO-3 with results so far.
7. If session was craving-linked → MG-REFLECT-1 appears. Otherwise → return to MG-HUB-1.

**Data saved:** game_type = 'echo_tap', sequences_completed, longest_streak, session_duration_seconds, craving_linked flag.

### Flow 5: Memory Game — 2 Player Local

1. MG-MEM2-1 loads. Pass-and-play instructions shown on first launch only. App prompts for Player 1 and Player 2 names (optional — defaults to 'Player 1' and 'Player 2').
2. MG-MEM2-2 loads for Player 1. Grid is face-down. 'Player 1's Turn' shown at top. Both scores at 0.
3. Player 1 taps two cards. If match: score increments, they get another turn. MG-MEM2-2 stays active.
4. If Player 1 does not find a match: MG-MEM2-3 (Handoff Screen) appears. Grid is covered. 'Pass to Player 2' button shown.
5. Player 2 taps 'I've got it' → MG-MEM2-4 loads. Same rules apply. If no match: MG-MEM2-3 appears again.
6. Game continues until all pairs are matched. MG-MEM2-5 loads. Winner declared (higher score wins; tie = 'It's a draw!'). Game streak updates.
7. If session was craving-linked → MG-REFLECT-1 appears. Otherwise → return to MG-HUB-1.
8. Escape hatch: Back button or app close mid-game abandons the session. No result saved, no streak update for either player.

**Data saved:** game_type = 'memory_2p', player1_score, player2_score, winner, grid_size, card_skin, craving_linked flag.

### Flow 6: Post-Game Reflection (craving-linked sessions only)

1. MG-REFLECT-1 appears after the result screen.
2. Question shown: 'Did the craving pass?' Three options: 'Yes, I'm good' / 'Not fully' / 'Still going'.
3. User taps any option → response saved to session log. Screen dismissed. User returns to MG-HUB-1.
4. If no input for 5 seconds → auto-dismiss. No response recorded for this session.

**Data saved:** reflection_response = 'passed' | 'partial' | 'ongoing' | null (if dismissed).

### Flow 7: Game Streaks Dashboard (MG-STREAK-1)

1. User taps streak shortcut on MG-HUB-1 → MG-STREAK-1 loads.
2. MG-STREAK-1 displays: current_streak (days), longest_streak_ever, sessions_this_week, and a per-game breakdown (craving-linked sessions for memory_1p, echo_tap, memory_2p). All data is read-only.
3. No user actions available on this screen other than reading.
4. Escape hatch: Back arrow returns to MG-HUB-1.

---

## Section 6: Stage-by-Stage Behaviour

Section 6 is the single source of truth for stage behaviour.

| Stage | Name | Duration | Mini-Games Behaviour |
|---|---|---|---|
| **0** | Learning Week | Days −7 to 0 | Fully available. Ideal moment for users to explore games and build familiarity before quit day. No craving data yet — adaptive difficulty not active. Reflection prompt still shown if user declares a craving. Themed card content defaults to quit-intent copy (e.g. 'Fresh start', 'Day 1 coming') — no milestone-specific cards until Stage 1+. Tool score weighting activates per game type once that game hits 3 craving-linked sessions, regardless of stage. |
| **1** | First 72 Hours | Days 1–3 | Fully available. Highest craving intensity period — games are a primary coping tool. Craving-linked sessions most common here. Reflection data starts building. Tool score weighting activates per game type at 3-session threshold. Themed card skin content begins surfacing milestone-specific cards (e.g. '24 hours smoke-free', '₹170 saved') if user has toggled into themed mode. |
| **2** | First Full Week | Days 4–7 | Fully available. Habitual trigger patterns dominate. Tool score weighting: each game type independently reaches its 3-session threshold and begins being weighted in Layer 1 curation at that moment — not gated by stage. Themed card content updates dynamically based on user's actual milestone data. |
| **3** | Weeks 2–3 | Days 8–21 | Fully available. Social pressure peaks. Memory 2P becomes especially relevant — shared play with a quit-group friend replaces social smoking rituals. Tool scores continue updating. No stage-specific behaviour changes beyond what is driven by accumulated tool score data. |
| **4** | Weeks 4–8 | Days 22–56 | Fully available. Complacency risk is real. Streak nudge activates: if the user goes 4 consecutive days with no craving-linked game session, an in-app card appears on the home screen or games hub the next time they open the app. This is NOT a push notification. The card fires once per 7-day window, maximum 2 times total for this user — after 2 appearances with no re-engagement, the nudge stops permanently. Game streaks become a secondary progress metric for users who have slipped on their quit-day streak. |
| **5** | Months 3+ | Day 57+ | Fully available. Usage likely drops naturally as cravings reduce in frequency. Games remain accessible. Streak data preserved. No forced re-engagement — user has stabilised. Streak nudge from Stage 4 does not carry over if already exhausted (max 2 fires is lifetime, not per-stage). |

---

## Section 7: Copy

High-sensitivity copy requires all three voice variants. High-sensitivity moments: craving prompt, post-game reflection, streak milestone notifications, re-engagement nudge.

**Neutral-warm** is used for low-stakes informational copy — result screens, stat labels, hub headers, button labels. No coaching, no emotional weight, no humour.

### HIGH-SENSITIVITY COPY

#### Craving Prompt — Main question

| Voice | Copy |
|---|---|
| Steady & Direct | *Craving hitting right now?* |
| Emotional & Understanding | *Are you playing because of a craving?* |
| Light & Honest | *Brain being annoying right now?* |

#### Craving Prompt — Yes button

| Voice | Copy |
|---|---|
| Steady & Direct | *Yes — let's deal with it.* |
| Emotional & Understanding | *Yes, I need a distraction.* |
| Light & Honest | *Yeah, shut it up.* |

#### Craving Prompt — No button

| Voice | Copy |
|---|---|
| Steady & Direct | *No — just playing.* |
| Emotional & Understanding | *No, just here for fun.* |
| Light & Honest | *Nope, just bored.* |

#### Post-game reflection — Question

| Voice | Copy |
|---|---|
| Steady & Direct | *Craving still there?* |
| Emotional & Understanding | *How are you feeling now?* |
| Light & Honest | *Did the craving get the memo?* |

#### Post-game reflection — Yes option

| Voice | Copy |
|---|---|
| Steady & Direct | *It passed.* |
| Emotional & Understanding | *Yes, I'm feeling better.* |
| Light & Honest | *Gone. See ya.* |

#### Post-game reflection — Partial option

| Voice | Copy |
|---|---|
| Steady & Direct | *Getting there.* |
| Emotional & Understanding | *Not fully, but better.* |
| Light & Honest | *Fading, slowly.* |

#### Post-game reflection — Still going option

| Voice | Copy |
|---|---|
| Steady & Direct | *Still there. That's okay.* |
| Emotional & Understanding | *Still going. It will pass.* |
| Light & Honest | *Still here. Annoying, right?* |

#### Streak Milestone Notifications

Delivered immediately after the session that hits the milestone. All are push notifications. Respects user notification preferences. Auto-reduce rule applies: 3 consecutive ignored notifications reduces frequency by one tier for 7 days.

**3-day milestone**

| Voice | Copy |
|---|---|
| Steady & Direct | *3 cravings in a row, handled with a game. That's a streak worth keeping.* |
| Emotional & Understanding | *Three days of reaching for something other than a cigarette. That matters more than it sounds.* |
| Light & Honest | *3-day game streak. Your brain tried it, your hands cooperated. Keep going.* |

**7-day milestone**

| Voice | Copy |
|---|---|
| Steady & Direct | *A week of fighting cravings with games. The habit is shifting.* |
| Emotional & Understanding | *Seven days. You've been showing up for yourself, one craving at a time.* |
| Light & Honest | *One week streak. At this point the game is basically your craving's nemesis.* |

**14-day milestone**

| Voice | Copy |
|---|---|
| Steady & Direct | *14 days. This is no longer a coincidence — it's a pattern.* |
| Emotional & Understanding | *Two weeks of choosing differently in hard moments. That's real.* |
| Light & Honest | *14-day streak. Your cravings must be exhausted by now.* |

**30-day milestone**

| Voice | Copy |
|---|---|
| Steady & Direct | *30 days. You built a new reflex. That's the whole point.* |
| Emotional & Understanding | *A month of meeting your cravings with something better. You've come a long way from Day 1.* |
| Light & Honest | *30 days. The craving shows up, you open a game, the craving sulks away. Honestly, respect.* |

#### Re-engagement nudge

| Voice | Copy |
|---|---|
| Steady & Direct | *You've used games to get through cravings before. They're still here.* |
| Emotional & Understanding | *It's been a few days. Games helped you before — they're still there if you need them.* |
| Light & Honest | *The games are starting to wonder where you went. Just saying.* |

### LOW-SENSITIVITY COPY (Neutral-warm)

| Label | Copy |
|---|---|
| Games Hub — header | *Need a distraction? Pick a game.* |
| Games Hub — streak label | *Cravings fought with a game this week* |
| MG-HUB-1 — Memory tile name | *Memory Game* |
| MG-HUB-1 — Memory tile description | *Flip cards. Find pairs. Good for a busy brain.* |
| MG-HUB-1 — Echo Tap tile name | *Echo Tap* |
| MG-HUB-1 — Echo Tap tile description | *Listen, remember, tap it back. Gets harder as you go.* |
| MG-HUB-1 — Memory 2P tile name | *Memory — 2 Players* |
| MG-HUB-1 — Memory 2P tile description | *Take turns. Find more pairs than your friend.* |
| Memory 1P — entry header | *Memory Game* |
| Memory 1P — entry subtext | *Flip cards. Find pairs. Give your brain something to do.* |
| Memory 1P — grid size label | *How long do you want to play?* |
| Memory 1P — 3×4 option | *Quick (12 cards)* |
| Memory 1P — 4×4 option | *Longer (16 cards)* |
| Memory 1P — card skin toggle label | *Card style* |
| Memory 1P — generic skin label | *Icons* |
| Memory 1P — themed skin label | *Quit journey* |
| Memory 1P — result header | *All pairs found.* |
| Memory 1P — pairs label | *Pairs matched* |
| Memory 1P — time label | *Time taken* |
| Echo Tap — entry header | *Echo Tap* |
| Echo Tap — entry subtext | *Listen. Remember. Tap it back. Sequences get longer as you go.* |
| Echo Tap — first launch how-to | *Here's how it works: the game plays a sequence of taps — you'll hear them and feel them. Then it's your turn to tap the same sequence back, in the same order. Get it right and the next one gets a little longer. Get it wrong and it dials back a bit. There's no timer pressure — just you and the rhythm. Tap Start when you're ready.* |
| Echo Tap — difficulty note | *Starts easy. Gets harder as you go.* |
| Echo Tap — result header | *Nice session.* |
| Echo Tap — sequences label | *Sequences completed* |
| Echo Tap — streak label | *Longest streak this session* |
| Memory 2P — entry header | *Memory Game — 2 Players* |
| Memory 2P — entry subtext | *Take turns flipping cards. Whoever matches the most pairs wins.* |
| Memory 2P — first launch instructions | *One phone, two players. You take turns flipping cards — find a matching pair and you score a point and get another go. Miss a match and you pass the phone across. When the board is clear, whoever has more pairs wins. The handoff screen covers the board between turns so no peeking.* |
| Memory 2P — handoff screen header | *Pass the phone.* |
| Memory 2P — handoff subtext | *Cover the board — don't peek.* |
| Memory 2P — handoff button | *I've got it — start my turn* |
| Memory 2P — result win | *[Player name] wins!* |
| Memory 2P — result draw | *It's a draw!* |
| MG-STREAK-1 — screen header | *Games played during cravings* |
| MG-STREAK-1 — header subtext | *Every time you opened a game during a craving, it counted. Here's your record.* |
| MG-STREAK-1 — current streak label | *Days in a row with a craving game session* |
| MG-STREAK-1 — longest streak label | *Your personal best* |
| MG-STREAK-1 — this week label | *Craving sessions fought with a game this week* |
| MG-STREAK-1 — per-game header | *By game* |
| MG-STREAK-1 — game labels | *Memory (Solo) · Echo Tap · Memory (2 Players)* |
| Game streak — label | *Games played during cravings this week* |

---

## Section 8: Edge Cases

| Scenario | Behaviour |
|---|---|
| User dismisses craving prompt | Treat as casual session. No reflection shown post-game. Game launches normally. |
| No input on craving prompt for 8 seconds | Auto-treated as casual. App proceeds to game entry screen. Session flagged as casual. |
| User reaches games before onboarding complete | Not possible. Games are inaccessible until onboarding is complete and Stage 0 is active. |
| User opens game with no prior app usage (Stage 0, Day 1) | No stage data issues — Stage 0 is active. Games fully available. Difficulty starts at fixed default. No craving history to reference. Themed card content shows quit-intent copy only. |
| User closes app mid-game | Session is abandoned. No score saved. No reflection shown. Streak not updated. |
| User answers craving prompt 'Yes' then doesn't play | Session treated as craving-linked but abandoned. No reflection. No streak update. |
| Both Memory cards look identical (image bug) | Fallback to card index comparison. Match determined by position ID, not image render. |
| Echo Tap: user taps before sequence finishes playing | Early tap is recorded as an error for that position. Sequence continues regardless. |
| Memory 2P: only one person present | App has no enforcement — it's pass-and-play on one phone. Player can play both sides. |
| Memory 2P: player closes app during partner's turn | Session is abandoned. No result saved. No streak update for either side. |
| Reflection shown but user ignores it | After 5 seconds with no input, reflection is auto-dismissed. No data recorded for that session. |
| User has played 10+ games today | No cap on game sessions. Streak only counts unique craving-linked sessions, not casual plays. |
| Themed cards in Stage 0 (no quit milestones yet) | Themed cards show generic quit-intent content (e.g. 'Fresh start', 'Day 1 coming') — no milestone-specific cards until Stage 1+. |
| No internet connection | All Phase 1–3 games are fully offline. No server dependency for single player or local 2P. |
| Stage 4 streak nudge already shown twice | Nudge is permanently suppressed for this user. No further in-app cards shown regardless of inactivity. |

---

# PART B — System Logic

## B1: Data Model

### Object: game_session

Created at the end of every game session, regardless of craving linkage.

| Field | Type | Required | Notes |
|---|---|---|---|
| session_id | UUID | Required | Unique identifier for this game session. |
| user_id | UUID | Required | References the user's account. |
| game_type | Enum | Required | 'memory_1p' \| 'echo_tap' \| 'memory_2p' |
| session_type | Enum | Required | 'craving_linked' \| 'casual' |
| started_at | Timestamp | Required | When the game was launched. |
| ended_at | Timestamp | Required | When the result screen was shown. |
| duration_seconds | Integer | Required | Derived from started_at and ended_at. |
| grid_size | Enum | Conditional | '3x4' \| '4x4'. Memory games only. |
| card_skin | Enum | Conditional | 'generic' \| 'themed'. Memory games only. |
| pairs_matched | Integer | Conditional | Memory games only. Total pairs found. |
| time_taken_seconds | Integer | Conditional | Memory 1P only. Time from start to last match. |
| sequences_completed | Integer | Conditional | Echo Tap only. |
| longest_streak | Integer | Conditional | Echo Tap only. Longest correct sequence run in session. |
| player1_score | Integer | Conditional | Memory 2P only. |
| player2_score | Integer | Conditional | Memory 2P only. |
| winner | Enum | Conditional | Memory 2P only. 'player1' \| 'player2' \| 'draw' |
| reflection_response | Enum | Optional | 'passed' \| 'partial' \| 'ongoing' \| null. Only populated for craving_linked sessions. |
| stage_at_session | Integer | Required | User's stage (0–5) at the time of play. |

### Object: game_streak

One record per user. Updated after every craving-linked session.

| Field | Type | Required | Notes |
|---|---|---|---|
| user_id | UUID | Required | References the user's account. |
| current_streak | Integer | Required | Number of consecutive days with at least one craving-linked game session. |
| longest_streak_ever | Integer | Required | All-time peak streak. Never decreases. |
| sessions_this_week | Integer | Required | Count of craving-linked sessions in the current calendar week. Resets Monday. |
| last_craving_session_date | Date | Required | Used to determine if the streak is still active or has broken. |

### Object: tool_score (updated, not owned by this feature)

Mini-games contribute to the existing tool_score object in the coping system. Each game type is a separate tool entry with its own independent score.

| Field | Type | Required | Notes |
|---|---|---|---|
| tool_id | Enum | Required | 'memory_1p' \| 'echo_tap' \| 'memory_2p' |
| successful_resistance_count | Integer | Required | Increments when reflection_response = 'passed' or 'partial'. |
| slip_after_use_count | Integer | Required | Increments if a slip is logged within 30 minutes of a craving-linked session ending. |
| score_value | Float | Required | Calculated: successful_resistance_count − slip_after_use_count. Minimum 3 craving-linked sessions per game type before score_value is weighted in Layer 1 curation. Threshold is per game type and data-triggered — not stage-gated. |

### Object: streak_nudge_log

One record per user. Tracks Stage 4 in-app nudge delivery to enforce the 2-fire lifetime cap.

| Field | Type | Required | Notes |
|---|---|---|---|
| user_id | UUID | Required | References the user's account. |
| times_shown | Integer | Required | Increments each time the nudge card is shown. Capped at 2. |
| last_shown_at | Timestamp | Required | Used to enforce the 7-day cooldown between nudge appearances. |
| permanently_suppressed | Boolean | Required | Set to true when times_shown reaches 2. Nudge never shown again after this. |

---

## B2: Logic & Conditions

**Craving-linked session determination:** When the user taps 'Yes' on MG-HUB-2, session_type is set to 'craving_linked'. All other responses (No, dismiss, timeout after 8 seconds) result in session_type = 'casual'. This flag is set at session start and does not change during play.

**Game streak logic:** A streak day is a calendar day (midnight to midnight, IST / UTC+5:30) on which the user completed at least one craving-linked game session. The streak counter increments by 1 for each new streak day. A user completing sessions at 11:58pm and 12:02am IST earns two consecutive streak days — this is intentional. If the user misses a day with no craving-linked session, the streak resets to 0 at midnight IST. The longest_streak_ever field never decreases.

**Tool score update timing:** Tool score is updated after the reflection screen is completed or dismissed. Score_value is calculated independently per game type. Minimum 3 craving-linked sessions per game type before that game's score_value is factored into Layer 1 curation. If reflection_response is 'passed' or 'partial', successful_resistance_count increments. If a slip is logged within 30 minutes of session ended_at, slip_after_use_count increments.

**Echo Tap difficulty scaling:** Sequence starts at length 2. Each correct replication increases sequence length by 1. Each incorrect replication decreases sequence length by 1, floor of 2. No ceiling on sequence length. The session timer runs in background; the current sequence attempt always completes before the session ends (no mid-sequence cutoff).

**Memory 2P turn logic:** A turn ends when a player flips two cards that do not match. If a player finds a match, they immediately get another turn — MG-MEM2-3 does not appear until a non-matching flip occurs. A player on a hot streak could theoretically match all remaining pairs without the other player getting a turn. This is intentional and valid.

**Themed card content rules:** In Stage 0, themed cards show quit-intent content only (no milestone references). From Stage 1 onwards, themed cards may include milestone-specific content (e.g. '24 hours smoke-free', '₹170 saved') pulled from the user's actual progress data. Themed card content is static per session. This content only activates if the user has toggled into themed skin mode.

**Stage 4 streak nudge logic:** Trigger: user in Stage 4 who has not completed a craving-linked game session in 4 consecutive days. Nudge type: in-app card only — not a push notification. Cooldown: once shown, the nudge cannot appear again for 7 days. Lifetime cap: maximum 2 appearances per user total. When times_shown reaches 2, permanently_suppressed is set to true.

**Post-game reflection auto-dismiss:** If MG-REFLECT-1 receives no input for 5 seconds, it is dismissed automatically. The reflection_response field is recorded as null. This does not affect the game streak or tool score.

**Craving-resistance rate calculation:** Defined as: the percentage of craving-linked game sessions where the user answered 'passed' or 'partial' on the post-game reflection, OR logged no slip within 30 minutes of session ended_at. Comparison group: users who logged a craving but did not open a game within 30 minutes of that log.

---

## B3: Notification Logic

**Streak milestone notifications:**
- Trigger: current_streak reaches 3, 7, 14, or 30 days.
- Message: Varies by milestone — see Section 7 milestone copy for all voice variants.
- Timing: Delivered immediately after the session that hits the milestone.
- Preference check: Respects user notification preferences.
- Auto-reduce rule: 3 consecutive ignored notifications reduces frequency by one tier for 7 days.

**Re-engagement nudge:**
- Trigger: User has played at least 3 craving-linked game sessions previously but has not played a craving-linked game session in the last 5 days.
- Message: Low-sensitivity, one-time nudge — see Section 7 re-engagement nudge copy.
- Timing: Sent at a fixed time: 6–7pm local time. Explicitly exempt from personalised risk-window timing — sending during a user's known high-risk window when they have not asked for help could feel manipulative.
- Preference check: Respects user notification preferences.
- Frequency: Sent once per re-engagement window. Not repeated until another 5-day gap occurs.
- Auto-reduce rule: 3 consecutive ignored notifications reduces frequency by one tier for 7 days.

**Stage 4 streak nudge:**
- Type: In-app card only. Not a push notification.
- Trigger: User in Stage 4 has not completed a craving-linked game session in 4 consecutive days.
- Delivery: Shown on home screen or games hub on next app open.
- Cooldown: 7 days between appearances.
- Lifetime cap: Maximum 2 appearances. After 2 fires, permanently_suppressed = true. Nudge never shown again.

*All other game interactions (session completions, reflections, streak updates) do not trigger notifications.*

---

## B4: API Surface

### What gets created

| Operation | Method | Data |
|---|---|---|
| Create session | POST | Sends: user_id, game_type, session_type, started_at, ended_at, all game-specific result fields, reflection_response. Returns: session_id. |

### What gets read

| Operation | Method | Data |
|---|---|---|
| Get game streak | GET | Returns: current_streak, longest_streak_ever, sessions_this_week, last_craving_session_date for the current user. |
| Get tool scores | GET | Returns: tool_score records (score_value, counts) for 'memory_1p', 'echo_tap', 'memory_2p'. Used by coping tool curation layer. |
| Get themed card content | GET | Returns: list of themed card image/text pairs appropriate for the user's current stage and milestone data. |
| Get streak nudge log | GET | Returns: times_shown, last_shown_at, permanently_suppressed for the current user. Used to enforce Stage 4 nudge cap. |

### What gets updated

| Operation | Method | Data |
|---|---|---|
| Update game streak | PATCH | Triggered server-side after a craving-linked session is created. Updates current_streak, longest_streak_ever, sessions_this_week, last_craving_session_date. |
| Update tool score | PATCH | Triggered server-side after reflection_response is recorded. Updates successful_resistance_count, slip_after_use_count, and recalculates score_value for the relevant game_type. |
| Update streak nudge log | PATCH | Triggered when nudge card is shown. Increments times_shown, updates last_shown_at. Sets permanently_suppressed = true if times_shown reaches 2. |

### What gets deleted

Nothing is deleted. Sessions, streaks, tool scores, and nudge logs persist across relapse restarts. If a user restarts their quit attempt, the quit timeline resets but all game data is preserved — consistent with LastOne's relapse rule that data and tool preferences always persist.

---

*LastOne — Mini-Games Feature Spec | V1.2 | April 2026 | Author: Vedant | Internal Use Only*

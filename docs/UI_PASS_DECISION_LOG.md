# UI Implementation Pass — Decision Log

Running log of work done and decisions made while implementing the design team's
Lovable design (`lovable-design-reference/`) onto the Expo app. Branch:
`UI-Implementations`. Rule: **app logic always wins; design = visuals only.**
Where design conflicts with a spec doc, the conflict is flagged and (if it needs
product taste) queued for review rather than decided unilaterally.

This log exists so Vedant can review every autonomous decision on return.

---

## TL;DR for your return (read this first)

**Commits on `UI-Implementations` since you left:** `cdb97ae` (Insights preview),
`5deb4ed` (profile header card). Earlier (with you): `4ce63a3`, `3f3642e`.
Everything typechecks; nothing pushed (you handle PRs/merges).

**What I did autonomously (all additive, no logic touched, no spec conflicts):**
1. Home Insights preview → design `RecentInsights` layout (icon + headline + body).
2. Settings root → added a profile header card (avatar + name + stage + 3 stats).

**Key finding:** your app is consistently MORE spec-complete than the design
mockups. The design mostly differs by (a) introducing V2/social features you've
excluded, or (b) proposing a different information architecture. Those are product
decisions, so I queued them instead of porting. The only safe autonomous wins were
the two additive visual pieces above.

**What needs YOUR decision (queued below, nothing built):**
- **Insights screen** — design reimagines it as a stats/explore hub; your spec says
  it's a generated-insight feed. Biggest conflict. Needs direction.
- **Progress detail** — same structure as design already, but design wants a
  different nav model (hero cards → drill-down vs your inline switcher). Recommend
  restyle-only; left for you because it touches Home deep-links.
- **Health Milestones (Home)** — design puts the full staged accordion on Home; spec
  says Home shows only the next-milestone countdown (full timeline = STK-8).
- **Profile IA** — design's two-level category nav + Community/social sections.
- **Games reconciliation, new tool families (Reframing/AI Chat/Content Cards),
  onboarding flow** — all product calls, untouched.

---

## Already reviewed WITH Vedant (committed)

**Commit `4ce63a3` — Batch A (Home chrome + cards):**
- TopBar (new): wordmark + bell + profile.
- BottomNav center button raise aligned to design.
- StreakBar → two-column Current | Lifetime (Vedant: label "Lifetime" not "Best").
- HomePersonalGoalCard (new), wired to useGoals. (Design override of spec §4.)
- ProgressDashboard (Home) → design 2-card grid Money+Cigs. (Design override of spec's 3-counter rule; Time Reclaimed stays on /progress.)

**Commit `3f3642e` — Batch A follow-up:**
- Greeting "Day X" subline removed.
- Home scroll order: Greeting → Content → Streak → Coping → Check-In → Progress(+savings,Goals) → Insights → Health Milestones. (Design wins on content-first + Check-In-before-Progress; spec wins on Insights pos 7.)
- 5-slot nav: Home · Community · [+] · Insights · Tools. Profile → TopBar only.
- Community = real tab → "coming soon" page.
- Content carousel: rotates every app open (was once/day); cards ~20% bigger.

Full rationale also in memory: `project_home_design_vs_spec.md`.

---

## Autonomous work (DONE while Vedant away) — REVIEW THESE

### Content cards — tap-to-expand reader + shadow-clip fix (session 2)
- Carousel cards are now TAPPABLE → open a full-screen `ContentCardReader`
  (`components/home/ContentCardReader.tsx`): green surface-accent gradient sheet
  (expo-linear-gradient, stops #67AC5F→#268255), drag handle, "Your body"-style
  pill, title, scrollable body, close button. Ported from the design's TodayFullCard.
- **Content decision:** reader shows the SAME resolved `body_copy` we already display
  (our content_cards have no long-form article field). Read-time line dropped (no
  field; design's was mock). "Go deeper with AI" button OMITTED (AI Chat deferred).
- Card face gained a "TAP TO READ MORE" affordance + body clamped to 3 lines.
- **Shadow-clip fix:** the horizontal ScrollView was clipping the soft card shadow at
  the scroll edge. Fixed via contentContainer paddingVertical 8 + the ScrollView
  marginVertical -8 + overflow visible, so shadows render fully while the row stays
  visually flush.
- ~~New dependency: `expo-linear-gradient@15.0.8`~~ → REMOVED. It ships native
  Android code, and the dev-build APK on-device was compiled before it existed, so
  Metro threw `UnableToResolveError` on device. Per Vedant: do Option B now (drop the
  native dep, unblock on current build) and switch to a true LinearGradient later
  (Option A) at the next dev-build rebuild. The reader now fakes the gradient with a
  solid FROM-green base (#67AC5F) + darkening TO-green overlays (#268255) at the
  bottom — no native module, works on the current build after a Metro `--clear` reload.
  TODO (later, with a rebuild): re-add expo-linear-gradient + restore the real
  LinearGradient in ContentCardReader for 100% fidelity.

### Profile header card (Settings root) — additive, clean win
- Added `components/settings/ProfileHeaderCard.tsx` to the top of the settings
  root: avatar initial + name + stage badge + 3-stat row (days clean / attempts
  / saved). Wired to data the root already loads (profile, stage, daysSinceQuit,
  attemptCount, dashboard.moneyLabel) — no new queries, no spec conflict. Design's
  "College student · Mumbai" subline omitted (mock, no backing field). Replaced
  the plain "Settings / Your Profile" text header.

### InsightsPreview (Home) — ported to design `RecentInsights` layout
- Clean port, NO spec conflict. Circular TrendingUp icon + headline + supporting
  line, deep-links to /insights. Logic unchanged (top-ranked feed item; same
  empty-state prompts). Mapped the design's secondary line to the real insight
  `content.body` (no invented data). Added a "Recent Insights" section eyebrow on
  Home to match the design. File: `components/home/InsightsPreview.tsx`.

---

## DECISIONS MADE on return (2026-06-20 session 2)

1. **Insights screen → ADOPT THE DESIGN HUB.** Vedant chose to re-architect Insights
   from the INS-1 generated-feed into the design's stats/explore hub (overview stat
   grid + "Cravings This Week" bar chart + Explore menu + game launchers). Implications
   to scope at build time: new aggregate queries for real stats (design numbers are
   mock); rebuild bar chart in react-native-svg (design used recharts/web); decide
   which Explore sub-views (Cravings/Top tools/Journal/Triggers/People/Places/Streaks)
   are real vs "coming soon"; this absorbs the games + new-tool-families questions
   (design launches games from here). The existing INS-1 feed logic may be preserved
   as one sub-view or retired — TBD at build. NOT YET BUILT.

2. **Progress detail (/progress) → DESIGN NAV MODEL + STYLING, keep real data.** Adopt
   the design's main "WHAT YOU'VE GAINED" view (3 hero cards: Money/Cigs/Time, icon +
   big number + relatable line + "Tap to explore") → tap into per-counter drill-downs
   with the scale ladder ("AT YOUR RATE", green year row) + reference cards. KEEP the
   app's real `scaleLadder()` math + canonical CM-01–08 Milestone System reference
   cards (NOT the design's mock copy). Must update Home's progress-card deep-links
   (currently `?counter=`) to land on the right drill-down. NOT YET BUILT.

3. **Health Milestones (Home) → COUNTDOWN ON HOME + ACCORDION ON TAP.** Keep the lean
   single-line "Next: X in N days" countdown on Home (honors Home spec §G), restyled to
   the design card look. Tapping it opens the design's full multi-stage expandable
   accordion (Stage 1/2/3, unlocked/locked checklists, in-progress badge) as the next
   screen — needs building as a real screen wired to actual unlocked-milestone state
   (design's stage data is mock). Currently Home card taps to /progress; will repoint
   to the new milestone-timeline screen. NOT YET BUILT.

4. **Profile/Settings → FULL DESIGN incl. Community section.** Rework the flat
   one-level Settings into the design's two-level category nav (category rows → category
   sub-screens with inline toggles/pills/text-input), AND add the Community section
   (Refer & Invite, Your Cheerleaders) as "coming soon" placeholders (consistent with
   the Community nav tab). KEEP all existing real data + edit logic underneath. Open
   sub-decisions to resolve AT BUILD: (a) "Best streak" → use "Lifetime" (consistent
   w/ Home StreakBar decision); (b) Dark mode toggle — confirm if it toggles anything
   or is a disabled placeholder; (c) Quit helplines (iCall/NIMHANS) — security
   constraints require verified NGO numbers/URLs before shipping, so use verified
   contacts or hold those rows. NOT YET BUILT.

5a. **Games → ADD design's new ones, KEEP yours.** Keep Echo Tap + Memory 1P/2P (and
    hub/streaks). ADD Physiological Sigh + Finger Pulse Press as new games (port from
    design's FingerPulsePressGame/PhysiologicalSighGame, rebuild for RN). For the
    overlapping "Memory", keep the app's existing working version. Net: bigger library.
    NOT YET BUILT.

5b. **New tool families → BUILD SIMPLE ONES, DEFER AI.** Add to the tool catalog:
    Reframing (Urge Surfing, Future Self Letter, Cost Reframe, Name the Trigger) and
    Content Cards (First 5 minutes, The 3-minute peak, Nicotine + dopamine) as REAL
    tools — mostly text/reflection/read flows. AI Chat (Talk it out / Why am I craving
    / Pep talk) = "coming soon" placeholder (needs LLM backend — deferred). Wire into
    the existing Tools library + tools.ts FAMILY_COLORS already has the 3 family chips.
    NOT YET BUILT.

6. **Onboarding → INCREMENTAL RESKIN, screen-group by group.** The app's ~22-screen
   onboarding (OB01–OB23) is fully working (Supabase, account creation OB05, real
   persistence, device-verified). The design's 909-line OnboardingFlow is the SAME flow
   content-wise (collects ~the same 23 steps) but with the design team's visual
   treatment (static mockup, no persistence). Approach: reskin in SMALL BATCHES
   (suggest: narrative/buffer screens → question screens → account+cost+quit-date+
   commitment+confirmation), KEEPING all logic, and VERIFY EACH GROUP ON DEVICE before
   moving on (high-stakes — first thing every user sees). NOT YET BUILT.

## All product decisions now resolved (none of 1–6 built yet)

Build order (CONFIRMED with Vedant 2026-06-20 — onboarding explicitly LAST):
  content reader (DONE) → Progress detail → Health Milestones accordion → new games +
  simple tool families → Profile/Settings rework → Insights hub → **Onboarding (LAST)**.
Onboarding is held until everything else is done, per Vedant. Confirm which item to
start before each build.

- **Insights screen — BIGGEST design↔spec conflict. LEFT UNTOUCHED.** The design's `InsightsScreen` (449 lines, the most-reworked file in the design pass) reimagines the Insights tab as a STATS-AND-EXPLORE HUB: an overview stat grid (total cravings / beaten / success rate / SOS used), a "Cravings This Week" bar chart, and an "Explore" menu (Cravings / Top tools / Journal / Triggers / People / Places / Streaks) — and it even embeds the games (Memory / PhysiologicalSigh / FingerPulse) as sub-views. The app's `insights.tsx` is INS-1 from the Insights spec: a RANKED VERTICAL FEED of generated insight cards derived from the user's own data (expand-in-place, ranking re-runs on focus, "the self-awareness feed / entry point from all navigation"). These are two different products for the same tab. Adopting the design means re-architecting Insights from a generated-feed into an analytics explorer + tool launcher — a major product decision that also absorbs the games + new-tool-families questions. NEEDS YOUR DIRECTION before any work. (The design's stat numbers + bar chart are also all mock; real versions would need new aggregate queries. The bar chart uses recharts → would be react-native-svg.)

- **Games reconciliation** — design ships FingerPulsePress / Memory / PhysiologicalSigh; app already has Echo Tap + Memory 1P/2P. Are the new ones additions or replacements? Needs decision. (Also note: in the design these games are launched from INSIDE the Insights hub — see the Insights conflict above.)
- **New tool families** — design's `tools.ts` adds Reframing (REF-01..04), AI Chat (AIC-01..03), Content Cards (CON-01..03). Are these functional screens or visual-only catalog entries? AI Chat especially implies a backend.
- **Onboarding flow** — design's 909-line OnboardingFlow vs the app's existing working onboarding (Step 7). High-stakes reskin; left for review.

- **Profile/Settings information architecture — LEFT MOSTLY UNTOUCHED (only the header card added).** The design's `ProfileScreen` uses a DIFFERENT architecture than the app's flat PROF-01 settings: (a) grouped CATEGORY rows (Your Journey / Preferences / Find Support / Privacy) that drill into category sub-screens with their own sub-sections — a two-level hierarchy vs the app's one-level (each row → one edit screen); (b) inline toggles/pills/text-input inside the preference sub-screens vs the app's push-to-edit-screen model; (c) a "Community" section (Refer & Invite, Your Cheerleaders) — both V2/social, which the app excludes; (d) content conflicts: design shows "Best streak" (you chose "Lifetime"), a "Dark mode" toggle (may not exist), and quit helplines (your security constraints require NGO URL/number verification before shipping). Reworking this is an IA + product decision touching the Settings spec — queued. Only the additive profile header card was applied.

- **Progress detail screen (`/progress`, DASH-2) — interaction-model decision, LEFT UNTOUCHED.** The app's `progress.tsx` already implements the SAME structure as the design (hero counter + value, a "scale ladder" of per day/week/month/year, and horizontal milestone reference cards with active/locked states) — but wired to REAL data and CANONICAL content: `useMilestoneCards` (your CM-01–08 from the Milestone System spec), real `scaleLadder()` math, real `cigarettesNotSmoked` thresholds. The design's versions are hardcoded MOCK copy ("13 Zomato orders", Goa-trip reference cards). Two differences that are TASTE/PRODUCT calls, not mechanical paint:
  1. **Navigation model.** App = ONE screen with an inline counter-switcher (pills toggle money/time/cigs in place); Home deep-links via `?counter=`. Design = a "WHAT YOU'VE GAINED" main view with 3 hero cards (icon + label + big number + relatable equiv + "Tap to explore"), each tapping into a separate drill-down view. Adopting the design's model changes how Home's counter cards deep-link. Needs your call.
  2. **Reference-card content.** Design's reference-card copy is mock and differs from your canonical Milestone System cards. Keep yours (recommended — it's the spec content); only restyle.
  RECOMMENDATION (for when you're back): keep the app's data/content + nav model, adopt the design's VISUAL styling only (hero-card look, "AT YOUR RATE" ladder with green year row, reference-card pills/opacity). But since it touches the nav model + Home deep-links, I left it for you rather than reworking unilaterally.
- **Any design↔spec conflict** encountered during autonomous work is logged here, not decided.

- **Health Milestones card (Home) — design vs spec conflict.** Design's `HealthMilestones` is a multi-stage EXPANDABLE ACCORDION (Stage 1/2/3, each with an unlocked/locked checklist, "In progress" badge, "View more"). The app's `HealthMilestonesCard` is intentionally a single-line forward-looking countdown ("Next: X in N days") — because **Home Spec §G explicitly says** the Home card shows ONLY the next upcoming milestone, forward-looking only; earned milestones + the staged checklist live in the full STK-8 timeline, NOT on Home. So the design puts the whole STK-8 timeline on Home. This is a product call: do you want the full staged accordion on Home (design), or keep Home as the countdown teaser + accordion on the timeline screen (spec)? LEFT UNTOUCHED pending review. (Note: the design's stage data is also static/mock — wiring it to real unlocked-milestone state would be additional logic work.)

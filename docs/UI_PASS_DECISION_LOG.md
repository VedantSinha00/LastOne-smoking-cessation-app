# UI Implementation Pass — Decision Log

Running log of work done and decisions made while implementing the design team's
Lovable design (`lovable-design-reference/`) onto the Expo app. Branch:
`UI-Implementations`. Rule: **app logic always wins; design = visuals only.**
Where design conflicts with a spec doc, the conflict is flagged and (if it needs
product taste) queued for review rather than decided unilaterally.

This log exists so Vedant can review every autonomous decision on return.

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

### InsightsPreview (Home) — ported to design `RecentInsights` layout
- Clean port, NO spec conflict. Circular TrendingUp icon + headline + supporting
  line, deep-links to /insights. Logic unchanged (top-ranked feed item; same
  empty-state prompts). Mapped the design's secondary line to the real insight
  `content.body` (no invented data). Added a "Recent Insights" section eyebrow on
  Home to match the design. File: `components/home/InsightsPreview.tsx`.

---

## QUEUED for Vedant (needs product taste — NOT touched)

- **Games reconciliation** — design ships FingerPulsePress / Memory / PhysiologicalSigh; app already has Echo Tap + Memory 1P/2P. Are the new ones additions or replacements? Needs decision.
- **New tool families** — design's `tools.ts` adds Reframing (REF-01..04), AI Chat (AIC-01..03), Content Cards (CON-01..03). Are these functional screens or visual-only catalog entries? AI Chat especially implies a backend.
- **Onboarding flow** — design's 909-line OnboardingFlow vs the app's existing working onboarding (Step 7). High-stakes reskin; left for review.
- **Any design↔spec conflict** encountered during autonomous work is logged here, not decided.

- **Health Milestones card (Home) — design vs spec conflict.** Design's `HealthMilestones` is a multi-stage EXPANDABLE ACCORDION (Stage 1/2/3, each with an unlocked/locked checklist, "In progress" badge, "View more"). The app's `HealthMilestonesCard` is intentionally a single-line forward-looking countdown ("Next: X in N days") — because **Home Spec §G explicitly says** the Home card shows ONLY the next upcoming milestone, forward-looking only; earned milestones + the staged checklist live in the full STK-8 timeline, NOT on Home. So the design puts the whole STK-8 timeline on Home. This is a product call: do you want the full staged accordion on Home (design), or keep Home as the countdown teaser + accordion on the timeline screen (spec)? LEFT UNTOUCHED pending review. (Note: the design's stage data is also static/mock — wiring it to real unlocked-milestone state would be additional logic work.)

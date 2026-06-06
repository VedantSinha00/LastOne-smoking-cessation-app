# LastOne — V1 Build Playbook

> Step-by-step construction guide. Directed at Claude Code / Antigravity.
> Written for someone who is directing AI to write the code — not writing it line by line.
> Each step ends with a **Verify** section. Do not move to the next step until it passes.
>
> Stack: Expo (React Native) · TypeScript · Expo Router · NativeWind · Supabase · React Query
>
> Spec source of truth: `specs/v1.2/` — read the relevant spec before prompting for each feature.
> Data model source of truth: `specs/LastOne_Data_Schema_V1.md`
>
> **Status:** Complete. All phases written (0–7, Steps 1–21).

---

## Phase 0 — Foundation [DONE]

### Step 1 — Project Scaffold [DONE]

Antigravity scaffolded the monorepo with the following prompt:

```
Framework: Expo (React Native) with TypeScript and Expo Router
Structure: Monorepo — Frontend Expo app + Supabase Edge Functions backend in one repo
Navigation: Expo Router with tab bar (3 tabs: Home, Tools, Profile) and auth flow.
  Log button is a central FAB (opens half-sheet with flow A/B/C/D options).
  SOS is a persistent red FAB on every main screen.
Styling: NativeWind v4 (Tailwind CSS for React Native)
Backend: Supabase — create lib/supabase.ts client, types/database.ts for type gen
Folder structure:
  app/ (screens + (modals)/ route group + auth/ + onboarding/)
  components/ (ui/ streak/ logging/ sos/ content/ tools/ insights/)
  lib/ (supabase.ts, constants.ts, utils.ts, queryKeys.ts, streak.ts, savings.ts)
  hooks/ (useAuth.ts, useProfile.ts, useCurrentAttempt.ts, useStreakRecord.ts,
          useLogs.ts, useStage.ts, useSavings.ts)
  types/ (database.ts, app.ts)
  supabase/ (migrations/ functions/ seed.sql)
  assets/
State: React Query (TanStack Query) for all server state. React Context for auth only.
```

### Step 2 — Supabase Project Setup [DONE]

Supabase project created at supabase.com. URL and anon key written to `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3 — First Run Verification [DONE]

`npx expo start` runs. App loads in Expo Go on device.

### Step 4 — Supabase Connection Test [DONE]

`lib/supabase.ts` initialised with SecureStore adapter. Simple query confirmed a round-trip to Supabase succeeds.

---

## Phase 1 — Infrastructure

### Step 5 — Database Migrations + RLS [DONE]

**What this delivers:** Every table in the V1 data model exists in Supabase with correct types, constraints, and row-level security. Nothing can be built on top until this is solid.

**Spec reference:** `specs/LastOne_Data_Schema_V1.md` — read this in full before running any migration.

**How to run migrations:** Paste each SQL block into the Supabase dashboard → SQL Editor, or save as numbered files in `supabase/migrations/` and apply with the Supabase CLI (`supabase db push`). Run them in order — later migrations reference earlier tables.

#### Global utility function (run first, once)

```sql
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

#### Migration 001 — `profiles`

```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  display_name text check (char_length(display_name) <= 30),
  email text,
  age_range text check (age_range in ('under_16','16_18','18_22','22_26','26_plus')),
  life_stage text check (life_stage in ('college_student','final_year','fresh_graduate','working')),
  intent text check (intent in ('quit','figuring_out')),
  cigarettes_per_day integer check (cigarettes_per_day > 0),
  price_per_cigarette numeric(10,2) check (price_per_cigarette > 0),
  smoking_reasons text[],
  trigger_times text[],
  time_to_first_cigarette text check (time_to_first_cigarette in
    ('within_5','within_30','within_60','later','not_daily')),
  craving_intensity text check (craving_intensity in ('low','medium','high','overwhelming')),
  previous_quit_attempts text check (previous_quit_attempts in
    ('never','one_two','three_five','five_plus','lost_count')),
  quit_struggles text[],
  motivation text check (motivation in
    ('health','money','others','independence','fitness','wake_up_call','no_reason')),
  commitment_reason text,
  commitment_identity text,
  voice_style text not null default 'steady_and_direct'
    check (voice_style in ('steady_and_direct','emotional_and_understanding','real_and_practical')),
  relatable_category text not null default 'food_delivery'
    check (relatable_category in
      ('food_delivery','movies_ott','music_podcasts','travel','gaming','clothes_shopping')),
  notifications_enabled boolean not null default true,
  notification_preference text not null default 'app_decides'
    check (notification_preference in ('app_decides','few_daily','on_demand')),
    -- NOTE: 'once_daily' does NOT exist. Do not add it.
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  last_giving_up_trigger_at timestamptz,
  giving_up_card_dismissed_count integer not null default 0,
  timezone text not null default 'Asia/Kolkata',
  risk_windows jsonb,
  onboarding_complete boolean not null default false,
  account_created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, account_created_at)
  values (new.id, new.email, now());
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "users can view own profile" on public.profiles for select using (id = auth.uid());
create policy "users can update own profile" on public.profiles for update using (id = auth.uid());
```

#### Migration 002 — `quit_attempts`

```sql
create table public.quit_attempts (
  attempt_id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quit_date date,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  dependency_level text check (dependency_level in ('light','moderate','heavy')),
  created_at timestamptz not null default now()
);

create index quit_attempts_user_current on public.quit_attempts (user_id) where ended_at is null;

alter table public.quit_attempts enable row level security;
create policy "users can view own quit attempts" on public.quit_attempts for select using (user_id = auth.uid());
create policy "users can insert own quit attempts" on public.quit_attempts for insert with check (user_id = auth.uid());
create policy "users can update own quit attempts" on public.quit_attempts for update using (user_id = auth.uid());
```

#### Migration 003 — `log`

```sql
create table public.log (
  log_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id integer references public.quit_attempts(attempt_id),
  log_type text not null check (log_type in ('craving','overcome','slip','note','sos')),
  timestamp timestamptz not null default now(),
  quit_day_number integer not null,
  current_stage integer not null check (current_stage between 0 and 5),
  entry_method text not null check (entry_method in ('daily_card','fab','sos','notification')),
  routed_to_sos boolean not null default false,
  other_text text check (char_length(other_text) <= 60),
  -- CRAVING fields
  intensity integer check (intensity between 1 and 5),
  -- intensity = 5 triggers SOS override. Scale is 1–5 ONLY. Never 1–10.
  triggers text[],
  location text[],
  social_context text[],
  mood integer check (mood between 1 and 5),
  -- OVERCOME fields
  what_helped text[],
  -- SLIP fields
  slip_type text check (slip_type in ('one_off','few_days','return_to_smoking')),
  cigarette_count integer,
  -- 1–4 = exact count. 99 = sentinel for '5+'. Display layer converts 99 → '5+'. Never show 99.
  slip_triggers text[],
  source text check (source in ('flow_c','return_modal')),
  -- SOS fields
  tool_selected text,
  tool_duration_seconds integer,
  tool_helpful boolean,
  post_tool_state text check (post_tool_state in ('better','same','smoked')),
  -- NOTE fields
  note_text text check (char_length(note_text) <= 280),
  has_photo boolean default false,
  created_at timestamptz not null default now()
);

create index log_user_attempt on public.log (user_id, attempt_id);
create index log_user_type_time on public.log (user_id, log_type, timestamp desc);
create index log_sos_24h on public.log (user_id, timestamp desc) where log_type = 'sos';
create index log_slip_type on public.log (user_id, slip_type) where log_type = 'slip';

alter table public.log enable row level security;
create policy "users can view own logs" on public.log for select using (user_id = auth.uid());
create policy "users can insert own logs" on public.log for insert with check (user_id = auth.uid());
create policy "users can update own logs" on public.log for update using (user_id = auth.uid());
```

#### Migration 004 — `streak_record`

```sql
create table public.streak_record (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak_days integer not null default 0,
  lifetime_smoke_free_days integer not null default 0,
  longest_streak_ever integer not null default 0,
  consistency_rate numeric(5,1) not null default 0,
  -- Formula: smoke_free_days_in_attempt / active_days_in_attempt × 100
  smoke_free_days_in_attempt integer not null default 0,
  active_days_in_attempt integer not null default 0,
  freeze_stock integer not null default 0,
  freeze_period integer not null default 0 check (freeze_period between 0 and 3),
  -- 0 = Days 1–14, 1 = Days 15–28, 2 = Days 29–90, 3 = Days 91+
  freeze_max_current_period integer not null default 0,
  -- FREEZE_MATRIX[dependency_level][freeze_period]:
  --   Period 0: light=2, moderate=3, heavy=4
  --   Period 1: light=1, moderate=2, heavy=3
  --   Period 2: light=1, moderate=1, heavy=2
  --   Period 3: light=0, moderate=1, heavy=1
  dependency_level text not null default 'moderate'
    check (dependency_level in ('light','moderate','heavy')),
  dependency_level_pending text check (dependency_level_pending in ('light','moderate','heavy')),
  current_stage integer not null default 0 check (current_stage between 0 and 5),
  streak_status text not null default 'active'
    check (streak_status in ('active','paused','reset')),
  last_confirmed_date date,
  streak_start_date date,
  confirmation_source text check (confirmation_source in ('sos','log')),
  -- 'sos' = optimistic (reversible same-day if slip logged); 'log' = final
  paused_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger streak_record_updated_at before update on public.streak_record
  for each row execute procedure public.handle_updated_at();

alter table public.streak_record enable row level security;
create policy "users can view own streak" on public.streak_record for select using (user_id = auth.uid());
create policy "users can insert own streak" on public.streak_record for insert with check (user_id = auth.uid());
create policy "users can update own streak" on public.streak_record for update using (user_id = auth.uid());
```

#### Migration 005 — `slip_state`

```sql
create table public.slip_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  red_flag_count integer not null default 0,
  last_slip_date date,
  pattern_window_open boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger slip_state_updated_at before update on public.slip_state
  for each row execute procedure public.handle_updated_at();

alter table public.slip_state enable row level security;
create policy "users can manage own slip state" on public.slip_state for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 006 — `coping_tools` catalog

```sql
create table public.coping_tools (
  tool_id text primary key,
  data_model_id text not null unique,
  family text not null check (family in ('breathing','physical','mini_games')),
  name text not null,
  category text not null check (category in
    ('physical_reset','cognitive_reframe','distraction','social_coping','reflective','breathing')),
  intensity_min integer not null check (intensity_min between 1 and 5),
  intensity_max integer not null check (intensity_max between 1 and 5),
  context text[],
  duration_seconds integer not null,
  sos_eligible boolean not null default true,
  library_only boolean not null default false,
  requires_buddy boolean not null default false,
  stage_min integer,
  emotional_tags text[]
);

alter table public.coping_tools enable row level security;
create policy "authenticated users can read coping tools" on public.coping_tools for select
  to authenticated using (true);
```

#### Migration 007 — `user_tool_scores`

```sql
create table public.user_tool_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool_id text not null references public.coping_tools(tool_id),
  tool_score integer not null default 0,
  -- Cumulative: +1 thumbs_up, -1 thumbs_down.
  total_uses integer not null default 0,
  is_weighted boolean not null default false,  -- true when total_uses >= 5
  last_used_at timestamptz,
  post_tool_state text check (post_tool_state in ('better','same','smoked')),
  removed_from_sos boolean not null default false,
  -- Set true when tool_score < -2 AND total_uses >= 5
  primary key (user_id, tool_id)
);

alter table public.user_tool_scores enable row level security;
create policy "users can manage own tool scores" on public.user_tool_scores for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 008 — `user_sos_state`

Note: `friend_phone_number` is device-only (SecureStore) — it does NOT exist in this table.

```sql
create table public.user_sos_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  failed_sos_count integer not null default 0,
  consecutive_sos_successes integer not null default 0,
  window_started_at timestamptz
);

alter table public.user_sos_state enable row level security;
create policy "users can manage own sos state" on public.user_sos_state for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 009 — `notification_log` + `notification_state`

```sql
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  -- Valid values: N-OB-00, N-OB-01/02/03/04/05, N-STK-01/02/03,
  -- N-CON-01 through N-CON-12, N-INS-01/02/03, N-GOAL-01/02, N-PROF-01, N-PAU-01/02/03/04
  status text not null default 'queued'
    check (status in ('queued','delivered','opened','ignored','expired','discarded')),
  scheduled_for timestamptz not null,
  delivered_at timestamptz,
  opened_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index notification_log_user_status on public.notification_log (user_id, status);
create index notification_log_scheduled on public.notification_log (scheduled_for) where status = 'queued';

alter table public.notification_log enable row level security;
create policy "users can view own notification log" on public.notification_log for select using (user_id = auth.uid());
create policy "users can manage own notification log" on public.notification_log for insert with check (user_id = auth.uid());
create policy "users can update own notification log" on public.notification_log for update using (user_id = auth.uid());

create table public.notification_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  consecutive_ignored integer not null default 0,
  -- Resets to 0 on any notification opened. Hits 3 → auto-reduce activates for 7 days.
  auto_reduce_active_until timestamptz,
  effective_tier text not null default 'app_decides'
    check (effective_tier in ('app_decides','few_daily','on_demand'))
);

alter table public.notification_state enable row level security;
create policy "users can manage own notification state" on public.notification_state for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 010 — `insight_card` + `insight_notification`

```sql
create table public.insight_card (
  insight_key text primary key,
  -- Format: {user_id}_{insight_type}_{attempt_id}. Prevents duplicate generation.
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id integer not null references public.quit_attempts(attempt_id),
  insight_type text not null check (insight_type in (
    'peak_risk_window','top_trigger','resistance_rate','tool_effectiveness',
    'slip_pattern','craving_drop','cross_attempt_comparison','trigger_shift',
    'profile_peak_windows','profile_social_context','profile_trigger_category',
    'first_craving_match'
  )),
  card_state text not null default 'collapsed' check (card_state in ('collapsed','expanded','read')),
  has_app_action boolean not null default false,
  tone_sensitivity text not null check (tone_sensitivity in ('high','low')),
  generated_at timestamptz not null default now(),
  last_seen_at timestamptz,
  engagement_score numeric(6,2) not null default 0,
  archived boolean not null default false
);

create index insight_card_user_attempt on public.insight_card (user_id, attempt_id, generated_at desc);

alter table public.insight_card enable row level security;
create policy "users can view own insight cards" on public.insight_card for select using (user_id = auth.uid());
create policy "users can insert own insight cards" on public.insight_card for insert with check (user_id = auth.uid());
create policy "users can update own insight cards" on public.insight_card for update using (user_id = auth.uid());

create table public.insight_notification (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  insight_key text not null references public.insight_card(insight_key),
  notification_type text not null check (notification_type in (
    'new_pattern_detected','progress_threshold','slip_pattern_emerging'
  )),
  scheduled_for timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'queued' check (status in ('queued','delivered','expired','discarded')),
  content_id text not null
);

alter table public.insight_notification enable row level security;
create policy "users can manage own insight notifications" on public.insight_notification for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 011 — `content_cards` + `user_card_history`

```sql
create table public.content_cards (
  id uuid primary key default gen_random_uuid(),
  card_id text not null unique,
  pill_tag text not null,
  title text not null,
  body_copy text,
  body_copy_steady text,
  body_copy_warm text,
  body_copy_practical text,
  trigger_type text not null,
  -- Values: scheduled, contextual, slip_logged, savings_milestone, stage_change, time_milestone
  trigger_value text not null,
  sensitivity text not null check (sensitivity in ('low','high')),
  stage_min integer,
  stage_max integer,
  active boolean not null default true
);

alter table public.content_cards enable row level security;
create policy "authenticated users can read content cards" on public.content_cards for select
  to authenticated using (true);

create table public.user_card_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id text not null references public.content_cards(card_id),
  last_shown_at timestamptz not null default now(),
  show_count integer not null default 1,
  unique (user_id, card_id)
);

alter table public.user_card_history enable row level security;
create policy "users can manage own card history" on public.user_card_history for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 012 — `goal` + `top_up_log` + `causes_card_log`

`current_amount` on `goal` is always derived from `SUM(top_up_log.amount)` — never written directly.

```sql
create table public.goal (
  goal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_name text not null check (char_length(goal_name) <= 60),
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0,
  allocated_amount numeric(12,2) not null default 0,
  source text not null check (source in ('link','manual')),
  product_url text,
  product_image_url text,
  emoji text,
  why text check (char_length(why) <= 200),
  status text not null default 'active' check (status in ('active','completed','retired')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.goal enable row level security;
create policy "users can manage own goals" on public.goal for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.top_up_log (
  topup_id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goal(goal_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.top_up_log enable row level security;
create policy "users can manage own top ups" on public.top_up_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.causes_card_log (
  log_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ngo_id text not null check (ngo_id in ('CFI','CPAA','CanSupport')),
  shown_at timestamptz not null default now(),
  dismissed_at timestamptz,
  tapped_learn_more boolean not null default false
);

alter table public.causes_card_log enable row level security;
create policy "users can manage own causes log" on public.causes_card_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 013 — `cpd_change_log` + `price_change_log`

```sql
create table public.cpd_change_log (
  log_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  previous_value integer not null,
  new_value integer not null,
  changed_at timestamptz not null default now()
);

alter table public.cpd_change_log enable row level security;
create policy "users can manage own cpd log" on public.cpd_change_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.price_change_log (
  log_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  previous_value numeric(10,2) not null,
  new_value numeric(10,2) not null,
  changed_at timestamptz not null default now()
);

alter table public.price_change_log enable row level security;
create policy "users can manage own price log" on public.price_change_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 014 — `giving_up_event`

```sql
create table public.giving_up_event (
  event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  triggered_at timestamptz not null default now(),
  current_stage integer not null check (current_stage between 0 and 5),
  trigger_condition text not null check (trigger_condition in
    ('slip_threshold','return_to_smoking','passive_disengagement')),
  beat_1_completed boolean not null default false,
  beat_2_completed boolean not null default false,
  resistance_count_shown integer,
  outcome text check (outcome in ('kept_going','routed_to_support','dismissed_mid_flow')),
  support_action text check (support_action in
    ('called_person','whatsapped_person','viewed_resources','dismissed')),
  support_call_outcome text check (support_call_outcome in
    ('helped_a_lot','helped_a_little','didnt_help','not_logged'))
);

alter table public.giving_up_event enable row level security;
create policy "users can manage own giving up events" on public.giving_up_event for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Migration 015 — `game_session` + `game_streak` + `streak_nudge_log`

```sql
create table public.game_session (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_type text not null check (game_type in ('memory_1p','echo_tap','memory_2p')),
  session_type text not null check (session_type in ('craving_linked','casual')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  stage_at_session integer not null check (stage_at_session between 0 and 5),
  grid_size text check (grid_size in ('3x4','4x4')),
  card_skin text check (card_skin in ('generic','themed')),
  pairs_matched integer,
  time_taken_seconds integer,
  sequences_completed integer,
  longest_streak integer,
  player1_score integer,
  player2_score integer,
  winner text check (winner in ('player1','player2','draw')),
  reflection_response text check (reflection_response in ('passed','partial','ongoing'))
);

create index game_session_user_type on public.game_session (user_id, session_type, started_at desc);

alter table public.game_session enable row level security;
create policy "users can manage own game sessions" on public.game_session for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.game_streak (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak_ever integer not null default 0,
  sessions_this_week integer not null default 0,
  last_craving_session_date date
);

alter table public.game_streak enable row level security;
create policy "users can manage own game streak" on public.game_streak for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.streak_nudge_log (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  times_shown integer not null default 0,
  last_shown_at timestamptz,
  permanently_suppressed boolean not null default false
);

alter table public.streak_nudge_log enable row level security;
create policy "users can manage own streak nudge log" on public.streak_nudge_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

#### Step 5 — Verify

- [ ] All 23 tables appear in the Table Editor
- [ ] Every table shows "RLS enabled" in the Auth → Policies view
- [ ] `profiles` shows RLS policies for select and update
- [ ] `quit_attempts` index `quit_attempts_user_current` appears in the indexes list
- [ ] The `handle_new_user` trigger exists in Database → Triggers
- [ ] Sign up a test user via Supabase Auth → confirm a row auto-appeared in `profiles`
- [ ] `onboarding_complete` is `false` on that row
- [ ] `coping_tools` and `content_cards` are empty (seed data comes later in Step 13/14)

---

### Step 6 — Auth Flow [DONE]

**What this delivers:** Users can sign up and log in via Google OAuth. The app shows the auth screens when no session exists, the onboarding when `onboarding_complete = false`, and the main app when fully set up. Session persists across app restarts.

**Architecture decisions made:**
- `signInWithGoogle` uses PKCE flow via `expo-web-browser` + `supabase.auth.signInWithOAuth`
- Only Web OAuth client needed — auth routes through Supabase servers, not native Google SDKs
- `onAuthStateChange` with `INITIAL_SESSION` event is the single source of truth (no separate `getSession()`)
- Auth gate uses imperative `router.replace` in `useEffect` with `useSegments` guard (NOT `<Redirect>` component — causes re-render loops)
- Profile data removed from auth context; accessed via React Query `queryKeys.profile`

**Step 6 Verify [DONE]:**
- [x] `_layout.tsx` routes to `/onboarding` (showing placeholder screen)
- [x] Kill and relaunch the app — session persists
- [x] Log out — session clears — routed back to `/onboarding`
- [x] Manually set `onboarding_complete = true` — relaunch — routed to main tabs
- [ ] Full OAuth tap-through *(deferred — needs Android dev build with `lastone://` scheme)*

---

## Phase 2 — Onboarding

### Step 7 — Onboarding Flow

**What this delivers:** A new user can open the app, go through the full intro + account creation + question sequence, and land on the home screen with a complete profile, a first `quit_attempts` row, and an initialised `streak_record`.

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Onboarding_Spec_V1.2.docx` — read in full. Sections B2 (derived fields), B2.1 (dependency score), B2.4 (quit date rules), and B6 (edge cases) are the most build-critical.

#### 7.1 — Architecture principles

**One write, at the end.** All answers held in `OnboardingContext`. Nothing written to DB until OB-23. No auto-save.

**Account creation at OB-05.** `signInWithGoogle()` called mid-flow. DB trigger creates `profiles` row. OB-06 through OB-22 populate local state only.

**Auth routing:** `user = null` → `/onboarding`. `user exists + onboarding_complete = false` → `/onboarding` (OB-05 detects existing session and skips account creation). `user exists + onboarding_complete = true` → main tabs.

#### 7.2 — Folder structure

```
app/onboarding/
  _layout.tsx       → simple Stack layout, no tab bar, no back gesture on OB-01/02
  index.tsx         → reads currentStep from context, renders the right screen component

components/onboarding/
  OB01Logo.tsx  OB02Welcome.tsx  OB03Intro.tsx  OB04Promise.tsx
  OB05CreateAccount.tsx  OB06Name.tsx  OB07Age.tsx  OB08LifeStage.tsx
  OB09Buffer1.tsx  OB10Intent.tsx  OB11CigarettesAndCost.tsx
  OB12SmokingReasons.tsx  OB13TriggerTimes.tsx  OB14FirstCigarette.tsx
  OB15CravingIntensity.tsx  OB16QuitHistory.tsx
  OB17QuitStruggles.tsx   → conditional: only if quit history != 'never'
  OB18Buffer2.tsx  OB19Motivation.tsx  OB20QuitDate.tsx
  OB22Commitment.tsx      → conditional: only if quit_date != null
  OB23Confirmation.tsx

lib/
  onboarding.ts           → dependency calculation, smoker_profile, freeze init
```

#### 7.3 — `OnboardingContext` (in `hooks/useOnboarding.ts`)

```ts
type OnboardingState = {
  currentStep: number
  userId: string | null
  firstName: string
  ageRange: string
  lifeStage: string
  intent: 'quit' | 'figuring_out' | null
  cigarettesPerDay: number          // default 5
  pricePerCigarette: number         // default 15
  smokingReasons: string[]
  triggerTimes: string[]
  timeToFirstCigarette: string | null
  cravingIntensity: string | null
  previousQuitAttempts: string | null
  quitStruggles: string[] | null
  motivation: string | null
  quitDate: Date | null
  commitmentReason: string | null
  commitmentIdentity: string | null
}

type OnboardingActions = {
  setAnswer: (field: keyof OnboardingState, value: any) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
}
```

#### 7.4 — Screen sequence

| Step | Screen | Branch condition |
|---|---|---|
| 0 | OB01Logo | Auto-advance after 2s |
| 1–3 | OB02–OB04 | — |
| 4 | OB05CreateAccount | If `userId` exists, skip to step 5 |
| 5–14 | OB06–OB15 | — |
| 15 | OB16QuitHistory | — |
| 16 | OB17QuitStruggles | **Skip if** `previousQuitAttempts === 'never'` → `goToStep(17)` |
| 17 | OB18Buffer2 | — |
| 18 | OB19Motivation | — |
| 19 | OB20QuitDate | Skip → `quitDate = null`, `goToStep(21)` |
| 20 | OB22Commitment | Only if `quitDate != null` |
| 21 | OB23Confirmation | — |

#### 7.5 — OB-22 hold mechanic

3-second hold button. `Animated.Value(0)` for fill progress. `pressIn` starts `Animated.timing` over 3000ms. `pressOut` before complete → stop and reset. Animation complete → `nextStep()`. Button disabled (opacity 0.4 + `pointerEvents: 'none'`) when either commitment blank is empty.

#### 7.6 — `lib/onboarding.ts` — calculations

```ts
const CRAVING_WEIGHTS: Record<string, number> = { low: 1, medium: 2, high: 3, overwhelming: 4 }
const FIRST_CIG_WEIGHTS: Record<string, number> = {
  within_5: 4, within_30: 3, within_60: 2, later: 1, not_daily: 1
}

export function calcDependencyLevel(
  cravingIntensity: string, timeToFirstCig: string
): 'light' | 'moderate' | 'heavy' {
  const score = CRAVING_WEIGHTS[cravingIntensity] + FIRST_CIG_WEIGHTS[timeToFirstCig]
  if (score <= 3) return 'light'
  if (score <= 5) return 'moderate'
  return 'heavy'
}

export const FREEZE_MATRIX: Record<string, number[]> = {
  light:    [2, 1, 1, 0],
  moderate: [3, 2, 1, 1],
  heavy:    [4, 3, 2, 1],
}

export function initialFreezeStock(level: 'light' | 'moderate' | 'heavy'): number {
  return FREEZE_MATRIX[level][0]
}
```

#### 7.7 — OB-23 write sequence

```ts
async function completeOnboarding(state: OnboardingState) {
  const dependencyLevel = calcDependencyLevel(state.cravingIntensity!, state.timeToFirstCigarette!)
  const freezeStock = initialFreezeStock(dependencyLevel)

  // 1. PATCH profiles (row exists from trigger)
  await supabase.from('profiles').update({ ...allOnboardingFields }).eq('id', state.userId).throwOnError()

  // 2. INSERT quit_attempts
  const { data: attempt } = await supabase.from('quit_attempts').insert({
    user_id: state.userId, quit_date: state.quitDate, dependency_level: dependencyLevel,
  }).select('attempt_id').single().throwOnError()

  // 3. INSERT streak_record
  await supabase.from('streak_record').insert({
    user_id: state.userId, dependency_level: dependencyLevel,
    freeze_stock: freezeStock, freeze_max_current_period: freezeStock,
    freeze_period: 0, current_stage: 0, streak_status: 'active',
  }).throwOnError()

  // 4. INSERT slip_state
  await supabase.from('slip_state').insert({ user_id: state.userId }).throwOnError()

  // 5. INSERT notification_state
  await supabase.from('notification_state').insert({
    user_id: state.userId, effective_tier: 'app_decides',
  }).throwOnError()

  // 6. PATCH profiles — onboarding_complete = true (last write)
  await supabase.from('profiles').update({ onboarding_complete: true })
    .eq('id', state.userId).throwOnError()

  // 7. Invalidate caches + route to home
  queryClient.invalidateQueries({ queryKey: queryKeys.profile(state.userId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.currentAttempt(state.userId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.streakRecord(state.userId) })
  router.replace('/')
}
```

Steps 3–5 should use `upsert` with `onConflict: 'user_id'` to handle retry after partial failure. `quit_attempts` INSERT should check for existing open row first.

#### 7.8 — Hooks

**`hooks/useProfile.ts`** — `staleTime: 5 * 60 * 1000`. Selects `*` from profiles. `enabled: !!user`.

**`hooks/useCurrentAttempt.ts`** — `.is('ended_at', null).single()`. `staleTime: 10 * 60 * 1000`.

#### 7.9 — OS notification permission

Ask at OB-23. If granted, store Expo push token on `profiles.push_token`. Add `push_token text` column to profiles (migration 016 or add to migration 001).

#### 7.10 — Step 7 Verify

- [ ] OB-01 → OB-23: all 5 DB rows created (profiles patched, quit_attempts, streak_record, slip_state, notification_state)
- [ ] `onboarding_complete = true` after OB-23
- [ ] App routes to home screen; kill/reopen → stays on home
- [ ] `figuring_out` path: `quit_date = null` on quit_attempts
- [ ] `quit_attempts = 'never'`: OB-17 skipped, `quit_struggles = null`
- [ ] OB-22 hold: release before 3s resets animation, does not save
- [ ] Network failure on OB-23: error shown, retry works

---

## Phase 3 — Core Loop

### Step 8 — App Shell + Stage System

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_HomeScreen_Spec_V1.2.docx` + `LastOne_Streak_System_Spec_V1_2.docx` §5, §B2.

#### 8.1 — `lib/stage.ts`

```ts
export type Stage = 0 | 1 | 2 | 3 | 4 | 5

export function deriveStage(quitDate: string | null | undefined): Stage {
  if (!quitDate) return 0
  const days = differenceInCalendarDays(new Date(), parseISO(quitDate))
  if (days < 1) return 0
  if (days <= 3) return 1
  if (days <= 7) return 2
  if (days <= 21) return 3
  if (days <= 56) return 4
  return 5
}
```

Day 0 stays in Stage 0. Stage 1 begins when `days >= 1`.

#### 8.2 — `hooks/useStage.ts`

Reads `useCurrentAttempt()`, returns `{ stage, daysSinceQuit, isPreQuit, quitDate }`.

#### 8.3 — `hooks/useStreakRecord.ts`

`staleTime: 30 * 1000` (changes frequently).

#### 8.4 — `hooks/useReturnModal.ts`

`daysMissed = differenceInCalendarDays(today, last_confirmed_date) - 1`. Returns `{ type: 'none' | 'stk2' | 'stk3', daysMissed }`. STK-3 threshold: `daysMissed >= 5`.

#### 8.5 — Home screen skeleton

```
app/(tabs)/index.tsx
components/home/
  Greeting.tsx  StreakBar.tsx  CopingSurfaceCard.tsx  ProgressDashboard.tsx
  DailyCheckInCard.tsx  ContentCarousel.tsx  InsightsPreviewCard.tsx
  HealthMilestonesCard.tsx  ReturnModalShort.tsx  ReturnModalLong.tsx
```

Return modal gates home entirely — no dismiss, no skip. Log FAB and SOS FAB rendered in tab layout, persist across all tabs.

Greeting: `Good morning` 05:00–12:00 · `Hey` 12:00–17:00 · `Good evening` 17:00–21:00 · `Hey` 21:00–05:00.

#### 8.6 — Step 8 Verify

- [ ] `useStage()` returns 0 for null quit_date; returns 1 for yesterday; returns 3 for 10 days ago
- [ ] STK-2 blocks home when `last_confirmed_date` is 2 days ago
- [ ] STK-3 blocks home when `last_confirmed_date` is 6 days ago

---

### Step 9 — Logging System

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Logging_System_Spec_V1_2.docx` — §B2 (commit rules), §3 (cigarette_count sentinel), §6 (SOS-3 skippability).

#### 9.1 — Log FAB + half-sheet

4 options → `/(modals)/log-a`, `log-b`, `log-c`, `log-d`. Modal group uses `presentation: 'modal'`.

#### 9.2 — Core mutation hooks

**`hooks/useCreateLog.ts`** — inserts log row with `user_id`, `attempt_id`, `quit_day_number`, `current_stage`, `timestamp`. Invalidates logs cache on success.

**`hooks/useUpdateLog.ts`** — PATCHes existing log row by `log_id`.

#### 9.3 — `hooks/useDailyCheckIn.ts`

AsyncStorage with timezone-aware date key (`yyyy-MM-dd` in user's timezone). Resets at midnight. `markSatisfied()` called on every log commit (A, B, C, D).

#### 9.4 — Flow A: Craving Log

**A1** (commit point): `createLog({ log_type: 'craving', intensity })` → store `logId` → `markSatisfied()` → advance to A2.

**A2** (optional): trigger chips (10 canonical tokens), location chips, social context chips. 'Other' chip → inline text, max 60 chars stored in `other_text`. `updateLog({ logId, triggers, location, social_context, other_text })`. "I Need Help Now" → `updateLog({ routed_to_sos: true })` → open SOS.

#### 9.5 — Flow B: Overcome Log

On screen mount (B1 — commit point): `createLog({ log_type: 'overcome' })` → `confirmSmokeFreeDay(userId, 'log')` → `markSatisfied()`. B2: optional "what helped" chips. If user exits after B1 — log committed, streak updated.

#### 9.6 — Flow C: Slip Log

**C1**: acknowledgement copy, no data capture.

**C2** (commit point): `slip_type` selection → `createLog({ log_type: 'slip', slip_type, source: 'flow_c' })` → `markSatisfied()`. `cigarette_count` optional (store '5+' as integer **99**). After commit: `const c3Screen = await routeAfterSlip(userId, slipType)`.

`return_to_smoking`: also calls `fullRelapse(userId)` which closes the current `quit_attempts` row.

#### 9.7 — Flow D: Quick Note

No auto-commit. Text (280 chars), mood (optional), photo (optional). On Save: `createLog({ log_type: 'note', ... })` → `markSatisfied()` → toast → back. Cancel = no log.

#### 9.8 — SOS Flow

**SOS-1**: commit on tool selection — `createLog({ log_type: 'sos', tool_selected })`.

**SOS-2**: render tool component. On exit: `updateLog({ tool_duration_seconds })`.

**SOS-3**: always show Skip button (skippable per spec). Skip → `updateLog({ tool_helpful: null, post_tool_state: null })`. 'Better' → `updateLog({ tool_helpful: true, post_tool_state: 'better' })` → `updateToolScore(+1)` → `confirmSmokeFreeDay(userId, 'sos')`. 'Same' → `updateToolScore(-1)` → `checkSosEscalation`. 'I smoked' → compressed Flow C (skip C2, default `slip_type='one_off'`).

Tool score update via `increment_tool_score` Postgres RPC (atomic upsert). SOS escalation: `failed_sos_count >= 2` in 24h window → only show Call a Friend + Quit Specialist Line.

#### 9.9 — Step 9 Verify

- [ ] Flow A: A1 commits on navigate to A2; log in DB even if user exits before A2 Save
- [ ] Flow A: "I Need Help Now" on A2 → `routed_to_sos = true` in log, SOS opens
- [ ] Flow B: streak incremented immediately on B1 display
- [ ] Flow C: '5+' stored as 99 in DB; never visible as 99 in UI
- [ ] Flow D: closing without Save → no log created
- [ ] Daily check-in card disappears after any log commit; reappears next calendar day
- [ ] SOS: SOS-3 skip works (no score update, log still saved)
- [ ] SOS 'Better' → `tool_score +1`; streak confirms smoke-free

---

### Step 10 — Streak System

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Streak_System_Spec_V1_2.docx` — read Part B fully, especially §8 (SOS reversal edge case).

All streak DB writes live in `lib/streak.ts`. Functions: `confirmSmokeFreeDay`, `consumeFreeze`, `breakStreak`, `consumeAllFreezes`, `fullRelapse`, `pauseStreak`, `resumeStreak`, `reverseSosConfirmation`.

**SOS reversal:** If `confirmation_source = 'sos'` and a slip is logged same day, undo the SOS confirmation before applying slip logic.

**Freeze period advance** (`checkFreezePeriodAdvance`): runs on app open when `quit_date` set. Boundaries: Day 15 (period 0→1), Day 29 (1→2), Day 91 (2→3). On advance: new `freeze_stock` from `FREEZE_MATRIX[dep][newPeriod]`, reset `slip_state.red_flag_count`.

**Return modals:**
- STK-2 (1–4 days absent): 3 options — 'Didn't smoke' (add all missed days), 'Had one or two' (freeze available: consume 1, give lifetime credit; no freeze: break streak), 'Smoked regularly' (break streak).
- STK-3 (5+ days absent): 3 options — 'I didn't smoke' (full credit + resume), 'Treat it as a break' (reset streak, resume), 'I did smoke' (same as break).

**StreakBar component** (Stage 0: logging streak count; Stage 1+: `current_streak_days` with snowflake freeze icons). STK-5 state when `current_streak_days = 0`. STK-6 personal best overlay when new streak exceeds `longest_streak_ever`.

**Health Milestones card** — derives hours since quit, shows next unearned milestone countdown.

#### 10.5 — Step 10 Verify

- [ ] Flow B commit → `current_streak_days` increments; StreakBar updates
- [ ] One_off slip with freeze → `freeze_stock` decrements; streak unchanged
- [ ] One_off slip no freeze → `current_streak_days = 0`; STK-5 shown
- [ ] SOS 'Better' then same-day slip → SOS reversal fires before slip logic
- [ ] STK-2 and STK-3 all options work; not dismissable
- [ ] `days_since_quit = 15`: freeze period advances on next app open
- [ ] Pause → StreakBar shows paused state; Resume → streak resets to Day 1

---

### Step 11 — Slip Threshold

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Slip_Threshold_Restart_Logic_V1_2.docx`

`lib/slipThreshold.ts` — `routeAfterSlip(userId, slipType)` returns `'warm' | 'restart_nudge'`.

**Logic:**
- `few_days`: `consumeAllFreezes` → `'warm'`
- `one_off` with freeze available: `consumeFreeze` + `red_flag_count = 0` → `'warm'`
- `one_off` no freeze, 6+ days since last slip: `breakStreak` + `red_flag_count = 0` → `'warm'`
- `one_off` no freeze, within window, `red_flag_count < 2`: `breakStreak` + `red_flag_count++` → `'warm'`
- `one_off` no freeze, within window, `red_flag_count >= 2`: `breakStreak` → `'restart_nudge'`

**C3 Restart Nudge** — 3 CTAs: 'Restart' (new quit_attempts row, reset streak/slip_state), 'Take a Break' (`pauseStreak`), 'Continue' (no state change).

`red_flag_count` resets on: Phase 1 slip, 6+ day clean window, freeze period boundary, 'Restart' chosen.

#### 11.5 — Step 11 Verify

- [ ] 3rd one_off slip within 6 days, no freeze → C3 Restart Nudge
- [ ] 'Restart': old `ended_at` set, new attempt created, streak reset
- [ ] Freeze period boundary → `red_flag_count` resets
- [ ] SOS 'Better' then same-day one_off → reversal fires; net effect is slip

---

## Phase 4 — Measurement

### Step 12 — Progress Dashboard

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_ProgressDashboard_Spec_V1_2.docx` — §B2 (formulas), §B7 (relatable equivalents).

**Pre-build:** Add `relatableCategory` to `OnboardingState`, add `OB11b_CategoryPicker.tsx` screen, add to OB-23 profiles PATCH. Default to `'food_delivery'` if null.

**`lib/savings.ts`** — pure calculation functions: `calcMoneySaved`, `calcTimeReclaimed`, `calcCigarettesNotSmoked`. All three accumulate across ALL quit attempts, not just current. Slip deductions: multiply `cigarette_count` (99→5) by price. Money in paise (integers) to avoid float errors.

Relatable equivalents: `moneyEquivalent(savedPaise, category)`, `timeEquivalent(totalMins)`.

**`hooks/useDashboard.ts`** — fetches all quit_attempts + all slip logs, calculates in `useMemo`, returns formatted labels and equivalents.

**Counter cards** → tap → DASH-2 expanded view with daily/weekly/monthly/yearly scale ladder.

Savings milestone thresholds (paise): 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 300000, 500000.

#### 12.5 — Step 12 Verify

- [ ] Stage 0: preview copy with daily savings rate
- [ ] Log slip with 3 cigarettes → money_saved decrements
- [ ] Tap counter → DASH-2 opens with correct scale ladder
- [ ] ₹10,000+ displays as ₹10.0K

---

### Step 13 — Coping Tools Suite

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_CopingToolsSuite_V1_2.docx` — §06 (SOS selection waterfall), §B1 (data model), §05 (seed data).

**DB setup:** `increment_tool_score` RPC (atomic upsert on `user_tool_scores`).

**Seed `supabase/seed.sql`** — 12 tools: BRE-01/02/03/04, PHY-01/02/03/04, MIN-01, MIN-02A, MIN-02B, MIN-03.

**`lib/sosTool.ts`** — `selectSOSTools(tools, scores, cravingContext)`:
- Step 0: intensity 5 → BRE-03 in slot 1 always
- Step 1: personal effectiveness (5+ uses, score > 0) → top 3 by score
- Step 2: context gate (public → no PHY-03/04; private → no PHY-01/02)
- Step 3: stage defaults (Stage 0–2: breathing/physical/game; Stage 3+: game elevated to slot 1)
- Composition rule: never two tools from same sub-family

Tool execution components: `BreathingTool.tsx`, `PhysicalTool.tsx`, `EchoTapGame.tsx` (stub), `MemoryGame.tsx` (stub). Full game implementations in Step 19.

Tools tab — library view with all 12 tools browsable by category. Library sessions do not affect `failed_sos_count`.

#### 13.6 — Step 13 Verify

- [ ] 12 rows in `coping_tools` after seeding
- [ ] Intensity 5 → BRE-03 always slot 1
- [ ] Public context → no PHY-03/04
- [ ] `removed_from_sos = true` when `tool_score < -2 AND total_uses >= 5`; tool still in library
- [ ] `failed_sos_count >= 2` → only Call a Friend + Quit Specialist shown

---

### Step 14 — Content Cards

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Content_Voice_Brief_V1.2.docx` and content cards spec.

**Seed:** 63 rows — MB-01–18 (Myth Buster), YB-01–15 (Your Body), PT-01–20 (Practical Tips), SW-01–10 (Small Wins).

Low-sensitivity cards: `body_copy` set, voice variants null. High-sensitivity: `body_copy` null, voice variant columns set.

**`lib/cardEngine.ts`** — `selectCard(userId, triggerType, triggerValue, stage, voiceStyle)`:
1. Filter by trigger type/value
2. Filter by stage range
3. Filter by 14-day cooldown; relax to 7-day if <3 eligible (carousel only); fallback to least-recently-shown
4. Select least-recently-shown
5. Resolve body copy (low-sensitivity: `body_copy`; high-sensitivity: voice variant column)
6. Record impression in `user_card_history`

**`hooks/useContentCarousel.ts`** — cache key includes today's date (auto-busts at midnight). Max 2 cards per pill_tag category per day.

**Contextual injection:** After Flow A with trigger chips → check for matching contextual card. After Flow C → check for `slip_logged` card.

#### 14.6 — Step 14 Verify

- [ ] 63 rows after seeding
- [ ] Card not re-shown within 14 days
- [ ] Max 2 cards per pill_tag per carousel load
- [ ] Voice variant correctly selected for high-sensitivity cards
- [ ] YB-01 surfaces within 20 minutes of quit_date reached

---

## Phase 5 — Communication

### Step 15 — Notifications

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Notifications_Spec_V1_2.docx` — §5 (registry), §B2 (all logic), Decision 3 (quiet hours bypass for N-STK-01), Decision 10 (pause track).

**Architecture:** Health milestones + daily check-in + pause track = local (`scheduleNotificationAsync`). Insight notifications + goal notifications = server-side (Supabase Edge Functions).

**`Notifications.setNotificationHandler`** set in `app/_layout.tsx`. Response handler routes to correct screen; logs opened status; resets `consecutive_ignored`.

**`lib/notifications.ts`:**
- `scheduleHealthMilestoneNotifications(quitDate, voiceStyle)` — N-CON-01 through N-CON-10 with absolute `Date` trigger
- `scheduleDailyCheckinReminder(riskWindowHour, voiceStyle)` — daily repeating; cancel at Stage 3
- `schedulePauseNotifications(pausedAt, voiceStyle)` — N-PAU-01–04 at Day 3/7/14/30 at 09:00

**Auto-reduce:** 3 consecutive ignored → `effective_tier` steps down one level for 7 days. Reverts after 7 days on app open. `consecutive_ignored` resets on any notification opened.

**Quiet hours:** N-STK-01 bypasses quiet hours (Decision 3). All other scheduled notifications defer to `quiet_hours_end` if scheduling during quiet hours.

**Notification permission:** denied → graceful exit (do not crash). One-time in-app re-prompt near quit day.

#### 15.9 — Step 15 Verify

- [ ] Health milestone fires at quit_date + 20 min (test with near-future quit date)
- [ ] Daily check-in fires at risk window hour; cancels at Stage 3
- [ ] Pause → 4 N-PAU notifications scheduled; Resume → all 4 cancelled
- [ ] 3 consecutive ignored → `effective_tier` drops one level for 7 days
- [ ] `notifications_enabled = false` → no notifications scheduled

---

### Step 16 — Insights

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Insights_v1.2.docx` — §B2 (all logic), B2.2 (feed ranking), B2.3 (thresholds), B2.4 (generation job), B2.8 (alert level).

**`supabase/functions/generate-insights/`** — triggered by pg_cron (03:00 UTC daily) and `log` INSERT webhook. Idempotent — `insight_key` uniqueness prevents duplicate creation.

**Insight types and thresholds:**
- `top_trigger`: 5+ craving logs
- `resistance_rate`: 10+ logs with outcomes
- `peak_risk_window`: 3+ cravings in same 2-hour window across 3+ different days
- `craving_drop`: last 7 days rate < prior 7 days, both periods have 5+ cravings
- Profile cards (`profile_peak_windows`, `profile_social_context`, `profile_trigger_category`): any log

Risk window calc: bucket cravings by 2-hour window; windows with 3+ unique days = `'medium'` confidence; 5+ days = `'high'`.

**`lib/feedRanking.ts`** — score = recencyScore + actionBoost (0.3 if `has_app_action`) + engagement×0.1 + readPenalty (−0.5 if 'read'). Profile cards get +1.0 boost in Stage 0/1.

**`hooks/useAlertLevel.ts`** — returns `1 | 2`. Returns `2` if current hour falls in a high-confidence active risk window from `profiles.risk_windows`. Alert level 2 → `CopingSurfaceCard` renders on home screen.

**Insights screen:** collapsed/expanded card states. Tapping → `card_state = 'read'`, `engagement_score += 2`. Scroll-past without tap → `engagement_score -= 0.5`. Stage 3+: Learning Week profile card at bottom.

#### 16.6 — Step 16 Verify

- [ ] Stage 0, no logs: empty state shown
- [ ] After 5+ craving logs: `top_trigger` card generates
- [ ] Insight generation idempotent: running job twice creates no duplicates
- [ ] Alert level 2 during high-confidence risk window → CopingSurfaceCard on home
- [ ] Risk window toggle: `profiles.risk_windows[n].active = false` → card no longer triggers

---

## Phase 6 — Supporting Features

### Step 17 — Personal Goals

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_PersonalGoals_Spec_V1.2.docx` — §B2, §3. Key: `current_amount` is always `SUM(top_up_log.amount)` — never written directly.

**Pre-ship:** NGO URLs must be verified by team before ship (see security constraints).

**`hooks/useGoals.ts`** — queries `goal` with nested `top_up_log(amount)`. Derives `current_amount` and `progress_pct` client-side.

**Goal creation flow:** GOAL-02 (entry method) → GOAL-03 (URL input) → GOAL-04 (confirm parsed details, all editable) or GOAL-05 (manual entry). URL parsing via `supabase/functions/parse-product-url/` Edge Function (extracts OG tags). Max 3 active goals.

**`current_amount`** = `SUM(top_up_log.amount)`. `allocated_amount` is informational only. Over-allocation in GOAL-10 blocked at UI level.

**Causes Card** (GOAL-11): appears at Stage 3+ when `total_saved > 0`, 14-day interval between appearances. NGO rotation: CFI → CPAA → CanSupport → repeat. "Learn more" opens URL in Linking.openURL.

**Occasion nudge:** V1 hardcoded calendar. Check on every app open. Window: 3–5 days before occasion. Must be maintained annually.

#### 17.6 — Step 17 Verify

- [ ] Max 3 goals enforced
- [ ] `top_up_log` row drives `current_amount`; no direct write to `goal.current_amount`
- [ ] Causes Card: Stage 2 → not shown; Stage 3 → shown
- [ ] NGO rotation correct (CFI → CPAA → CanSupport)
- [ ] NGO URLs verified before ship ⚠️

---

### Step 18 — Giving Up Support System

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_Giving_Up_Support_System_v1.docx` — §B2 (trigger conditions), §3 (design decisions).

**Security constraint:** `support_person_phone` in SecureStore ONLY — never in Supabase.

**`hooks/useGivingUpTrigger.ts`** — three trigger conditions:
- A: `slipsLast14d >= threshold` (3 slips Stage 2–4; 4 slips Stage 5+)
- B: `return_to_smoking` log within 48h
- C: `last_confirmed_date` 3+ days ago (passive disengagement)

7-day suppression after each activation. 3-dismissal cap. GU-1 replaces daily check-in card in same session.

**GU experience beats:**
- GU-2 (Beat 1): validation copy. CTA → GU-3.
- GU-3 (Beat 2): overcome count for last 14 days (or lifetime fallback). Skip if count = 0 (go straight to GU-4).
- GU-4 (Beat 3): "Keep going" → `outcome = 'kept_going'` → home. "Talk to someone" → GU-5.

**GU-5** — Call support person (from SecureStore) or counsellor. Pre-call screen (GU-6) → dialler/WhatsApp. Post-call log (GU-7) — auto-dismiss after 5s.

**GU-8** — Professional resources. Phone numbers must be verified before ship ⚠️.

**GU-9/GU-10** — Support person setup. Phone stored via `SecureStore.setItemAsync('sos_contact_phone', phone)`. Name stored on `profiles.sos_contact_name`.

#### 18.7 — Step 18 Verify

- [ ] Condition A: 3 slips in 14 days → GU-1 at Stage 2+
- [ ] 7-day suppression works; 3-dismissal cap works
- [ ] GU-3 skip: 0 overcome_count → jumps from GU-2 to GU-4
- [ ] `support_person_phone` never in Supabase profiles table
- [ ] Stage 1: GU-1 never appears

---

### Step 19 — Mini-Games Full Implementation

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_MiniGames_FeatureSpec_V1.2.docx` — Part B fully.

Replaces the stub tool execution components from Step 13.

**Games Hub** in Tools tab → craving prompt overlay (MG-HUB-2) on every game launch (8s auto-dismiss = casual).

**Memory 1P** — `generateGrid('3x4' | '4x4')`. State machine: `flippedIds` (max 2). Match → stay face-up. No match → flip back after 1s. All matched → result screen → if craving_linked → reflection.

**Echo Tap** — sequence of 0–3 (four tap zones). Phase 'playing_sequence' → 'awaiting_input'. Correct: streak++, sequence length++. Wrong: streak reset, length-- (floor 2). X button completes current sequence attempt then shows result.

**Memory 2P** — extends 1P with turn logic. Handoff screen covers grid between turns ("Pass the phone. Don't peek."). Match → same player continues (no handoff).

**Post-game reflection** (MG-REFLECT-1): craving-linked only. Auto-dismiss after 5s. 'passed'/'partial' → `tool_score +1`. 'ongoing' → no score change.

**`hooks/useGameStreak.ts`** — consecutive calendar day streak. Milestones (3/7/14/30): schedule local notification. Sessions this week resets on Monday.

**Stage 4 streak nudge** — max 2 times lifetime. In-app only (no push). 4+ days gap in craving sessions.

#### 19.8 — Step 19 Verify

- [ ] Craving prompt fires on every game launch; 8s auto-dismiss = casual
- [ ] Memory 1P: no-match flip-back after 1s; game ends when all pairs matched
- [ ] Echo Tap: X button completes current sequence attempt then shows result
- [ ] Memory 2P: handoff screen covers grid fully; same player continues on match
- [ ] Stage 4 nudge: max 2 lifetime; in-app only

---

### Step 20 — Settings & Profile

**Spec reference:** `docs/specs/v1.2 spec files/LastOne_SettingsProfile_Spec_V1_2.docx`. Note: `once_daily` does NOT exist — only `app_decides / few_daily / on_demand`.

**PROF-01** — 4 sections: Your Journey, Preferences, Your Support, Privacy & Account.

**PROF-02** (Stage 0 quit date): min = `max(account_created_at + 3 days, today)`. No max.

**PROF-03** (Stage 1+ quit date tap): modal — 'Take a Break' → STK-7 pause, 'Start Fresh' → C3 restart.

**PROF-04/05** (CPD/price edit): write to `cpd_change_log`/`price_change_log` before PATCHing profiles. Dashboard recalculates prospectively.

**PROF-09** (SOS contact): phone via `SecureStore.setItemAsync('sos_contact_phone', phone)`. Remove: `SecureStore.deleteItemAsync`. Name on `profiles.sos_contact_name`. Phone never in Supabase.

**PROF-10** (notifications): 3 tiers only. Saving → PATCH `profiles.notification_preference` + reset `notification_state.effective_tier` (clears auto-reduce if preference changed).

**PROF-14** (Delete Account): requires typing `"DELETE"` exactly. Calls `delete_user_account` RPC which deletes from `profiles` (cascades all child tables) then deletes from `auth.users`. Clears SecureStore.

```sql
create or replace function public.delete_user_account(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  delete from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;
```

#### 20.6 — Step 20 Verify

- [ ] PROF-04/05: `cpd_change_log`/`price_change_log` row created on every change
- [ ] SOS contact: phone in SecureStore only, not in Supabase
- [ ] Notification preference: only 3 options available (no `once_daily`)
- [ ] Delete Account: "DELETE" typed exactly → confirm enabled; all data gone; SecureStore cleared

---

## Phase 7 — Ship

### Step 21 — EAS Build, Credentials, and Release

#### 21.1 — app.json key fields

`bundleIdentifier: "com.lastone.app"` / `package: "com.lastone.app"` — permanent, set once. `UIBackgroundModes: ["remote-notification"]` required for APNs to wake app. `autoIncrement: true` in eas.json production profile.

#### 21.2 — eas.json profiles

- `development`: `developmentClient: true`, `distribution: internal`
- `preview`: internal distribution, production JS bundle
- `production`: `autoIncrement: true`, goes to TestFlight / Play Store internal track

#### 21.3 — Environment variables

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
```

`EXPO_PUBLIC_` prefix = safe to bundle (visible in JS bundle — never put service role keys here). Supabase Edge Function secrets set via `supabase secrets set`.

#### 21.4 — Push credentials

iOS: APNs Auth Key from Apple Developer Portal → `eas credentials --platform ios`. Android: FCM V1 service account JSON from Firebase → `eas credentials --platform android`.

Token registration on every authenticated app open: `Notifications.getExpoPushTokenAsync({ projectId })` → PATCH `profiles.push_token`.

#### 21.5 — Edge Functions + Cron

```bash
supabase functions deploy generate-insights
supabase functions deploy parse-product-url
```

Enable `pg_cron` + `pg_net` extensions. Schedule:
```sql
select cron.schedule('generate-insights-daily', '0 3 * * *', $$
  select net.http_post(url := '...supabase.co/functions/v1/generate-insights',
    headers := jsonb_build_object('Authorization', 'Bearer <service_role_key>'),
    body := '{}'::jsonb);
$$);
```

Set DB webhook on `log` INSERT → trigger `generate-insights`.

#### 21.6 — Build + Submit

```bash
eas build --profile production --platform all
eas submit --profile production --platform ios --latest
eas submit --profile production --platform android --latest
```

#### 21.9 — Final Pre-Ship Integration Checklist (critical items)

- [ ] Supabase on paid plan (free tier pauses after 1 week inactivity)
- [ ] `push_token` column on `profiles`
- [ ] `increment_tool_score` RPC deployed
- [ ] `delete_user_account` RPC deployed with `security definer`
- [ ] All FK constraints include `ON DELETE CASCADE` from `profiles`
- [ ] APNs Auth Key + FCM V1 credentials uploaded to EAS
- [ ] No secrets hardcoded in source: `git grep -r "eyJ" -- "*.ts" "*.tsx"` returns nothing unexpected
- [ ] NGO URLs in GU-8 live-tested and confirmed correct ⚠️
- [ ] Professional helpline numbers verified with team ⚠️
- [ ] `profiles` table has NO `sos_contact_phone` column ⚠️
- [ ] Delete Account: "DELETE" exact match; all data gone; SecureStore cleared

---

## Connected to
- LastOne Product Foundations V1 — product rules this architecture implements
- LastOne Data Schema V1 — canonical source for all table shapes

---

*LastOne Build Playbook · All phases complete · 2026-06-05*

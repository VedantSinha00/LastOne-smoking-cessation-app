-- Step 12 / Step 14 — bring content_cards + user_card_history into version control.
-- These tables already exist on remote (created out-of-band before VC); this migration
-- is the reconciling baseline so the schema is reproducible. Everything is idempotent
-- (create table if not exists + add column if not exists), so re-applying is a no-op
-- on the live DB and a clean create on a fresh one.
--
-- content_cards (Content Cards §B1, Milestone Spec §4): the card catalog. Holds both
-- the daily content cards (Step 14) and the DASH-2 milestone reference cards CM-01–08
-- (trigger_type='cigarette_milestone', Step 12). card_id is the stable business key
-- (UNIQUE); seeds upsert on it. trigger_type is intentionally unconstrained text.

create table if not exists public.content_cards (
  id                  uuid primary key default gen_random_uuid(),
  card_id             text not null unique,
  pill_tag            text not null,
  title               text not null,
  body_copy           text,
  body_copy_steady    text,
  body_copy_warm      text,
  body_copy_practical text,
  trigger_type        text not null,
  trigger_value       text not null,
  sensitivity         text not null check (sensitivity in ('low', 'high')),
  stage_min           integer,
  stage_max           integer,
  active              boolean not null default true
);

-- Idempotent guards for the variant columns, in case an older create lacked them.
alter table public.content_cards add column if not exists body_copy_steady    text;
alter table public.content_cards add column if not exists body_copy_warm      text;
alter table public.content_cards add column if not exists body_copy_practical text;

-- user_card_history (Content Cards §3): per-user impression log driving the 14-day
-- cooldown selection. UNIQUE(user_id, card_id) — cooldown reads/writes upsert on the
-- pair. NOT written for cigarette_milestone cards (their unlock state is derived;
-- Milestone Spec §4.2). FK to content_cards(card_id) and profiles(id).

create table if not exists public.user_card_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  card_id       text not null references public.content_cards(card_id),
  last_shown_at timestamptz not null default now(),
  show_count    integer not null default 1,
  unique (user_id, card_id)
);

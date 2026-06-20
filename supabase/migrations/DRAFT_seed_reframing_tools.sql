-- ⚠️ DRAFT — DO NOT APPLY AS-IS. Needs Vedant to confirm the `family` value first.
--
-- Seeds the 4 Reframing tools (REF-01..04 from the Lovable design) into
-- coping_tools, under the existing `cognitive_reframe` CATEGORY. The screens are
-- already built (components/coping/ReframeTool.tsx, routed by category in
-- ToolRunner), so once these rows exist they become runnable in the Tools library.
--
-- ── THE OPEN QUESTION: the `family` column ────────────────────────────────────
-- coping_tools.family is typed in the app as 'breathing' | 'physical' |
-- 'mini_games'. The table's CREATE definition (and whether `family` is a hard
-- Postgres enum / CHECK constraint) lives ONLY on remote Supabase — it is NOT in
-- version control, and the anon key cannot read coping_tools rows (RLS), so the
-- valid set could not be verified from the repo.
--
-- Reframing tools are cognitive/reflective — none of breathing/physical/mini_games
-- fits semantically. Before applying, Vedant must EITHER:
--   (a) confirm `family` accepts a new value (e.g. 'reflective' / 'cognitive') and
--       update the value below + the app's ToolFamily type + the Tools section, OR
--   (b) pick the least-wrong existing family for these rows (placeholder below uses
--       'physical' purely so the INSERT is valid against the current enum — change
--       if (a) is preferred).
-- The Tools screen already filters the Reframing section by CATEGORY
-- (cognitive_reframe), not family, so the family value does not affect listing.
--
-- Idempotent: ON CONFLICT (tool_id) DO NOTHING.

insert into public.coping_tools
  (tool_id, data_model_id, family, name, category, intensity_min, intensity_max,
   context, duration_seconds, sos_eligible, library_only, requires_buddy, stage_min, emotional_tags)
values
  ('REF-01', 'urge_surfing',       'physical', 'Urge Surfing',       'cognitive_reframe', 2, 4, null, 150, true,  false, false, null, array['peak_craving','restless']),
  ('REF-02', 'future_self_letter', 'physical', 'Future Self Letter', 'cognitive_reframe', 1, 3, null, 240, false, true,  false, null, array['reflective']),
  ('REF-03', 'cost_reframe',       'physical', 'Cost Reframe',       'cognitive_reframe', 2, 3, null, 60,  true,  false, false, null, array['autopilot']),
  ('REF-04', 'name_the_trigger',   'physical', 'Name the Trigger',   'cognitive_reframe', 1, 3, null, 45,  true,  false, false, null, array['awareness'])
on conflict (tool_id) do nothing;

-- Seed the 4 Reframing tools (REF-01..04 from the Lovable design) into
-- coping_tools, under the existing `cognitive_reframe` CATEGORY. The screens are
-- already built (components/coping/ReframeTool.tsx, routed by category in
-- ToolRunner), so once these rows exist they become runnable in the Tools library.
--
-- `family` is a fixed 3-value set on this DB (confirmed 2026-06-20 via
--   select distinct family from public.coping_tools;  → breathing | physical | mini_games).
-- Reframing is cognitive, but none of the three fit semantically — we use
-- 'physical' as a harmless bucket. The Tools screen lists the Reframing section by
-- CATEGORY (cognitive_reframe), NOT family, so this value does not affect listing.
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

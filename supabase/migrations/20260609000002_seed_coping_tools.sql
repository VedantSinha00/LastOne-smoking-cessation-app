-- Step 9 §9.8 — seed the coping_tools catalog (Coping Tools Suite spec §B1, the
-- 12-row master table). Idempotent: ON CONFLICT DO NOTHING keeps tool_ids stable
-- (user_tool_scores references them) and lets this run safely more than once.
--
-- Columns: tool_id (stable PK), data_model_id (snake_case, used by scoring),
-- family (breathing|physical|mini_games), category (6-value enum), intensity
-- min/max, context (null = context-neutral), duration_seconds, sos_eligible,
-- library_only, requires_buddy, stage_min, emotional_tags.

insert into public.coping_tools
  (tool_id, data_model_id, family, name, category, intensity_min, intensity_max,
   context, duration_seconds, sos_eligible, library_only, requires_buddy, stage_min, emotional_tags)
values
  ('BRE-01', 'box_breathing',     'breathing',  'Box Breathing',          'breathing',      1, 3, null,                   64,  true,  false, false, null, array['anxious','restless']),
  ('BRE-02', 'reset_478',         'breathing',  '4-7-8 Reset',            'breathing',      3, 5, null,                   90,  true,  false, false, null, array['anxious','overwhelmed']),
  ('BRE-03', 'physiological_sigh','breathing',  'Physiological Sigh',     'breathing',      4, 5, null,                   55,  true,  false, false, null, array['panicky','peak_craving']),
  ('BRE-04', 'grounding_555',     'breathing',  '5-5-5 Grounding Breath', 'reflective',     1, 3, null,                   90,  false, true,  false, null, array['scattered']),
  ('PHY-01', 'finger_pulse',      'physical',   'Finger Pulse Press',     'physical_reset', 3, 5, array['public'],        40,  true,  false, false, null, array['tense']),
  ('PHY-02', 'tongue_press',      'physical',   'Tongue Press',           'physical_reset', 2, 5, array['social'],        60,  true,  false, false, null, array['social_pressure']),
  ('PHY-03', 'pushups',           'physical',   'Push-ups',               'physical_reset', 4, 5, array['private'],       60,  true,  false, false, null, array['restless','energetic']),
  ('PHY-04', 'squat_jumps',       'physical',   'Squat Jumps',            'physical_reset', 4, 5, array['private'],       55,  true,  false, false, null, array['angry']),
  ('MIN-01', 'echo_tap',          'mini_games', 'Echo Tap',               'distraction',    1, 3, null,                   180, true,  false, false, null, array['bored','idle']),
  ('MIN-02A','memory_1p',         'mini_games', 'Memory Game',            'distraction',    1, 3, null,                   240, true,  false, false, null, array['bored','idle']),
  ('MIN-02B','memory_2p',         'mini_games', 'Memory Game (2-player)', 'social_coping',  1, 3, array['social'],        240, true,  false, true,  null, array['social_ritual']),
  ('MIN-03', 'find_match_2p',     'mini_games', 'Find Match (2-player)',  'social_coping',  1, 3, array['social'],        150, true,  false, true,  null, array['social_ritual'])
on conflict (tool_id) do nothing;

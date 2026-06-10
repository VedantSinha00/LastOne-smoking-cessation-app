-- Step 12 §12 — seed the 8 cigarette-count milestone reference cards (CM-01–08) that
-- back the DASH-2 reference scroll. Source of truth: LastOne_Milestone_System_Spec.md
-- §3 (copy) + §4 (storage mapping). These are catalog rows in content_cards.
--
-- Mapping (Milestone Spec §4.1):
--   trigger_type  = 'cigarette_milestone'  (unconstrained text column — accepted as-is)
--   trigger_value = integer threshold AS TEXT ('50' … '10000')
--   sensitivity   = 'high'  (voice variants)
--   stage_min/max = null    (unlock gated by cigarettes_not_smoked, not stage)
--   body_copy        = null (high-sensitivity → uses variant columns)
--   body_copy_steady = Steady & Direct variant (also the DASH-2 fallback)
--   body_copy_warm   = Emotional & Understanding variant
--   body_copy_practical = null (Real & Practical deferred; falls back to steady)
--
-- Idempotent: upsert on card_id so re-running refreshes copy without dupes.

insert into public.content_cards
  (card_id, pill_tag, title, body_copy, body_copy_steady, body_copy_warm,
   body_copy_practical, trigger_type, trigger_value, sensitivity, stage_min, stage_max, active)
values
  ('CM-01', 'Milestone · 50', 'Fifty you didn''t smoke.', null,
   'Lined up end to end, that''s about the length of a car. Fifty cigarettes that never got lit. Small number — but it''s the first real marker.',
   'Fifty. Doesn''t sound like much until you line them up — about as long as a car, not one of them lit. That came from a lot of small moments you got through. Worth noticing.',
   null, 'cigarette_milestone', '50', 'high', null, null, true),

  ('CM-02', 'Milestone · 100', 'One hundred.', null,
   'Stacked end to end, that''s a two-storey building. A hundred cigarettes you walked past — and about a gram of tar that was never produced.',
   'A hundred. End to end, taller than a two-storey building. None of it happened, and none of it was automatic. You chose past it, a hundred separate times.',
   null, 'cigarette_milestone', '100', 'high', null, null, true),

  ('CM-03', 'Milestone · 250', 'Two hundred and fifty.', null,
   'End to end, that''s longer than a cricket pitch. Twenty-two yards of cigarettes you didn''t smoke. The number''s starting to carry weight now.',
   'Two-fifty. Stretched out, that''s a full cricket pitch, end to end. You''ve been at this long enough that the count surprises even you. Sit with that for a second.',
   null, 'cigarette_milestone', '250', 'high', null, null, true),

  ('CM-04', 'Milestone · 500', 'Five hundred.', null,
   'End to end, taller than a 13-floor building. About five grams of tar that was never produced. Half a thousand — that''s not nothing.',
   'Five hundred cigarettes. None lit, none inhaled. Stacked up, they''d clear a 13-storey building. This one took patience, and the patience is the part worth acknowledging.',
   null, 'cigarette_milestone', '500', 'high', null, null, true),

  ('CM-05', 'Milestone · 1,000', 'One thousand.', null,
   'Laid end to end, nearly the length of a football pitch. A thousand cigarettes, about ten grams of tar, none of it real. Four digits now.',
   'A thousand. Picture a football pitch — that''s how far they''d stretch, end to end. You didn''t get here in a week. A thousand is the kind of number you earn slowly.',
   null, 'cigarette_milestone', '1000', 'high', null, null, true),

  ('CM-06', 'Milestone · 2,500', 'Two thousand five hundred.', null,
   'Two football pitches, end to end. About twenty-five grams of tar that never existed. For a lot of people that''s a year of smoking — and you''re on the other side of it.',
   'Twenty-five hundred. Two full football pitches of cigarettes you didn''t smoke. For many people that''s a whole year of it. You turned it into nothing. Quietly huge.',
   null, 'cigarette_milestone', '2500', 'high', null, null, true),

  ('CM-07', 'Milestone · 5,000', 'Five thousand.', null,
   'End to end, longer than four football pitches. About fifty grams of tar that was never produced. Five thousand — that''s a habit you''ve genuinely left behind.',
   'Five thousand. Four football pitches, laid end to end. Numbers this size don''t come from one hard day of willpower — they come from showing up, again and again. That''s what this is.',
   null, 'cigarette_milestone', '5000', 'high', null, null, true),

  ('CM-08', 'Milestone · 10,000', 'Ten thousand.', null,
   'Stacked end to end, taller than the Burj Khalifa. Ten thousand cigarettes, roughly a full cup of tar, none of it real. Almost no one reaches this.',
   'Ten thousand. End to end, they''d stand taller than the Burj Khalifa. There isn''t really a bigger way to say it — this is a different life than the one you started with. You built that.',
   null, 'cigarette_milestone', '10000', 'high', null, null, true)

on conflict (card_id) do update set
  pill_tag            = excluded.pill_tag,
  title               = excluded.title,
  body_copy           = excluded.body_copy,
  body_copy_steady    = excluded.body_copy_steady,
  body_copy_warm      = excluded.body_copy_warm,
  body_copy_practical = excluded.body_copy_practical,
  trigger_type        = excluded.trigger_type,
  trigger_value       = excluded.trigger_value,
  sensitivity         = excluded.sensitivity,
  stage_min           = excluded.stage_min,
  stage_max           = excluded.stage_max,
  active              = excluded.active;

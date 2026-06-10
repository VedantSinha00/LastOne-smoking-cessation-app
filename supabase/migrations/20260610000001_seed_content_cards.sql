-- Step 14 — seed the 63-card content database (Content Cards V1, Part A).
-- Source of truth: LastOne_Content_Cards_V1.md (MB-01–18, YB-01–15, PT-01–20, SW-01–10).
--
-- Sensitivity → body columns (spec §1.3, §3 Step 5):
--   low  → body_copy set; variant columns null.
--   high → the single authored copy goes in body_copy_steady (the canonical fallback
--          per §4 / §1.3); body_copy_warm + body_copy_practical stay null until the
--          Voice Brief authors distinct variants (engine falls back to steady).
-- stage_range 'all' → stage_min/stage_max null. Ranges like '0–2' → (0,2).
-- trigger_value 'any' kept as 'any'. savings_milestone values stored as the integer
--   rupee threshold as text ('100'…'5000') to match the dashboard's paise comparison.
--
-- Idempotent: upsert on card_id so re-running refreshes copy without dupes.

insert into public.content_cards
  (card_id, pill_tag, title, body_copy, body_copy_steady, trigger_type, trigger_value, sensitivity, stage_min, stage_max, active)
values
-- ── Myth Buster (18) — all low except MB-08 ─────────────────────────────────
('MB-01','Myth','The cigarette doesn''t calm you down.','It ends the withdrawal that was making you anxious. Smoking causes the stress it appears to fix.',null,'scheduled','any','low',0,2,true),
('MB-02','Myth','That focus boost isn''t real.','Nicotine withdrawal kills your concentration. The cigarette just restores what smoking took away.',null,'scheduled','any','low',0,2,true),
('MB-03','Myth','"Whenever" keeps getting postponed.','That''s not a choice anymore. That''s what addiction feels like from the inside.',null,'scheduled','any','low',0,3,true),
('MB-04','Myth','The filter isn''t protecting you.','It makes smoke smoother, so you inhale deeper. That''s not safety. That''s just better delivery.',null,'scheduled','any','low',null,null,true),
('MB-05','Myth','Every social moment. Every single one.','If you smoke every time you''re with people, that''s not occasional. That''s a pattern.',null,'contextual','social','low',0,3,true),
('MB-06','Myth','Your body is chasing a moving number.','Nicotine temporarily raises your metabolism, then drops it every time you stop. It''s not managing your weight. It''s disrupting it.',null,'scheduled','any','low',null,null,true),
('MB-07','Myth','"Light" is a marketing word, not a health one.','Light cigarettes deliver less nicotine per puff, so you take more puffs. The tobacco industry already knew this.',null,'scheduled','any','low',null,null,true),
('MB-08','Myth','One cigarette usually doesn''t reset you.',null,'But the craving after it is three times stronger. That''s the part worth knowing.','slip_logged','any','high',null,null,true),
('MB-09','Myth','This was decided for you a long time ago.','The tobacco industry spent decades funding research to prove nicotine wasn''t addictive. They lost. Badly.',null,'scheduled','any','low',null,null,true),
('MB-10','Myth','Life doesn''t get less stressful. Seriously.','But your ability to handle it without a cigarette gets stronger, starting within weeks of quitting.',null,'scheduled','any','low',0,3,true),
('MB-11','Myth','Cutting down keeps the trap alive.','Addiction wants more, not less. Every cigarette you allow just makes the next craving harder to ignore.',null,'scheduled','any','low',0,2,true),
('MB-12','Myth','That restlessness isn''t boredom.','Nicotine withdrawal feels exactly like restlessness. The cigarette relieves what smoking caused, not what your afternoon caused.',null,'contextual','boredom','low',0,2,true),
('MB-13','Myth','Nobody enjoys their first cigarette.','They taste awful. You learned to need them. That''s a different thing entirely.',null,'scheduled','any','low',null,null,true),
('MB-14','Myth','Quitting doesn''t make you gain weight.','Using food to replace the craving does. The hunger and the craving feel similar. They''re not the same thing.',null,'scheduled','any','low',null,null,true),
('MB-15','Myth','That relaxed feeling at a party isn''t real.','It''s the relief of ending withdrawal that started when your last cigarette wore off. You''re just back to baseline.',null,'contextual','social','low',0,3,true),
('MB-16','Myth','A cigarette isn''t a personality trait.','The industry spent decades making it look like one. That was the product. Not the tobacco.',null,'scheduled','any','low',0,3,true),
('MB-17','Myth','The cool smoker was always fictional.','Cigarette companies paid Bollywood and Hollywood for decades to put cigarettes in the hands of heroes. You inherited their marketing.',null,'scheduled','any','low',0,2,true),
('MB-18','Myth','A pricier cigarette isn''t a safer one.','The tobacco inside costs the same to your lungs regardless of what the brand charges for it.',null,'scheduled','any','low',null,null,true),

-- ── Your Body (15) — YB-01–10 high, YB-11–15 low ────────────────────────────
('YB-01','Your Body','Twenty minutes since your last one.',null,'Your heart rate has already dropped. Blood pressure is coming down right now.','time_milestone','20min','high',null,null,true),
('YB-02','Your Body','Eight hours. Carbon monoxide is leaving.',null,'The CO displacing oxygen in your blood is clearing out. Your haemoglobin is starting to work properly again.','time_milestone','8hr','high',null,null,true),
('YB-03','Your Body','Twelve hours in. Blood is cleaner.',null,'Carbon monoxide levels are back to normal. Your blood is carrying oxygen the way it''s supposed to.','time_milestone','12hr','high',null,null,true),
('YB-04','Your Body','Twenty-four hours. Heart attack risk drops.',null,'One smoke-free day and your cardiovascular system is already responding. The risk of a cardiac event has measurably decreased.','time_milestone','24hr','high',null,null,true),
('YB-05','Your Body','Forty-eight hours. Nicotine is fully gone.',null,'It''s completely out of your body now. Your sense of smell and taste are beginning to come back.','time_milestone','48hr','high',null,null,true),
('YB-06','Your Body','Seventy-two hours. Breathing gets easier.',null,'Your bronchial tubes are relaxing and lung capacity is increasing. You may already notice it on a flight of stairs.','time_milestone','72hr','high',null,null,true),
('YB-07','Your Body','One week. The hardest part is done.',null,'Peak withdrawal is behind you. Your brain''s nicotine receptors are returning to their normal count.','time_milestone','1week','high',null,null,true),
('YB-08','Your Body','Two weeks. Circulation is improving.',null,'Blood is reaching your hands and feet more effectively. Lung function has already measurably improved since day one.','time_milestone','2weeks','high',null,null,true),
('YB-09','Your Body','One month. Lungs are clearing out.',null,'The cilia in your airways are recovering. They''re moving debris out again, something they couldn''t do properly before.','time_milestone','1month','high',null,null,true),
('YB-10','Your Body','Three months. Lungs are significantly stronger.',null,'Lung function keeps climbing. Coughing and breathlessness are a fraction of what they were on day one.','time_milestone','3months','high',null,null,true),
('YB-11','Your Body','A year without smoking.','Your risk of coronary heart disease is now half that of a smoker''s. One year did that.',null,'time_milestone','1year','low',4,5,true),
('YB-12','Your Body','Five years smoke-free.','Stroke risk drops to almost the same as someone who never smoked. The body is that good at recovering.',null,'time_milestone','5year','low',4,5,true),
('YB-13','Your Body','Ten years smoke-free.','Your risk of dying from lung cancer is now roughly half a smoker''s. A decade of repair, showing up.',null,'scheduled','any','low',4,5,true),
('YB-14','Your Body','Fifteen years smoke-free.','Coronary heart disease risk resets to the same as a lifelong non-smoker. The body gets all the way back.',null,'scheduled','any','low',4,5,true),
('YB-15','Your Body','Your body never stops recovering.','Every month without a cigarette, something improves. There is no point at which the repair stops.',null,'scheduled','any','low',null,null,true),

-- ── Practical Tips (20) — PT-04,05,07,10 high; rest low ──────────────────────
('PT-01','Tip','Chai doesn''t need a sutta.','Try changing where you sit at the tapri. Same chai, different spot — the cue breaks faster than you''d think.',null,'contextual','post_chai','low',0,2,true),
('PT-02','Tip','The walk to the tapri is the trigger.','Not the chai. Next time, take a different route and see if the craving arrives at the same intensity.',null,'contextual','post_chai','low',0,2,true),
('PT-03','Tip','Replace the ritual, not just the cigarette.','The tapri break is about stepping away and exhaling. You can do that without anything in your hand.',null,'contextual','post_chai','low',0,3,true),
('PT-04','Tip','Cravings peak at three minutes.',null,'You don''t need to kill it. You just need to outlast it. Most cravings are gone before five minutes.','craving_logged','any','high',0,3,true),
('PT-05','Tip','Cold water works faster than you expect.',null,'Drink a full glass slowly when a craving hits. It interrupts the pattern without needing any willpower.','craving_logged','any','high',0,3,true),
('PT-06','Tip','Your hands want something to do.','Keep something nearby — a pen, a coin, anything. The hands-busy fix is simple and it actually works.',null,'craving_logged','any','low',0,2,true),
('PT-07','Tip','Change the scene, change the craving.',null,'If you''re in the place where you usually smoke, move. A different room or a short walk changes the signal.','craving_logged','any','high',0,3,true),
('PT-08','Tip','Stress before an exam is real.','But the cigarette isn''t solving it — it''s ending withdrawal that started an hour ago. A five-minute walk does more.',null,'contextual','stress','low',0,3,true),
('PT-09','Tip','Deep breathing isn''t just a wellness thing.','Six slow breaths activates your parasympathetic nervous system. That''s the part that actually calms you down.',null,'craving_logged','any','low',null,null,true),
('PT-10','Tip','Postpone the craving by ten minutes.',null,'Tell yourself you''ll smoke in ten minutes if you still want to. Most of the time, the ten minutes is enough.','craving_logged','any','high',0,3,true),
('PT-11','Tip','You can still go on the smoke break.','Standing outside with your friends without smoking is completely possible. Nobody actually checks.',null,'contextual','social','low',0,3,true),
('PT-12','Tip','Have one honest conversation about it.','Telling one friend you''re quitting makes you measurably more likely to succeed. You don''t need to tell everyone.',null,'scheduled','any','low',0,1,true),
('PT-13','Tip','Boredom and craving feel identical.','Next time you reach for one, check if you''re actually craving or just have nothing to do for three minutes.',null,'contextual','boredom','low',0,2,true),
('PT-14','Tip','The corridor is a trigger, not a necessity.','If hostel nights are when you smoke most, identify the specific moment. That''s where the habit actually lives.',null,'scheduled','any','low',0,2,true),
('PT-15','Tip','Late night cravings are the weakest ones.','Your nicotine levels are low and your willpower is tired but cravings at this hour pass faster than any other.',null,'scheduled','any','low',0,2,true),
('PT-16','Tip','The post-meal cigarette is pure conditioning.','Your body doesn''t need it after eating. Your brain just learned to expect it. Break the sequence once and it loosens.',null,'contextual','post_meal','low',0,3,true),
('PT-17','Tip','Get up from the table immediately after eating.','Walk somewhere, rinse your mouth, do anything that interrupts the usual post-meal sequence before the craving forms.',null,'contextual','post_meal','low',0,3,true),
('PT-18','Tip','Pick one trigger to work on first.','Not all of them. Just one. Chai, post-lecture, after meals — pick the smallest one and start there.',null,'scheduled','any','low',0,1,true),
('PT-19','Tip','Track which situations are hardest for you.','After a week you''ll see a pattern. Knowing your two or three highest-risk moments is more useful than general willpower.',null,'stage_change','stage_1','low',1,2,true),
('PT-20','Tip','Tell your body what''s coming.','Before entering a high-risk situation, say it out loud: I''m going to want one in there. I''m not going to have it.',null,'scheduled','any','low',0,3,true),

-- ── Small Wins (10) — all high, savings_milestone ───────────────────────────
('SW-01','Small Win','First hundred. That''s a...',null,'...chaat plate and a chai on the cigarettes you didn''t buy. Small, but it''s real money back in your hands.','savings_milestone','100','high',null,null,true),
('SW-02','Small Win','Two hundred. Sounds like...',null,'...a decent dessert or a small Swiggy order waiting to happen. That one''s yours, genuinely earned.','savings_milestone','200','high',null,null,true),
('SW-03','Small Win','Three hundred. Treat yourself to...',null,'...a good burger or a pizza, just for you. You got here without trying to be perfect. That counts.','savings_milestone','300','high',null,null,true),
('SW-04','Small Win','Five hundred. That''s a...',null,'...proper meal or a movie ticket, sitting right there. Half a thousand rupees that almost went up in smoke.','savings_milestone','500','high',null,null,true),
('SW-05','Small Win','Seven-fifty. Pick a...',null,'...JioCinema or Hotstar subscription, covered for the month. A whole month of something good, from something you let go of.','savings_milestone','750','high',null,null,true),
('SW-06','Small Win','One thousand. Take someone for...',null,'...a good meal, on the cigarettes you didn''t smoke. Four digits. That''s not nothing, that''s genuinely something.','savings_milestone','1000','high',null,null,true),
('SW-07','Small Win','Fifteen hundred. Date night...',null,'...sorted, without touching your actual budget. This one took patience. Worth acknowledging that.','savings_milestone','1500','high',null,null,true),
('SW-08','Small Win','Two thousand. Spend it on...',null,'...a month of ChatGPT Plus or a full stretch of canteen lunches. Two thousand rupees back. That''s a real number now.','savings_milestone','2000','high',null,null,true),
('SW-09','Small Win','Three thousand. Plan a...',null,'...trip, bus, stay, food, the whole thing. This didn''t happen overnight. That''s worth sitting with for a moment.','savings_milestone','3000','high',null,null,true),
('SW-10','Small Win','Five thousand. That''s a...',null,'...flight somewhere or a full road trip with friends. Five thousand rupees. You did that. Seriously.','savings_milestone','5000','high',null,null,true)

on conflict (card_id) do update set
  pill_tag         = excluded.pill_tag,
  title            = excluded.title,
  body_copy        = excluded.body_copy,
  body_copy_steady = excluded.body_copy_steady,
  trigger_type     = excluded.trigger_type,
  trigger_value    = excluded.trigger_value,
  sensitivity      = excluded.sensitivity,
  stage_min        = excluded.stage_min,
  stage_max        = excluded.stage_max,
  active           = excluded.active;

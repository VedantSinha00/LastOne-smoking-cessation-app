-- Step 7 §7.9 — store the Expo push token captured when the user grants
-- notification permission at OB-23. Nullable: permission may be denied or deferred.
alter table public.profiles
  add column if not exists push_token text;

-- Step 9 §9.8 — atomic upsert of a per-user tool score (user_tool_scores).
-- Called from SOS-3: +1 on 'Better', -1 on 'Same'. Null tool_helpful (SOS-3
-- skipped) never calls this. SECURITY DEFINER so the single statement is atomic;
-- the WHERE p_user_id = auth.uid() guard preserves per-user isolation (RLS-equivalent).
--
-- Derived flags (Data Schema §7 / migration 007):
--   is_weighted     := total_uses >= 5
--   removed_from_sos := tool_score < -2 AND total_uses >= 5

create or replace function public.increment_tool_score(
  p_user_id uuid,
  p_tool_id text,
  p_delta integer,
  p_post_tool_state text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only the signed-in user may mutate their own scores.
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorized';
  end if;

  insert into public.user_tool_scores as uts
    (user_id, tool_id, tool_score, total_uses, is_weighted,
     last_used_at, post_tool_state, removed_from_sos)
  values
    (p_user_id, p_tool_id, p_delta, 1, false,
     now(), p_post_tool_state, false)
  on conflict (user_id, tool_id) do update set
    tool_score      = uts.tool_score + p_delta,
    total_uses      = uts.total_uses + 1,
    is_weighted     = (uts.total_uses + 1) >= 5,
    removed_from_sos = ((uts.tool_score + p_delta) < -2 and (uts.total_uses + 1) >= 5),
    last_used_at    = now(),
    post_tool_state = p_post_tool_state;
end;
$$;

grant execute on function public.increment_tool_score(uuid, text, integer, text) to authenticated;

-- Journal note deletion RPC.
--
-- The `log` table's RLS grants INSERT / SELECT / UPDATE only — no client DELETE —
-- so journal notes can't be removed from the app directly. This security-definer
-- function lets a user delete ONE of their OWN journal notes (log_type='note').
--
-- Scoped tightly on purpose: it will only ever delete a row that is both owned by
-- the caller AND of log_type='note', so it can't be used to wipe cravings/slips/
-- overcomes (those feed streak/insight integrity and stay non-deletable).

create or replace function public.delete_note_log(p_log_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.log
  where log_id = p_log_id
    and user_id = auth.uid()
    and log_type = 'note';

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    -- Either the note doesn't exist, isn't the caller's, or isn't a note.
    raise exception 'note not found or not deletable';
  end if;
end;
$$;

revoke all on function public.delete_note_log(uuid) from public;
grant execute on function public.delete_note_log(uuid) to authenticated;

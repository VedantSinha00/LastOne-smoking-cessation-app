-- Step 20 (Settings & Profile) — Delete Account RPC (Architecture Guide §20, PROF-14).
--
-- Deletes the caller's profiles row (which cascades to every child table via the
-- ON DELETE CASCADE foreign keys from profiles.id) and then the auth.users row.
-- security definer so it can reach auth.users; guarded so a user can only delete
-- their own account.

create or replace function public.delete_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A user may only delete themselves (defence in depth alongside RLS).
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized to delete this account';
  end if;

  delete from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.delete_user_account(uuid) from public;
grant execute on function public.delete_user_account(uuid) to authenticated;

-- Applied to production as Supabase migration user_learning_state_delete_policy
-- Migration version recorded by Supabase on 2026-10-03.

grant delete on table public.user_learning_state to authenticated;

create policy "Users can delete their own learning state"
on public.user_learning_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Kanji 5 account + learning sync schema.
-- Run this script in the Supabase SQL Editor after creating the project.
-- The browser uses only the publishable/anon key; RLS keeps each user's row private.

create table if not exists public.user_learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_learning_state enable row level security;

drop policy if exists "Users can read their own learning state" on public.user_learning_state;
create policy "Users can read their own learning state"
  on public.user_learning_state
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own learning state" on public.user_learning_state;
create policy "Users can insert their own learning state"
  on public.user_learning_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own learning state" on public.user_learning_state;
create policy "Users can update their own learning state"
  on public.user_learning_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists user_learning_state_updated_at_idx
  on public.user_learning_state (updated_at);

-- Explicit API privileges: RLS then controls row ownership.
grant select, insert, update on public.user_learning_state to authenticated;
revoke all on public.user_learning_state from anon;

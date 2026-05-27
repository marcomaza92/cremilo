-- Fix public.users RLS: drop open SELECT policy, replace with own-row policies.
-- Matches the pattern used on transactions, rates, user_config.

drop policy "Enable read access for all users" on public.users;

create policy "users: select own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: insert own row"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users: delete own row"
  on public.users for delete
  using (auth.uid() = id);

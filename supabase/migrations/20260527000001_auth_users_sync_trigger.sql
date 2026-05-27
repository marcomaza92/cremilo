-- Sync auth.users → public.users on every new signup.
-- SECURITY DEFINER runs as function owner (bypasses RLS on public.users).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, created_at)
  values (new.id, new.email, new.created_at);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

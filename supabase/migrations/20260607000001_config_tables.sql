-- Config Phase C: add grouping_categories, categories, payment_methods
-- and migrate user_config to the Phase C schema.

-- ─── grouping_categories ───────────────────────────────────────────────────

create table if not exists public.grouping_categories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now()
);

alter table public.grouping_categories enable row level security;

create policy "grouping_categories: select own rows"
  on public.grouping_categories for select
  using (auth.uid() = user_id);

create policy "grouping_categories: insert own rows"
  on public.grouping_categories for insert
  with check (auth.uid() = user_id);

create policy "grouping_categories: update own rows"
  on public.grouping_categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "grouping_categories: delete own rows"
  on public.grouping_categories for delete
  using (auth.uid() = user_id);

-- ─── categories ────────────────────────────────────────────────────────────

create table if not exists public.categories (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  name                  text        not null,
  grouping_category_id  uuid        not null references public.grouping_categories(id) on delete cascade,
  created_at            timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: select own rows"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories: insert own rows"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories: update own rows"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories: delete own rows"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ─── payment_methods ───────────────────────────────────────────────────────

create table if not exists public.payment_methods (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  type        text        not null check (type in ('card', 'cash', 'transfer')),
  card_last4  text,
  created_at  timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "payment_methods: select own rows"
  on public.payment_methods for select
  using (auth.uid() = user_id);

create policy "payment_methods: insert own rows"
  on public.payment_methods for insert
  with check (auth.uid() = user_id);

create policy "payment_methods: update own rows"
  on public.payment_methods for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "payment_methods: delete own rows"
  on public.payment_methods for delete
  using (auth.uid() = user_id);

-- ─── user_config: migrate to Phase C schema ────────────────────────────────
-- Existing table has surrogate PK (id uuid) + unique user_id.
-- Phase C spec uses user_id as PK directly.
-- We rename the old table, recreate it with the new schema, migrate rows, then drop the old one.

alter table public.user_config rename to user_config_old;

create table public.user_config (
  user_id         uuid        primary key references auth.users(id) on delete cascade,
  date_format     text        not null default 'DD/MM/YYYY',
  number_format   text        not null default 'dot-comma',
  global_currency text        not null default 'ARS',
  global_rate_id  uuid        references public.rates(id) on delete set null,
  updated_at      timestamptz not null default now()
);

-- Migrate existing rows (best-effort mapping; global_currency_rate is dropped)
insert into public.user_config (user_id, date_format, number_format, global_currency, global_rate_id, updated_at)
select
  user_id,
  date_format,
  -- remap legacy 'es-AR' → 'dot-comma'; keep other values as-is
  case when number_format = 'es-AR' then 'dot-comma' else number_format end,
  global_currency,
  null,
  now()
from public.user_config_old
on conflict (user_id) do nothing;

drop table public.user_config_old;

alter table public.user_config enable row level security;

create policy "user_config: select own row"
  on public.user_config for select
  using (auth.uid() = user_id);

create policy "user_config: insert own row"
  on public.user_config for insert
  with check (auth.uid() = user_id);

create policy "user_config: update own row"
  on public.user_config for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_config: delete own row"
  on public.user_config for delete
  using (auth.uid() = user_id);

-- Monthly Calculator: initial schema
-- Tables: transactions, rates, user_config

-- transactions
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  section       text not null check (section in ('ingresos', 'gastos', 'tarjetas')),
  name          text not null,
  amount        numeric(18, 2) not null default 0,
  currency      text not null default 'ARS',
  is_paid       boolean not null default false,
  payment_method text,
  installment_number   integer,
  total_installments   integer,
  due_date      date,
  created_at    timestamptz not null default now()
);

-- rates
create table if not exists public.rates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  value      numeric(18, 6) not null,
  updated_at timestamptz not null default now()
);

-- user_config
create table if not exists public.user_config (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  date_format           text not null default 'DD/MM/YYYY',
  number_format         text not null default 'es-AR',
  global_currency       text not null default 'ARS',
  global_currency_rate  numeric(18, 6) not null default 1
);

-- RLS: enable on all tables
alter table public.transactions  enable row level security;
alter table public.rates         enable row level security;
alter table public.user_config   enable row level security;

-- transactions policies
create policy "transactions: select own rows"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions: insert own rows"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions: update own rows"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions: delete own rows"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- rates policies
create policy "rates: select own rows"
  on public.rates for select
  using (auth.uid() = user_id);

create policy "rates: insert own rows"
  on public.rates for insert
  with check (auth.uid() = user_id);

create policy "rates: update own rows"
  on public.rates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rates: delete own rows"
  on public.rates for delete
  using (auth.uid() = user_id);

-- user_config policies
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

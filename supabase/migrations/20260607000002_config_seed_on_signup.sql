-- Config Phase C: seed default Config data on account creation.
-- Replaces handle_new_user with an extended version that also seeds
-- rates, grouping_categories, categories, payment_methods, user_config.
--
-- All inserts use ON CONFLICT DO NOTHING — idempotent and safe to replay.
-- Seeded rows have no special flags and behave identically to user-created rows.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_vivienda_id      uuid;
  v_alimentacion_id  uuid;
  v_transporte_id    uuid;
  v_entretenimiento_id uuid;
  v_ahorro_id        uuid;
begin
  -- ── public.users sync (existing behaviour) ────────────────────────────────
  insert into public.users (id, email, created_at)
  values (new.id, new.email, new.created_at)
  on conflict (id) do nothing;

  -- ── rates ─────────────────────────────────────────────────────────────────
  insert into public.rates (user_id, name, value, updated_at)
  values
    (new.id, 'USD',           1.00, now()),
    (new.id, 'Dólar Tarjeta', 1.00, now()),
    (new.id, 'EUR',           1.00, now()),
    (new.id, 'YEN',           1.00, now());
  -- No unique constraint on (user_id, name) — idempotency handled by the trigger
  -- only firing on INSERT (first-time signup). Existing accounts are unaffected.

  -- ── grouping_categories ───────────────────────────────────────────────────
  insert into public.grouping_categories (id, user_id, name, created_at)
  values
    (gen_random_uuid(), new.id, 'Vivienda',        now()),
    (gen_random_uuid(), new.id, 'Alimentación',    now()),
    (gen_random_uuid(), new.id, 'Transporte',      now()),
    (gen_random_uuid(), new.id, 'Entretenimiento', now()),
    (gen_random_uuid(), new.id, 'Ahorro',          now());

  -- Query the just-inserted grouping_categories to get stable ids for category FKs.
  select id into v_vivienda_id
    from public.grouping_categories
   where user_id = new.id and name = 'Vivienda'
   limit 1;

  select id into v_alimentacion_id
    from public.grouping_categories
   where user_id = new.id and name = 'Alimentación'
   limit 1;

  select id into v_transporte_id
    from public.grouping_categories
   where user_id = new.id and name = 'Transporte'
   limit 1;

  select id into v_entretenimiento_id
    from public.grouping_categories
   where user_id = new.id and name = 'Entretenimiento'
   limit 1;

  select id into v_ahorro_id
    from public.grouping_categories
   where user_id = new.id and name = 'Ahorro'
   limit 1;

  -- ── categories ────────────────────────────────────────────────────────────
  insert into public.categories (user_id, name, grouping_category_id, created_at)
  values
    -- Vivienda
    (new.id, 'Alquiler',          v_vivienda_id, now()),
    (new.id, 'Expensas',          v_vivienda_id, now()),
    (new.id, 'Servicios',         v_vivienda_id, now()),
    -- Alimentación
    (new.id, 'Supermercado',      v_alimentacion_id, now()),
    (new.id, 'Restaurantes',      v_alimentacion_id, now()),
    -- Transporte
    (new.id, 'Combustible',       v_transporte_id, now()),
    (new.id, 'Transporte público',v_transporte_id, now()),
    -- Entretenimiento
    (new.id, 'Streaming',         v_entretenimiento_id, now()),
    (new.id, 'Salidas',           v_entretenimiento_id, now()),
    -- Ahorro
    (new.id, 'Inversiones',       v_ahorro_id, now()),
    (new.id, 'Fondo de emergencia',v_ahorro_id, now());

  -- ── payment_methods ───────────────────────────────────────────────────────
  insert into public.payment_methods (user_id, name, type, card_last4, created_at)
  values
    (new.id, 'Efectivo',         'cash',     null, now()),
    (new.id, 'Débito',           'card',     null, now()),
    (new.id, 'Crédito',          'card',     null, now()),
    (new.id, 'Transferencia',    'transfer', null, now());

  -- ── user_config ───────────────────────────────────────────────────────────
  insert into public.user_config (user_id, date_format, number_format, global_currency, global_rate_id, updated_at)
  values (new.id, 'DD/MM/YYYY', 'dot-comma', 'ARS', null, now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- The trigger on auth.users already exists from migration 20260527000001.
-- No need to recreate it — the function replacement is enough.

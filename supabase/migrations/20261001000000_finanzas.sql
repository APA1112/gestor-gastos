-- =============================================================
-- Mis Finanzas: categorías y movimientos por usuario
-- =============================================================

-- ---------- Categorías ----------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 30),
  type        text not null check (type in ('income', 'expense')),
  color       text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon        text not null check (char_length(icon) between 1 and 16),
  -- 'other-income' / 'other-expense': categorías protegidas que reciben
  -- los movimientos de una categoría eliminada
  system_key  text check (system_key in ('other-income', 'other-expense')),
  created_at  timestamptz not null default now(),
  unique (user_id, system_key),
  -- Necesario para la FK compuesta desde transactions
  unique (id, user_id, type)
);

create unique index categories_user_type_name_key
  on public.categories (user_id, type, lower(btrim(name)));

-- ---------- Movimientos ----------
create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type         text not null check (type in ('income', 'expense')),
  amount       numeric(12, 2) not null check (amount > 0),
  category_id  uuid not null,
  date         date not null,
  description  text not null default '' check (char_length(description) <= 80),
  created_at   timestamptz not null default now(),
  -- La categoría debe ser del mismo usuario y del mismo tipo que el movimiento
  foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type) on delete cascade
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_category_idx on public.transactions (category_id);

-- ---------- Seguridad a nivel de fila ----------
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "Ver mis categorías" on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Crear mis categorías" on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Editar mis categorías" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Borrar mis categorías" on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Ver mis movimientos" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Crear mis movimientos" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Editar mis movimientos" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Borrar mis movimientos" on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Privilegios por columna: el cliente no puede tocar user_id, system_key ni fechas de creación
revoke all on public.categories, public.transactions from anon, authenticated;

grant select, delete on public.categories to authenticated;
grant insert (name, type, color, icon) on public.categories to authenticated;
grant update (name, color, icon) on public.categories to authenticated;

grant select, delete on public.transactions to authenticated;
grant insert (type, amount, category_id, date, description) on public.transactions to authenticated;
grant update (type, amount, category_id, date, description) on public.transactions to authenticated;

-- ---------- Borrado de categorías ----------
-- Antes de borrar una categoría, sus movimientos pasan a "Otros" del mismo tipo.
-- Las categorías protegidas no se pueden borrar (salvo al eliminar la cuenta).
create function public.reassign_before_category_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  fallback_id uuid;
begin
  -- Borrado en cascada (p. ej. al eliminar el usuario): no intervenir
  if pg_trigger_depth() > 1 then
    return old;
  end if;

  if old.system_key is not null then
    raise exception 'La categoría "%" no se puede eliminar', old.name
      using errcode = 'P0001';
  end if;

  select id into fallback_id
  from public.categories
  where user_id = old.user_id
    and system_key = case old.type when 'income' then 'other-income' else 'other-expense' end;

  if fallback_id is null then
    raise exception 'No existe la categoría de respaldo' using errcode = 'P0001';
  end if;

  update public.transactions
  set category_id = fallback_id
  where category_id = old.id;

  return old;
end;
$$;

create trigger categories_before_delete
  before delete on public.categories
  for each row execute function public.reassign_before_category_delete();

-- ---------- Categorías iniciales al registrarse ----------
create function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, type, color, icon, system_key)
  values
    (new.id, 'Alimentación',   'expense', '#2a78d6', '🛒', null),
    (new.id, 'Vivienda',       'expense', '#eb6834', '🏠', null),
    (new.id, 'Transporte',     'expense', '#1baf7a', '🚗', null),
    (new.id, 'Facturas',       'expense', '#eda100', '💡', null),
    (new.id, 'Ocio',           'expense', '#e87ba4', '🎉', null),
    (new.id, 'Salud',          'expense', '#008300', '💊', null),
    (new.id, 'Compras',        'expense', '#4a3aa7', '🛍️', null),
    (new.id, 'Otros gastos',   'expense', '#64748b', '📦', 'other-expense'),
    (new.id, 'Nómina',         'income',  '#2a78d6', '💼', null),
    (new.id, 'Trabajos extra', 'income',  '#eb6834', '🧑‍💻', null),
    (new.id, 'Regalos',        'income',  '#1baf7a', '🎁', null),
    (new.id, 'Otros ingresos', 'income',  '#64748b', '💰', 'other-income');
  return new;
end;
$$;

revoke execute on function public.seed_default_categories() from public, anon, authenticated;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_default_categories();

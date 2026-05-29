-- =====================================================================
-- PRECISSA INSTITUTE · setup admin/enrollments
-- ---------------------------------------------------------------------
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor.
-- Es idempotente: puedes volver a correrlo sin romper nada.
--
-- Crea:
--   · profiles          (lista de alumnas registradas, auto-rellenada)
--   · enrollments       (qué email tiene acceso a qué curso, con caducidad)
--   · is_admin()        (función helper para las políticas)
--   · trigger handle_new_user  (cada registro nuevo cae en profiles)
--   · políticas RLS para que solo los admins puedan escribir
-- =====================================================================

-- 1) FUNCIÓN: ¿la sesión actual es admin?
--    Mantén esta lista sincronizada con PRECISSA_ADMIN_EMAILS del JS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) in (
      'carlosalbiachperez@gmail.com',
      'beautysecrets.betty@gmail.com',
      'precissainstitute@gmail.com'
    ),
    false
  );
$$;

-- 2) TABLA profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  created_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- 3) TRIGGER: cada nuevo usuario en auth.users → fila en profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      null
    )
  )
  on conflict (id) do update set
    email     = lower(new.email),
    full_name = coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      profiles.full_name
    );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: registra a quienes YA están en auth.users
insert into public.profiles (id, email, full_name)
select id, lower(email),
       coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')
from auth.users
on conflict (id) do nothing;

-- 4) TABLA enrollments
create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  course_id   text not null,
  expires_at  timestamptz,
  granted_by  text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (email, course_id)
);

create index if not exists enrollments_email_idx  on public.enrollments (lower(email));
create index if not exists enrollments_course_idx on public.enrollments (course_id);

-- Mantener updated_at fresco
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists enrollments_updated_at on public.enrollments;
create trigger enrollments_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

-- 5) ROW-LEVEL SECURITY
alter table public.profiles    enable row level security;
alter table public.enrollments enable row level security;

-- profiles: cada usuaria ve su perfil; los admins ven todos
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- enrollments: cada usuaria ve las suyas; los admins ven y editan todas
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select
  using (
    lower(email) = lower(coalesce(
      (select email from auth.users where id = auth.uid()),
      ''
    ))
    or public.is_admin()
  );

drop policy if exists enrollments_insert_admin on public.enrollments;
create policy enrollments_insert_admin on public.enrollments for insert
  with check (public.is_admin());

drop policy if exists enrollments_update_admin on public.enrollments;
create policy enrollments_update_admin on public.enrollments for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists enrollments_delete_admin on public.enrollments;
create policy enrollments_delete_admin on public.enrollments for delete
  using (public.is_admin());

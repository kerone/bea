-- =====================================================================
-- PRECISSA INSTITUTE · Agenda y fichas de clientas
-- ---------------------------------------------------------------------
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor.
-- Es idempotente: puedes volver a correrlo sin romper nada.
--
-- Requisito previo: haber ejecutado supabase/setup.sql (usa is_admin()).
--
-- Crea:
--   · clientas      (ficha de cada clienta, incluidas contraindicaciones)
--   · tratamientos  (catálogo propio: nombre, duración y precio por defecto)
--   · citas         (agenda + histórico; guarda nombre y precio del
--                    tratamiento en el momento, para que el histórico no
--                    cambie si luego editas el catálogo)
--
-- PROTECCIÓN DE DATOS
--   Estas tablas contienen datos personales y, en `contraindicaciones`,
--   datos de SALUD (categoría especial, art. 9 RGPD). Las políticas RLS
--   solo permiten acceso a las cuentas administradoras: ninguna alumna
--   autenticada del aula puede leer ni escribir aquí.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) CLIENTAS
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.clientas (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  apellidos          text,
  telefono           text,
  email              text,
  fecha_nacimiento   date,
  -- Datos de salud (categoría especial RGPD): alergias, medicación,
  -- embarazo, marcapasos, fototipo, antecedentes relevantes.
  contraindicaciones text,
  notas              text,
  activa             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists clientas_nombre_idx
  on public.clientas (lower(nombre), lower(coalesce(apellidos, '')));
create index if not exists clientas_telefono_idx on public.clientas (telefono);

-- ─────────────────────────────────────────────────────────────────────
-- 2) TRATAMIENTOS (catálogo para agendar rápido)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.tratamientos (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  duracion_min integer not null default 60,
  precio       numeric(10,2),
  color        text not null default '#A86B4E',
  activo       boolean not null default true,
  orden        integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 3) CITAS (agenda + histórico de tratamientos)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.citas (
  id             uuid primary key default gen_random_uuid(),
  clienta_id     uuid not null references public.clientas(id) on delete cascade,
  tratamiento_id uuid references public.tratamientos(id) on delete set null,
  -- Copia del nombre y el precio en el momento de la cita: si mañana
  -- cambias el catálogo, el histórico sigue contando lo que pasó.
  tratamiento    text,
  precio         numeric(10,2),
  inicio         timestamptz not null,
  duracion_min   integer not null default 60,
  estado         text not null default 'programada'
                 check (estado in ('programada','completada','cancelada','no_asistio')),
  -- Notas de la sesión: parámetros usados, incidencias, evolución.
  notas          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists citas_inicio_idx  on public.citas (inicio);
create index if not exists citas_clienta_idx on public.citas (clienta_id, inicio desc);

-- ─────────────────────────────────────────────────────────────────────
-- 4) updated_at automático
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clientas_touch on public.clientas;
create trigger clientas_touch before update on public.clientas
  for each row execute function public.touch_updated_at();

drop trigger if exists citas_touch on public.citas;
create trigger citas_touch before update on public.citas
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 5) RLS · SOLO ADMINISTRADORAS
--    Sin estas políticas, cualquiera con la clave pública del navegador
--    podría leer los datos de tus clientas. Son la única barrera real.
-- ─────────────────────────────────────────────────────────────────────
alter table public.clientas     enable row level security;
alter table public.tratamientos enable row level security;
alter table public.citas        enable row level security;

drop policy if exists clientas_admin_all on public.clientas;
create policy clientas_admin_all on public.clientas
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists tratamientos_admin_all on public.tratamientos;
create policy tratamientos_admin_all on public.tratamientos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists citas_admin_all on public.citas;
create policy citas_admin_all on public.citas
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 6) Catálogo inicial de tratamientos (edítalo luego desde la app)
-- ─────────────────────────────────────────────────────────────────────
insert into public.tratamientos (nombre, duracion_min, precio, color, orden)
select * from (values
  ('Higiene facial profunda',        60, null, '#A86B4E', 10),
  ('Plasmapen',                      90, null, '#7E4C36', 20),
  ('HIFU facial',                    90, null, '#8A5A3C', 30),
  ('Radiofrecuencia facial',         60, null, '#9B6244', 40),
  ('Depilación láser',               30, null, '#6E6558', 50),
  ('Microblading de cejas',         120, null, '#5C4E42', 60),
  ('Micropigmentación de labios',   120, null, '#8C5A5A', 70),
  ('Lifting de pestañas',            60, null, '#7A6A55', 80),
  ('Drenaje linfático',              60, null, '#6B7A5E', 90),
  ('Maderoterapia',                  60, null, '#8A6F4E', 100),
  ('Primera visita · valoración',    30, 0,    '#544A40', 5)
) as t(nombre, duracion_min, precio, color, orden)
where not exists (select 1 from public.tratamientos);

-- ─────────────────────────────────────────────────────────────────────
-- 7) Comprobación
-- ─────────────────────────────────────────────────────────────────────
select relname as tabla, relrowsecurity as rls_activada
from pg_class
where relname in ('clientas','tratamientos','citas');

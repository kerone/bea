-- =====================================================================
-- PRECISSA INSTITUTE · Profesional (ejecutor) de cada cita
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisitos previos: setup.sql, agenda.sql y agenda-consentimientos.sql
--
-- Añade:
--   · profesionales          (quién ejecuta cada cita; hoy, una fila)
--   · citas.profesional_id   (NOT NULL con DEFAULT, ver el orden abajo)
--   · citas_duracion_ck      (duración entre 5 y 600 minutos)
--
-- QUÉ NO HACE ESTO, Y POR QUÉ
--   No impide guardar dos citas solapadas. La detección vive en
--   agenda/agenda.js y AVISA con opción de guardar igualmente: en
--   estética el solape a veces es intencionado. Si algún día hiciera
--   falta una garantía dura en base de datos (varias personas
--   escribiendo a la vez), el camino sería: create extension btree_gist;
--   columna `fin` mantenida por trigger (GENERATED es imposible:
--   timestamptz + interval no es IMMUTABLE); columna `permite_solape`;
--   indultar los solapes ya existentes del histórico (EXCLUDE se valida
--   contra toda la tabla y no admite NOT VALID); y entonces:
--     exclude using gist (profesional_id with =,
--                         tstzrange(inicio, fin, '[)') with &&)
--     where (estado in ('programada','en_curso','completada')
--            and not permite_solape)
--
--   Tampoco da acceso a nadie nuevo: "profesional" es una ETIQUETA para
--   organizar la agenda. Dar entrada a una segunda persona la haría
--   administradora y vería las contraindicaciones (datos de salud) de
--   toda la clientela: eso es otra conversación, y exige antes ampliar
--   la política de privacidad.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) PROFESIONALES
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.profesionales (
  id         uuid primary key default gen_random_uuid(),
  nombre     text    not null,
  color      text    not null default '#A86B4E'
             check (color ~ '^#[0-9A-Fa-f]{6}$'),
  activo     boolean not null default true,
  orden      integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profesionales_touch on public.profesionales;
create trigger profesionales_touch before update on public.profesionales
  for each row execute function public.touch_updated_at();

-- Fila semilla con UUID FIJO: volver a ejecutar este archivo no duplica
-- nada y el DEFAULT de citas puede apuntar a un valor concreto.
-- Renómbrala con tu nombre desde la app (Ajustes → Profesionales).
insert into public.profesionales (id, nombre, color, orden)
values ('00000000-0000-4000-8000-000000000001', 'Profesional 1', '#A86B4E', 10)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- 2) CITAS · profesional_id
--    NOT NULL con DEFAULT, en este orden exacto:
--    default → relleno del histórico → not null.
--    El DEFAULT va PRIMERO para que la agenda ya desplegada (que aún no
--    envía profesional_id) siga insertando sin fallar hasta publicar la
--    versión nueva.
--    on delete restrict: dar de baja es activo=false, nunca borrar.
-- ─────────────────────────────────────────────────────────────────────
alter table public.citas
  add column if not exists profesional_id uuid
  references public.profesionales(id) on delete restrict;

alter table public.citas
  alter column profesional_id
  set default '00000000-0000-4000-8000-000000000001';

update public.citas
   set profesional_id = '00000000-0000-4000-8000-000000000001'
 where profesional_id is null;

alter table public.citas alter column profesional_id set not null;

create index if not exists citas_profesional_idx
  on public.citas (profesional_id, inicio);

-- ─────────────────────────────────────────────────────────────────────
-- 3) Duración razonable
--    El formulario antiguo dejaba pasar duraciones negativas ('-30' es
--    truthy para Number(x) || 60). Con duración negativa el fin va antes
--    que el inicio y cualquier cálculo de solape miente. CHECK admite
--    NOT VALID (al contrario que EXCLUDE): se añade aunque hubiera filas
--    viejas malas y se valida después.
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'citas_duracion_ck') then
    alter table public.citas
      add constraint citas_duracion_ck
      check (duracion_min > 0 and duracion_min <= 600) not valid;
  end if;
end $$;

do $$
begin
  alter table public.citas validate constraint citas_duracion_ck;
exception when check_violation then
  raise notice 'Hay citas con duración 0, negativa o mayor de 10 h. Revísalas y vuelve a ejecutar este archivo.';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4) RLS · solo administradoras (misma política que el resto)
-- ─────────────────────────────────────────────────────────────────────
alter table public.profesionales enable row level security;

drop policy if exists profesionales_admin_all on public.profesionales;
create policy profesionales_admin_all on public.profesionales
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 5) Comprobación: debe salir "Profesional 1" con todas tus citas,
--    y un 0 en citas_sin_profesional.
-- ─────────────────────────────────────────────────────────────────────
select p.nombre, count(c.id) as citas
  from public.profesionales p
  left join public.citas c on c.profesional_id = p.id
 group by p.nombre order by p.nombre;

select count(*) as citas_sin_profesional
  from public.citas where profesional_id is null;

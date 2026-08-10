-- =====================================================================
-- PRECISSA INSTITUTE · Fotos de tratamiento por sesión
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/agenda.sql
--
-- Las fotos se guardan en un bucket PRIVADO (solo administradoras, con
-- enlace firmado temporal) y la tabla fotos_sesion las cuelga de su cita
-- y su cliente. La app las comprime antes de subirlas (~200-400 KB), así
-- el giga del plan gratuito da para años.
--
-- RGPD: una foto de tratamiento puede ser dato de salud (art. 9). La
-- casilla "autoriza fotografías" del consentimiento firmado es la base;
-- la app avisa si la última firma no la marcó. Sigue pendiente ampliar
-- la política de privacidad para clientela de cabina.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) Tabla: una fila por foto, colgada de cita y cliente
--    on delete cascade: al borrar la cita o la clienta caen las FILAS;
--    los ARCHIVOS del bucket los borra la app antes (no hay cascada
--    entre Postgres y Storage).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.fotos_sesion (
  id         uuid primary key default gen_random_uuid(),
  clienta_id uuid not null references public.clientas(id) on delete cascade,
  cita_id    uuid not null references public.citas(id) on delete cascade,
  ruta       text not null,          -- ruta dentro del bucket tratamiento-fotos
  created_at timestamptz not null default now()
);

create index if not exists fotos_sesion_clienta_idx
  on public.fotos_sesion (clienta_id, created_at desc);
create index if not exists fotos_sesion_cita_idx
  on public.fotos_sesion (cita_id);

alter table public.fotos_sesion enable row level security;

drop policy if exists fotos_sesion_admin_all on public.fotos_sesion;
create policy fotos_sesion_admin_all on public.fotos_sesion
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 2) Bucket PRIVADO con límite de tamaño y solo JPEG
--    (la app comprime a JPEG; el límite de 5 MB es una red de seguridad)
-- ─────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tratamiento-fotos', 'tratamiento-fotos', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

drop policy if exists fotos_read   on storage.objects;
drop policy if exists fotos_write  on storage.objects;
drop policy if exists fotos_delete on storage.objects;

create policy fotos_read on storage.objects
  for select using (bucket_id = 'tratamiento-fotos' and public.is_admin());

create policy fotos_write on storage.objects
  for insert with check (bucket_id = 'tratamiento-fotos' and public.is_admin());

create policy fotos_delete on storage.objects
  for delete using (bucket_id = 'tratamiento-fotos' and public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 3) Comprobación: tabla con RLS y bucket privado
-- ─────────────────────────────────────────────────────────────────────
select 'tabla fotos_sesion', case when relrowsecurity then 'RLS activa ✓' else 'SIN RLS ⚠️' end
  from pg_class where oid = 'public.fotos_sesion'::regclass;

select 'bucket privado', coalesce((select case when public then 'PUBLICO ⚠️' else 'privado ✓' end
  from storage.buckets where id = 'tratamiento-fotos'), 'no existe ⚠️');

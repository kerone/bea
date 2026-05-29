-- =====================================================================
-- PRECISSA INSTITUTE · edición de cursos desde el panel (overrides)
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
--
-- Requisito: haber ejecutado antes supabase/setup.sql (usa is_admin()).
--
-- El contenido de los cursos sigue en assets/js/courses-data.js (defaults).
-- Esta tabla guarda, por curso, SOLO lo que se edite desde el panel:
--   · metadatos de texto + portada (cover)
--   · lessons (lista de lecciones) y test, como JSON
-- Un campo a null = usar el valor por defecto del JS.
-- El .md del temario (sourceDoc) NO se gestiona aquí.
-- =====================================================================

create table if not exists public.course_overrides (
  course_id          text primary key,
  title              text,
  eyebrow            text,
  level              text,
  duration           text,
  short_description  text,
  description        text,
  category           text,
  cover              text,
  lessons            jsonb,
  test               jsonb,
  updated_at         timestamptz not null default now()
);

-- Mantener updated_at fresco (la función ya existe desde setup.sql).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists course_overrides_updated_at on public.course_overrides;
create trigger course_overrides_updated_at
  before update on public.course_overrides
  for each row execute function public.set_updated_at();

-- ROW-LEVEL SECURITY: lectura pública (la web lo necesita), escritura admin.
alter table public.course_overrides enable row level security;

drop policy if exists course_overrides_select_all on public.course_overrides;
create policy course_overrides_select_all on public.course_overrides for select
  using (true);

drop policy if exists course_overrides_insert_admin on public.course_overrides;
create policy course_overrides_insert_admin on public.course_overrides for insert
  with check (public.is_admin());

drop policy if exists course_overrides_update_admin on public.course_overrides;
create policy course_overrides_update_admin on public.course_overrides for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_overrides_delete_admin on public.course_overrides;
create policy course_overrides_delete_admin on public.course_overrides for delete
  using (public.is_admin());

-- STORAGE: bucket público para portadas (covers/) y HTML de slides (slides/).
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do update set public = true;

drop policy if exists course_media_read on storage.objects;
create policy course_media_read on storage.objects for select
  using (bucket_id = 'course-media');

drop policy if exists course_media_insert on storage.objects;
create policy course_media_insert on storage.objects for insert
  with check (bucket_id = 'course-media' and public.is_admin());

drop policy if exists course_media_update on storage.objects;
create policy course_media_update on storage.objects for update
  using (bucket_id = 'course-media' and public.is_admin())
  with check (bucket_id = 'course-media' and public.is_admin());

drop policy if exists course_media_delete on storage.objects;
create policy course_media_delete on storage.objects for delete
  using (bucket_id = 'course-media' and public.is_admin());

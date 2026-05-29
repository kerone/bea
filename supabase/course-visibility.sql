-- =====================================================================
-- PRECISSA INSTITUTE · visibilidad de cursos en el catálogo público
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
--
-- Requisito: haber ejecutado antes supabase/setup.sql (usa is_admin()).
--
-- El contenido de los cursos sigue en assets/js/courses-data.js. Esta
-- tabla solo guarda el interruptor on/off de cada curso para el
-- catálogo público. Si un curso NO aparece aquí, se considera visible.
-- Ocultar un curso solo lo quita del catálogo público y la home; las
-- alumnas ya matriculadas siguen accediendo a él en su aula.
-- =====================================================================

create table if not exists public.course_visibility (
  course_id   text primary key,
  hidden      boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- Mantener updated_at fresco (la función ya existe desde setup.sql).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists course_visibility_updated_at on public.course_visibility;
create trigger course_visibility_updated_at
  before update on public.course_visibility
  for each row execute function public.set_updated_at();

-- ROW-LEVEL SECURITY: lectura pública (la web necesita saber qué ocultar),
-- escritura solo admins.
alter table public.course_visibility enable row level security;

drop policy if exists course_visibility_select_all on public.course_visibility;
create policy course_visibility_select_all on public.course_visibility for select
  using (true);

drop policy if exists course_visibility_insert_admin on public.course_visibility;
create policy course_visibility_insert_admin on public.course_visibility for insert
  with check (public.is_admin());

drop policy if exists course_visibility_update_admin on public.course_visibility;
create policy course_visibility_update_admin on public.course_visibility for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_visibility_delete_admin on public.course_visibility;
create policy course_visibility_delete_admin on public.course_visibility for delete
  using (public.is_admin());

-- =====================================================================
-- PRECISSA INSTITUTE · Contenido privado de cursos (materia + slides)
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
--
-- Requisito: haber ejecutado antes supabase/setup.sql (usa is_admin(),
-- current_email() y la tabla enrollments).
--
-- Crea un bucket PRIVADO 'course-private' donde se guardan la materia
-- (.md) y los slides (.html) de los cursos. A diferencia de
-- 'course-media' (público), aquí NADIE puede leer un archivo por su URL:
-- el aula pide a Supabase un enlace firmado temporal, y Supabase solo lo
-- entrega si el email autenticado está MATRICULADO en ese curso (o es
-- admin). Así el contenido deja de ser accesible sabiendo la URL.
--
-- Convención de rutas dentro del bucket:
--   <course_id>/materia.md
--   <course_id>/slides/<lesson_id>-<timestamp>.html
-- La primera carpeta del path ES el course_id; sobre ella se comprueba
-- la matrícula.
-- =====================================================================

-- Helper: ¿el usuario actual está matriculado (vigente) en un curso?
create or replace function public.is_enrolled(p_course_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course_id
      and lower(e.email) = public.current_email()
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- Bucket privado (public = false): sin acceso anónimo por URL.
insert into storage.buckets (id, name, public)
values ('course-private', 'course-private', false)
on conflict (id) do update set public = false;

-- LECTURA: admin siempre; alumna solo si está matriculada en el curso
-- (= primera carpeta del path). storage.foldername(name) devuelve el
-- array de carpetas; [1] es el course_id.
drop policy if exists course_private_read on storage.objects;
create policy course_private_read on storage.objects for select
  using (
    bucket_id = 'course-private'
    and (
      public.is_admin()
      or public.is_enrolled((storage.foldername(name))[1])
    )
  );

-- ESCRITURA / BORRADO: solo admin (sube y gestiona el contenido).
drop policy if exists course_private_insert on storage.objects;
create policy course_private_insert on storage.objects for insert
  with check (bucket_id = 'course-private' and public.is_admin());

drop policy if exists course_private_update on storage.objects;
create policy course_private_update on storage.objects for update
  using (bucket_id = 'course-private' and public.is_admin())
  with check (bucket_id = 'course-private' and public.is_admin());

drop policy if exists course_private_delete on storage.objects;
create policy course_private_delete on storage.objects for delete
  using (bucket_id = 'course-private' and public.is_admin());

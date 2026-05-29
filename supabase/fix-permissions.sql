-- =====================================================================
-- PRECISSA INSTITUTE · FIX "permission denied for table users"
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor si al guardar accesos
-- desde el panel admin sale "permission denied for table users".
--
-- Causa: la política enrollments_select original hacía un SELECT en
-- línea sobre auth.users, y el rol "authenticated" no tiene permiso
-- de lectura sobre esa tabla. Al hacer upsert (que devuelve la fila),
-- se evaluaba esa política y Postgres lanzaba el error.
--
-- Solución: encapsular el acceso a auth.users en una función
-- SECURITY DEFINER (current_email) y que la política la use.
--
-- Es idempotente: puedes ejecutarlo las veces que quieras.
-- =====================================================================

-- Función que devuelve el email de la sesión actual con privilegios
-- elevados (security definer), para que las políticas no toquen
-- auth.users directamente.
create or replace function public.current_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower((select email from auth.users where id = auth.uid()));
$$;

-- Política de lectura de enrollments usando current_email()
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select
  using (
    lower(email) = coalesce(public.current_email(), '')
    or public.is_admin()
  );

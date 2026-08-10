-- =====================================================================
-- PRECISSA INSTITUTE · Tratamientos con prueba previa obligatoria
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/agenda.sql
--
-- Marca qué tratamientos exigen prueba previa en zona (p. ej. depilación
-- láser: parche 24-48 h antes). Al agendar ese tratamiento a alguien sin
-- ninguna sesión previa registrada, la agenda AVISA (no bloquea) para
-- que quien atienda no se lo salte por no saberlo.
-- =====================================================================

alter table public.tratamientos
  add column if not exists requiere_prueba boolean not null default false;

-- Sugerencia: márcalo ya para la depilación láser si existe en el catálogo
update public.tratamientos set requiere_prueba = true
 where lower(nombre) like '%láser%' or lower(nombre) like '%laser%';

-- Comprobación: qué tratamientos exigen prueba
select nombre, requiere_prueba from public.tratamientos
 where requiere_prueba order by nombre;

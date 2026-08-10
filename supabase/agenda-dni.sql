-- =====================================================================
-- PRECISSA INSTITUTE · DNI/NIE en la ficha de cliente
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/agenda.sql
--
-- Añade el campo dni a clientas (para facturación). Sigue protegido por
-- la misma política RLS de solo administradoras de la tabla.
-- =====================================================================

alter table public.clientas add column if not exists dni text;

create index if not exists clientas_dni_idx on public.clientas (lower(dni));

-- Comprobación
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'clientas' and column_name = 'dni';

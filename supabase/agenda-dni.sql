-- =====================================================================
-- PRECISSA INSTITUTE · DNI/NIE y dirección en la ficha de cliente
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente (se puede
-- repetir aunque ya se hubiera ejecutado una versión anterior).
-- Requisito previo: supabase/agenda.sql
--
-- Añade los campos de facturación a clientas (DNI/NIE y dirección).
-- Siguen protegidos por la misma política RLS de solo administradoras.
-- =====================================================================

alter table public.clientas add column if not exists dni text;
alter table public.clientas add column if not exists direccion text;

create index if not exists clientas_dni_idx on public.clientas (lower(dni));

-- Comprobación: deben salir las dos columnas
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'clientas'
   and column_name in ('dni', 'direccion');

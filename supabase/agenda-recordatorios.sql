-- =====================================================================
-- PRECISSA INSTITUTE · Recordatorios de cita por WhatsApp
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/agenda.sql
--
-- Añade a citas la marca de "recordatorio ya enviado". Al vivir en la
-- base de datos, el móvil, la tablet y el ordenador comparten el mismo
-- estado: enviado desde uno, desaparece de la campana en todos.
-- Mientras este SQL no esté ejecutado, la app funciona igual pero el
-- apunte queda solo en el dispositivo desde el que se envió.
-- =====================================================================

alter table public.citas
  add column if not exists recordatorio_enviado_at timestamptz;

-- Comprobación
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'citas'
   and column_name = 'recordatorio_enviado_at';

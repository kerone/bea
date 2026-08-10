-- =====================================================================
-- PRECISSA INSTITUTE · Horario configurable de la agenda
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/setup.sql (is_admin)
--
-- Una fila por día de la semana (0=domingo … 6=sábado): si se trabaja y
-- de qué hora a qué hora. La agenda lo usa para pintar la franja
-- laborable, avisar de citas fuera de horario y proponer huecos libres.
-- Se edita desde la app: Ajustes → Horario.
-- Mientras este SQL no esté ejecutado, la agenda usa el horario de
-- siempre (L-V de 9:30 a 14:00).
-- =====================================================================

create table if not exists public.horario_semana (
  dia        smallint primary key check (dia between 0 and 6),
  activo     boolean not null default false,
  abre       time    not null default '09:30',
  cierra     time    not null default '14:00',
  -- Horario partido: segundo tramo (tarde) opcional. O los dos en
  -- blanco, o los dos rellenos y después del primer tramo.
  abre2      time,
  cierra2    time,
  updated_at timestamptz not null default now(),
  check (cierra > abre)
);

-- Si la tabla ya existía de una versión anterior, añadir el tramo de tarde
alter table public.horario_semana add column if not exists abre2  time;
alter table public.horario_semana add column if not exists cierra2 time;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'horario_tramo2_ck'
                    and conrelid = 'public.horario_semana'::regclass) then
    alter table public.horario_semana
      add constraint horario_tramo2_ck check (
        (abre2 is null and cierra2 is null)
        or (abre2 is not null and cierra2 is not null
            and abre2 >= cierra and cierra2 > abre2)
      );
  end if;
end $$;

drop trigger if exists horario_touch on public.horario_semana;
create trigger horario_touch before update on public.horario_semana
  for each row execute function public.touch_updated_at();

-- Semilla: lunes a viernes de 9:30 a 14:00, finde cerrado.
-- 'do nothing': si ya lo configuraste desde la app, no se pisa.
insert into public.horario_semana (dia, activo, abre, cierra) values
  (1, true,  '09:30', '14:00'),
  (2, true,  '09:30', '14:00'),
  (3, true,  '09:30', '14:00'),
  (4, true,  '09:30', '14:00'),
  (5, true,  '09:30', '14:00'),
  (6, false, '09:30', '14:00'),
  (0, false, '09:30', '14:00')
on conflict (dia) do nothing;

alter table public.horario_semana enable row level security;

drop policy if exists horario_admin_all on public.horario_semana;
create policy horario_admin_all on public.horario_semana
  for all using (public.is_admin()) with check (public.is_admin());

-- Comprobación: 7 filas (abre2/cierra2 en blanco = jornada seguida)
select dia, activo, abre, cierra, abre2, cierra2
  from public.horario_semana order by dia;

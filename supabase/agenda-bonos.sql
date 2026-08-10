-- =====================================================================
-- PRECISSA INSTITUTE · Bonos de sesiones (paquetes prepagados)
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/agenda.sql
--
-- Un bono es un paquete de N sesiones pagado por adelantado ("Bono 5
-- sesiones láser"). Cada vez que se gasta una sesión, la clienta FIRMA
-- el uso: si algún día hay dudas, se le enseñan sus propias firmas con
-- fecha y hora, y no hay discusión posible.
--
-- Por eso los usos son INMUTABLES: se registran o se borran (con la
-- ficha), pero nunca se editan. Igual que los consentimientos.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) Bonos
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.bonos (
  id             uuid primary key default gen_random_uuid(),
  clienta_id     uuid not null references public.clientas(id) on delete cascade,
  -- Si apunta a un tratamiento, solo vale para ese; en blanco, vale
  -- para cualquiera.
  tratamiento_id uuid references public.tratamientos(id) on delete set null,
  nombre         text not null,
  sesiones_total integer not null check (sesiones_total between 1 and 100),
  precio         numeric(10,2) check (precio is null or precio >= 0),
  comprado_at    date not null default current_date,
  notas          text,
  created_at     timestamptz not null default now()
);

create index if not exists bonos_clienta_idx on public.bonos (clienta_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 2) Usos: una fila por sesión gastada, con la firma de la clienta
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.bono_usos (
  id              uuid primary key default gen_random_uuid(),
  bono_id         uuid not null references public.bonos(id) on delete cascade,
  clienta_id      uuid not null references public.clientas(id) on delete cascade,
  -- La cita en la que se gastó (si se borra la cita, el uso NO se pierde:
  -- la sesión del bono se consumió igualmente)
  cita_id         uuid references public.citas(id) on delete set null,
  firma_data      text,      -- PNG embebido; puede faltar si se descontó sin firma
  firmante_nombre text,
  usado_at        timestamptz not null default now()
);

create index if not exists bono_usos_bono_idx    on public.bono_usos (bono_id, usado_at);
create index if not exists bono_usos_clienta_idx on public.bono_usos (clienta_id);
create index if not exists bono_usos_cita_idx    on public.bono_usos (cita_id);

-- Un uso firmado no se retoca jamás (mismo criterio que los
-- consentimientos): registrar o borrar, nunca editar.
create or replace function public.bono_usos_solo_lectura()
returns trigger language plpgsql as $$
begin
  raise exception 'Los usos de bono no se modifican: son el justificante firmado. Elimina y registra otro si hace falta.';
end $$;

drop trigger if exists bono_usos_inmutables on public.bono_usos;
create trigger bono_usos_inmutables before update on public.bono_usos
  for each row execute function public.bono_usos_solo_lectura();

-- ─────────────────────────────────────────────────────────────────────
-- 3) RLS · solo administradoras
-- ─────────────────────────────────────────────────────────────────────
alter table public.bonos     enable row level security;
alter table public.bono_usos enable row level security;

drop policy if exists bonos_admin_all on public.bonos;
create policy bonos_admin_all on public.bonos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists bono_usos_admin_all on public.bono_usos;
create policy bono_usos_admin_all on public.bono_usos
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 4) Comprobación
-- ─────────────────────────────────────────────────────────────────────
select 'bonos',     case when relrowsecurity then 'RLS activa ✓' else 'SIN RLS ⚠️' end
  from pg_class where oid = 'public.bonos'::regclass
union all
select 'bono_usos', case when relrowsecurity then 'RLS activa ✓' else 'SIN RLS ⚠️' end
  from pg_class where oid = 'public.bono_usos'::regclass;

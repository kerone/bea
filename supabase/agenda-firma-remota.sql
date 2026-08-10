-- =====================================================================
-- PRECISSA INSTITUTE · Firma del consentimiento desde el móvil del cliente
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/agenda-consentimientos.sql
--
-- CÓMO FUNCIONA (y por qué es seguro):
--   La agenda (sesión de administradora) crea un TOKEN de un solo uso y
--   2 horas de vida, ligado a una cita y una plantilla. El QR / enlace de
--   WhatsApp lleva solo ese token. El móvil del cliente, SIN iniciar
--   sesión, llama a dos funciones SECURITY DEFINER muy limitadas:
--     · firma_remota_datos(token)  → nombre de pila + texto a firmar
--     · firma_remota_guardar(...)  → registra la firma y quema el token
--   Las políticas RLS de las tablas siguen cerradas para anónimos: sin
--   token válido no se puede leer ni escribir absolutamente nada.
--   La firma remota se guarda como imagen embebida (columna firma_data):
--   el bucket de firmas sigue siendo solo para administradoras.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) Columna para la firma remota (imagen PNG embebida, data-URL)
-- ─────────────────────────────────────────────────────────────────────
alter table public.consentimientos_firmados
  add column if not exists firma_data text;

-- ─────────────────────────────────────────────────────────────────────
-- 2) Tokens de un solo uso
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.firma_tokens (
  token        uuid primary key default gen_random_uuid(),
  cita_id      uuid not null references public.citas(id) on delete cascade,
  plantilla_id uuid not null references public.consentimiento_plantillas(id) on delete cascade,
  creado_at    timestamptz not null default now(),
  expira_at    timestamptz not null default now() + interval '2 hours',
  usado_at     timestamptz
);

create index if not exists firma_tokens_cita_idx on public.firma_tokens (cita_id);

alter table public.firma_tokens enable row level security;

-- Solo la administradora crea y ve tokens; el cliente nunca toca la tabla
drop policy if exists firma_tokens_admin_all on public.firma_tokens;
create policy firma_tokens_admin_all on public.firma_tokens
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 3) Lectura: qué se firma (solo con token vivo)
--    Devuelve lo mínimo: nombre de pila, título, texto y versión.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.firma_remota_datos(p_token uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  t  record;
  c  record;
  n  text;
  pl record;
begin
  select * into t from firma_tokens
   where token = p_token and usado_at is null and expira_at > now();
  if not found then return null; end if;

  select * into c from citas where id = t.cita_id;
  if not found then return null; end if;

  -- Si ya hay consentimiento para esta cita, el enlace ya no pinta nada
  if exists (select 1 from consentimientos_firmados where cita_id = t.cita_id) then
    return json_build_object('ya_firmado', true);
  end if;

  select nombre into n from clientas where id = c.clienta_id;
  select * into pl from consentimiento_plantillas where id = t.plantilla_id and activa;
  if not found then return null; end if;

  return json_build_object(
    'nombre',  coalesce(n, ''),
    'titulo',  pl.nombre,
    'texto',   pl.texto,
    'version', pl.version
  );
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4) Guardado: registra la firma y quema el token
--    Misma regla de oro que en la tablet: copia LITERAL del texto.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.firma_remota_guardar(
  p_token uuid, p_nombre text, p_firma text, p_acepta_fotos boolean)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  t  record;
  c  record;
  pl record;
begin
  -- Validaciones defensivas: esto lo llama un dispositivo sin sesión
  if p_nombre is null or length(trim(p_nombre)) < 3 or length(p_nombre) > 120 then
    return 'nombre_invalido';
  end if;
  if p_firma is null or p_firma not like 'data:image/png;base64,%'
     or length(p_firma) > 500000 then
    return 'firma_invalida';
  end if;

  -- Bloqueo del token: dos envíos a la vez no firman dos veces
  select * into t from firma_tokens
   where token = p_token and usado_at is null and expira_at > now()
   for update;
  if not found then return 'token_invalido'; end if;

  select * into c from citas where id = t.cita_id;
  if not found then return 'token_invalido'; end if;

  if exists (select 1 from consentimientos_firmados where cita_id = t.cita_id) then
    update firma_tokens set usado_at = now() where token = p_token;
    return 'ya_firmado';
  end if;

  select * into pl from consentimiento_plantillas where id = t.plantilla_id;
  if not found then return 'token_invalido'; end if;

  insert into consentimientos_firmados
    (cita_id, clienta_id, plantilla_id, titulo, texto_firmado, version,
     firma_data, firmante_nombre, acepta_fotos)
  values
    (c.id, c.clienta_id, pl.id, pl.nombre, pl.texto, pl.version,
     p_firma, trim(p_nombre), coalesce(p_acepta_fotos, false));

  update firma_tokens set usado_at = now() where token = p_token;
  return 'ok';
end $$;

-- Ejecutables por el dispositivo del cliente (sin sesión) y por la app
revoke all on function public.firma_remota_datos(uuid) from public;
revoke all on function public.firma_remota_guardar(uuid, text, text, boolean) from public;
grant execute on function public.firma_remota_datos(uuid) to anon, authenticated;
grant execute on function public.firma_remota_guardar(uuid, text, text, boolean) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 5) Comprobación
-- ─────────────────────────────────────────────────────────────────────
select 'tabla firma_tokens', case when relrowsecurity then 'RLS activa ✓' else 'SIN RLS ⚠️' end
  from pg_class where oid = 'public.firma_tokens'::regclass;

select 'columna firma_data', count(*)::text || ' ✓' from information_schema.columns
 where table_schema = 'public' and table_name = 'consentimientos_firmados'
   and column_name = 'firma_data';

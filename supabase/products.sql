-- =====================================================================
-- PRECISSA INSTITUTE · Tienda de aparatología gestionable desde el panel
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
--
-- Requisito: haber ejecutado antes supabase/setup.sql (usa is_admin()
-- y set_updated_at()).
--
-- La base del catálogo vive en assets/js/products-data.js. Esta tabla
-- guarda los equipos creados o editados desde el panel:
--   · un registro por equipo (id de texto, p. ej. 'rf-200' o uno nuevo)
--   · specs e images como JSON
--   · deleted=true funciona como "tombstone" para ocultar/borrar un
--     equipo que venga por defecto del JS (los creados a mano se borran
--     de verdad).
-- =====================================================================

create table if not exists public.products (
  id                 text primary key,
  name               text,
  category           text,
  eyebrow            text,
  short_description  text,
  description        text,
  price              text,
  price_note         text,
  related_course_id    text,
  related_course_label text,
  images             jsonb not null default '[]'::jsonb,
  specs              jsonb not null default '[]'::jsonb,
  hidden             boolean not null default false,
  deleted            boolean not null default false,
  sort               integer not null default 100,
  updated_at         timestamptz not null default now()
);

-- Mantener updated_at fresco (la función ya existe desde setup.sql).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ROW-LEVEL SECURITY: lectura pública (la tienda lo necesita), escritura admin.
alter table public.products enable row level security;

drop policy if exists products_select_all on public.products;
create policy products_select_all on public.products for select
  using (true);

drop policy if exists products_insert_admin on public.products;
create policy products_insert_admin on public.products for insert
  with check (public.is_admin());

drop policy if exists products_update_admin on public.products;
create policy products_update_admin on public.products for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin on public.products for delete
  using (public.is_admin());

-- STORAGE: reutilizamos el bucket público 'course-media' (lo crea
-- course-content.sql). Las fotos de equipos se guardan bajo products/.
-- Recreamos bucket + políticas aquí también para que este script funcione
-- por sí solo si aún no se ejecutó course-content.sql.
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do update set public = true;

drop policy if exists course_media_read on storage.objects;
create policy course_media_read on storage.objects for select
  using (bucket_id = 'course-media');

drop policy if exists course_media_insert on storage.objects;
create policy course_media_insert on storage.objects for insert
  with check (bucket_id = 'course-media' and public.is_admin());

drop policy if exists course_media_update on storage.objects;
create policy course_media_update on storage.objects for update
  using (bucket_id = 'course-media' and public.is_admin())
  with check (bucket_id = 'course-media' and public.is_admin());

drop policy if exists course_media_delete on storage.objects;
create policy course_media_delete on storage.objects for delete
  using (bucket_id = 'course-media' and public.is_admin());

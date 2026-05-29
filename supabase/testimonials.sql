-- =====================================================================
-- PRECISSA INSTITUTE · reseñas de alumnas (testimonios)
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor.
-- Es idempotente: puedes volver a correrlo sin romper nada.
--
-- Requisito: haber ejecutado antes supabase/setup.sql, porque aquí
-- usamos la función public.is_admin() definida allí.
--
-- Crea:
--   · tabla public.testimonials   (las tarjetas de la home)
--   · políticas RLS               (lectura pública, escritura solo admin)
--   · bucket de Storage 'testimonials' (público) + sus políticas
--   · siembra las 3 reseñas que ya estaban en la web (Nerea/Claudia/Marta)
-- =====================================================================

-- 1) TABLA testimonials
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  name        text not null,
  centro      text,
  photo_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists testimonials_sort_idx on public.testimonials (sort_order, created_at);

-- Mantener updated_at fresco (la función ya existe desde setup.sql; la
-- re-creamos por si este archivo se ejecuta de forma independiente).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists testimonials_updated_at on public.testimonials;
create trigger testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- 2) ROW-LEVEL SECURITY
alter table public.testimonials enable row level security;

-- Lectura: cualquiera (la home es pública). Escritura: solo admins.
drop policy if exists testimonials_select_all on public.testimonials;
create policy testimonials_select_all on public.testimonials for select
  using (true);

drop policy if exists testimonials_insert_admin on public.testimonials;
create policy testimonials_insert_admin on public.testimonials for insert
  with check (public.is_admin());

drop policy if exists testimonials_update_admin on public.testimonials;
create policy testimonials_update_admin on public.testimonials for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists testimonials_delete_admin on public.testimonials;
create policy testimonials_delete_admin on public.testimonials for delete
  using (public.is_admin());

-- 3) STORAGE: bucket público para las fotos de las reseñas
insert into storage.buckets (id, name, public)
values ('testimonials', 'testimonials', true)
on conflict (id) do update set public = true;

-- Políticas del bucket sobre storage.objects
drop policy if exists testimonials_storage_read on storage.objects;
create policy testimonials_storage_read on storage.objects for select
  using (bucket_id = 'testimonials');

drop policy if exists testimonials_storage_insert on storage.objects;
create policy testimonials_storage_insert on storage.objects for insert
  with check (bucket_id = 'testimonials' and public.is_admin());

drop policy if exists testimonials_storage_update on storage.objects;
create policy testimonials_storage_update on storage.objects for update
  using (bucket_id = 'testimonials' and public.is_admin())
  with check (bucket_id = 'testimonials' and public.is_admin());

drop policy if exists testimonials_storage_delete on storage.objects;
create policy testimonials_storage_delete on storage.objects for delete
  using (bucket_id = 'testimonials' and public.is_admin());

-- 4) SIEMBRA: las 3 reseñas que ya estaban en el HTML.
--    Solo se insertan si la tabla está vacía (idempotente).
insert into public.testimonials (quote, name, centro, photo_url, sort_order)
select * from (values
  ('PRECISSA INSTITUTE me dio el lenguaje para explicar lo que ya hacía. Ahora mis clientas confían en el protocolo, no sólo en mí.',
   'Nerea Álvarez', 'Centro Estético Nerea · Bilbao', 'assets/IMG-20260522-WA0032.jpg', 1),
  ('La RF-200 la compré después del curso. No hay forma de usarla mal si has hecho la formación. Eso es lo que busco.',
   'Claudia Moreno', 'Skin Studio CM · Madrid', null, 2),
  ('Los tests son lo que diferencia a PRECISSA INSTITUTE. Saber que tengo el 83 % en electroestética me da seguridad real en cabina.',
   'Marta Iglesias', 'Clínica Estética Iglesias · Sevilla', null, 3)
) as v(quote, name, centro, photo_url, sort_order)
where not exists (select 1 from public.testimonials);

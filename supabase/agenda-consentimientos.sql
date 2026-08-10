-- =====================================================================
-- PRECISSA INSTITUTE · Consentimientos informados (fase 2)
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
-- Requisito previo: supabase/setup.sql y supabase/agenda.sql
--
-- Añade:
--   · estado 'en_curso' en citas (la clienta ya está en cabina)
--   · consentimiento_plantillas  (textos editables desde la app)
--   · consentimientos_firmados   (una firma por cita, con COPIA EXACTA
--                                 del texto que se mostró ese día)
--   · bucket privado 'consentimientos' para las imágenes de firma
--
-- POR QUÉ SE GUARDA EL TEXTO COMPLETO Y NO UNA REFERENCIA
--   Para que una firma sirva como prueba hay que poder demostrar QUÉ
--   se firmó exactamente. Si solo se guardara "plantilla nº3" y esa
--   plantilla se editara después, la firma dejaría de probar nada.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) Nuevo estado: 'en_curso'
-- ─────────────────────────────────────────────────────────────────────
alter table public.citas drop constraint if exists citas_estado_check;
alter table public.citas add constraint citas_estado_check
  check (estado in ('programada','en_curso','completada','cancelada','no_asistio'));

-- ─────────────────────────────────────────────────────────────────────
-- 2) Plantillas de consentimiento
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.consentimiento_plantillas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  texto      text not null,
  version    integer not null default 1,
  activa     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists plantillas_touch on public.consentimiento_plantillas;
create trigger plantillas_touch before update on public.consentimiento_plantillas
  for each row execute function public.touch_updated_at();

-- Cada tratamiento puede tener su consentimiento asociado
alter table public.tratamientos
  add column if not exists consentimiento_id uuid
  references public.consentimiento_plantillas(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────
-- 3) Consentimientos firmados
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.consentimientos_firmados (
  id               uuid primary key default gen_random_uuid(),
  cita_id          uuid not null references public.citas(id) on delete cascade,
  clienta_id       uuid not null references public.clientas(id) on delete cascade,
  plantilla_id     uuid references public.consentimiento_plantillas(id) on delete set null,
  titulo           text not null,
  -- Copia literal e inmutable del texto mostrado y firmado ese día
  texto_firmado    text not null,
  version          integer,
  -- Ruta de la imagen de la firma dentro del bucket privado
  firma_path       text,
  firmante_nombre  text not null,
  acepta_fotos     boolean not null default false,
  firmado_at       timestamptz not null default now()
);

create index if not exists cf_cita_idx    on public.consentimientos_firmados (cita_id);
create index if not exists cf_clienta_idx on public.consentimientos_firmados (clienta_id, firmado_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 4) RLS · solo administradoras
-- ─────────────────────────────────────────────────────────────────────
alter table public.consentimiento_plantillas enable row level security;
alter table public.consentimientos_firmados  enable row level security;

drop policy if exists plantillas_admin_all on public.consentimiento_plantillas;
create policy plantillas_admin_all on public.consentimiento_plantillas
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists firmados_admin_all on public.consentimientos_firmados;
create policy firmados_admin_all on public.consentimientos_firmados
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 5) Bucket PRIVADO para las imágenes de firma
-- ─────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('consentimientos', 'consentimientos', false)
on conflict (id) do nothing;

drop policy if exists consent_read  on storage.objects;
drop policy if exists consent_write on storage.objects;

create policy consent_read on storage.objects
  for select using (bucket_id = 'consentimientos' and public.is_admin());

create policy consent_write on storage.objects
  for insert with check (bucket_id = 'consentimientos' and public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 6) Plantillas iniciales
--    BORRADORES basados en la estructura habitual del sector.
--    Revísalos y adáptalos a tu forma de trabajar; conviene que los
--    valide un profesional del derecho antes de usarlos con clientas.
--    Son editables desde la app (Tratamientos → Consentimientos).
-- ─────────────────────────────────────────────────────────────────────
insert into public.consentimiento_plantillas (nombre, texto)
select * from (values
(
  'General · cualquier tratamiento estético',
$txt$INFORMACIÓN Y CONSENTIMIENTO PARA TRATAMIENTO ESTÉTICO

1. EN QUÉ CONSISTE
Se me ha explicado en qué consiste el tratamiento que voy a recibir, cómo se realiza, cuántas sesiones suelen ser necesarias y qué cuidados debo seguir antes y después.

2. RESULTADOS
Entiendo que los resultados varían de una persona a otra según el tipo de piel, la edad, los hábitos y la respuesta individual, y que NO se me ha garantizado un resultado concreto.

3. RIESGOS Y EFECTOS ESPERABLES
Se me ha informado de que pueden aparecer enrojecimiento, inflamación leve, sensibilidad o pequeñas molestias en las horas o días siguientes, y de que existen riesgos poco frecuentes que se me han explicado verbalmente y he podido preguntar.

4. LO QUE YO DECLARO
Declaro que he informado con veracidad sobre mi estado de salud, alergias, medicación que tomo, tratamientos previos y si estoy embarazada o en periodo de lactancia. Me comprometo a comunicar cualquier cambio antes de las siguientes sesiones.

5. CUIDADOS POSTERIORES
Me comprometo a seguir las indicaciones posteriores que se me han dado, incluida la protección solar cuando proceda, y entiendo que no seguirlas puede afectar al resultado y aumentar el riesgo de complicaciones.

6. PROTECCIÓN DE DATOS
Autorizo a PRECISSA INSTITUTE a tratar mis datos personales y de salud con la única finalidad de prestarme el servicio y llevar el seguimiento de mis tratamientos. Puedo ejercer mis derechos de acceso, rectificación y supresión escribiendo a precissainstitute@gmail.com.

7. DECLARACIÓN
He leído esta información, se me ha permitido preguntar y se han resuelto mis dudas. Presto mi consentimiento libremente y sé que puedo retirarlo en cualquier momento antes de iniciar el tratamiento.$txt$
),
(
  'Depilación láser y fotodepilación',
$txt$INFORMACIÓN Y CONSENTIMIENTO PARA DEPILACIÓN LÁSER / LUZ PULSADA

1. EN QUÉ CONSISTE
El tratamiento utiliza luz que es absorbida por la melanina del pelo y transformada en calor, dañando el folículo. Se me ha explicado que es una REDUCCIÓN PROGRESIVA Y DURADERA del vello, no una eliminación definitiva, y que solo responde el pelo en fase de crecimiento, por lo que se necesitan varias sesiones espaciadas.

2. RIESGOS Y EFECTOS
Se me ha informado de que es normal un enrojecimiento y una ligera hinchazón alrededor del folículo durante unas horas. Con menor frecuencia pueden aparecer ampollas, costras, quemaduras superficiales o cambios temporales de color en la piel (más clara o más oscura), especialmente si no se siguen las indicaciones.

3. LO QUE YO DECLARO
Declaro que NO estoy embarazada, que he informado de la medicación que tomo (en especial fármacos que aumentan la sensibilidad a la luz), de mis antecedentes de herpes, queloides o problemas de pigmentación, y de si tengo tatuajes o lunares en la zona a tratar.

4. ANTES Y DESPUÉS
Me comprometo a: no exponerme al sol ni usar autobronceadores en las semanas indicadas antes y después, no depilarme con cera ni pinzas entre sesiones (solo rasurado), y usar protección solar alta en la zona tratada.

5. PRUEBA PREVIA
Se me ha ofrecido y explicado la realización de una prueba en una zona pequeña antes del tratamiento completo.

6. PROTECCIÓN DE DATOS
Autorizo el tratamiento de mis datos personales y de salud para prestarme el servicio y su seguimiento. Puedo ejercer mis derechos escribiendo a precissainstitute@gmail.com.

7. DECLARACIÓN
He leído esta información, he podido preguntar y consiento el tratamiento.$txt$
),
(
  'Plasmapen · plasma fibroblast',
$txt$INFORMACIÓN Y CONSENTIMIENTO PARA TRATAMIENTO CON PLASMAPEN

1. EN QUÉ CONSISTE
El dispositivo genera un pequeño arco eléctrico que sublima de forma controlada la capa más superficial de la piel, produciendo una retracción del tejido. Es un tratamiento ESTÉTICO, no quirúrgico, y no sustituye a una intervención de cirugía.

2. CÓMO EVOLUCIONA
Entiendo que tras la sesión aparecerán pequeños puntos oscuros (costras) que deben caerse SOLOS en unos días, y que puede haber hinchazón, sobre todo en la zona de los párpados, durante las primeras 48-72 horas.

3. RIESGOS
Se me ha informado de que, si no se respetan los cuidados, pueden producirse manchas, marcas persistentes o cicatrices, y de que el riesgo es mayor en pieles con tendencia a hiperpigmentar o a formar queloides.

4. LO QUE YO DECLARO
Declaro que no estoy embarazada ni en lactancia, que no tengo marcapasos ni implantes metálicos en la zona, que he informado de mis antecedentes de herpes, queloides y problemas de cicatrización, y de la medicación que tomo.

5. MIS COMPROMISOS
Me comprometo a NO arrancar las costras, a seguir las pautas de higiene y cuidado indicadas, y a usar protección solar alta durante el tiempo que se me ha indicado. Entiendo que suele necesitarse más de una sesión y que se debe respetar el intervalo entre ellas.

6. PROTECCIÓN DE DATOS
Autorizo el tratamiento de mis datos personales y de salud para prestarme el servicio y su seguimiento. Puedo ejercer mis derechos escribiendo a precissainstitute@gmail.com.

7. DECLARACIÓN
He leído esta información, he podido preguntar y consiento el tratamiento.$txt$
),
(
  'Micropigmentación y microblading',
$txt$INFORMACIÓN Y CONSENTIMIENTO PARA MICROPIGMENTACIÓN

1. EN QUÉ CONSISTE
Se implanta pigmento en las capas superficiales de la piel para realzar cejas, labios o el contorno de los ojos. Es un procedimiento SEMIPERMANENTE: el pigmento se degrada con el tiempo y su duración depende del tipo de piel, la exposición solar y los cuidados.

2. COLOR Y RETOQUE
Entiendo que el color evoluciona durante las semanas siguientes y que puede virar de tono, y que la sesión de retoque forma parte del procedimiento: el resultado no es definitivo hasta completarla.

3. RIESGOS
Se me ha informado de que puede haber hinchazón y enrojecimiento los primeros días, y de riesgos menos frecuentes como reacción al pigmento, infección si no se siguen los cuidados, o resultados asimétricos que requieran corrección.

4. LO QUE YO DECLARO
Declaro que no estoy embarazada ni en lactancia, que he informado de mis alergias, de la medicación que tomo, de mis antecedentes de herpes labial (en el caso de labios), de problemas de cicatrización o queloides, y de tratamientos previos de micropigmentación en la zona.

5. HIGIENE Y MATERIAL
Se me ha informado de que se utiliza material estéril de un solo uso y pigmentos conformes a la normativa europea aplicable.

6. MIS COMPROMISOS
Me comprometo a seguir los cuidados posteriores, a no arrancar las costras y a evitar sol, sauna y piscina durante el tiempo indicado.

7. PROTECCIÓN DE DATOS
Autorizo el tratamiento de mis datos personales y de salud para prestarme el servicio y su seguimiento. Puedo ejercer mis derechos escribiendo a precissainstitute@gmail.com.

8. DECLARACIÓN
He leído esta información, he podido preguntar y consiento el tratamiento.$txt$
),
(
  'Aparatología · HIFU, radiofrecuencia, cavitación',
$txt$INFORMACIÓN Y CONSENTIMIENTO PARA TRATAMIENTO CON APARATOLOGÍA

1. EN QUÉ CONSISTE
El tratamiento aplica energía (ultrasonido focalizado, radiofrecuencia o ultrasonido de cavitación) para actuar sobre las capas profundas de la piel o el tejido graso. Es un tratamiento ESTÉTICO y no sustituye a la cirugía ni a un tratamiento médico.

2. RESULTADOS
Entiendo que los resultados aparecen de forma progresiva a lo largo de las semanas siguientes, que varían según la persona y que no se me ha garantizado un resultado concreto.

3. RIESGOS Y EFECTOS
Se me ha informado de que puede notarse calor, enrojecimiento, sensibilidad o pequeños hematomas temporales, y de que existen riesgos poco frecuentes que se me han explicado, incluidas alteraciones transitorias de la sensibilidad en la zona tratada.

4. LO QUE YO DECLARO
Declaro que NO estoy embarazada ni en lactancia, que NO llevo marcapasos ni dispositivos electrónicos implantados, y que he informado sobre prótesis o material metálico en la zona, hilos tensores, implantes, enfermedades autoinmunes, problemas de tiroides, hepáticos o renales, y sobre la medicación que tomo.

5. MIS COMPROMISOS
Me comprometo a seguir las indicaciones posteriores, incluida una buena hidratación, y a comunicar cualquier molestia que aparezca tras la sesión.

6. PROTECCIÓN DE DATOS
Autorizo el tratamiento de mis datos personales y de salud para prestarme el servicio y su seguimiento. Puedo ejercer mis derechos escribiendo a precissainstitute@gmail.com.

7. DECLARACIÓN
He leído esta información, he podido preguntar y consiento el tratamiento.$txt$
)
) as t(nombre, texto)
where not exists (select 1 from public.consentimiento_plantillas);

-- ─────────────────────────────────────────────────────────────────────
-- 7) Comprobación
-- ─────────────────────────────────────────────────────────────────────
select 'plantillas creadas' as concepto, count(*)::text as valor
from public.consentimiento_plantillas
union all
select 'bucket privado', coalesce((select case when public then 'PUBLICO ⚠️' else 'privado ✓' end
  from storage.buckets where id = 'consentimientos'), 'no existe ⚠️');

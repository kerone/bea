/* =====================================================================
 * PRECISSA INSTITUTE · Subir la materia de TODOS los cursos al bucket
 * privado (course-private) y registrar su referencia en course_overrides.
 * ---------------------------------------------------------------------
 * Mueve la materia (.md) de docs/cursos/ al almacenamiento privado, de
 * modo que deje de ser accesible por URL pública. Excluye plasma-pen y
 * diatermia a propósito.
 *
 * USO (una sola vez, desde tu ordenador con Node 18+):
 *   1. Supabase → Project Settings → API → copia la "service_role" key.
 *   2. Ejecuta desde la raíz del repo:
 *        SUPABASE_URL="https://fatgkdecpgiptvbagoij.supabase.co" \
 *        SUPABASE_SERVICE_KEY="<service_role key>" \
 *        node supabase/migrate-materia-cursos.mjs
 *   3. IMPORTANTE: regenera la service_role key después, por seguridad.
 *
 * Requisito previo: haber ejecutado supabase/course-private.sql.
 * ===================================================================== */
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL || !KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY en el entorno.');
  process.exit(1);
}
const db = createClient(URL, KEY, { auth: { persistSession: false } });
const BUCKET = 'course-private';

// id del curso  →  archivo de materia en docs/cursos/
const COURSES = {
  'higiene-facial-profunda':          'docs/cursos/14-higiene-facial-profunda.md',
  'pestanas-lifting-tinte':           'docs/cursos/19-pestanas-lifting-tinte.md',
  'pestanas-extensiones':             'docs/cursos/20-pestanas-extensiones.md',
  'cejas-diseno-visajismo':           'docs/cursos/21-cejas-diseno-visajismo.md',
  'cejas-laminado-henna':             'docs/cursos/22-cejas-laminado-henna.md',
  'hyaluron-pen':                     'docs/cursos/02-hyaluron-pen.md',
  'dermapen-microneedling':           'docs/cursos/03-dermapen-microneedling.md',
  'vacuum-cavitacion-radiofrecuencia':'docs/cursos/04-vacuum-cavitacion-radiofrecuencia.md',
  'ipl-fotorejuvenecimiento':         'docs/cursos/06-ipl-fotorejuvenecimiento.md',
  'depilacion-laser':                 'docs/cursos/07-depilacion-laser.md',
  'laser-switched-yag-carbon-peel':   'docs/cursos/08-laser-switched-yag-carbon-peel.md',
  'hifu':                             'docs/cursos/09-hifu.md',
  'microblading-cejas':               'docs/cursos/15-microblading-cejas.md',
  'micropigmentacion-labios':         'docs/cursos/16-micropigmentacion-labios.md',
  'neutralizacion-labios':            'docs/cursos/17-neutralizacion-labios.md',
  'micropigmentacion-eyeliner':       'docs/cursos/18-micropigmentacion-eyeliner.md',
  'drenaje-linfatico':                'docs/cursos/10-drenaje-linfatico.md',
  'maderoterapia':                    'docs/cursos/11-maderoterapia.md',
  'masaje-reductor-remodelante':      'docs/cursos/12-masaje-reductor-remodelante.md',
  'limpieza-espalda':                 'docs/cursos/13-limpieza-espalda.md'
  // NOTA: plasma-pen y diatermia se excluyen a propósito.
};

let ok = 0, fail = 0;
for (const [id, file] of Object.entries(COURSES)) {
  try {
    const body = await readFile(file);
    const path = `${id}/materia-${Date.now()}.md`;
    const up = await db.storage.from(BUCKET).upload(path, body, {
      contentType: 'text/markdown', upsert: true, cacheControl: '3600'
    });
    if (up.error) throw up.error;

    const { data: prev } = await db.from('course_overrides').select('*').eq('course_id', id).maybeSingle();
    const payload = Object.assign({}, prev || {}, {
      course_id: id, source_doc: 'private:' + path, deleted: false
    });
    delete payload.updated_at;
    const { error } = await db.from('course_overrides').upsert(payload, { onConflict: 'course_id' });
    if (error) throw error;

    console.log(`  ✓ ${id}`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${id}: ${e.message || e}`);
    fail++;
  }
}
console.log(`\nHecho. ${ok} cursos protegidos, ${fail} con error.`);
console.log('Verifica el aula con una alumna matriculada. Luego regenera la service_role key.');

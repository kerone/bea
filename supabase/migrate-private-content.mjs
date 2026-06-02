/* =====================================================================
 * PRECISSA INSTITUTE · Migrar materia + slides al bucket privado
 * ---------------------------------------------------------------------
 * Sube la materia (.md) y los slides (.html) de cursos concretos al
 * bucket privado 'course-private' y registra sus referencias 'private:'
 * en la tabla course_overrides, de modo que el contenido deje de ser
 * accesible por URL pública.
 *
 * USO (una sola vez, desde tu ordenador con Node 18+):
 *   1. Supabase Dashboard → Project Settings → API → copia la
 *      "service_role" key (¡secreta! no la subas a git).
 *   2. Ejecuta:
 *        SUPABASE_URL="https://fatgkdecpgiptvbagoij.supabase.co" \
 *        SUPABASE_SERVICE_KEY="<service_role key>" \
 *        node supabase/migrate-private-content.mjs
 *   3. (Opcional) Tras verificar que el aula carga bien Plasma Pen y
 *      HIFU para una alumna matriculada, borra del repositorio las
 *      copias públicas: docs/cursos/01-plasma-pen.md, docs/cursos/09-hifu.md
 *      y assets/cursos/{plasma-pen,hifu}/.
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

// Cursos a migrar: id del curso + materia + slides (ruta local → lessonId).
const COURSES = [
  {
    id: 'plasma-pen',
    materia: 'docs/cursos/01-plasma-pen.md',
    slides: [{ lessonId: 'leccion-1', file: 'assets/cursos/plasma-pen/leccion-1/index.html' }]
  },
  {
    id: 'hifu',
    materia: 'docs/cursos/09-hifu.md',
    slides: [{ lessonId: 'leccion-1', file: 'assets/cursos/hifu/leccion-1/index.html' }]
  }
];

async function uploadPrivate(path, localFile, contentType) {
  const body = await readFile(localFile);
  const { error } = await db.storage.from(BUCKET).upload(path, body, {
    contentType, upsert: true, cacheControl: '3600'
  });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  return 'private:' + path;
}

async function currentOverride(id) {
  const { data, error } = await db.from('course_overrides').select('*').eq('course_id', id).maybeSingle();
  if (error) throw new Error(`select ${id}: ${error.message}`);
  return data || null;
}

for (const c of COURSES) {
  console.log(`\n=== ${c.id} ===`);
  const ts = Date.now();

  // Materia
  const materiaRef = await uploadPrivate(`${c.id}/materia-${ts}.md`, c.materia, 'text/markdown');
  console.log(`  materia → ${materiaRef}`);

  // Slides (conservando lessonId/título/duración del override o del default)
  const prev = await currentOverride(c.id);
  const prevLessons = (prev && Array.isArray(prev.lessons)) ? prev.lessons : null;
  const lessons = [];
  for (let i = 0; i < c.slides.length; i++) {
    const s = c.slides[i];
    const ref = await uploadPrivate(`${c.id}/slides/${s.lessonId}-${ts}.html`, s.file, 'text/html');
    console.log(`  slide  → ${ref}`);
    const meta = prevLessons ? prevLessons.find(l => l.id === s.lessonId) : null;
    lessons.push({
      id: s.lessonId,
      title: (meta && meta.title) || '',
      duration: (meta && meta.duration) || '',
      slides: ref
    });
  }

  // Guardar override (merge sobre lo existente)
  const payload = Object.assign({}, prev || {}, {
    course_id: c.id,
    source_doc: materiaRef,
    lessons,
    deleted: false
  });
  delete payload.updated_at;
  const { error } = await db.from('course_overrides').upsert(payload, { onConflict: 'course_id' });
  if (error) throw new Error(`upsert ${c.id}: ${error.message}`);
  console.log(`  override actualizado ✓`);
}

console.log('\nListo. Verifica el aula con una alumna matriculada antes de borrar las copias públicas.');

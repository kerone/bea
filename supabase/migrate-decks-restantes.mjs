/* =====================================================================
 * PRECISSA INSTITUTE · Migrar los decks RESTANTES al bucket privado
 * ---------------------------------------------------------------------
 * Plasma Pen e HIFU ya se migraron con migrate-private-content.mjs.
 * Este script sube al bucket privado 'course-private' las presentaciones
 * de TODOS los demás cursos que aún viven en assets/cursos/ (públicas y
 * descargables por URL), y registra las referencias 'private:' en
 * course_overrides. Los títulos y duraciones de las lecciones se leen
 * de assets/js/courses-data.js — no hay nada que mantener a mano aquí.
 *
 * USO (una sola vez, desde tu ordenador con Node 18+, en la raíz del repo):
 *   1. Supabase Dashboard → Project Settings → API → copia la
 *      "service_role" key (¡secreta! no la subas a git ni la pegues en chats).
 *   2. Ejecuta:
 *        SUPABASE_URL="https://fatgkdecpgiptvbagoij.supabase.co" \
 *        SUPABASE_SERVICE_KEY="<service_role key>" \
 *        node supabase/migrate-decks-restantes.mjs
 *   3. Verifica en el aula (con una alumna matriculada y con una cuenta
 *      SIN matrícula) que las presentaciones cargan/deniegan como toca.
 *   4. SOLO después de verificar: borra las copias públicas del repo
 *      (assets/cursos/<id>/ de los cursos migrados) y haz push. Sin este
 *      paso la migración no protege nada.
 *
 * Requisito previo: haber ejecutado supabase/course-private.sql.
 * Es seguro re-ejecutarlo: sube con upsert y hace merge del override.
 * ===================================================================== */
import { readFile, access } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL || !KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY en el entorno.');
  process.exit(1);
}
const db = createClient(URL, KEY, { auth: { persistSession: false } });
const BUCKET = 'course-private';

// Ya migrados a mano; no volver a tocarlos.
const YA_MIGRADOS = new Set(['plasma-pen', 'hifu']);

// Cargar el catálogo real (título/duración de cada lección).
globalThis.window = {};
await import('../assets/js/courses-data.js');
const COURSES = (globalThis.window.PRECISSA_COURSES || [])
  .filter(c => !YA_MIGRADOS.has(c.id))
  .map(c => ({
    id: c.id,
    lessons: (c.lessons || []).filter(l =>
      typeof l.slides === 'string' && l.slides.startsWith('assets/cursos/')
    )
  }))
  .filter(c => c.lessons.length > 0);

console.log(`Cursos con decks públicos a migrar: ${COURSES.length}`);

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

let okCount = 0;
const fallos = [];
for (const c of COURSES) {
  try {
    console.log(`\n=== ${c.id} ===`);
    const ts = Date.now();
    const prev = await currentOverride(c.id);
    const prevLessons = (prev && Array.isArray(prev.lessons)) ? prev.lessons : null;

    const lessons = [];
    for (const l of c.lessons) {
      await access(l.slides); // aborta este curso si el archivo no existe
      const ref = await uploadPrivate(`${c.id}/slides/${l.id}-${ts}.html`, l.slides, 'text/html');
      console.log(`  slide → ${ref}`);
      const meta = prevLessons ? prevLessons.find(x => x.id === l.id) : null;
      lessons.push({
        id: l.id,
        title: (meta && meta.title) || l.title || '',
        duration: (meta && meta.duration) || l.duration || '',
        slides: ref
      });
    }

    // Merge sobre el override existente; NO tocar source_doc (la materia
    // de estos cursos ya vive en el bucket vía overrides anteriores).
    const payload = Object.assign({}, prev || {}, {
      course_id: c.id,
      lessons,
      deleted: false
    });
    delete payload.updated_at;
    const { error } = await db.from('course_overrides').upsert(payload, { onConflict: 'course_id' });
    if (error) throw new Error(`upsert ${c.id}: ${error.message}`);
    console.log('  override actualizado ✓');
    okCount++;
  } catch (e) {
    console.error(`  FALLO en ${c.id}: ${e.message}`);
    fallos.push(c.id);
  }
}

console.log(`\n─────────────────────────────────────`);
console.log(`Migrados: ${okCount}/${COURSES.length}` + (fallos.length ? ` · Fallos: ${fallos.join(', ')}` : ''));
console.log('Siguiente paso: verificar el aula y DESPUÉS borrar assets/cursos/<id>/ de los migrados (sin esto siguen públicos).');

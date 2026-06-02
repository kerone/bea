/* =============================================================
 * PRECISSA INSTITUTE · edición de cursos (overrides)
 * -------------------------------------------------------------
 * Expone window.courseContent:
 *   · load()        lee los overrides de la BD y cachea
 *   · getMap()      mapa por course_id (cacheado)
 *   · getOverride(id)
 *   · save(id, fields)   solo admin (RLS lo impone en Supabase)
 *   · reset(id)          borra el override (vuelve al JS)
 *   · uploadCover(file)              → URL pública de la portada
 *   · uploadSlide(courseId,lessonId,file) → URL pública del HTML
 *
 * El contenido por defecto vive en courses-data.js. Aquí solo se
 * guardan los campos editados. Ver supabase/course-content.sql.
 * ============================================================= */
(function () {
  const BUCKET = 'course-media';
  let _map = {};      // { course_id: override }
  let _loaded = false;

  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }
  function isConfigured() { return !!client(); }

  // Normaliza una fila de BD (snake_case) al shape del JS (camelCase),
  // dejando fuera los campos null para que la fusión los ignore.
  function rowToOverride(r) {
    const o = {};
    if (r.title             != null) o.title            = r.title;
    if (r.eyebrow           != null) o.eyebrow          = r.eyebrow;
    if (r.level             != null) o.level            = r.level;
    if (r.duration          != null) o.duration         = r.duration;
    if (r.short_description != null) o.shortDescription = r.short_description;
    if (r.description       != null) o.description      = r.description;
    if (r.category          != null) o.category         = r.category;
    if (r.cover             != null) o.cover            = r.cover;
    if (r.source_doc        != null) o.sourceDoc        = r.source_doc;
    if (r.lessons           != null) o.lessons          = r.lessons;
    if (r.test              != null) o.test             = r.test;
    o.deleted = !!r.deleted;
    return o;
  }

  async function load() {
    const c = client();
    if (!c) { _map = {}; _loaded = true; return _map; }
    const { data, error } = await c.from('course_overrides').select('*');
    if (error) { console.error('[courseContent] load', error); _loaded = true; return _map; }
    const map = {};
    (data || []).forEach(r => { map[r.course_id] = rowToOverride(r); });
    _map = map;
    _loaded = true;
    return _map;
  }

  function getMap()       { return _map; }
  function getOverride(id){ return _map[id] || null; }
  function isLoaded()     { return _loaded; }

  // fields: { title, eyebrow, level, duration, shortDescription,
  //           description, category, cover, lessons, test }
  // Cualquier campo undefined no se toca; null lo limpia (vuelve al default).
  async function save(courseId, fields) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const id = String(courseId || '').trim();
    if (!id) throw new Error('Falta el id del curso.');
    const payload = { course_id: id };
    const map = {
      title: 'title', eyebrow: 'eyebrow', level: 'level', duration: 'duration',
      shortDescription: 'short_description', description: 'description',
      category: 'category', cover: 'cover', sourceDoc: 'source_doc',
      lessons: 'lessons', test: 'test', deleted: 'deleted'
    };
    Object.keys(map).forEach(k => {
      if (Object.prototype.hasOwnProperty.call(fields, k)) payload[map[k]] = fields[k];
    });
    const { error } = await c.from('course_overrides').upsert(payload, { onConflict: 'course_id' });
    if (error) throw error;
    await load();
  }

  async function reset(courseId) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const { error } = await c.from('course_overrides').delete().eq('course_id', courseId);
    if (error) throw error;
    delete _map[courseId];
  }

  async function _upload(path, file, contentType) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    if (!file) throw new Error('No hay archivo.');
    const { error } = await c.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: contentType || file.type || undefined
    });
    if (error) throw error;
    const { data } = c.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  function safe(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'x'; }

  async function uploadCover(file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = 'covers/c-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    return _upload(path, file);
  }

  async function uploadSlide(courseId, lessonId, file) {
    const path = 'slides/' + safe(courseId) + '/' + safe(lessonId) + '-' + Date.now() + '.html';
    return _upload(path, file, 'text/html');
  }

  // ─── CONTENIDO PRIVADO (bucket course-private, RLS por matrícula) ──
  // Las rutas dentro del bucket empiezan por el course_id (la RLS lo usa
  // para comprobar la matrícula). Guardamos una referencia con prefijo
  // 'private:<bucketPath>' para distinguirla de las URLs públicas
  // antiguas; el aula la resuelve a un enlace firmado temporal.
  const PRIVATE_BUCKET = 'course-private';
  const PRIVATE_PREFIX = 'private:';

  function isPrivateRef(ref) { return typeof ref === 'string' && ref.indexOf(PRIVATE_PREFIX) === 0; }
  function privatePath(ref)  { return isPrivateRef(ref) ? ref.slice(PRIVATE_PREFIX.length) : null; }

  async function _uploadPrivate(path, file, contentType) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    if (!file) throw new Error('No hay archivo.');
    const { error } = await c.storage.from(PRIVATE_BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: true, contentType: contentType || file.type || undefined
    });
    if (error) throw error;
    return PRIVATE_PREFIX + path;
  }

  async function uploadMateriaPrivate(courseId, file) {
    const path = safe(courseId) + '/materia-' + Date.now() + '.md';
    return _uploadPrivate(path, file, 'text/markdown');
  }

  async function uploadSlidePrivate(courseId, lessonId, file) {
    const path = safe(courseId) + '/slides/' + safe(lessonId) + '-' + Date.now() + '.html';
    return _uploadPrivate(path, file, 'text/html');
  }

  // Devuelve una URL utilizable para fetch/iframe:
  //   · ref privada  → enlace firmado temporal (solo si hay matrícula/admin)
  //   · ref pública  → la propia ref (URL o ruta de repo), sin cambios
  async function signedUrl(ref, expiresInSec) {
    if (!isPrivateRef(ref)) return ref;
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const { data, error } = await c.storage.from(PRIVATE_BUCKET)
      .createSignedUrl(privatePath(ref), expiresInSec || 3600);
    if (error) throw error;
    return data.signedUrl;
  }

  window.courseContent = {
    isConfigured, load, getMap, getOverride, isLoaded,
    isPrivateRef, signedUrl, uploadMateriaPrivate, uploadSlidePrivate,
    save, reset, uploadCover, uploadSlide
  };
})();

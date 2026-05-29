/* =============================================================
 * PRECISSA INSTITUTE · visibilidad de cursos en el catálogo
 * -------------------------------------------------------------
 * Expone window.courseVisibility:
 *   · load()           lee de la BD qué cursos están ocultos y cachea
 *   · getHiddenSet()   Set con los course_id ocultos (cacheado)
 *   · isHidden(id)
 *   · setHidden(id, h) solo admin (RLS lo impone en Supabase)
 *
 * El contenido de los cursos vive en courses-data.js. Aquí solo se
 * gestiona el interruptor on/off para el catálogo público.
 * Ver supabase/course-visibility.sql.
 * ============================================================= */
(function () {
  let _hidden = new Set();   // course_ids ocultos (caché)
  let _loaded = false;

  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }
  function isConfigured() { return !!client(); }

  // Lee de la BD los cursos ocultos y los cachea. Devuelve el Set.
  // Si Supabase no está configurado o hay error, deja todo visible.
  async function load() {
    const c = client();
    if (!c) { _hidden = new Set(); _loaded = true; return _hidden; }
    const { data, error } = await c
      .from('course_visibility')
      .select('course_id, hidden')
      .eq('hidden', true);
    if (error) { console.error('[courseVisibility] load', error); _loaded = true; return _hidden; }
    _hidden = new Set((data || []).map(r => r.course_id));
    _loaded = true;
    return _hidden;
  }

  function getHiddenSet() { return _hidden; }
  function isHidden(id)  { return _hidden.has(id); }
  function isLoaded()    { return _loaded; }

  async function setHidden(courseId, hidden) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const id = String(courseId || '').trim();
    if (!id) throw new Error('Falta el id del curso.');
    const { error } = await c
      .from('course_visibility')
      .upsert({ course_id: id, hidden: !!hidden }, { onConflict: 'course_id' });
    if (error) throw error;
    if (hidden) _hidden.add(id); else _hidden.delete(id);
  }

  window.courseVisibility = { isConfigured, load, getHiddenSet, isHidden, isLoaded, setHidden };
})();

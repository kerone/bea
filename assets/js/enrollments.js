/* =============================================================
 * PRECISSA INSTITUTE · Matrículas (Supabase)
 * -------------------------------------------------------------
 * Fuente única: tabla `enrollments` de Supabase, gestionable
 * desde el panel /#admin de la web.
 *
 * canAccess(email, courseId) respeta caducidades: si la fila
 * tiene expires_at y ya pasó, el acceso queda revocado.
 *
 * Un fallo de red/Supabase NO equivale a "sin matrículas": se
 * distingue con lastError para que el aula pueda mostrar
 * "no se pudo comprobar, reintenta" en vez de un falso
 * "no tienes cursos". Los fallos no se cachean.
 * ============================================================= */
(function () {
  const CACHE_TTL_MS = 30_000;
  let cache = { rows: null, timestamp: 0 };
  let lastError = null;

  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }

  async function fetchFromSupabase() {
    const c = client();
    if (!c) return [];
    const { data, error } = await c
      .from('enrollments')
      .select('email, course_id, expires_at');
    if (error) throw error;
    return (data || []).map(r => ({
      email:      (r.email || '').toLowerCase(),
      curso:      r.course_id,
      expires_at: r.expires_at || null
    }));
  }

  async function fetchRows() {
    const now = Date.now();
    if (cache.rows && (now - cache.timestamp) < CACHE_TTL_MS) return cache.rows;
    try {
      const rows = await fetchFromSupabase();
      cache = { rows, timestamp: now };
      lastError = null;
      return rows;
    } catch (e) {
      console.warn('[enrollments] no se pudo consultar matrículas', e);
      lastError = e;
      // Fallo puntual: servir la última copia buena si existe, sin cachear el error.
      return cache.rows || [];
    }
  }

  function isLive(row) {
    if (!row.expires_at) return true;
    return new Date(row.expires_at).getTime() > Date.now();
  }

  async function canAccess(email, courseId) {
    if (!email || !courseId) return false;
    const rows = await fetchRows();
    const e = email.toLowerCase().trim();
    const c = courseId.toLowerCase().trim();
    return rows.some(r => r.email === e && r.curso === c && isLive(r));
  }

  async function coursesForUser(email) {
    if (!email) return [];
    const rows = await fetchRows();
    const e = email.toLowerCase().trim();
    return rows.filter(r => r.email === e && isLive(r)).map(r => r.curso);
  }

  window.enrollments = {
    isConfigured: () => true,
    canAccess,
    coursesForUser,
    fetchRows,
    // true si la última consulta falló y no hay copia buena: el aula debe
    // mostrar "no se pudo comprobar tu matrícula" en vez de "sin cursos".
    hadError: () => !!lastError && !cache.rows,
    invalidate: () => { cache = { rows: null, timestamp: 0 }; lastError = null; }
  };
})();
